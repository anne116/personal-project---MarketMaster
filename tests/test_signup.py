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
        CREATE TABLE IF NOT EXISTS users (
            user_id VARCHAR(36) PRIMARY KEY,
            name VARCHAR(255),
            email VARCHAR(255) UNIQUE,
            password VARCHAR(255)
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

class TestSignupEndpoint(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        create_test_db()

    @classmethod
    def tearDownClass(cls):
        drop_test_db()

    def setUp(self):
        self.app_deps_patch = unittest.mock.patch('app.get_db_connection', get_test_db_connection)
        self.app_deps_patch.start()
        self.clear_users_table()

    def tearDown(self):
        self.app_deps_patch.stop()

    def clear_users_table(self):
        conn = get_test_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM users")
        conn.commit()
        cursor.close()
        conn.close()

    def test_signup_success(self):
        signup_data = {
            "name": "Test User",
            "email": "testuser@example.com",
            "password": "testpassword123"
        }
        
        response = client.post("/api/signup", json=signup_data)
        print(response.json())
        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", response.json())
        self.assertEqual(response.json()["message"], "User created successfully!")

    def test_signup_duplicate(self):
        signup_data = {
            "name": "Test User",
            "email": "testuser@example.com",
            "password": "testpassword123"
        }
        client.post("/api/signup", json=signup_data)

        response = client.post("/api/signup", json=signup_data)
        self.assertEqual(response.status_code, 400)
        self.assertIn("detail", response.json())
        self.assertEqual(response.json()["detail"], "This email already exists!")

    def test_signup_invalid_data(self):
        invalid_signup_data = {
            "name": "Test User",
        }
        response = client.post("/api/signup", json=invalid_signup_data)
        self.assertEqual(response.status_code, 422)
        self.assertIn("detail", response.json())

if __name__ == "__main__":
    unittest.main()
