from fastapi import FastAPI, HTTPException, Depends
from datetime import datetime, timezone
import logging
from .db import driver
from .models import User, SessionData

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
        # Create new user
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
            RETURN elementId(u) as id, u.name as name, u.open_id as open_id,
                   u.created_at as created_at, u.last_login_at as last_login_at,
                   u.level as level, u.deleted as deleted
            """,
            name=user_info["name"],
            open_id=user_info["open_id"],
            now=now
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

def setup_user_routes(app: FastAPI, verifier):
    @app.get("/api/users/me")
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

    return app
