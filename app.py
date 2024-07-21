"""
This module implements the FastAPI applcation with various endpoints
for user authentication, product management, translation, title suggestion, and other features
"""
import re
import os
import uuid
import json
import logging
from typing import Optional
from datetime import datetime, timedelta
from difflib import get_close_matches
import spacy
import numpy as np
import pandas as pd
from dotenv import load_dotenv
from fastapi import (
    FastAPI,
    HTTPException,
    Query,
    Depends,
    WebSocket,
    WebSocketDisconnect,
)
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from google.cloud import translate_v2 as translate
from openai import AsyncOpenAI
from passlib.context import CryptContext
from jose import JWTError, jwt
from pydantic import BaseModel
import mysql.connector
from backend.tasks.tasks import add_crawl_task

app = FastAPI()
load_dotenv()

nlp = spacy.load("en_core_web_sm")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

WHITELIST = [
    "women's clothing",
    "accessory",
    "action figure",
    "Air Fryer",
    "air purifier",
    "Amazon fire TV stick",
    "ant killer",
    "anti slip dog paw pads",
    "Apple AirPods",
    "Apple AirTag",
    "bag",
    "bed sheet",
    "bicycle",
    "board game",
    "body lotion",
    "camera",
    "camping gear",
    "car part",
    "children's book",
    "crocs",
    "cushion foundation",
    "disposable face towel",
    "earring",
    "educational toy",
    "engagement gifts",
    "External Hard Drive",
    "fiction",
    "Fitbit",
    "fitness equipment",
    "fitness tracker",
    "flat back stud earrings",
    "fly trap",
    "furniture",
    "grooming product",
    "headphone",
    "health supplement",
    "home decor",
    "hydrating serum for face",
    "kitchen gadgets",
    "laptop",
    "laptops",
    "lego",
    "makeup",
    "makeup remover wipes",
    "mascara",
    "men's clothing",
    "microphone",
    "microwave",
    "monitor",
    "Nintendo Switch",
    "non-fiction",
    "personalized cutting board",
    "pet food",
    "pet toy",
    "pillow case",
    "ping pong paddle",
    "portable bluetooth speaker",
    "printer",
    "puzzle",
    "refrigerator",
    "skincare product",
    "smartphone",
    "smartphones",
    "smartwatch",
    "sports equipment",
    "SSD",
    "sun protection shirts",
    "tablet",
    "taiwanese oolong tea bags",
    "tazo decaffeinated chai tea bags",
    "tech golf polo",
    "textbook",
    "vacuum cleaner",
    "washing machine",
    "water shoes",
    "Wireless Earbuds",
]


def validate_keyword(keyword):
    """
    Validate the keyword against a list of known valid words using SpaCy
    and check if it's a meaningful word
    """
    logger.info("Validating keyword: %s", keyword)
    if keyword.lower() in [k.lower() for k in WHITELIST]:
        logger.info("Keyword '%s' is in the whitelist", keyword)
        return True

    if not re.match("^[a-zA-Z0-9' ]+$", keyword):
        logger.warning("Keyword '%s' is not valid", keyword)
        return False

    return True


def correct_typo(keyword):
    """
    Correct typos in the keyword using a predefined vocabulary.
    """
    if keyword.lower() in [k.lower() for k in WHITELIST]:
        return keyword

    try:
        doc = nlp(keyword)
        corrected_tokens = []

        for token in doc:
            matches = get_close_matches(
                token.text,
                [word.lower() for word in nlp.vocab.strings if word.isalpha()],
                n=1,
                cutoff=0.6,
            )
            if matches:
                corrected_tokens.append(matches[0])
            else:
                corrected_tokens.append(token.text)

        corrected_keyword = " ".join(corrected_tokens)
        if corrected_keyword != keyword.lower():
            logger.info("Corrected '%s' to '%s'", keyword, corrected_keyword)
        return corrected_keyword
    except ValueError as err:
        logger.error(
            "ValueError in typo correction for keyword '%s': %s", keyword, str(err)
        )
    except RuntimeError as err:
        logger.error(
            "RuntimeError in typo correction for keyword '%s': %s", keyword, str(err)
        )
    except Exception as err:
        logger.error("Error in typo correction for keyword '%s': %s", keyword, str(err))
    return keyword


