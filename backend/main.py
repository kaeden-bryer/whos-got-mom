from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
import uvicorn
import os
from dotenv import load_dotenv
from supabase import create_client, Client
import requests
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_ANON_KEY")
GOOGLE_CLIENT_ID: str = os.environ.get("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET: str = os.environ.get("GOOGLE_CLIENT_SECRET")
FRONTEND_URL: str = os.environ.get("FRONTEND_URL", "http://localhost:5173")

# Use this client for standard user-scoped operations
try:
    supabase: Client = create_client(url, key)
    print("Supabase client created successfully")
except Exception as e:
    print(f"ERROR creating Supabase client: {str(e)}")

app = FastAPI()

# Configure CORS to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "Is this even updating bro"}

@app.get("/health")
def health_check():
    return {"status": "OK"}

@app.get(
    "/users",
    responses={
        200: {
            "description": "Users fetched successfully",
            "content": {
                "application/json": {
                    "example": {
                        "message": "Users fetched successfully",
                        "data": [
                            {
                                "id": "123",
                                "nameFirst": "John",
                                "nameLast": "Doe",
                                "email": "john@example.com",
                                "phoneNumber": "123-456-7890",
                                "hours": 10,
                                "sessions": 5
                            }
                        ]
                    }
                }
            }
        },
        404: {
            "description": "No users found",
            "content": {
                "application/json": {
                    "example": {"message": "No users found", "data": []}
                }
            }
        },
        500: {
            "description": "Internal server error",
            "content": {
                "application/json": {
                    "example": {"message": "Internal server error: Database connection failed", "data": []}
                }
            }
        }
    }
)

async def get_users():
    try:
        response = supabase.table("users").select("*").execute()
        
        # Check if the response has data
        if response.data is None:
            print("DEBUG - No data found, returning 404")
            return JSONResponse(
                status_code=404,
                content={"message": "No users found", "data": []}
            )
        
        # Ensure data is serializable to JSON
        users_data = response.data if isinstance(response.data, list) else []
        
        return JSONResponse(
            status_code=200,
            content={"message": "Users fetched successfully", "data": users_data}
        )
    
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"message": f"Internal server error: {str(e)}", "data": []}
        )

@app.get("/auth/google/callback")
async def google_callback(code: str = Query(...)):
    """
    Google OAuth callback handler
    1. Exchanges authorization code for tokens
    2. Verifies Google ID token
    3. Creates/updates user in Supabase (stub)
    4. Redirects back to frontend with session token
    """
    try:
        # Step 1: Exchange authorization code for tokens
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": f"{os.environ.get('BACKEND_URL', 'http://localhost:8000')}/auth/google/callback",
            "grant_type": "authorization_code",
        }
        
        token_response = requests.post(token_url, data=token_data)
        
        if token_response.status_code != 200:
            raise HTTPException(
                status_code=400, 
                detail=f"Failed to exchange code for tokens: {token_response.text}"
            )
        
        tokens = token_response.json()
        id_token_jwt = tokens.get("id_token")
        
        # Step 2: Verify Google ID token
        try:
            idinfo = id_token.verify_oauth2_token(
                id_token_jwt, 
                google_requests.Request(), 
                GOOGLE_CLIENT_ID
            )
            
            # Extract user information
            google_user_id = idinfo["sub"]
            email = idinfo["email"]
            name = idinfo.get("name", "")
            picture = idinfo.get("picture", "")
            
            print(f"✓ Verified Google user: {email} (ID: {google_user_id})")
            
        except ValueError as e:
            raise HTTPException(status_code=401, detail=f"Invalid ID token: {str(e)}")
        
        # Step 3: (Stub) Create or update user in Supabase
        # TODO: Implement actual user creation/update logic
        print(f"TODO: Create/update user in Supabase")
        print(f"  - Email: {email}")
        print(f"  - Name: {name}")
        print(f"  - Google ID: {google_user_id}")
        print(f"  - Picture: {picture}")
        
        # Stub: Simulate user creation
        user_data = {
            "google_id": google_user_id,
            "email": email,
            "name": name,
            "picture": picture,
        }
        
        # TODO: Insert into Supabase and get user_id
        # response = supabase.table("users").upsert(user_data).execute()
        stub_user_id = f"stub_user_{google_user_id[:8]}"
        
        # Step 4: Redirect back to frontend with session token
        # TODO: Create actual JWT session token
        session_token = f"stub_session_token_{stub_user_id}"
        
        # Redirect to frontend with token
        redirect_url = f"{FRONTEND_URL}/dashboard?token={session_token}&email={email}"
        
        print(f"✓ Redirecting to: {redirect_url}")
        
        return RedirectResponse(url=redirect_url)
        
    except HTTPException as he:
        # Pass through HTTP exceptions
        raise he
    except Exception as e:
        print(f"ERROR in Google callback: {str(e)}")
        # Redirect to frontend with error
        error_url = f"{FRONTEND_URL}/login?error={str(e)}"
        return RedirectResponse(url=error_url)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
