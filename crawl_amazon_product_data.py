"""
This module contains functions to crawl Amazon product data
and store it in mySQL database
"""
import asyncio
import time
import random
import os
from playwright.async_api import async_playwright
import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv

load_dotenv()

db_config = {
    "user": os.getenv("MYSQL_USER"),
    "password": os.getenv("MYSQL_PASSWORD"),
    "host": os.getenv("MYSQL_HOST"),
    "database": os.getenv("MYSQL_DATABASE"),
}

user_agents = [
    (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    ),
    (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 "
        "(KHTML, like Gecko) Version/14.1.2 Safari/605.1.15"
    ),
    (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) "
        "Gecko/20100101 Firefox/89.0"
    ),
    ("Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:89.0) " "Gecko/20100101 Firefox/89.0"),
    (
        "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    ),
]


def create_connection():
    """Create and return a mySQL database connection"""
    try:
        connection = mysql.connector.connect(**db_config)
        if connection.is_connected():
            return connection
    except Error as err:
        print(f"Error: {err}")
    return None


def store_data(data):
    """Store product data in database"""
    connection = create_connection()
    if connection:
        cursor = connection.cursor()
        add_product = """
            INSERT INTO products 
                (title, price_whole, price_fraction, rating, reviews,
                keyword, url, mainImage_url, otherImages_url)
            VALUES 
                (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(add_product, data)
        connection.commit()
        cursor.close()
        connection.close()


def store_keyword(keyword):
    """Store a keyword in database"""
    print(f"Storing keyword: {keyword}")
    connection = create_connection()
    if connection:
        try:
            cursor = connection.cursor()
            add_keyword = "INSERT INTO keywords (keyword) VALUES (%s)"
            cursor.execute(add_keyword, (keyword,))
            connection.commit()
        except Error as err:
            print(f"Error storing keywor: {err}")
        finally:
            cursor.close()
            connection.close()


def keyword_exists(keyword):
    """Check if a keyword exists in database"""
    connection = create_connection()
    if connection:
        try:
            cursor = connection.cursor()
            query = "SELECT 1 FROM keywords WHERE keyword = %s LIMIT 1"
            cursor.execute(query, (keyword,))
            result = cursor.fetchone()
            return result is not None
        except Error as err:
            print(f"Error checking keyword: {err}")
            return False
        finally:
            cursor.close()
            connection.close()
    return False


async def extract_product_images(context, product_page_url):
    """Extract product images from product page"""
    product_page = await context.new_page()
    await product_page.goto(product_page_url, wait_until="domcontentloaded")

    await product_page.wait_for_selector("#imgTagWrapperId img")
    print("Waiting for the selector(img) to load completely")

    await product_page.wait_for_timeout(3000)

    main_image_element = await product_page.query_selector("#imgTagWrapperId img")
    main_image_url = (
        await main_image_element.get_attribute("src") if main_image_element else None
    )

    other_image_elements = await product_page.query_selector_all(
        "li.imageThumbnail img"
    )
    other_image_urls = [
        await img.get_attribute("src")
        for img in other_image_elements
        if img and await img.get_attribute("src") != main_image_url
    ]

    await product_page.close()

    return main_image_url, list(set(other_image_urls))


async def extract_product_details(item):
    """Extract product details from an item element"""
    title_element = await item.query_selector("h2 a span")
    title = (
        await title_element.evaluate("el => el.innerText") if title_element else None
    )

    link_element = await item.query_selector("h2 a")
    url = await link_element.get_attribute("href") if link_element else None

    price_whole_element = await item.query_selector(".a-price-whole")
    price_whole = (
        await price_whole_element.evaluate("el => el.innerText")
        if price_whole_element
        else None
    )
    if price_whole:
        price_whole = price_whole.replace(" .", "")
        price_whole = price_whole.rstrip(" .")

    price_fraction_element = await item.query_selector(".a-price-fraction")
    price_fraction = (
        await price_fraction_element.evaluate("el => el.innerText")
        if price_fraction_element
        else None
    )

    rating_element = await item.query_selector(".a-icon-alt")
    rating = (
        await rating_element.evaluate("el => el.innerText") if rating_element else None
    )

    reviews_element = await item.query_selector(".a-size-small .a-size-base")
    reviews = (
        await reviews_element.evaluate("el => el.innerText")
        if reviews_element
        else None
    )

    return title, url, price_whole, price_fraction, rating, reviews


def is_valid_product(details):
    """Check if product details are valid"""
    return all(details)


async def process_item(item, context, keyword):
    """Process an individual item"""
    details = await extract_product_details(item)
    if is_valid_product(details):
        title, url, price_whole, price_fraction, rating, reviews = details
        product_page_url = f"https://www.amazon.com{url}"
        main_image_url, other_image_urls = await extract_product_images(
            context, product_page_url
        )
        other_images_url_str = ",".join(other_image_urls)
        product_data = (
            title,
            price_whole,
            price_fraction,
            rating,
            reviews,
            keyword,
            product_page_url,
            main_image_url,
            other_images_url_str,
        )
        store_data(product_data)


async def crawl_page(page, context, keyword: str):
    """Crawl a page for product information"""
    items = await page.query_selector_all(".s-result-item")
    for item in items:
        try:
            await process_item(item, context, keyword)
        except (AttributeError, TypeError, ValueError) as err:
            print(f"Error processing item: {err}")


async def fetch_product_info(keyword: str):
    """Fetch product information for a given keyword"""
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context(user_agent=random.choice(user_agents))
        page = await context.new_page()
        base_url = f"https://www.amazon.com/s?k={keyword}"
        current_page = 1

        while True:
            url = f"{base_url}&page={current_page}"
            await page.goto(url, wait_until="domcontentloaded", timeout=60000)
            await page.wait_for_timeout(random.randint(3000, 10000))

            try:
                await crawl_page(page, context, keyword)
            except (TimeoutError, Error) as err:
                print(f"Error crawling page {current_page}: {err}")

            try:
                next_button = await page.query_selector("a.s-pagination-next")
                if next_button:
                    await next_button.click()
                    await page.wait_for_load_state("domcontentloaded")
                    await page.wait_for_timeout(5000)
                    current_page += 1
                else:
                    break
            except (TimeoutError, Error) as err:
                print(f"Error navigating to next page: {err}")
                break
        store_keyword(keyword)
        await browser.close()


if __name__ == "__main__":
    keywords = [
        "Nintendo Switch",
        "Wireless Earbuds",
        "SSD",
        "Fitbit",
        "Air Fryer",
        "External Hard Drive",
        "Tablet",
        "Instant Pot",
        "Micro SD Card",
        "Gaming Chair",
    ]

    async def main():
        """Main function to run the keyword crawl"""
        start_time = time.time()

        for keyword in keywords:
            if not keyword_exists(keyword):
                print(f"Crawling data for keyword: {keyword} on US Amazon website")
                await fetch_product_info(keyword)
            else:
                print(f"Data for keyword '{keyword}' already exists in the database.")
        end_time = time.time()
        elapsed_time = end_time - start_time
        print(f"Crawling completed in {elapsed_time} seconds.")

    asyncio.run(main())