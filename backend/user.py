from fastapi import APIRouter, FastAPI, HTTPException, Depends
from datetime import datetime, timezone
import logging
from .db import driver
from .models import User, SessionData, InboxMessage
from typing import List

# Configure logging
logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

def get_or_create_user(session, user_info):
    """Get existing user or create a new one"""
    result = session.run(
        """
        MATCH (u:User {open_id: $open_id}) 
        WHERE u.deleted = false OR u.deleted IS NULL
        RETURN elementId(u) as id, u.name as name, u.open_id as open_id, 
               u.created_at as created_at, u.last_login_at as last_login_at,
               u.level as level, u.deleted as deleted
        """,
        open_id=user_info["open_id"]
    )
    user = result.single()
    
    if not user:
        # Create new user with welcome message
        now = datetime.now(timezone.utc).isoformat()
        result = session.run(
            """
            CREATE (u:User {
                name: $name,
                open_id: $open_id,
                created_at: $now,
                last_login_at: $now,
                level: 1,
                deleted: false
            })
            WITH u
            CREATE (m:InboxMessage {
                date: $now,
                text: $welcome_text,
                read: false,
                message_type: 'System'
            })
            CREATE (u)-[:HAS_MESSAGE]->(m)
            RETURN elementId(u) as id, u.name as name, u.open_id as open_id,
                   u.created_at as created_at, u.last_login_at as last_login_at,
                   u.level as level, u.deleted as deleted
            """,
            name=user_info["name"],
            open_id=user_info["open_id"],
            now=now,
            welcome_text="Welcome! 👋 We're glad to have you in HM."
        )
        user = result.single()
    else:
        # Update last login time
        now = datetime.now(timezone.utc).isoformat()
        session.run(
            """
            MATCH (u:User {open_id: $open_id})
            SET u.last_login_at = $now
            """,
            open_id=user_info["open_id"],
            now=now
        )
    
    return dict(user)

def setup_user_routes(router: APIRouter, verifier):
    @router.get("/user/me")
    async def get_current_user(session_data: SessionData = Depends(verifier)):
        """Get the current user's information"""
        try:
            with driver.session() as session:
                result = session.run(
                    """
                    MATCH (u:User {open_id: $open_id})
                    WHERE u.deleted = false OR u.deleted IS NULL
                    RETURN elementId(u) as id, u.name as name, u.open_id as open_id,
                           u.created_at as created_at, u.last_login_at as last_login_at,
                           u.level as level, u.deleted as deleted
                    """,
                    open_id=session_data.user_info["open_id"]
                )
                user = result.single()
                if not user:
                    raise HTTPException(status_code=404, detail="User not found")
                return dict(user)
        except Exception as e:
            log.error(f"Error getting current user: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    @router.get("/user/inbox", response_model=List[InboxMessage])
    async def get_inbox_messages(session_data: SessionData = Depends(verifier)):
        """Get the 20 newest inbox messages for the current user"""
        try:
            with driver.session() as session:
                result = session.run(
                    """
                    MATCH (u:User {open_id: $open_id})-[:HAS_MESSAGE]->(m:InboxMessage)
                    RETURN elementId(m) as id, m.date as date, m.text as text, m.read as read,
                           m.message_type as message_type
                    ORDER BY m.date DESC
                    LIMIT 20
                    """,
                    open_id=session_data.user_info["open_id"]
                )
                return [dict(record) for record in result]
        except Exception as e:
            log.error(f"Error getting inbox messages: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    @router.post("/user/inbox/{message_id}/read")
    async def mark_message_as_read(message_id: str, session_data: SessionData = Depends(verifier)):
        """Mark a message as read"""
        try:
            with driver.session() as session:
                result = session.run(
                    """
                    MATCH (u:User {open_id: $open_id})-[:HAS_MESSAGE]->(m:InboxMessage)
                    WHERE elementId(m) = $message_id AND m.read = false
                    SET m.read = true
                    RETURN elementId(m) as id, m.date as date, m.text as text, m.read as read,
                           m.message_type as message_type
                    """,
                    open_id=session_data.user_info["open_id"],
                    message_id=message_id
                )
                record = result.single()
                if not record:
                    raise HTTPException(status_code=404, detail="Message not found or already read")
                return dict(record)
        except Exception as e:
            log.error(f"Error marking message as read: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

