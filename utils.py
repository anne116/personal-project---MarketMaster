import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

load_dotenv()

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
        print(f"Error: {err}")
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
            print(f"Error getting progress: {err}")
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
            print(f"Error updating progress: {err}")
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
            print(f"Error checking keyword: {err}")
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
            cursor.execute(add_product, (
                product['title'],
                product['price_whole'],
                product['price_fraction'],
                product['rating'],
                product['reviews'],
                product['keyword'],
                product['url'],
                product['mainImage_url'],
                product['otherImages_url']
            ))
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
            print(f"Error storing keyword: {err}")
        finally:
            cursor.close()
            connection.close()
