from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.responses import JSONResponse
import mysql.connector
from dotenv import load_dotenv
import os
import subprocess
from fastapi.middleware.cors import CORSMiddleware
from google.cloud import translate_v2 as translate
from openai import AsyncOpenAI
from crawlAmazonProductData import fetch_product_info
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import uuid
from pydantic import BaseModel


app = FastAPI()

load_dotenv()

os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = r"google-translate-key.json"

JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

client = AsyncOpenAI(
    api_key=os.environ.get("OPENAI_API_KEY"),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

translate_client = translate.Client()

def get_db_connection():
    return mysql.connector.connect(
        host = os.getenv('MYSQL_HOST'),
        user = os.getenv('MYSQL_USER'),
        password = os.getenv('MYSQL_PASSWORD'),
        database = os.getenv('MYSQL_DATABASE')
    )

def verify_password(plain_password, hased_password):
    return pwd_context.verify(plain_password, hased_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else: 
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

class SignUpRequest(BaseModel):
    name: str
    email: str
    password: str

@app.post("/signup")
async def signUp(signup_request: SignUpRequest):
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(signup_request.password)
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO users(user_id, name, email, password) VALUES ( %s, %s, %s, %s)", (user_id, signup_request.name, signup_request.email, hashed_password ))
        conn.commit()
    except mysql.connector.Error as err:
        raise HTTPException(status_code=400, detail=str(err))
    finally:
        cursor.close()
        conn.close()
    return { "message": "User created successfully!"}

@app.post("/signin")
async def signIn(form_data: OAuth2PasswordRequestForm = Depends()):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SELECT * FROM users WHERE email = %s", (form_data.username,))
        user = cursor.fetchone()
        if not user or not verify_password(form_data.password, user["password"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(data={"sub": user["user_id"]}, expires_delta=access_token_expires)

        return { "access_token": access_token, "token_type": "bearer"}
    finally:
        cursor.close()
        conn.close()



@app.get("/fetch_products")
async def fetch_products(keyword: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT mainImage_url, title, CONCAT(REPLACE(price_whole, '\n', ''), '.', LPAD(price_fraction, 2, '0')) AS price, rating, reviews 
        FROM products
        WHERE keyword = %s
        """, (keyword,))
    products = cursor.fetchall()

    if not products:
        await fetch_product_info(keyword)

        cursor.execute("""
            SELECT mainImage_url, title, CONCAT(REPLACE(price_whole, '\n', ''), '.', LPAD(price_fraction, 2, '0')) AS price, rating, reviews
            FROM products
            WHERE keyword = %s
        """, (keyword,))
        products = cursor.fetchall()

    cursor.close()
    conn.close()

    if not products:
        raise HTTPException(status_code=404, detail="No product found for current keyword")


    product_list = []
    for product in products:
        product_dict = {
            "main_Image": product[0],
            "product_title": product[1],
            "price": product[2],
            "rating": product[3],
            "reviews": product[4]
        }
        product_list.append(product_dict)
    print('Fetched products from DB:', product_list)
    return JSONResponse( content = product_list )

@app.get("/translate")
async def translate_text(text: str = Query(..., description="Text to translate"), dest: str = Query(..., description="Destination language")):
    result = translate_client.translate(text, target_language=dest)
    return {"translated_text": result["translatedText"]}

@app.get("/fetch_statistics")
async def fetch_statistics(keyword:str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT 
            CONCAT(REPLACE(REPLACE(price_whole, '\n', ''), ',', ''), '.', LPAD(price_fraction, 2, '0')) AS price,
            SUBSTRING_INDEX(rating, ' ', 1) as rating,
            REPLACE(reviews, ',', '') as reviews
        FROM 
            products
        WHERE
            keyword = %s 
    """, (keyword, ))
    products = cursor.fetchall()
    cursor.close()
    conn.close()

    if not products:
        raise HTTPException(status_code=404, detail = "No product found for current keyword")
    
    price_list = [float(product[0]) for product in products]
    rating_list = [float(product[1]) for product in products]
    review_list = [int(product[2]) for product in products]

    statistics = {
        "seller_count": len(products),
        "price_range": (min(price_list),max(price_list)),
        "average_price": sum(price_list) / len(price_list),
        "average_rating": sum(rating_list) / len(rating_list),
        "average_reviews": sum(review_list) / len(review_list)
    }

    return JSONResponse(content=statistics)

@app.get("/suggested_title")
async def suggested_title(keyword:str):
    try:
        response = await client.chat.completions.create(
            model = "gpt-3.5-turbo",
            messages=[
                { "role" : "system" , "content" : "Reply in English" },
                { "role" : "user" , "content" : f"Generate a catchy product title for a product related to '{keyword}'" }
            ],
            max_tokens= 50,
            temperature = 2,
            presence_penalty = 2,
        )
        suggested_title = response.choices[0].message.content
        return suggested_title
    except Exception as e:
        raise HTTPException( status_code=500 , detail = str(e) )
    

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)