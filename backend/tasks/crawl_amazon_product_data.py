"""
This module contains functions to crawl Amazon product data,
batch store in database and return data to worker.
"""
import asyncio
import time
import random
import logging
import os
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError
from mysql.connector import Error
from dotenv import load_dotenv
from backend.utils.utils import store_data, update_progress, get_progress

load_dotenv()

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)
# os.environ['PWDEBUG'] = '1'

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


async def extract_product_images(context, product_page_url):
    """Extract product images from product page"""
    product_page = await context.new_page()
    await product_page.goto(product_page_url, wait_until="domcontentloaded")

    try:
        await product_page.wait_for_selector("#imgTagWrapperId img", timeout=20000)
        print("Main image loaded")

        main_image_element = await product_page.query_selector("#imgTagWrapperId img")
        main_image_url = (
            await main_image_element.get_attribute("src")
            if main_image_element
            else None
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
    except PlaywrightTimeoutError:
        logger.error(f"Timeout waiting for the main image on {product_page_url}")
        await product_page.close()
        return None, []
    except Exception as e:
        logger.error(f"Unexpected error on {product_page_url}: {e}")
        await product_page.close()
        return None, []


async def extract_product_details(item):
    """Extract product details from an item element"""
    span_elements = await item.query_selector_all("h2 a span")
    title_parts = [
        await span_element.evaluate("el => el.innerText")
        for span_element in span_elements
    ]
    title = " ".join(title_parts).strip() if title_parts else None

    link_element = await item.query_selector("h2 a")
    url = await link_element.get_attribute("href") if link_element else None
    if url and not url.startswith("http"):
        url = f"https://www.amazon.com{url}"

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


async def process_item(item, context, keyword, batch_products):
    """Process an individual item"""
    details = await extract_product_details(item)
    if is_valid_product(details):
        title, url, price_whole, price_fraction, rating, reviews = details
        try:
            main_image_url, other_image_urls = await extract_product_images(
                context, url
            )
            if main_image_url is not None:
                other_images_url_str = ",".join(other_image_urls)
                product_data = {
                    "title": title,
                    "price_whole": price_whole,
                    "price_fraction": price_fraction,
                    "rating": rating,
                    "reviews": reviews,
                    "keyword": keyword,
                    "url": url,
                    "mainImage_url": main_image_url,
                    "otherImages_url": other_images_url_str,
                }
                print("Extracted product data: %s", product_data)
                batch_products.append(product_data)
            else:
                print("skipping product at %s due to missing main image.", url)
        except TimeoutError:
            print(
                "Timeout waiting for the main image on %s. Skipping this product.", url
            )
    else:
        print("Invalid product details for item: %s", details)


async def crawl_page(page, context, keyword: str, batch_size=2):
    """Crawl a page for product information"""
    items = await page.query_selector_all(".s-result-item")
    products = []
    items_crawled = 0

    for item in items:
        try:
            await process_item(item, context, keyword, products)
            items_crawled += 1
            if len(products) >= batch_size:
                store_data(products)
                products = []
        except (AttributeError, TypeError, ValueError) as err:
            print("Error processing item: %s", err)
    if products:
        store_data(products)
    return items_crawled

async def fetch_product_info(keyword: str, batch_size=2, min_items_to_store=80, max_retries=3):
    """Fetch product information for a given keyword"""
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=False, slow_mo=1000)
        context = await browser.new_context(user_agent=random.choice(user_agents))
        page = await context.new_page()
        base_url = f"https://www.amazon.com/s?k={keyword}"
        current_page = get_progress(keyword)
        total_items_crawled = 0
        retries = 0

        try:
            while True:
                url = f"{base_url}&page={current_page}"
                logger.debug(f"Navigating to URL: {url}")
                try:
                    await page.goto(url, wait_until="domcontentloaded", timeout=60000)
                except PlaywrightTimeoutError:
                    logger.error(f"Timeout navigating to URL: {url}")
                    retries += 1
                    if retries >= max_retries:
                        logger.error("Max retries reached, exiting...")
                        break
                    continue

                await page.wait_for_timeout(random.randint(3000, 10000))
                items_crawled = await crawl_page(page, context, keyword, batch_size)
                total_items_crawled += items_crawled
                update_progress(keyword, current_page)

                if total_items_crawled >= min_items_to_store:
                    logger.info(f"Crawled {total_items_crawled} items, exceeding the threshold.")
                    break

                try:
                    next_button = await page.query_selector("a.s-pagination-next")
                    if next_button:
                        await next_button.click()
                        await page.wait_for_load_state("domcontentloaded")
                        await page.wait_for_timeout(5000)
                        current_page += 1
                    else:
                        break
                except (PlaywrightTimeoutError, Error) as err:
                    logger.error(f"Error navigating to next page: {err}")
                    break
        except Exception as err:
            logger.error(f"Error during crawling: {err}")
            if total_items_crawled >= min_items_to_store:
                logger.info(f"Crawling interrupted, Crawled items ({total_items_crawled}) exceed threshold.")
                return total_items_crawled
            raise err
        finally:
            await browser.close()
        return total_items_crawled

async def main():
    """Main function to run the keyword crawl"""
    keywords = []
    start_time = time.time()
    for keyword in keywords:
        print("Crawling data on US Amazon website")
        await fetch_product_info(keyword)

    end_time = time.time()
    elapsed_time = end_time - start_time
    print("Crawling completed in %s seconds.", elapsed_time)


if __name__ == "__main__":
    asyncio.run(main())
