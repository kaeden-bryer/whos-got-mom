from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, Response
from starlette.middleware.base import BaseHTTPMiddleware
from pydantic import BaseModel, EmailStr, Field
import uvicorn
import os
import uuid
import re
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_ANON_KEY")


# Pydantic model for user creation
class CreateUserRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="User's username")
    password: str = Field(..., min_length=8, max_length=100, description="User's password")
    nameFirst: str = Field(..., min_length=1, max_length=100, description="User's first name")
    nameLast: str = Field(..., min_length=1, max_length=100, description="User's last name")
    email: EmailStr = Field(..., description="User's email address")
    phoneNumber: str = Field(..., min_length=10, max_length=20, description="User's phone number")

# Pydantic model for login
class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1, description="User's username")
    password: str = Field(..., min_length=1, description="User's password")

# Use this client for standard user-scoped operations
try:
    supabase: Client = create_client(url, key)
    print("Supabase client created successfully")
except Exception as e:
    print(f"ERROR creating Supabase client: {str(e)}")

app = FastAPI()


# Custom CORS middleware that works reliably in serverless
class CORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Handle preflight OPTIONS requests
        if request.method == "OPTIONS":
            return Response(
                status_code=200,
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
                    "Access-Control-Max-Age": "86400",
                }
            )
        
        # Process the request and add CORS headers to response
        response = await call_next(request)
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept"
        return response


app.add_middleware(CORSMiddleware)

@app.get("/")
def root():
    return {"status": "Is this even updating bro"}

@app.get("/health")
def health_check():
    return {"status": "OK"}


@app.post(
    "/login",
    responses={
        200: {
            "description": "Login successful",
            "content": {
                "application/json": {
                    "example": {
                        "message": "Login successful",
                        "userId": "550e8400-e29b-41d4-a716-446655440000",
                        "username": "john_doe"
                    }
                }
            }
        },
        403: {
            "description": "Invalid credentials",
            "content": {
                "application/json": {
                    "example": {"message": "Invalid username or password. Please try again."}
                }
            }
        },
        500: {
            "description": "Internal server error",
            "content": {
                "application/json": {
                    "example": {"message": "Internal server error: Database connection failed"}
                }
            }
        }
    }
)
async def login(credentials: LoginRequest):
    try:
        # Query Supabase for user with matching username
        response = supabase.table("users").select("id, username, password").eq("username", credentials.username).execute()
        
        # Check if user exists
        if not response.data or len(response.data) == 0:
            return JSONResponse(
                status_code=403,
                content={"message": "Invalid username or password. Please try again."}
            )
        
        user = response.data[0]
        
        # Check if password matches
        # Note: In production, you should use proper password hashing!
        if user["password"] != credentials.password:
            return JSONResponse(
                status_code=403,
                content={"message": "Invalid username or password. Please try again."}
            )
        
        # Login successful
        return JSONResponse(
            status_code=200,
            content={
                "message": "Login successful",
                "userId": user["id"],
                "username": user["username"]
            }
        )
    
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"message": f"Internal server error: {str(e)}"}
        )

@app.get(
    "/users/{user_id}",
    responses={
        200: {
            "description": "User fetched successfully",
            "content": {
                "application/json": {
                    "example": {
                        "message": "User fetched successfully",
                        "data": {
                            "id": "550e8400-e29b-41d4-a716-446655440000",
                            "nameFirst": "John",
                            "nameLast": "Doe",
                            "email": "john@example.com",
                            "phoneNumber": "123-456-7890",
                            "hours": 10,
                            "sessions": 5
                        }
                    }
                }
            }
        },
        404: {
            "description": "User not found",
            "content": {
                "application/json": {
                    "example": {"message": "User not found", "data": None}
                }
            }
        },
        500: {
            "description": "Internal server error",
            "content": {
                "application/json": {
                    "example": {"message": "Internal server error: Database connection failed", "data": None}
                }
            }
        }
    }
)
async def get_user_by_id(user_id: str):
    try:
        response = supabase.table("users").select("id, nameFirst, nameLast, email, phoneNumber, hours, sessions").eq("id", user_id).execute()
        
        if not response.data or len(response.data) == 0:
            return JSONResponse(
                status_code=404,
                content={"message": "User not found", "data": None}
            )
        
        return JSONResponse(
            status_code=200,
            content={"message": "User fetched successfully", "data": response.data[0]}
        )
    
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"message": f"Internal server error: {str(e)}", "data": None}
        )


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


