from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
import logging
from .db import driver
from .models import Person

# Configure logging
logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

def setup_people_routes(router: APIRouter):
    @router.get("/people/")
    def get_people(limit: int = 10):
        try:
            with driver.session() as session:
                result = session.run(
                    "MATCH (p:Person) "
                    "RETURN elementId(p) as id, p.name as name, p.nickname as nickname, "
                    "p.gender as gender, p.birthday as birthday, p.phone as phone, "
                    "p.email as email, p.city as city, p.resources as resources, p.needs as needs, "
                    "p.created_at as created_at, p.updated_at as updated_at "
                    "ORDER BY p.created_at DESC LIMIT $limit",
                    limit=limit
                )
                return [dict(record) for record in result]
        except Exception as e:
            log.error(f"Error fetching people: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    @router.get("/people/{person_id}")
    def get_person(person_id: str):
        """Get a single person's details"""
        try:
            with driver.session() as session:
                result = session.run(
                    """
                    MATCH (p:Person)
                    WHERE elementId(p) = $person_id
                    RETURN elementId(p) as id, p.name as name, p.nickname as nickname,
                           p.gender as gender, p.birthday as birthday, p.phone as phone,
                           p.email as email, p.city as city, p.resources as resources, p.needs as needs,
                           p.created_at as created_at, p.updated_at as updated_at
                    """,
                    person_id=person_id
                )
                record = result.single()
                if not record:
                    raise HTTPException(status_code=404, detail="Person not found")
                return dict(record)
        except Exception as e:
            log.error(f"Error fetching person details: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    @router.post("/people/")
    def create_person(person: Person):
        try:
            with driver.session() as session:
                now = datetime.now(timezone.utc).isoformat()
                result = session.run(
                    """
                    CREATE (n:Person {
                        name: $name,
                        nickname: $nickname,
                        gender: $gender,
                        birthday: $birthday,
                        phone: $phone,
                        email: $email,
                        city: $city,
                        resources: $resources,
                        needs: $needs,
                        created_at: $now,
                        updated_at: $now
                    })
                    RETURN elementId(n) as id, n.name as name, n.nickname as nickname,
                            n.gender as gender, n.birthday as birthday, n.phone as phone,
                            n.email as email, n.city as city, n.resources as resources, n.needs as needs,
                            n.created_at as created_at, n.updated_at as updated_at
                    """,
                    name=person.name,
                    nickname=person.nickname,
                    gender=person.gender,
                    birthday=person.birthday,
                    phone=person.phone,
                    email=person.email,
                    city=person.city,
                    resources=person.resources,
                    needs=person.needs,
                    now=now
                )
                return dict(result.single())
        except Exception as e:
            log.error(f"Error creating person: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))    

    @router.put("/people/{person_id}")
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
                        n.gender = $gender,
                        n.birthday = $birthday,
                        n.phone = $phone,
                        n.email = $email,
                        n.city = $city,
                        n.resources = $resources,
                        n.needs = $needs,
                        n.updated_at = $now
                    RETURN elementId(n) as id, n.name as name, n.nickname as nickname,
                            n.gender as gender, n.birthday as birthday, n.phone as phone,
                            n.email as email, n.city as city, n.resources as resources, n.needs as needs,
                            n.created_at as created_at, n.updated_at as updated_at
                    """,
                    person_id=person_id,
                    name=person.name,
                    nickname=person.nickname,
                    gender=person.gender,
                    birthday=person.birthday,
                    phone=person.phone,
                    email=person.email,
                    city=person.city,
                    resources=person.resources,
                    needs=person.needs,
                    now=now
                )
                record = result.single()
                if not record:
                    raise HTTPException(status_code=404, detail="Person not found")
                return dict(record)
        except Exception as e:
            log.error(f"Error updating person: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e)) 

    @router.delete("/people/{person_id}")
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

