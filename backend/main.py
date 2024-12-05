from fastapi import FastAPI, HTTPException
from neo4j import GraphDatabase
import os
# import hashlib
import time
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from pydantic import BaseModel
from datetime import datetime, timezone
from fastapi.middleware.cors import CORSMiddleware
from .auth import Auth
import requests
import logging
from .session_auth import setup_auth_routes, auth

# Configure logging
logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
FEISHU_APP_ID = os.getenv("FEISHU_APP_ID")

# Get environment variables
NEO4J_URI = os.getenv("NEO4J_URI")
NEO4J_USERNAME = os.getenv("NEO4J_USERNAME")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")

# Initialize driver
driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USERNAME, NEO4J_PASSWORD))

# Initialize FastAPI app with auth routes
app = FastAPI()
app = setup_auth_routes(app, auth)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Person(BaseModel):
    id: str = None  # Neo4j node ID
    name: str
    nickname: str = None
    created_at: str = None
    updated_at: str = None

@app.get("/")
def read_root():
    with driver.session() as session:
        result = session.run("MATCH (n) RETURN 'Hello from Neo4j!' as message")
        message = result.single()["message"]
    return {"message": message}

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

@app.post("/api/people/")
def create_person(person: Person):
    try:
        with driver.session() as session:
            now = datetime.now(timezone.utc).isoformat()
            result = session.run(
                "CREATE (p:Person {name: $name, nickname: $nickname, "
                "created_at: $created_at, updated_at: $updated_at}) "
                "RETURN elementId(p) as id, p.name as name, p.nickname as nickname, "
                "p.created_at as created_at, p.updated_at as updated_at",
                name=person.name,
                nickname=person.nickname,
                created_at=now,
                updated_at=now
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
                "MATCH (p) WHERE elementId(p) = $person_id "
                "SET p.name = $name, p.nickname = $nickname, "
                "p.updated_at = $updated_at "
                "RETURN elementId(p) as id, p.name as name, p.nickname as nickname, "
                "p.created_at as created_at, p.updated_at as updated_at",
                person_id=person_id,
                name=person.name,
                nickname=person.nickname,
                updated_at=now
            )
            if not result.peek():
                raise HTTPException(status_code=404, detail="Person not found")
            return dict(result.single())
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Error updating person: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/people/{person_id}")
def delete_person(person_id: str):
    try:
        with driver.session() as session:
            result = session.run(
                "MATCH (p) WHERE elementId(p) = $person_id "
                "DELETE p",
                person_id=person_id
            )
            if result.consume().counters.nodes_deleted == 0:
                raise HTTPException(status_code=404, detail="Person not found")
            return {"status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Error deleting person: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/settings")
def get_settings(url: str):
    # # 接入方前端传来的需要鉴权的网页url
    # ticket = auth.get_ticket()
    # # 当前时间戳，毫秒级
    # timestamp = int(time.time()) * 1000
    # verify_str = "jsapi_ticket={}&noncestr={}&timestamp={}&url={}".format(
    #     ticket, NONCE_STR, timestamp, url
    # ) 
    # # 对字符串做sha1加密，得到签名signature
    # signature = hashlib.sha1(verify_str.encode("utf-8")).hexdigest()
    # # 将鉴权所需参数返回给前端
    # return {"appid": FEISHU_APP_ID,"signature": signature,"noncestr": NONCE_STR,"timestamp": timestamp}
    return {"appid": FEISHU_APP_ID}