from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from fastapi.security import HTTPBearer
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'samachar-group-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days

# Create the main app
app = FastAPI(title="Samachar Group API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

security = HTTPBearer(auto_error=False)

# ============== MODELS ==============

class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: str = "reporter"  # reporter, admin

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    role: str
    picture: Optional[str] = None
    created_at: datetime

class ArticleCreate(BaseModel):
    title: str
    title_hi: Optional[str] = None
    content: str
    content_hi: Optional[str] = None
    category: str
    image_url: Optional[str] = None
    is_featured: bool = False
    status: str = "draft"  # draft, published

class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    title_hi: Optional[str] = None
    content: Optional[str] = None
    content_hi: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    is_featured: Optional[bool] = None
    status: Optional[str] = None

class ArticleResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    article_id: str
    title: str
    title_hi: Optional[str] = None
    content: str
    content_hi: Optional[str] = None
    category: str
    image_url: Optional[str] = None
    is_featured: bool
    status: str
    author_id: str
    author_name: str
    created_at: datetime
    updated_at: datetime
    views: int = 0

# ============== AUTH HELPERS ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(request: Request):
    # Try cookie first
    session_token = request.cookies.get("session_token")
    
    # Fall back to Authorization header
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check if it's a session token (Google OAuth)
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if session:
        expires_at = session["expires_at"]
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=401, detail="Session expired")
        
        user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    
    # Try JWT token
    try:
        payload = decode_jwt_token(session_token)
        user = await db.users.find_one({"user_id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except:
        raise HTTPException(status_code=401, detail="Invalid authentication")

async def get_admin_user(request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ============== AUTH ENDPOINTS ==============

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password": hash_password(user_data.password),
        "role": "reporter",
        "picture": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_jwt_token(user_id, user_data.email, "reporter")
    
    return {
        "token": token,
        "user": {
            "user_id": user_id,
            "email": user_data.email,
            "name": user_data.name,
            "role": "reporter"
        }
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin, response: Response):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not user.get("password"):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(user["user_id"], user["email"], user["role"])
    
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=JWT_EXPIRATION_HOURS * 3600,
        path="/"
    )
    
    return {
        "token": token,
        "user": {
            "user_id": user["user_id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "picture": user.get("picture")
        }
    }

@api_router.post("/auth/google-session")
async def google_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    # Call Emergent Auth API
    async with httpx.AsyncClient() as client_http:
        auth_response = await client_http.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
    
    if auth_response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    auth_data = auth_response.json()
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": auth_data["email"]}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user info
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "name": auth_data["name"],
                "picture": auth_data.get("picture")
            }}
        )
        role = existing_user["role"]
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "email": auth_data["email"],
            "name": auth_data["name"],
            "picture": auth_data.get("picture"),
            "role": "reporter",
            "password": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
        role = "reporter"
    
    # Store session
    session_token = auth_data["session_token"]
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 3600,
        path="/"
    )
    
    return {
        "user": {
            "user_id": user_id,
            "email": auth_data["email"],
            "name": auth_data["name"],
            "role": role,
            "picture": auth_data.get("picture")
        }
    }

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "picture": user.get("picture")
    }

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# ============== ARTICLE ENDPOINTS ==============

@api_router.post("/articles", response_model=ArticleResponse)
async def create_article(article: ArticleCreate, user: dict = Depends(get_current_user)):
    article_id = f"article_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    article_doc = {
        "article_id": article_id,
        "title": article.title,
        "title_hi": article.title_hi,
        "content": article.content,
        "content_hi": article.content_hi,
        "category": article.category,
        "image_url": article.image_url,
        "is_featured": article.is_featured,
        "status": article.status,
        "author_id": user["user_id"],
        "author_name": user["name"],
        "created_at": now,
        "updated_at": now,
        "views": 0
    }
    
    await db.articles.insert_one(article_doc)
    article_doc.pop("_id", None)
    
    # Convert ISO strings to datetime for response
    article_doc["created_at"] = datetime.fromisoformat(article_doc["created_at"])
    article_doc["updated_at"] = datetime.fromisoformat(article_doc["updated_at"])
    
    return article_doc

@api_router.get("/articles", response_model=List[ArticleResponse])
async def get_articles(
    category: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    featured: Optional[bool] = None,
    author_id: Optional[str] = None,
    limit: int = 50,
    skip: int = 0
):
    query = {}
    
    if category:
        query["category"] = category
    if status:
        query["status"] = status
    if featured is not None:
        query["is_featured"] = featured
    if author_id:
        query["author_id"] = author_id
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"title_hi": {"$regex": search, "$options": "i"}},
            {"content": {"$regex": search, "$options": "i"}}
        ]
    
    articles = await db.articles.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    for article in articles:
        if isinstance(article.get("created_at"), str):
            article["created_at"] = datetime.fromisoformat(article["created_at"])
        if isinstance(article.get("updated_at"), str):
            article["updated_at"] = datetime.fromisoformat(article["updated_at"])
    
    return articles

