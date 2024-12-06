from fastapi import FastAPI, Request
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
import logging

from .db import driver
from .session_auth import cookie, verifier, setup_auth_routes
from .user import setup_user_routes
from .people import setup_people_routes
from .models import SessionData

# Configure logging
logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
FEISHU_APP_ID = os.getenv("FEISHU_APP_ID")

# Create FastAPI app
app = FastAPI()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Adjust as needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    with driver.session() as session:
        result = session.run("MATCH (n) RETURN 'Hello from Neo4j!' as message")
        message = result.single()["message"]
    return {"message": message}

@app.get("/api/settings")
def get_settings():
    return {"appid": FEISHU_APP_ID, "mock_user": True}

# Setup routes
setup_auth_routes(app)
setup_user_routes(app, verifier, cookie)
setup_people_routes(app, verifier, cookie)