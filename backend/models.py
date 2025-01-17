from pydantic import BaseModel
from typing import Optional

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
    id: Optional[str] = None  # Neo4j node ID
    name: str
    nickname: Optional[str] = None
    gender: Optional[str] = None  # 'male' or 'female' or other
    birthday: Optional[str] = None  # ISO format date string
    phone: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None
    resources: Optional[str] = None  # what this person can provide
    needs: Optional[str] = None  # what this person needs
    created_at: Optional[str] = None
    updated_at: Optional[str] = None # ISO format timestamp for last update  

class InboxMessage(BaseModel):
    id: str = None  # Neo4j node ID
    date: str
    text: str
    read: bool = False
    message_type: str = 'System'
