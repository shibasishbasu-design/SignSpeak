import os
import re
import secrets
import sqlite3
import hashlib
import hmac

import logging

import numpy as np
import joblib

from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


# ==========================================
# 1. CONFIGURATION
# ==========================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(
    BASE_DIR,
    "trained_model",
    "final_dtw_svm_model.joblib"
)

DATABASE_PATH = os.path.join(
    BASE_DIR,
    "signspeak_accounts.db"
)

PASSWORD_ITERATIONS = 310000


# ==========================================
# 2. LOAD TRAINED MODEL
# ==========================================

if not os.path.isfile(MODEL_PATH):
    raise FileNotFoundError(
        f"Trained model not found: {MODEL_PATH}"
    )

model = joblib.load(MODEL_PATH)

classifier = model["classifier"]
reference_sequences = model["reference_sequences"]
gamma = model["gamma"]
label_map = model["label_map"]

SEQUENCE_LENGTH = model["sequence_length"]
FEATURES_PER_FRAME = model["features_per_frame"]

index_to_label = {
    int(index): label
    for label, index in label_map.items()
}

print("DTW + SVM model loaded successfully.")
print("Reference sequences:", reference_sequences.shape)
print("Supported signs:", len(label_map))


# ==========================================
# 3. DATABASE INITIALIZATION
# ==========================================

def initialize_database():

    connection = sqlite3.connect(DATABASE_PATH)

    try:

        connection.execute("""
            CREATE TABLE IF NOT EXISTS users (

                id INTEGER PRIMARY KEY AUTOINCREMENT,

                signSpeakId TEXT UNIQUE NOT NULL,

                fullName TEXT NOT NULL,

                accountType TEXT NOT NULL,

                guardianName TEXT DEFAULT '',

                email TEXT UNIQUE COLLATE NOCASE NOT NULL,

                passwordHash TEXT NOT NULL,

                passwordSalt TEXT NOT NULL,

                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP

            )
        """)

        connection.commit()

    finally:

        connection.close()


initialize_database()

print("SignSpeak account database initialized.")


# ==========================================
# 4. PASSWORD SECURITY
# ==========================================

def hash_password(password, salt=None):

    if salt is None:
        salt = secrets.token_bytes(32)

    password_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        PASSWORD_ITERATIONS
    )

    return password_hash.hex(), salt.hex()


def verify_password(password, stored_hash, stored_salt):

    salt = bytes.fromhex(stored_salt)

    calculated_hash, _ = hash_password(
        password,
        salt
    )

    return hmac.compare_digest(
        calculated_hash,
        stored_hash
    )


# ==========================================
# 5. UNIQUE SIGNSPEAK ID GENERATION
# ==========================================

def generate_signspeak_id():

    while True:

        unique_id = (
            "SS-" + secrets.token_hex(4).upper()
        )

        connection = sqlite3.connect(DATABASE_PATH)

        try:

            existing = connection.execute(
                "SELECT id FROM users WHERE signSpeakId = ?",
                (unique_id,)
            ).fetchone()

        finally:

            connection.close()

        if existing is None:
            return unique_id


# ==========================================
# 6. FASTAPI APPLICATION
# ==========================================

app = FastAPI(

    title="SignSpeak API",

    description="DTW + SVM Sign Recognition and Authentication API",

    version="2.0.0"

)


# ==========================================
# 7. CORS CONFIGURATION
# ==========================================

allowed_origins = [

    "http://localhost:5173",

    "http://127.0.0.1:5173"

]

extra_origins = os.getenv(
    "FRONTEND_ORIGINS",
    ""
)

if extra_origins:

    allowed_origins.extend(
        origin.strip()
        for origin in extra_origins.split(",")
        if origin.strip()
    )


from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://signspeak-tan.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# 8. REQUEST MODELS
# ==========================================

class SignupRequest(BaseModel):

    fullName: str

    accountType: Literal["Minor", "Major"]

    guardianName: str = ""

    email: str

    password: str


class LoginRequest(BaseModel):

    email: str

    signSpeakId: str

    password: str


class PredictionRequest(BaseModel):

    sequence: list[list[float]]


# ==========================================
# 9. EMAIL VALIDATION
# ==========================================

def validate_email(email):

    pattern = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"

    return bool(
        re.match(pattern, email)
    )


# ==========================================
# 10. SIGNUP ENDPOINT
# ==========================================

