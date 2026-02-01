from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
    return {"status": "OK"}

@app.get("/health")
def health_check():
    return {"status": "OK"}

@app.get("/test")
def test_route():
    return "Hello world!"

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
