from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Literal
import sqlite3
import secrets
import hashlib
import hmac
import re
from pathlib import Path

# --------------------------------------------------
# APPLICATION
# --------------------------------------------------

app = FastAPI(
    title="SignSpeak API",
    description="Backend API for SignSpeak sign language recognition",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database will be created inside the backend folder.
DATABASE = Path(__file__).resolve().parent / "signspeak.db"


# --------------------------------------------------
# DATABASE
# --------------------------------------------------

def get_connection():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection


def create_database():
    with get_connection() as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                full_name TEXT NOT NULL,
                account_type TEXT NOT NULL,
                guardian_name TEXT,
                email TEXT NOT NULL UNIQUE,
                sign_speak_id TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)


create_database()


# --------------------------------------------------
# PASSWORD SECURITY
# --------------------------------------------------

def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)

    password_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        310000
    )

    return salt.hex() + "$" + password_hash.hex()


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt_hex, original_hash = stored_hash.split("$")

        salt = bytes.fromhex(salt_hex)

        new_hash = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt,
            310000
        ).hex()

        return hmac.compare_digest(new_hash, original_hash)

    except (ValueError, TypeError):
        return False


# --------------------------------------------------
# REQUEST MODELS
# --------------------------------------------------

class SignupRequest(BaseModel):
    fullName: str = Field(min_length=2, max_length=100)
    accountType: Literal["Minor", "Major"]
    guardianName: str = ""
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: str
    signSpeakId: str
    password: str


# --------------------------------------------------
# HOME AND HEALTH CHECK
# --------------------------------------------------

@app.get("/")
def home():
    return {
        "message": "Welcome to SignSpeak API",
        "status": "Backend is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "SignSpeak Backend"
    }


# --------------------------------------------------
# SIGN UP
# --------------------------------------------------

@app.post("/signup")
def signup(data: SignupRequest):

    full_name = data.fullName.strip()
    email = data.email.strip().lower()
    guardian_name = data.guardianName.strip()

    if len(full_name) < 2:
        raise HTTPException(
            status_code=400,
            detail="Please enter a valid full name."
        )

    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        raise HTTPException(
            status_code=400,
            detail="Please enter a valid email address."
        )

    if data.accountType == "Minor" and not guardian_name:
        raise HTTPException(
            status_code=400,
            detail="Guardian name is required for Minor accounts."
        )

    if data.accountType == "Major":
        guardian_name = ""

    sign_speak_id = "SS-" + secrets.token_hex(4).upper()
    password_hash = hash_password(data.password)

    try:
        with get_connection() as connection:
            connection.execute(
                """
                INSERT INTO users (
                    full_name,
                    account_type,
                    guardian_name,
                    email,
                    sign_speak_id,
                    password_hash
                )
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    full_name,
                    data.accountType,
                    guardian_name,
                    email,
                    sign_speak_id,
                    password_hash
                )
            )

    except sqlite3.IntegrityError:
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists."
        )

    return {
        "message": "Account created successfully.",
        "signSpeakId": sign_speak_id,
        "fullName": full_name,
        "email": email,
        "accountType": data.accountType
    }


# --------------------------------------------------
# LOGIN
# --------------------------------------------------

@app.post("/login")
def login(data: LoginRequest):

    email = data.email.strip().lower()
    sign_speak_id = data.signSpeakId.strip().upper()

    with get_connection() as connection:
        user = connection.execute(
            """
            SELECT *
            FROM users
            WHERE email = ? AND sign_speak_id = ?
            """,
            (email, sign_speak_id)
        ).fetchone()

    if user is None or not verify_password(
        data.password,
        user["password_hash"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email, SignSpeak ID, or password."
        )

    return {
        "message": "Login successful.",
        "signSpeakId": user["sign_speak_id"],
        "fullName": user["full_name"],
        "email": user["email"],
        "accountType": user["account_type"]
    }