@app.post("/signup")
def signup(request: SignupRequest):

    full_name = request.fullName.strip()

    account_type = request.accountType

    guardian_name = request.guardianName.strip()

    email = request.email.strip().lower()

    password = request.password


    # Validate full name.

    if len(full_name) < 2:

        raise HTTPException(
            status_code=400,
            detail="Please enter a valid full name."
        )


    # Validate email.

    if not validate_email(email):

        raise HTTPException(
            status_code=400,
            detail="Please enter a valid email address."
        )


    # Validate password.

    if len(password) < 8:

        raise HTTPException(
            status_code=400,
            detail="Password must contain at least 8 characters."
        )


    # Minor account validation.

    if account_type == "Minor" and not guardian_name:

        raise HTTPException(
            status_code=400,
            detail="Guardian name is required for Minor accounts."
        )


    # Generate unique account ID.

    sign_speak_id = generate_signspeak_id()


    # Securely hash password.

    password_hash, password_salt = hash_password(
        password
    )


    # Store account in SQLite.

    connection = sqlite3.connect(DATABASE_PATH)

    try:

        connection.execute("""

            INSERT INTO users (

                signSpeakId,

                fullName,

                accountType,

                guardianName,

                email,

                passwordHash,

                passwordSalt

            )

            VALUES (?, ?, ?, ?, ?, ?, ?)

        """, (

            sign_speak_id,

            full_name,

            account_type,

            guardian_name,

            email,

            password_hash,

            password_salt

        ))

        connection.commit()


        return {

            "success": True,

            "message": "Account created successfully!",

            "signSpeakId": sign_speak_id,

            "fullName": full_name,

            "email": email,

            "accountType": account_type

        }


    except sqlite3.IntegrityError:

        raise HTTPException(

            status_code=409,

            detail="An account with this email already exists."

        )


    finally:

        connection.close()


# ==========================================
# 11. LOGIN ENDPOINT
# ==========================================

@app.post("/login")
def login(request: LoginRequest):

    email = request.email.strip().lower()

    sign_speak_id = request.signSpeakId.strip().upper()

    password = request.password


    if not validate_email(email):

        raise HTTPException(
            status_code=400,
            detail="Please enter a valid email address."
        )


    connection = sqlite3.connect(DATABASE_PATH)

    connection.row_factory = sqlite3.Row

    try:

        user = connection.execute("""

            SELECT *

            FROM users

            WHERE email = ?

            AND signSpeakId = ?

        """, (

            email,

            sign_speak_id

        )).fetchone()


        if user is None:

            raise HTTPException(

                status_code=401,

                detail="Invalid email address or SignSpeak ID."

            )


        password_valid = verify_password(

            password,

            user["passwordHash"],

            user["passwordSalt"]

        )


        if not password_valid:

            raise HTTPException(

                status_code=401,

                detail="Invalid email address, SignSpeak ID or password."

            )


        return {

            "success": True,

            "message": "Login successful!",

            "signSpeakId": user["signSpeakId"],

            "fullName": user["fullName"],

            "email": user["email"],

            "accountType": user["accountType"]

        }


    finally:

        connection.close()


# ==========================================
# 12. ORIGINAL HOME ENDPOINT
# ==========================================

@app.get("/")
def home():

    return {

        "message": "Welcome to SignSpeak API",

        "model": model["model_name"],

        "status": "running"

    }


# ==========================================
# 13. ORIGINAL HEALTH CHECK
# ==========================================

@app.get("/health")
def health():

    return {

        "status": "healthy",

        "model_loaded": True,

        "classes": len(label_map),

        "reference_sequences": len(reference_sequences)

    }


# ==========================================
# 14. ORIGINAL DTW DISTANCE
# ==========================================

from scipy.spatial.distance import cdist

def dtw_distance(sequence_a, sequence_b):

    # Calculate all frame-to-frame Euclidean distances
    # in one optimised operation.
    cost_matrix = cdist(
        sequence_a,
        sequence_b,
        metric="euclidean"
    )

    n, m = cost_matrix.shape

    previous = np.full(m + 1, np.inf)
    previous[0] = 0.0

    for i in range(1, n + 1):

        current = np.full(m + 1, np.inf)

        for j in range(1, m + 1):

            current[j] = cost_matrix[i - 1, j - 1] + min(
                previous[j],
                current[j - 1],
                previous[j - 1]
            )

        previous = current

    return previous[m] / (n + m)

# ==========================================
# 15. ORIGINAL SIGN PREDICTION
# ==========================================

@app.post("/predict")
def predict(request: PredictionRequest):

    logging.warning("PREDICT ENDPOINT CALLED")

    try:

        sequence = np.asarray(

            request.sequence,

            dtype=np.float64

        )


        expected_shape = (

            SEQUENCE_LENGTH,

            FEATURES_PER_FRAME

        )


        if sequence.shape != expected_shape:

            raise HTTPException(

                status_code=400,

                detail=f"Expected shape {expected_shape}, "
                       f"received {sequence.shape}"

            )


        if not np.isfinite(sequence).all():

            raise HTTPException(

                status_code=400,

                detail="Sequence contains invalid values"

            )


        # Calculate DTW distances against all
        # 105 reference sequences.

        distances = np.array([

            dtw_distance(sequence, reference)

            for reference in reference_sequences

        ])


        # Reproduce original training kernel.

        kernel_row = np.exp(

            -gamma * np.square(distances)

        ).reshape(1, -1)


        # SVM prediction.

        predicted_index = int(

            classifier.predict(kernel_row)[0]

        )

        print("PREDICTED INDEX:", predicted_index, flush=True)


        predicted_sign = index_to_label.get(

            predicted_index

        )

        print("PREDICTED SIGN:", predicted_sign, flush=True)


        if predicted_sign is None:

            raise HTTPException(

                status_code=500,

                detail="Predicted class has no label mapping"

            )


        return {

            "success": True,

            "predicted_sign": predicted_sign,

            "class_index": predicted_index

        }


    except HTTPException:

        raise


    except Exception as error:

        raise HTTPException(

            status_code=500,

            detail=str(error)

        )