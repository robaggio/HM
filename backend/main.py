from fastapi import FastAPI
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
import logging
from .session_auth import setup_auth_routes, verifier
from .user import setup_user_routes
from .people import setup_people_routes
from .db import driver

# Configure logging
logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
FEISHU_APP_ID = os.getenv("FEISHU_APP_ID")

# Initialize FastAPI app with routes
app = FastAPI()
app = setup_auth_routes(app, verifier)
app = setup_user_routes(app, verifier)
app = setup_people_routes(app, verifier)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
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