import os
from dotenv import load_dotenv
import unittest
import unittest.mock
from fastapi.testclient import TestClient
from app import app, get_db_connection
import mysql.connector

load_dotenv()
client = TestClient(app)

TEST_DB_NAME = "test_db"

def create_test_db():
    conn = mysql.connector.connect(
        host=os.getenv("MYSQL_HOST"),
        user=os.getenv("MYSQL_USER"),
        password=os.getenv("MYSQL_PASSWORD")
    )
    cursor = conn.cursor()
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS {TEST_DB_NAME}")
    conn.database = TEST_DB_NAME
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            mainImage_url VARCHAR(255),
            title VARCHAR(255),
            price_whole VARCHAR(255),
            price_fraction VARCHAR(255),
            rating VARCHAR(255),
            reviews VARCHAR(255),
            url VARCHAR(255),
            keyword VARCHAR(255)
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS normalized_keywords (
            keyword VARCHAR(255) PRIMARY KEY,
            keyword_pool TEXT
        )
    """)
    conn.commit()
    cursor.close()
    conn.close()

def drop_test_db():
    conn = mysql.connector.connect(
        host=os.getenv("MYSQL_HOST"),
        user=os.getenv("MYSQL_USER"),
        password=os.getenv("MYSQL_PASSWORD")
    )
    cursor = conn.cursor()
    cursor.execute(f"DROP DATABASE IF EXISTS {TEST_DB_NAME}")
    conn.commit()
    cursor.close()
    conn.close()

def get_test_db_connection():
    return mysql.connector.connect(
        host=os.getenv("MYSQL_HOST"),
        user=os.getenv("MYSQL_USER"),
        password=os.getenv("MYSQL_PASSWORD"),
        database=TEST_DB_NAME
    )

class TestFetchProductsEndpoint(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        create_test_db()

    @classmethod
    def tearDownClass(cls):
        drop_test_db()

    def setUp(self):
        self.app_deps_patch = unittest.mock.patch('app.get_db_connection', get_test_db_connection)
        self.app_deps_patch.start()
        self.clear_tables()
        self.insert_test_data()

    def tearDown(self):
        self.app_deps_patch.stop()

    def clear_tables(self):
        conn = get_test_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM products")
        cursor.execute("DELETE FROM normalized_keywords")
        conn.commit()
        cursor.close()
        conn.close()

    def insert_test_data(self):
        conn = get_test_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO products (mainImage_url, title, price_whole, price_fraction, rating, reviews, url, keyword)
            VALUES 
            ('image1.jpg', 'Product 1', '100', '00', '4.5', '100', 'http://example.com/product1', 'camera'),
            ('image2.jpg', 'Product 2', '200', '00', '4.0', '50', 'http://example.com/product2', 'camera')
        """)
        cursor.execute("""
            INSERT INTO normalized_keywords (keyword, keyword_pool)
            VALUES 
            ('camera', 'camera,cameras,cam,cams')
        """)
        conn.commit()
        cursor.close()
        conn.close()

    def test_fetch_products_success(self):
        response = client.get("/api/fetch_products?keyword=camera&sessionId=test_session")
        self.assertEqual(response.status_code, 200)
        products = response.json()
        self.assertIsInstance(products, list)
        self.assertEqual(len(products), 2)

    def test_fetch_products_keyword_not_found(self):
        response = client.get("/api/fetch_products?keyword=curtain&sessionId=test_session")
        self.assertEqual(response.status_code, 202)
        self.assertEqual(response.json()["detail"], "Keyword not found. A crawl task has been added to the queue")

    def test_fetch_products_invalid_keyword(self):
        response = client.get("/api/fetch_products?keyword=ahsdjflk&sessionId=test_session")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["detail"], "Invalid keyword. Please enter a meaningful search term.")

if __name__ == "__main__":
    unittest.main()