@api_router.get("/articles/{article_id}", response_model=ArticleResponse)
async def get_article(article_id: str, increment_view: bool = True):
    article = await db.articles.find_one({"article_id": article_id}, {"_id": 0})
    
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    if increment_view:
        await db.articles.update_one(
            {"article_id": article_id},
            {"$inc": {"views": 1}}
        )
        article["views"] = article.get("views", 0) + 1
    
    if isinstance(article.get("created_at"), str):
        article["created_at"] = datetime.fromisoformat(article["created_at"])
    if isinstance(article.get("updated_at"), str):
        article["updated_at"] = datetime.fromisoformat(article["updated_at"])
    
    return article

@api_router.put("/articles/{article_id}", response_model=ArticleResponse)
async def update_article(article_id: str, article_update: ArticleUpdate, user: dict = Depends(get_current_user)):
    existing = await db.articles.find_one({"article_id": article_id}, {"_id": 0})
    
    if not existing:
        raise HTTPException(status_code=404, detail="Article not found")
    
    # Check ownership or admin
    if existing["author_id"] != user["user_id"] and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {k: v for k, v in article_update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.articles.update_one(
        {"article_id": article_id},
        {"$set": update_data}
    )
    
    updated = await db.articles.find_one({"article_id": article_id}, {"_id": 0})
    
    if isinstance(updated.get("created_at"), str):
        updated["created_at"] = datetime.fromisoformat(updated["created_at"])
    if isinstance(updated.get("updated_at"), str):
        updated["updated_at"] = datetime.fromisoformat(updated["updated_at"])
    
    return updated

@api_router.delete("/articles/{article_id}")
async def delete_article(article_id: str, user: dict = Depends(get_current_user)):
    existing = await db.articles.find_one({"article_id": article_id}, {"_id": 0})
    
    if not existing:
        raise HTTPException(status_code=404, detail="Article not found")
    
    # Check ownership or admin
    if existing["author_id"] != user["user_id"] and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.articles.delete_one({"article_id": article_id})
    
    return {"message": "Article deleted"}

# ============== ADMIN ENDPOINTS ==============

@api_router.get("/admin/articles", response_model=List[ArticleResponse])
async def admin_get_articles(
    admin: dict = Depends(get_admin_user),
    status: Optional[str] = None,
    limit: int = 100
):
    query = {}
    if status:
        query["status"] = status
    
    articles = await db.articles.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    for article in articles:
        if isinstance(article.get("created_at"), str):
            article["created_at"] = datetime.fromisoformat(article["created_at"])
        if isinstance(article.get("updated_at"), str):
            article["updated_at"] = datetime.fromisoformat(article["updated_at"])
    
    return articles

@api_router.put("/admin/articles/{article_id}/revoke")
async def revoke_article(article_id: str, admin: dict = Depends(get_admin_user)):
    existing = await db.articles.find_one({"article_id": article_id}, {"_id": 0})
    
    if not existing:
        raise HTTPException(status_code=404, detail="Article not found")
    
    await db.articles.update_one(
        {"article_id": article_id},
        {"$set": {"status": "revoked", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Article revoked"}

@api_router.get("/admin/stats")
async def admin_stats(admin: dict = Depends(get_admin_user)):
    total_articles = await db.articles.count_documents({})
    published = await db.articles.count_documents({"status": "published"})
    drafts = await db.articles.count_documents({"status": "draft"})
    revoked = await db.articles.count_documents({"status": "revoked"})
    total_users = await db.users.count_documents({})
    reporters = await db.users.count_documents({"role": "reporter"})
    
    return {
        "total_articles": total_articles,
        "published": published,
        "drafts": drafts,
        "revoked": revoked,
        "total_users": total_users,
        "reporters": reporters
    }

# ============== PUBLIC ENDPOINTS ==============

@api_router.get("/public/articles", response_model=List[ArticleResponse])
async def get_public_articles(
    category: Optional[str] = None,
    search: Optional[str] = None,
    featured: Optional[bool] = None,
    limit: int = 50,
    skip: int = 0
):
    query = {"status": "published"}
    
    if category:
        query["category"] = category
    if featured is not None:
        query["is_featured"] = featured
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"title_hi": {"$regex": search, "$options": "i"}},
            {"content": {"$regex": search, "$options": "i"}}
        ]
    
    articles = await db.articles.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    for article in articles:
        if isinstance(article.get("created_at"), str):
            article["created_at"] = datetime.fromisoformat(article["created_at"])
        if isinstance(article.get("updated_at"), str):
            article["updated_at"] = datetime.fromisoformat(article["updated_at"])
    
    return articles

@api_router.get("/public/categories")
async def get_categories():
    return {
        "categories": [
            {"id": "sports", "name": "Sports", "name_hi": "खेल"},
            {"id": "crime", "name": "Crime", "name_hi": "अपराध"},
            {"id": "politics", "name": "Politics", "name_hi": "राजनीति"},
            {"id": "entertainment", "name": "Entertainment", "name_hi": "मनोरंजन"},
            {"id": "business", "name": "Business", "name_hi": "व्यापार"},
            {"id": "technology", "name": "Technology", "name_hi": "प्रौद्योगिकी"}
        ]
    }

@api_router.get("/")
async def root():
    return {"message": "Samachar Group API", "version": "1.0.0"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
