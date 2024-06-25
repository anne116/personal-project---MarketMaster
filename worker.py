"""
Process messages from the SQS queue and performs crawling operations, including storing crawled data into database and delete message after it is processed successfully.
"""
import boto3
import os
import json
import mysql.connector
import asyncio
from utils import keyword_exists, store_keyword
from crawl_amazon_product_data import fetch_product_info
from dotenv import load_dotenv
import logging

load_dotenv()

AWS_SQS_QUEUE_URL = os.getenv('AWS_SQS_QUEUE_URL')

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

sqs = boto3.client(
    'sqs',
    region_name=os.getenv('AWS_REGION'),
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
)

async def process_message(message):
    """Process a single SQS message"""
    body = json.loads(message['Body'])
    keyword = body['keyword']
    if not keyword_exists(keyword):
        try:
            await fetch_product_info(keyword)
            store_keyword(keyword)
            logger.info(f"Keyword {keyword} stored successfully.")
            return True
        except Exception as err:
            logger.error(f"Error processing keyword {keyword}: {err}")
            return False
    else:
        logger.info(f"Keyword {keyword} already exists in the database.")
        return True
    # if not keyword_exists(keyword):
    #     crawled_data = asyncio.run(fetch_product_info(keyword))
    #     print(f"CRAWLED DATA:{crawled_data}")
    #     store_data(crawled_data)
    #     print("Crawled data is stored!")
    #     store_keyword(keyword)
    #     print("Keyword is stored!")
    # else:
    #     print(f"Keyword {keyword} already exists in the database")


def main():
    while True:
        response = sqs.receive_message(
            QueueUrl=AWS_SQS_QUEUE_URL,
            MaxNumberOfMessages=10,
            WaitTimeSeconds=10
        )

        messages = response.get('Messages', [])
        for message in messages:
            success = asyncio.run(process_message(message))
            if success:
                sqs.delete_message(
                    QueueUrl=AWS_SQS_QUEUE_URL,
                    ReceiptHandle=message['ReceiptHandle']
                )
                logger.info(f"Message Processed and Deleted: {message['MessageId']}")
            else:
                logger.error(f"Failed to process message: {message['MessageId']}")

if __name__ == '__main__':
    main()