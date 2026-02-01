from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_ANON_KEY")

# Use this client for standard user-scoped operations
supabase: Client = create_client(url, key)

app = FastAPI()

# Configure CORS to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
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
        response = supabase.table("user").select("*").execute()
        
        # Check if the response has data
        if response.data is None:
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
        # Log the error for debugging
        print(f"Error fetching users: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"message": f"Internal server error: {str(e)}", "data": []}
        )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