def normalize_keyword(keyword):
    """
    Normalize the given keyword by converting to lowercase, removing extra spaces,
    lemmatizing, and handling typos using word embeddings.
    """
    try:
        logger.info("Original keyword: %s", keyword)
        keyword = keyword.lower()
        keyword = " ".join(keyword.split())
        doc = nlp(keyword)
        lemma = " ".join([token.lemma_ for token in doc])
        logger.info("Lemmatized keyword: %s", lemma)
        corrected_keyword = correct_typo(lemma)
        logger.info("Corrected keyword: %s", corrected_keyword)
        if not validate_keyword(corrected_keyword):
            logger.warning("Keyword '%s' failed validation", corrected_keyword)
            return None
        return corrected_keyword
    except ValueError as err:
        logger.error("ValueError normalizing keyword: %s - %s", keyword, str(err))
        return None
    except RuntimeError as err:
        logger.error("RuntimeError normalizing keyword: %s - %s", keyword, str(err))
        return None
    except Exception as err:
        logger.error("Error normalizing keyword: %s - %s", keyword, str(err))
        return None


@app.get("/api/validate_keyword")
async def validate_keyword_endpoint(keyword: str):
    """
    Normalize the given keyword by converting to lowercase, removing extra spaces,
    lemmatizing, and handling typos using word embeddings.
    """
    normalized_keyword = normalize_keyword(keyword)
    if normalized_keyword:
        return {"valid": True, "normalized_keyword": normalized_keyword}

    return JSONResponse(content={"valid": False}, status_code=400)


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


@app.post("/api/signup")
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


@app.post("/api/signin")
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


@app.get("/api/profile")
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


@app.post("/api/save_to_savedLists")
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


@app.delete("/api/unsave_product/{product_id}")
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


