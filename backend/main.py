from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, EmailStr, Field
import uvicorn
import os
import uuid
import re
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
# Use service key for backend operations (bypasses RLS)
# Falls back to anon key if service key is not set
key: str = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_ANON_KEY")


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

# Pydantic model for squad creation
class CreateSquadRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Name of the squad")
    nameMom: str = Field(..., min_length=1, max_length=100, description="Name of mom")
    user_id: str = Field(..., description="ID of the user creating the squad (will become admin)")

# Pydantic model for squad membership creation
class CreateSquadMembershipRequest(BaseModel):
    user_id: str = Field(..., description="ID of the user to add")
    squad_id: str = Field(..., description="ID of the squad")

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
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# Handle OPTIONS preflight requests explicitly
@app.options("/{path:path}")
async def options_handler(path: str):
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        }
    )

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
    "/users/search",
    responses={
        200: {
            "description": "Users found",
            "content": {
                "application/json": {
                    "example": {
                        "message": "Users found",
                        "data": [
                            {
                                "id": "user-uuid",
                                "nameFirst": "John",
                                "nameLast": "Doe"
                            }
                        ]
                    }
                }
            }
        },
        500: {
            "description": "Internal server error",
            "content": {
                "application/json": {
                    "example": {"message": "Internal server error", "data": []}
                }
            }
        }
    }
)
async def search_users(q: str = ""):
    """
    Search users by first name (case-insensitive partial match).
    
    Query parameters:
    - q: Search query to match against nameFirst
    """
    try:
        if not q:
            return JSONResponse(
                status_code=200,
                content={"message": "No search query provided", "data": []}
            )
        
        # Fetch all users and filter in Python for compatibility
        response = supabase.table("users").select("id, nameFirst, nameLast").execute()
        
        if not response.data:
            return JSONResponse(
                status_code=200,
                content={"message": "No users found", "data": []}
            )
        
        # Filter users whose nameFirst contains the search query (case-insensitive)
        q_lower = q.lower()
        filtered_users = [
            user for user in response.data 
            if user.get("nameFirst", "").lower().startswith(q_lower) or 
               q_lower in user.get("nameFirst", "").lower()
        ]
        
        return JSONResponse(
            status_code=200,
            content={"message": "Users found", "data": filtered_users}
        )
    
    except Exception as e:
        print(f"Search error: {str(e)}")  # Log the error for debugging
        return JSONResponse(
            status_code=500,
            content={"message": f"Internal server error: {str(e)}", "data": []}
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


@app.get(
    "/squads",
    responses={
        200: {
            "description": "Squads fetched successfully",
            "content": {
                "application/json": {
                    "example": {
                        "message": "Squads fetched successfully",
                        "data": [
                            {
                                "id": "550e8400-e29b-41d4-a716-446655440000",
                                "name": "Smith Family",
                                "nameMom": "Jane Smith"
                            }
                        ]
                    }
                }
            }
        },
        404: {
            "description": "No squads found",
            "content": {
                "application/json": {
                    "example": {"message": "No squads found", "data": []}
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
async def get_squads():
    try:
        response = supabase.table("squad").select("id, name, nameMom").execute()
        
        if response.data is None:
            return JSONResponse(
                status_code=404,
                content={"message": "No squads found", "data": []}
            )
        
        squads_data = response.data if isinstance(response.data, list) else []
        
        return JSONResponse(
            status_code=200,
            content={"message": "Squads fetched successfully", "data": squads_data}
        )
    
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"message": f"Internal server error: {str(e)}", "data": []}
        )


@app.post(
    "/squads",
    responses={
        201: {
            "description": "Squad created successfully",
            "content": {
                "application/json": {
                    "example": {
                        "message": "Squad created successfully",
                        "data": {
                            "id": "550e8400-e29b-41d4-a716-446655440000",
                            "name": "Smith Family",
                            "nameMom": "Jane Smith"
                        }
                    }
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
async def create_squad(squad: CreateSquadRequest):
    """
    Create a new squad with auto-generated UUID.
    Also creates a squad membership for the creator as admin.
    
    Sample Postman request body:
    {
        "name": "Smith Family",
        "nameMom": "Jane Smith",
        "user_id": "550e8400-e29b-41d4-a716-446655440000"
    }
    """
    try:
        # Generate unique ID and prepare squad data
        squad_id = str(uuid.uuid4())
        squad_data = {
            "id": squad_id,
            "name": squad.name.strip(),
            "nameMom": squad.nameMom.strip()
        }
        
        # Insert squad into Supabase
        response = supabase.table("squad").insert(squad_data).execute()
        
        if response.data:
            # Create squad membership for the creator as admin
            membership_id = str(uuid.uuid4())
            membership_data = {
                "id": membership_id,
                "user_id": squad.user_id,
                "squad_id": squad_id,
                "primary": True,  # Creator is admin
                "joined_at": datetime.utcnow().isoformat()
            }
            supabase.table("user_squad_memberships").insert(membership_data).execute()
            
            return JSONResponse(
                status_code=201,
                content={"message": "Squad created successfully", "data": response.data[0]}
            )
        else:
            return JSONResponse(
                status_code=500,
                content={"message": "Failed to create squad", "data": None}
            )
    
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"message": f"Internal server error: {str(e)}", "data": None}
        )


@app.get(
    "/squad-memberships",
    responses={
        200: {
            "description": "Squad memberships fetched successfully",
            "content": {
                "application/json": {
                    "example": {
                        "message": "Squad memberships fetched successfully",
                        "data": [
                            {
                                "id": "550e8400-e29b-41d4-a716-446655440000",
                                "user_id": "user-uuid",
                                "squad_id": "squad-uuid",
                                "primary": True,
                                "joined_at": "2024-01-15T10:30:00"
                            }
                        ]
                    }
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
async def get_squad_memberships(squad_id: str = None):
    """
    Get all squad memberships, optionally filtered by squad_id.
    
    Query parameters:
    - squad_id (optional): Filter memberships by squad ID
    """
    try:
        query = supabase.table("user_squad_memberships").select("id, user_id, squad_id, primary, joined_at")
        
        if squad_id:
            query = query.eq("squad_id", squad_id)
        
        response = query.execute()
        
        if response.data is None:
            return JSONResponse(
                status_code=200,
                content={"message": "No squad memberships found", "data": []}
            )
        
        memberships_data = response.data if isinstance(response.data, list) else []
        
        return JSONResponse(
            status_code=200,
            content={"message": "Squad memberships fetched successfully", "data": memberships_data}
        )
    
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"message": f"Internal server error: {str(e)}", "data": []}
        )


@app.get(
    "/squad-memberships/{squad_id}/members",
    responses={
        200: {
            "description": "Squad members fetched successfully with user details",
            "content": {
                "application/json": {
                    "example": {
                        "message": "Squad members fetched successfully",
                        "data": [
                            {
                                "id": "membership-uuid",
                                "user_id": "user-uuid",
                                "squad_id": "squad-uuid",
                                "primary": True,
                                "joined_at": "2024-01-15T10:30:00",
                                "user": {
                                    "id": "user-uuid",
                                    "nameFirst": "John",
                                    "nameLast": "Doe"
                                }
                            }
                        ]
                    }
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
async def get_squad_members(squad_id: str):
    """
    Get all members of a specific squad with their user details.
    """
    try:
        # Get all memberships for this squad
        memberships_response = supabase.table("user_squad_memberships").select("*").eq("squad_id", squad_id).execute()
        
        if not memberships_response.data:
            return JSONResponse(
                status_code=200,
                content={"message": "No members found", "data": []}
            )
        
        # Get user details for each membership
        members_with_details = []
        for membership in memberships_response.data:
            user_response = supabase.table("users").select("id, nameFirst, nameLast").eq("id", membership["user_id"]).execute()
            if user_response.data:
                membership["user"] = user_response.data[0]
            members_with_details.append(membership)
        
        return JSONResponse(
            status_code=200,
            content={"message": "Squad members fetched successfully", "data": members_with_details}
        )
    
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"message": f"Internal server error: {str(e)}", "data": []}
        )


@app.post(
    "/squad-memberships",
    responses={
        201: {
            "description": "Squad membership created successfully",
            "content": {
                "application/json": {
                    "example": {
                        "message": "Squad membership created successfully",
                        "data": {
                            "id": "550e8400-e29b-41d4-a716-446655440000",
                            "user_id": "user-uuid",
                            "squad_id": "squad-uuid",
                            "primary": False,
                            "joined_at": "2024-01-15T10:30:00"
                        }
                    }
                }
            }
        },
        409: {
            "description": "User already in squad",
            "content": {
                "application/json": {
                    "example": {"message": "User is already a member of this squad", "data": None}
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
async def create_squad_membership(membership: CreateSquadMembershipRequest):
    """
    Add a user to a squad.
    
    Sample Postman request body:
    {
        "user_id": "550e8400-e29b-41d4-a716-446655440000",
        "squad_id": "660e8400-e29b-41d4-a716-446655440000"
    }
    """
    try:
        # Check if user is already a member of this squad
        existing = supabase.table("user_squad_memberships").select("id").eq("user_id", membership.user_id).eq("squad_id", membership.squad_id).execute()
        if existing.data and len(existing.data) > 0:
            return JSONResponse(
                status_code=409,
                content={"message": "User is already a member of this squad", "data": None}
            )
        
        # Create membership
        membership_id = str(uuid.uuid4())
        membership_data = {
            "id": membership_id,
            "user_id": membership.user_id,
            "squad_id": membership.squad_id,
            "primary": False,  # New members are not admins
            "joined_at": datetime.utcnow().isoformat()
        }
        
        response = supabase.table("user_squad_memberships").insert(membership_data).execute()
        
        if response.data:
            return JSONResponse(
                status_code=201,
                content={"message": "Squad membership created successfully", "data": response.data[0]}
            )
        else:
            return JSONResponse(
                status_code=500,
                content={"message": "Failed to create squad membership", "data": None}
            )
    
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"message": f"Internal server error: {str(e)}", "data": None}
        )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
