from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import JSONResponse
import mysql.connector
from dotenv import load_dotenv
import os
import subprocess
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

load_dotenv()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db_connection():
    return mysql.connector.connect(
        host = os.getenv('MYSQL_HOST'),
        user = os.getenv('MYSQL_USER'),
        password = os.getenv('MYSQL_PASSWORD'),
        database = os.getenv('MYSQL_DATABASE')
    )

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
    cursor.close()
    conn.close()

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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)