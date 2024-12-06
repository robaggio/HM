from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi_sessions.backends.implementations import InMemoryBackend
from fastapi_sessions.session_verifier import SessionVerifier
from fastapi_sessions.frontends.implementations import SessionCookie, CookieParameters
from uuid import UUID, uuid4
import requests
import logging
import os
from dotenv import load_dotenv
from .feishu import Feishu
from .db import driver
from .user import get_or_create_user
from .models import SessionData

# Load environment variables
load_dotenv()
FEISHU_APP_ID = os.getenv("FEISHU_APP_ID")
FEISHU_APP_SECRET = os.getenv("FEISHU_APP_SECRET")
FEISHU_HOST = os.getenv("FEISHU_HOST")

# Initialize Feishu
auth = Feishu(FEISHU_HOST, FEISHU_APP_ID, FEISHU_APP_SECRET)

# Configure logging
logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

# Configure cookie parameters
cookie_params = CookieParameters()

# Use UUID4 (random) as session ID
cookie = SessionCookie(
    cookie_name="feishu_session",
    identifier="general_verifier",
    auto_error=True,
    secret_key="HIKE",  # In production, use a proper secret key
    cookie_params=cookie_params
)

backend = InMemoryBackend[UUID, SessionData]()

class BasicVerifier(SessionVerifier[UUID, SessionData]):
    def __init__(
        self,
        *,
        identifier: str,
        auto_error: bool,
        backend: InMemoryBackend[UUID, SessionData],
        auth_http_exception: HTTPException,
    ):
        self._identifier = identifier
        self._auto_error = auto_error
        self._backend = backend
        self._auth_http_exception = auth_http_exception

    @property
    def identifier(self):
        return self._identifier

    @property
    def backend(self):
        return self._backend

    @property
    def auto_error(self):
        return self._auto_error

    @property
    def auth_http_exception(self):
        return self._auth_http_exception

    def verify_session(self, model: SessionData) -> bool:
        """If the session exists, it is valid"""
        return True

verifier = BasicVerifier(
    identifier="general_verifier",
    auto_error=True,
    backend=backend,
    auth_http_exception=HTTPException(status_code=403, detail="invalid session"),
)

def setup_auth_routes(app: FastAPI, verifier):
    @app.get("/api/auth/callback")
    async def feishu_callback(code: str):
        """Handle Feishu authorization callback"""
        try:
            # TODO need to comment this before deploy
            # if code == "mock": use mock data
            if code == "mock":
                user_info = {
                    "avatar_url": "https://s3-imfile.feishucdn.com/static-resource/v1/v3_00gn_e89aea88-3b26-492b-a789-1bc9165f884g~?image_size=72x72&cut_type=&quality=&format=image&sticker_format=.webp",
                    "en_name": "Toby",
                    "name": "Toby",
                    "open_id": "ou_f9697445a083cbad6e15c7d71b63eb74",
                    "tenant_key": "145c3d9f7d0fd75d",
                    "union_id": "on_86ec337b91935163274083d388e753f9"
                }
            else:
                # Get user access token and info
                auth.authorize_user_access_token(code)
                user_info = auth.get_user_info()

            # Create or update user in database
            with driver.session() as session:
                db_user = get_or_create_user(session, user_info)
                # Add database user info to the user_info dict
                user_info.update({
                    "level": db_user["level"],
                    "created_at": db_user["created_at"],
                    "last_login_at": db_user["last_login_at"]
                })

            # Create new session
            session_id = uuid4()
            data = SessionData(user_info=user_info)
            
            await backend.create(session_id, data)
            response = JSONResponse(user_info)
            
            # Set session cookie
            cookie.attach_to_response(response, session_id)
            
            return response
            
        except requests.exceptions.RequestException as e:
            log.error(f"Request error: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to communicate with Feishu API")
        except Exception as e:
            log.error(f"Unexpected error in callback: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    return app
