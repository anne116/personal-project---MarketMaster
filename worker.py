"""
Process messages from the SQS queue and performs crawling operations, including storing crawled data into database and delete message after it is processed successfully.
"""
import boto3
import os
import json
import mysql.connector
import asyncio
import websockets
from utils import keyword_exists, store_keyword
from crawl_amazon_product_data import fetch_product_info
from app import connected_clients
from dotenv import load_dotenv
import logging
import requests

load_dotenv()
NOTIFY_URL = os.getenv('NOTIFY_URL')

AWS_SQS_QUEUE_URL = os.getenv('AWS_SQS_QUEUE_URL')
WEBSOCKET_URL = os.getenv('WEBSOCKET_URL')

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

sqs = boto3.client(
    'sqs',
    region_name=os.getenv('AWS_REGION'),
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
)

async def notify_user(sessionId, keyword, status, message):
    """Notify the backend server and optionally the user's browser"""
    payload = {
        "sessionId": sessionId,
        "keyword": keyword,
        "status": status,
        "message": message
    }

    logger.info(f"payload: {payload}")

    custom_message = f"The crawling job for keyword '{keyword}' is {status}!"
    if sessionId in connected_clients:
        for websocket in connected_clients[sessionId]:
            await websocket.send_text(json.dumps({"message": custom_message}))
            logger.info(f"Sent message to session {sessionId}: {custom_message}")
    else:
        logger.info(f"No connected clients found for session {sessionId}")

async def process_message(message):
    """Process a single SQS message"""
    body = json.loads(message['Body'])
    keyword = body.get('keyword')
    sessionId = body.get('sessionId')
    logger.info(f"Processing keyword: {keyword} for sessionId: {sessionId}")

    if not sessionId:
        logger.error("Session ID is missing in the message.")
        return False

    if not keyword_exists(keyword):
        logger.info(f"Starting to fetch product info for keyword: {keyword}")
        try:
            total_crawled_items = await fetch_product_info(keyword, min_items_to_store=80)
            if total_crawled_items >= 80:
                store_keyword(keyword)
                logger.info(f"Keyword {keyword} stored successfully.")
                message = f"The crawling job for keyword '{keyword}' is completed successfully."
                await notify_user(sessionId, keyword, status="completed", message=message)
                logger.info(f"Job crawling keyword:{keyword} completed. User is informed.")
                return True
            else:
                message = f"Failed to fetch sufficient product info for keyword '{keyword}'."
                await notify_user(sessionId, keyword, status="failed", message=message)
                logger.info(f"Job crawling keyword:{keyword} failed. User is informed.")
                return False
        except Exception as err:
            logger.error(f"Error processing keyword {keyword}: {err}")
            return False
    else:
        logger.info(f"Keyword {keyword} already exists in the database.")
        message = f"Keyword '{keyword}' already exists in the database."
        await notify_user(sessionId, keyword, status="exists", message=message)
        return True

async def process_sqs_messages():
    while True:
        logger.info("Polling for messages...")

        response = sqs.receive_message(
            QueueUrl=AWS_SQS_QUEUE_URL,
            MaxNumberOfMessages=10,
            WaitTimeSeconds=10
        )

        messages = response.get('Messages', [])
        logger.info(f"Received {len(messages)} messages from SQS queue.")
        for message in messages:
            success = await process_message(message)
            if success or "Keyword already exists" in message['Body']:
                sqs.delete_message(
                    QueueUrl=AWS_SQS_QUEUE_URL,
                    ReceiptHandle=message['ReceiptHandle']
                )
                logger.info(f"Message Processed and Deleted: {message['MessageId']}")
            else:
                logger.error(f"Failed to process message: {message['MessageId']}")

async def main():
    await process_sqs_messages()

if __name__ == '__main__':
    asyncio.run(main())
