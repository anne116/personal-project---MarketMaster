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
from dotenv import load_dotenv
import logging

load_dotenv()

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

async def notify_websocket(message, keyword):
    """Notify the WebSocket Server"""
    try:
        async with websockets.connect(WEBSOCKET_URL) as websocket:
            await websocket.send(json.dumps({"message": message, "keyword": keyword}))
            logger.info(f"Sent message: {message}")
    except Exception as err:
        logger.error(f"Error notifying websocket: {err}")

async def process_message(message):
    """Process a single SQS message"""
    body = json.loads(message['Body'])
    keyword = body['keyword']
    if not keyword_exists(keyword):
        try:
            await fetch_product_info(keyword)
            store_keyword(keyword)
            logger.info(f"Keyword {keyword} stored successfully.")
            await notify_websocket(f"Crawling job for keyword '{keyword}' is completed!", keyword)
            return True
        except Exception as err:
            logger.error(f"Error processing keyword {keyword}: {err}")
            return False
    else:
        logger.info(f"Keyword {keyword} already exists in the database.")
        return True

async def process_sqs_messages():
    while True:
        response = sqs.receive_message(
            QueueUrl=AWS_SQS_QUEUE_URL,
            MaxNumberOfMessages=10,
            WaitTimeSeconds=10
        )

        messages = response.get('Messages', [])
        for message in messages:
            success = await process_message(message)
            if success:
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
