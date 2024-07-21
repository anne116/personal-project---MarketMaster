"""
This module provides utility functions for interacting with a MySQL database,
including creating connections, managing keyword progress, checking for keyword existence,
and storing product data and keywords.
"""
import os
import logging
import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

db_config = {
    "user": os.getenv("MYSQL_USER"),
    "password": os.getenv("MYSQL_PASSWORD"),
    "host": os.getenv("MYSQL_HOST"),
    "database": os.getenv("MYSQL_DATABASE"),
}


def create_connection():
    """Create and return a mySQL database connection"""
    try:
        connection = mysql.connector.connect(**db_config)
        if connection.is_connected():
            return connection
    except Error as err:
        logger.error("Error: %s", err)
    return None


def get_progress(keyword):
    """Get the current progress for a keyword"""
    connection = create_connection()
    if connection:
        try:
            cursor = connection.cursor()
            query = "SELECT current_page FROM progress WHERE keyword = %s"
            cursor.execute(query, (keyword,))
            result = cursor.fetchone()
            return result[0] if result else 1
        except Error as err:
            logger.error("Error getting progress: %s", err)
            return 1
        finally:
            cursor.close()
            connection.close()
    return 1


def update_progress(keyword, current_page):
    """Update the progress for a keyword"""
    connection = create_connection()
    if connection:
        try:
            cursor = connection.cursor()
            query = "REPLACE INTO progress (keyword, current_page) VALUES (%s, %s)"
            cursor.execute(query, (keyword, current_page))
            connection.commit()
        except Error as err:
            logger.error("Error updating progress: %s", err)
        finally:
            cursor.close()
            connection.close()


def keyword_exists(keyword):
    """Check if a keyword exists in the database"""
    connection = create_connection()
    if connection:
        try:
            cursor = connection.cursor()
            query = "SELECT 1 FROM keywords WHERE keyword = %s LIMIT 1"
            cursor.execute(query, (keyword,))
            result = cursor.fetchone()
            return result is not None
        except Error as err:
            logger.error("Error checking keyword: %s", err)
            return False
        finally:
            cursor.close()
            connection.close()
    return False


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
        for product in data:
            cursor.execute(
                add_product,
                (
                    product["title"],
                    product["price_whole"],
                    product["price_fraction"],
                    product["rating"],
                    product["reviews"],
                    product["keyword"],
                    product["url"],
                    product["mainImage_url"],
                    product["otherImages_url"],
                ),
            )
        connection.commit()
        cursor.close()
        connection.close()
    else:
        logger.error("Failed to connect to the database.")

def store_keyword(keyword):
    """Store a keyword in database"""
    logger.info("Storing keyword: %s", keyword)
    connection = create_connection()
    if connection:
        try:
            cursor = connection.cursor()
            add_keyword = "INSERT INTO keywords (keyword) VALUES (%s)"
            cursor.execute(add_keyword, (keyword,))

            add_normalized_keyword = (
                "INSERT INTO normalized_keywords (keyword, keyword_pool) "
                "VALUES (%s, %s)"
            )
            cursor.execute(add_normalized_keyword, (keyword, keyword))

            connection.commit()
        except Error as err:
            logger.error("Error storing keyword: %s", err)
        finally:
            cursor.close()
            connection.close()
