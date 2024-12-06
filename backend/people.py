from fastapi import FastAPI, HTTPException, Depends
from datetime import datetime, timezone
import logging
from .db import driver
from .models import Person

# Configure logging
logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

def setup_people_routes(app: FastAPI, verifier):
    @app.get("/api/people/")
    def get_people(limit: int = 10):
        try:
            with driver.session() as session:
                result = session.run(
                    "MATCH (p:Person) "
                    "RETURN elementId(p) as id, p.name as name, p.nickname as nickname, "
                    "p.created_at as created_at, p.updated_at as updated_at "
                    "ORDER BY p.created_at DESC LIMIT $limit",
                    limit=limit
                )
                return [dict(record) for record in result]
        except Exception as e:
            log.error(f"Error fetching people: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    @app.post("/api/people")
    def create_person(person: Person):
        try:
            with driver.session() as session:
                now = datetime.now(timezone.utc).isoformat()
                result = session.run(
                    """
                    CREATE (n:Person {
                        name: $name,
                        nickname: $nickname,
                        created_at: $now,
                        updated_at: $now
                    })
                    RETURN elementId(n) as id, n.name as name, n.nickname as nickname,
                            n.created_at as created_at, n.updated_at as updated_at
                    """,
                    name=person.name,
                    nickname=person.nickname,
                    now=now
                )
                return dict(result.single())
        except Exception as e:
            log.error(f"Error creating person: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))    

    @app.put("/api/people/{person_id}")
    def update_person(person_id: str, person: Person):
        try:
            with driver.session() as session:
                now = datetime.now(timezone.utc).isoformat()
            result = session.run(
                """
                MATCH (n)
                WHERE elementId(n) = $person_id
                SET n.name = $name,
                    n.nickname = $nickname,
                    n.updated_at = $now
                RETURN elementId(n) as id, n.name as name, n.nickname as nickname,
                        n.created_at as created_at, n.updated_at as updated_at
                """,
                person_id=person_id,
                name=person.name,
                nickname=person.nickname,
                now=now
            )
            record = result.single()
            if not record:
                raise HTTPException(status_code=404, detail="Person not found")
            return dict(record)
        except Exception as e:
            log.error(f"Error updating person: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e)) 

    @app.delete("/api/people/{person_id}")
    def delete_person(person_id: str):
        try:
            with driver.session() as session:
                result = session.run(
                    """
                    MATCH (n)
                WHERE elementId(n) = $person_id
                DELETE n
                """,
                person_id=person_id
            )
            return {"status": "success"}
        except Exception as e:
            log.error(f"Error deleting person: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e)) 

    return app
