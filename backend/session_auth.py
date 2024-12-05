from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi_sessions.backends.implementations import InMemoryBackend
from fastapi_sessions.session_verifier import SessionVerifier
from fastapi_sessions.frontends.implementations import SessionCookie, CookieParameters
from uuid import UUID, uuid4
from pydantic import BaseModel
import requests
import logging
import os
from dotenv import load_dotenv
from .auth import Auth

# Load environment variables
load_dotenv()
# Get environment variables
FEISHU_APP_ID = os.getenv("FEISHU_APP_ID")
FEISHU_APP_SECRET = os.getenv("FEISHU_APP_SECRET")
FEISHU_HOST = os.getenv("FEISHU_HOST")

# Initialize Auth
auth = Auth(FEISHU_HOST, FEISHU_APP_ID, FEISHU_APP_SECRET)

# Configure logging
logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

# Session configuration
cookie_params = CookieParameters()
cookie = SessionCookie(
    cookie_name="feishu_session",
    identifier="general_verifier",
    auto_error=True,
    secret_key="CHANGE_THIS_TO_A_SECRET_KEY",  # In production, use a proper secret key
    cookie_params=cookie_params
)

backend = InMemoryBackend()

class SessionData(BaseModel):
    user_info: dict

class BasicVerifier(SessionVerifier[UUID, SessionData]):
    def __init__(
        self,
        *,
        identifier: str,
        auto_error: bool,
        backend: InMemoryBackend,
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

def setup_auth_routes(app: FastAPI, auth):
    @app.get("/api/auth/callback")
    async def feishu_callback(code: str):
        """Handle Feishu authorization callback"""
        try:
            # Get user access token and info
            auth.authorize_user_access_token(code)
            user_info = auth.get_user_info()

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
