from fastapi import FastAPI, Request
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
import logging

from .db import driver
from .session_auth import verifier, create_protected_router, setup_auth_routes
from .user import setup_user_routes
from .people import setup_people_routes
from .network import setup_network_routes

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

@app.get("/api/public/hello")
def read_root():
    with driver.session() as session:
        result = session.run("MATCH (n) RETURN 'Hello from Neo4j!' as message")
        message = result.single()["message"]
    return {"message": message}

@app.get("/api/public/settings")
def get_settings():
    return {"appid": FEISHU_APP_ID, "mock_user": True}

# Setup routes
setup_auth_routes(app)
# Below are protected routes    
router = create_protected_router("/api/private")
setup_user_routes(router,verifier)
setup_people_routes(router)
setup_network_routes(router)
app.include_router(router)