"""
This module implements the FastAPI applcation with various endpoints
for user authentication, product management, translation, title suggestion, and other features
"""
import os
import uuid
from typing import Optional
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Query, Depends, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import mysql.connector
from dotenv import load_dotenv
from google.cloud import translate_v2 as translate
from openai import AsyncOpenAI
from passlib.context import CryptContext
from jose import JWTError, jwt
from pydantic import BaseModel
from tasks import add_crawl_task
import logging
import numpy as np
import pandas as pd

app = FastAPI()

load_dotenv()

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = r"google-translate-key.json"
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"),)

FRONTEND_URL = os.getenv("FRONTEND_URL")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

translate_client = translate.Client()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

active_connections = []

def get_db_connection():
    """Establish and return connection to the database"""
    return mysql.connector.connect(
        host=os.getenv("MYSQL_HOST"),
        user=os.getenv("MYSQL_USER"),
        password=os.getenv("MYSQL_PASSWORD"),
        database=os.getenv("MYSQL_DATABASE"),
    )

def verify_password(plain_password, hased_password):
    """Verify a plain password against a hashed password"""
    return pwd_context.verify(plain_password, hased_password)

def get_password_hash(password):
    """Hash password for storing"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

class SignUpRequest(BaseModel):
    """Model for user signup requests"""

    name: str
    email: str
    password: str

class SaveProductRequest(BaseModel):
    """Model for user saving product requests"""

    product_id: int

@app.post("/signup")
async def signup(signup_request: SignUpRequest):
    """Endpoint to handle user signup"""
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(signup_request.password)
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        query = (
            "INSERT INTO users(user_id, name, email, password) VALUES ( %s, %s, %s, %s)"
        )
        cursor.execute(
            query, (user_id, signup_request.name, signup_request.email, hashed_password)
        )
        conn.commit()
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user_id}, expires_delta=access_token_expires
        )
    except mysql.connector.Error as err:
        raise HTTPException(status_code=400, detail=str(err)) from err
    finally:
        cursor.close()
        conn.close()
    return {"message": "User created successfully!", "access_token": access_token}

@app.post("/signin")
async def signin(form_data: OAuth2PasswordRequestForm = Depends()):
    """Endpoint to handle user signin"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SELECT * FROM users WHERE email = %s", (form_data.username,))
        user = cursor.fetchone()
        if not user or not verify_password(form_data.password, user["password"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user["user_id"]}, expires_delta=access_token_expires
        )

        return {"access_token": access_token, "token_type": "bearer"}
    finally:
        cursor.close()
        conn.close()

def get_current_user(token: str = Depends(oauth2_scheme)):
    """Get the current user based on the token"""
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError as err:
        raise credentials_exception from err
    return user_id

@app.get("/profile")
async def get_profile(user_id: str = Depends(get_current_user)):
    """Get user profile"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SELECT name, email FROM users WHERE user_id = %s", (user_id,))
        user = cursor.fetchone()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    finally:
        cursor.close()
        conn.close()

@app.post("/save_to_savedLists")
async def save_to_saved_lists(
    save_request: SaveProductRequest, user_id: str = Depends(get_current_user)
):
    """Save product to user's saved list"""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        query_select = "SELECT * FROM savedLists WHERE user_id = %s AND product_id = %s"
        cursor.execute(query_select, (user_id, save_request.product_id))
        existing_entry = cursor.fetchone()

        if existing_entry:
            raise HTTPException(status_code=400, detail="Product already saved")

        query_insert = "INSERT INTO savedLists (user_id, product_id) VALUES (%s, %s)"
        cursor.execute(query_insert, (user_id, save_request.product_id))
        conn.commit()
    except mysql.connector.Error as err:
        raise HTTPException(status_code=400, detail=str(err)) from err
    finally:
        cursor.close()
        conn.close()

    return {"message": "Product saved successfully!"}

