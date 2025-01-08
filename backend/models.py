from pydantic import BaseModel

class SessionData(BaseModel):
    user_info: dict

class User(BaseModel):
    id: str = None  # Neo4j node ID
    name: str
    open_id: str
    created_at: str = None
    last_login_at: str = None
    level: int = 1
    deleted: bool = False

class Person(BaseModel):
    id: str = None  # Neo4j node ID
    name: str
    nickname: str = None
    created_at: str = None
    updated_at: str = None

class InboxMessage(BaseModel):
    id: str = None  # Neo4j node ID
    date: str
    text: str
    read: bool = False
    message_type: str = 'System'
