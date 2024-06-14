import asyncio
from playwright.async_api import async_playwright
import mysql.connector
from mysql.connector import Error
import time
import inflect
import random
import os
from dotenv import load_dotenv

load_dotenv()

db_config = {
    'user': os.getenv('MYSQL_USER'),
    'password': os.getenv('MYSQL_PASSWORD'),
    'host': os.getenv('MYSQL_HOST'),
    'database': os.getenv('MYSQL_DATABASE'),
}

user_agents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
    "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:89.0) Gecko/20100101 Firefox/89.0",
    "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
]

def create_connection():
    try:
        connection = mysql.connector.connect(**db_config)
        if connection.is_connected():
            return connection
    except Error as e:
        print(f"Error: {e}")
        return None


async def extract_product_images(context, product_page_url):
    product_page = await context.new_page()
    await product_page.goto(product_page_url, wait_until='domcontentloaded')
    main_image_element = await product_page.query_selector('#imgTagWrapperId img')
    main_image_url = await main_image_element.get_attribute('src') if main_image_element else None

    other_image_elements = await product_page.query_selector_all('li.imageThumbnail img')
    other_image_urls = [await img.get_attribute('src') for img in other_image_elements if img and await img.get_attribute('src') != main_image_url]
    
    await product_page.close()

    return main_image_url, list(set(other_image_urls))  

async def crawl_image(product_urls):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(user_agent=random.choice(user_agents))
        for url in product_urls:
            print(f"Crawling images for {url}")
            main_image_url, other_image_urls = await extract_product_images(context,url)
            print(f"Main Image URL: {main_image_url}")
            print(f"Other Imgae URLs: {other_image_urls}")
        await browser.close()

if __name__ == "__main__":
    product_urls = [
        "https://www.amazon.com/crocs-Womens-Kadee-Black-10/dp/B003XDXNHS/ref=sr_1_47?dib=eyJ2IjoiMSJ9.8dSsYXRU4TLiWWVUCa6OJR1KpM_6TkdC1Oz5hiUS6U_vFUGJEDcdwMMmGox2utgSlKwEpdLSrVeooObEfyibKLlrEfdnalnpfPovWTCUL9iZVJW1N-m2-1wIBrFcCGulJVxcdkj_X49deqGWmhy6rQMtLcQPR9ySfnd3fRKEPo9_sNr6S4S_r68de-AMR0-D7425QLvdKX9g0eWXWQ0ID7fB4RVsNQOtpiDcrsx5GvWy3IgCE371_5QRGLx9dbVeAQ2AnI7tXaYi4WApfHNkaDzwqdgAZ7nrmUZOlpSlx-w.x5WcMb0pJ1GptNueBPTDEMmkb8m_afn0BLkX4tJyXHA&dib_tag=se&keywords=crocs&qid=1718296250&sr=8-47",
        "https://www.amazon.com/Crocs-Unisex-Sonic-Hedgehog-Classic/dp/B0BTTXZ4PB/ref=sr_1_49?dib=eyJ2IjoiMSJ9.8dSsYXRU4TLiWWVUCa6OJR1KpM_6TkdC1Oz5hiUS6U_vFUGJEDcdwMMmGox2utgSlKwEpdLSrVeooObEfyibKLlrEfdnalnpfPovWTCUL9iZVJW1N-m2-1wIBrFcCGulJVxcdkj_X49deqGWmhy6rQMtLcQPR9ySfnd3fRKEPo9_sNr6S4S_r68de-AMR0-D7425QLvdKX9g0eWXWQ0ID7fB4RVsNQOtpiDcrsx5GvWy3IgCE371_5QRGLx9dbVeAQ2AnI7tXaYi4WApfHNkaDzwqdgAZ7nrmUZOlpSlx-w.x5WcMb0pJ1GptNueBPTDEMmkb8m_afn0BLkX4tJyXHA&dib_tag=se&keywords=crocs&qid=1718296250&sr=8-49"
    ]

    asyncio.run(crawl_image(product_urls))
