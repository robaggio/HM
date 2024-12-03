import logging
from fastapi import FastAPI, HTTPException
from neo4j import GraphDatabase
import os
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from pydantic import BaseModel
from uuid import uuid4
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware

# Configure logging
logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

load_dotenv()

# Neo4j connection setup
uri = os.getenv("NEO4J_URI")
username = os.getenv("NEO4J_USERNAME")
password = os.getenv("NEO4J_PASSWORD")
driver = GraphDatabase.driver(uri, auth=(username, password))

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    driver.close()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Adjust this to match your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Person(BaseModel):
    id: str = None
    name: str
    nickname: str
    created_at: str = None
    updated_at: str = None

@app.get("/")
def read_root():
    with driver.session() as session:
        result = session.run("RETURN 'Hello, Neo4j!' AS message")
        message = result.single()["message"]
    return {"message": message}

@app.get("/api/people")
def get_people(limit: int = 10):
    with driver.session() as session:
        log.info(f"api people")
        result = session.run(
            "MATCH (p:Person) RETURN p.id AS id, p.name AS name, p.nickname AS nickname, p.created_at AS created_at, p.updated_at AS updated_at ORDER BY p.updated_at DESC LIMIT $limit",
            limit=limit
        )
        people = [{"id": record["id"], "name": record["name"], "nickname": record["nickname"], "created_at": record["created_at"], "updated_at": record["updated_at"]} for record in result]
    return people

@app.post("/api/person")
def create_person(person: Person):
    person.id = str(uuid4())
    person.created_at = datetime.utcnow().isoformat()
    person.updated_at = datetime.utcnow().isoformat()
    log.info(f"Creating person {person}")
    with driver.session() as session:
        session.run(
            "CREATE (p:Person {id: $id, name: $name, nickname: $nickname, created_at: $created_at, updated_at: $updated_at})",
            id=person.id, name=person.name, nickname=person.nickname, created_at=person.created_at, updated_at=person.updated_at
        )
    return {"message": "Person created successfully", "id": person.id}