@app.delete("/unsave_product/{product_id}")
async def unsave_product(product_id: int, user_id: str = Depends(get_current_user)):
    """Remove a product from user's saved product list"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        query_delete = "DELETE FROM savedLists WHERE user_id = %s AND product_id = %s"
        cursor.execute(query_delete, (user_id, product_id))
        conn.commit()
    except mysql.connector.Error as err:
        raise HTTPException(status_code=400, detail=str(err)) from err
    finally:
        cursor.close()
        conn.close()
    return {"message": "Product unsaved successfully!"}

@app.get("/get_savedLists")
async def get_saved_lists(user_id: str = Depends(get_current_user)):
    """Get user's saved product list"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT p.id, p.mainImage_url, p.title, CONCAT(REPLACE(p.price_whole, '\n', ''), '.', LPAD(p.price_fraction, 2, '0')) AS price, p.rating, p.reviews
            FROM savedLists s
            JOIN products p ON s.product_id = p.id
            WHERE s.user_id = %s
        """,
            (user_id,),
        )
        products = cursor.fetchall()
    except mysql.connector.Error as err:
        raise HTTPException(status_code=400, detail=str(err)) from err
    finally:
        cursor.close()
        conn.close()
    return products if products else []

@app.get("/fetch_products")
async def fetch_products(keyword: str):
    """Fetch product information based on a keyword"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT id, mainImage_url, title, CONCAT(REPLACE(price_whole, '\n', ''), '.', LPAD(price_fraction, 2, '0')) AS price, rating, reviews, url
        FROM products
        WHERE keyword = %s
        """,
        (keyword,),
    )
    products = cursor.fetchall()

    if not products:
        add_crawl_task(keyword)
        logger.info(f"No products found for keyword '{keyword}', crawl task added")
        raise HTTPException(
            status_code=202, detail='Keyword not found. A crawl task has been added to the queue'
        )
    
    cursor.close()
    conn.close()

    product_list = []
    for product in products:
        product_dict = {
            "id": product[0],
            "main_Image": product[1],
            "product_title": product[2],
            "price": product[3],
            "rating": product[4],
            "reviews": product[5],
            "url": product[6],
        }
        product_list.append(product_dict)
    print("Fetched products from DB:", product_list)
    return JSONResponse(content=product_list)

@app.get("/translate")
async def translate_text(
    text: str = Query(..., description="Text to translate"),
    dest: str = Query(..., description="Destination language"),
):
    """Translate text to a specific language"""
    result = translate_client.translate(text, target_language=dest)
    return {"translated_text": result["translatedText"]}

@app.get("/fetch_statistics")
async def fetch_statistics(keyword: str):
    """Fetch statistics for products based on a keyword"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT 
            CONCAT(REPLACE(REPLACE(price_whole, '\n', ''), ',', ''), '.', LPAD(price_fraction, 2, '0')) AS price,
            SUBSTRING_INDEX(rating, ' ', 1) as rating,
            REPLACE(reviews, ',', '') as reviews
        FROM 
            products
        WHERE
            keyword = %s 
    """,
        (keyword,),
    )
    products = cursor.fetchall()
    cursor.close()
    conn.close()

    if not products:
        raise HTTPException(
            status_code=404, detail="No product found for current keyword"
        )

    price_list = [float(product[0]) for product in products]
    rating_list = [float(product[1]) for product in products]
    review_list = [int(product[2]) for product in products]

    def calculate_bins(data, num_bins=10, round_up=False):
        min_val = np.floor(min(data)) if not round_up else np.ceil(min(data))
        max_val = np.ceil(max(data)) + 1e-6
        step = np.ceil((max_val - min_val) / num_bins)
        bins = np.arange(min_val, max_val + step, step)
        return bins
    
    price_bins = calculate_bins(price_list, round_up=True)
    price_bin_labels = [f"${int(price_bins[i])}-${int(price_bins[i+1])}" for i in range(len(price_bins) - 1)]
    price_range_distribution = pd.cut(price_list, bins=price_bins, labels=price_bin_labels, right=False).value_counts().sort_index().to_dict()

    review_bins = calculate_bins(review_list, round_up=True)
    review_bin_labels = [f"{int(review_bins[i])}-{int(review_bins[i+1])}" for i in range(len(review_bins) - 1)]
    review_range_distribution = pd.cut(review_list, bins=review_bins, labels=review_bin_labels, right=False).value_counts().sort_index().to_dict()

    rating_distribution = {
        '1': rating_list.count(1),
        '2': rating_list.count(2),
        '3': rating_list.count(3),
        '4': rating_list.count(4),
        '5': rating_list.count(5),
    }

    statistics = {
        "seller_count": len(products),
        "price_range": (min(price_list), max(price_list)),
        "average_price": sum(price_list) / len(price_list),
        "average_rating": sum(rating_list) / len(rating_list),
        "average_reviews": sum(review_list) / len(review_list),
        "price_list": price_list,
        "review_list": review_list,
        "rating_list": rating_list,
        "price_range_distribution": price_range_distribution,
        "review_range_distribution": review_range_distribution,
        "rating_distribution": rating_distribution,
    }

    return JSONResponse(content=statistics)

@app.get("/suggested_title")
async def get_suggested_title(keyword: str):
    """Generate a suggested product title based on keyword"""
    try:
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Reply in English"},
                {
                    "role": "user",
                    "content": (
                        f"Generate a catchy and relevant product title for a product related to the keyword:'{keyword}'."
                        f"Make sure the title is clear and engaging and highlights the key benefits of the product."
                    ),
                },
            ],
            max_tokens=30,
            temperature=1,
            presence_penalty=2,
        )
        suggested_title = response.choices[0].message.content
        return suggested_title
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err)) from err

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    try:
        logger.info(f"New connection: {websocket.client}")
        while True:
            try:
                data = await websocket.receive_text()
                logger.info(f"Received messages: {data}")
                await notify_users(data)
            except WebSocketDisconnect:
                break
    except Exception as err:
        logger.error(f"WebSocket connection error: {err}")
    finally:
        active_connections.remove(websocket)
        logger.info("WebSocket connection closed.")

async def notify_users(message: str):
    logger.info(f"Sending message to {len(active_connections)} connections")
    for connection in active_connections:
        await connection.send_text(message)
        logger.info(f"Sent message to {connection.client}: {message}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