@app.get("/api/get_savedLists")
async def get_saved_lists(user_id: str = Depends(get_current_user)):
    """Get user's saved product list"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT p.id, p.mainImage_url, p.title,
            CONCAT(REPLACE(p.price_whole, '\n', ''), '.', LPAD(p.price_fraction, 2, '0')) AS price,
            p.rating, p.reviews
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


@app.get("/api/fetch_products")
async def fetch_products(keyword: str, sessionId: str):
    """Validate keyword first then fetch product information based on the keyword"""
    logger.info("Received keyword: %s, sessionId: %s", keyword, sessionId)
    try:
        normalized_keyword = normalize_keyword(keyword)
        if not normalized_keyword:
            return JSONResponse(
                status_code=400,
                content={
                    "detail": "Invalid keyword. Please enter a meaningful search term."
                },
            )

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT keyword FROM normalized_keywords WHERE FIND_IN_SET(%s, keyword_pool)",
            (normalized_keyword,),
        )
        result = cursor.fetchone()

        if result:
            normalized_keyword = result["keyword"]
        else:
            add_crawl_task(normalized_keyword, sessionId)
            logger.info(
                "No products found for keyword '%s', crawl task added",
                normalized_keyword,
            )
            return JSONResponse(
                status_code=202,
                content={
                    "detail": "Keyword not found. A crawl task has been added to the queue"
                },
            )

        cursor.execute(
            """
            SELECT id, mainImage_url, title,
            CONCAT(REPLACE(price_whole, '\n', ''), '.', LPAD(price_fraction, 2, '0')) AS price,
            rating, reviews, url
            FROM products
            WHERE keyword = %s
            """,
            (normalized_keyword,),
        )
        products = cursor.fetchall()

        if not products:
            return JSONResponse(
                status_code=404, content={"detail": "No products found for the keyword"}
            )

        product_list = []
        for product in products:
            product_dict = {
                "id": product["id"],
                "main_Image": product["mainImage_url"],
                "product_title": product["title"],
                "price": product["price"],
                "rating": product["rating"],
                "reviews": product["reviews"],
                "url": product["url"],
            }
            product_list.append(product_dict)
        logger.info("Fetched products from DB: %s", product_list)
        return JSONResponse(content=product_list)
    except Exception as err:
        logger.error("Error in fetch_products: %s", str(err))
        return JSONResponse(
            status_code=500,
            content={"detail": "An error occurred while fetching products."},
        )
    finally:
        cursor.close()
        conn.close()


@app.get("/api/translate")
async def translate_text(
    text: str = Query(..., description="Text to translate"),
    dest: str = Query(..., description="Destination language"),
):
    """Translate text to a specific language"""
    result = translate_client.translate(text, target_language=dest)
    return {"translated_text": result["translatedText"]}


@app.get("/api/fetch_statistics")
async def fetch_statistics(keyword: str):
    """Fetch statistics for products based on a keyword"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT
        CONCAT(REPLACE(
            REPLACE(price_whole, '\n', ''), ',', ''),
            '.', LPAD(price_fraction, 2, '0')) AS price,
        SUBSTRING_INDEX(rating, ' ', 1) as rating,
        REPLACE(reviews, ',', '') as reviews
        FROM products
        WHERE keyword = %s
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
    price_bin_labels = [
        f"${int(price_bins[i])}-${int(price_bins[i+1])}"
        for i in range(len(price_bins) - 1)
    ]
    price_range_distribution = (
        pd.cut(price_list, bins=price_bins, labels=price_bin_labels, right=False)
        .value_counts()
        .sort_index()
        .to_dict()
    )

    review_bins = calculate_bins(review_list, round_up=True)
    review_bin_labels = [
        f"{int(review_bins[i])}-{int(review_bins[i+1])}"
        for i in range(len(review_bins) - 1)
    ]
    review_range_distribution = (
        pd.cut(review_list, bins=review_bins, labels=review_bin_labels, right=False)
        .value_counts()
        .sort_index()
        .to_dict()
    )

    rating_distribution = {
        "1": rating_list.count(1),
        "2": rating_list.count(2),
        "3": rating_list.count(3),
        "4": rating_list.count(4),
        "5": rating_list.count(5),
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


@app.get("/api/suggested_title")
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
                        f"Generate a catchy and relevant product title for a product "
                        f"related to the keyword: '{keyword}'. Make sure the title is "
                        f"clear and engaging and highlights the key benefits of the product."
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


class NotificationRequest(BaseModel):
    """
    A model representing a notification request
    """

    sessionId: str
    message: str
    keyword: str


@app.post("/api/notify")
async def notify(notification: NotificationRequest):
    """
    Send a notification message to connected WebSocket clients for a given sessionId.
    """
    sessionId = notification.sessionId
    message = notification.message
    if sessionId in connected_clients:
        logger.info("Notifying sessionId: %s with message: %s", sessionId, message)
        for websocket in connected_clients[sessionId]:
            await websocket.send_text(
                json.dumps({"message": message, "keyword": notification.keyword})
            )
        return {"status": "success", "message": "Notification sent."}

    logger.info("No connected clients found for sessionId: %s", sessionId)
    return {"status": "error", "message": "No connected clients found."}


connected_clients = {}


@app.websocket("/api/ws/{sessionId}")
async def websocket_endpoint(websocket: WebSocket, sessionId: str):
    """
    Handle WebSocket connections for a given sessionId. Manage connection lifecycle and
    store connected clients in the global 'connected_clients' dictionary.
    """
    logger.info("check1: %s", connected_clients)
    await websocket.accept()
    logger.info("check2: %s", connected_clients)
    if sessionId not in connected_clients:
        connected_clients[sessionId] = []
    logger.info("check3: %s", connected_clients)
    if websocket not in connected_clients[sessionId]:
        logger.info("check websocket: %s", websocket)
        connected_clients[sessionId].append(websocket)
        logger.info("check4: %s", connected_clients)
        logger.info("check5: %s", connected_clients[sessionId])
    try:
        logger.info("New connection for sessionId: %s", sessionId)
        while True:
            data = await websocket.receive_text()
            logger.info("Received message from sessionId %s: %s", sessionId, data)
    except WebSocketDisconnect:
        connected_clients[sessionId].remove(websocket)
        if not connected_clients[sessionId]:
            del connected_clients[sessionId]
        logger.info("WebSocket connection for sessionId %s closed.", sessionId)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
