import os
import datetime
from fastapi import FastAPI, HTTPException, Depends, Header, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from database import store, persist_store, get_user_by_email, get_user_by_id, get_expenses_by_user, add_expense, delete_expense
from security import hash_password, verify_password, create_access_token, decode_access_token

app = FastAPI(
    title="TrueBalance API",
    description="Python FastAPI High-Performance Backend for TrueBalance",
    version="3.0.0"
)

# Enable CORS for Web & Mobile clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Seed default accounts if missing
def seed_defaults():
    if not any(u.get("email") == "admin@tracker.com" for u in store["users"]):
        store["users"].append({
            "id": 1,
            "name": "Admin",
            "email": "admin@tracker.com",
            "password": hash_password("admin123"),
            "role": "admin",
            "plan": "pro",
            "monthly_budget": 50000.0,
            "created_at": datetime.datetime.utcnow().isoformat()
        })
    if not any(u.get("email") == "user@tracker.com" for u in store["users"]):
        store["users"].append({
            "id": 2,
            "name": "Heri Ghetiya",
            "email": "user@tracker.com",
            "password": hash_password("user123"),
            "role": "user",
            "plan": "free",
            "monthly_budget": 25000.0,
            "created_at": datetime.datetime.utcnow().isoformat()
        })
    persist_store()

seed_defaults()

# Pydantic Schemas
class SignupModel(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginModel(BaseModel):
    email: EmailStr
    password: str

class ExpenseModel(BaseModel):
    amount: float
    category: str
    description: Optional[str] = ""
    date: str
    time: str
    type: Optional[str] = "expense"

# Auth Helper Dependency
def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Access token required")
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=403, detail="Invalid or expired token")
    user = get_user_by_id(payload.get("id"))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Routes
@app.get("/")
def read_root():
    return {"message": "TrueBalance Python FastAPI Engine Online 🚀", "version": "3.0.0"}

@app.post("/api/auth/signup")
def signup(data: SignupModel):
    existing = get_user_by_email(data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_id = max([u.get("id", 0) for u in store["users"]], default=0) + 1
    new_user = {
        "id": new_id,
        "name": data.name.strip(),
        "email": data.email.strip().lower(),
        "password": hash_password(data.password),
        "role": "user",
        "plan": "free",
        "monthly_budget": 25000.0,
        "created_at": datetime.datetime.utcnow().isoformat()
    }
    store["users"].append(new_user)
    persist_store()
    
    token = create_access_token({"id": new_id, "email": new_user["email"], "role": "user"})
    return {"token": token, "user": {"id": new_id, "name": new_user["name"], "email": new_user["email"], "role": "user", "plan": "free", "monthly_budget": 25000.0}}

@app.post("/api/auth/login")
def login(data: LoginModel):
    user = get_user_by_email(data.email)
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    token = create_access_token({"id": user["id"], "email": user["email"], "role": user.get("role", "user")})
    return {"token": token, "user": {"id": user["id"], "name": user["name"], "email": user["email"], "role": user.get("role", "user"), "plan": user.get("plan", "free"), "monthly_budget": user.get("monthly_budget", 25000.0)}}

@app.get("/api/expenses")
def get_expenses(user: dict = Depends(get_current_user)):
    return get_expenses_by_user(user["id"])

@app.post("/api/expenses")
def create_expense(data: ExpenseModel, user: dict = Depends(get_current_user)):
    exp = {
        "user_id": user["id"],
        "amount": data.amount,
        "category": data.category,
        "description": data.description,
        "date": data.date,
        "time": data.time,
        "type": data.type,
        "created_at": datetime.datetime.utcnow().isoformat()
    }
    return add_expense(exp)

@app.delete("/api/expenses/{expense_id}")
def remove_expense(expense_id: int, user: dict = Depends(get_current_user)):
    success = delete_expense(expense_id, user["id"])
    if not success:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"message": "Expense deleted successfully"}