@app.post(
    "/create-user",
    responses={
        201: {
            "description": "User created successfully",
            "content": {
                "application/json": {
                    "example": {
                        "message": "User created successfully",
                        "data": {
                            "id": "550e8400-e29b-41d4-a716-446655440000",
                            "nameFirst": "John",
                            "nameLast": "Doe",
                            "username": "john_doe",
                            "password": "password123",
                            "email": "john@example.com",
                            "phoneNumber": "123-456-7890",
                            "hours": 0,
                            "sessions": 0
                        }
                    }
                }
            }
        },
        400: {
            "description": "Invalid request data",
            "content": {
                "application/json": {
                    "example": {"message": "Invalid email format", "data": None}
                }
            }
        },
        409: {
            "description": "User already exists",
            "content": {
                "application/json": {
                    "example": {"message": "A user with this email already exists", "data": None}
                }
            }
        },
        500: {
            "description": "Internal server error",
            "content": {
                "application/json": {
                    "example": {"message": "Internal server error: Database connection failed", "data": None}
                }
            }
        }
    }
)
async def create_user(user: CreateUserRequest):
    try:
        # Validate phone number format (basic validation for digits, dashes, spaces, parentheses)
        phone_pattern = re.compile(r'^[\d\s\-\(\)\+]+$')
        if not phone_pattern.match(user.phoneNumber):
            return JSONResponse(
                status_code=400,
                content={"message": "Invalid phone number format. Use only digits, spaces, dashes, and parentheses.", "data": None}
            )
        
        # Check if user with this email already exists
        existing_email = supabase.table("users").select("id").eq("email", user.email).execute()
        if existing_email.data and len(existing_email.data) > 0:
            return JSONResponse(
                status_code=409,
                content={"message": "A user with this email already exists", "data": None}
            )
        
        # Check if user with this username already exists
        existing_username = supabase.table("users").select("id").eq("username", user.username).execute()
        if existing_username.data and len(existing_username.data) > 0:
            return JSONResponse(
                status_code=409,
                content={"message": "This username is already taken", "data": None}
            )
        
        # Generate unique ID and prepare user data
        user_id = str(uuid.uuid4())
        user_data = {
            "id": user_id,
            "username": user.username.strip(),
            "password": user.password,  # Note: In production, hash this password!
            "nameFirst": user.nameFirst.strip(),
            "nameLast": user.nameLast.strip(),
            "email": user.email.lower().strip(),
            "phoneNumber": user.phoneNumber.strip(),
            "hours": 0,
            "sessions": 0
        }
        
        # Insert user into Supabase
        response = supabase.table("users").insert(user_data).execute()
        
        if response.data:
            return JSONResponse(
                status_code=201,
                content={"message": "User created successfully", "data": response.data[0]}
            )
        else:
            return JSONResponse(
                status_code=500,
                content={"message": "Failed to create user", "data": None}
            )
    
    except Exception as e:
        error_message = str(e)
        # Check for common Supabase errors
        if "duplicate" in error_message.lower() or "unique" in error_message.lower():
            return JSONResponse(
                status_code=409,
                content={"message": "A user with this email or phone number already exists", "data": None}
            )
        return JSONResponse(
            status_code=500,
            content={"message": f"Internal server error: {error_message}", "data": None}
        )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
