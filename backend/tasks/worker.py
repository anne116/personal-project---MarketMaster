"""
Process messages from the SQS queue and performs crawling operations,
including storing crawled data into database and delete message after it is processed successfully.
"""
import os
import json
import logging
import asyncio
import requests
import boto3
from dotenv import load_dotenv
from backend.utils.utils import keyword_exists, store_keyword
from backend.tasks.crawl_amazon_product_data import fetch_product_info


load_dotenv()
NOTIFY_URL = os.getenv("NOTIFY_URL")

AWS_SQS_QUEUE_URL = os.getenv("AWS_SQS_QUEUE_URL")
WEBSOCKET_URL = os.getenv("WEBSOCKET_URL")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

sqs = boto3.client(
    "sqs",
    region_name=os.getenv("AWS_REGION"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)


async def notify_app(sessionId, keyword, status="completed", message=None):
    """Notify the WebSocket Server"""
    try:
        if message is None:
            message = f"The crawling job for keyword '{keyword}' is {status}!"
        response = requests.post(
            f"{NOTIFY_URL}/api/notify",
            json={"sessionId": sessionId, "message": message, "keyword": keyword},
        )
        response.raise_for_status()
        logger.info("Sent message: %s to sessionId: %s", message, sessionId)
    except requests.RequestException as err:
        logger.error("Error notifying websocket server: %s", err)


async def process_message(message):
    """Process a single SQS message"""
    body = json.loads(message["Body"])
    keyword = body.get("keyword")
    sessionId = body.get("sessionId")
    logger.info("Processing keyword: %s for sessionId: %s", keyword, sessionId)

    if not sessionId:
        logger.error("Session ID is missing in the message.")
        return False

    if not keyword_exists(keyword):
        logger.info("Starting to fetch product info for keyword: %s", keyword)
        total_crawled_items = 0
        try:
            total_crawled_items = await fetch_product_info(
                keyword, min_items_to_store=80
            )
            if total_crawled_items >= 80:
                store_keyword(keyword)
                logger.info("Keyword %s stored successfully.", keyword)
                message = f"The crawling job for keyword '{keyword}' is completed successfully."
                await notify_app(
                    sessionId, keyword, status="completed", message=message
                )
                logger.info(
                    "Job crawling keyword: %s completed. User is informed.", keyword
                )
                return True
            message = (
                f"Failed to fetch sufficient product info for keyword '{keyword}'. Please try a valid keyword"
            )
            await notify_app(sessionId, keyword, status="failed", message=message)
            logger.info("Job crawling keyword:%s failed. User is informed.", keyword)
            return False
        except Exception as err:
            if total_crawled_items >= 80:
                store_keyword(keyword)
                message = f"The crawling job for keyword '{keyword}' is completed with error: {err}"
                await notify_app(sessionId, keyword, status="completed_with_errors", message=message)
                logger.error(f"Error processing keyword {keyword}: {err}")
                return True
            return False
    else:
        logger.info("Keyword %s already exists in the database.", keyword)
        message = f"Keyword '{keyword}' already exists in the database."
        await notify_app(sessionId, keyword, status="exists", message=message)
        return True


async def process_sqs_messages():
    """
    Continuously poll the SQS queue for messages, process messages,
    delete successfully processed messages from the queue.
    """
    while True:
        logger.info("Polling for messages...")

        response = sqs.receive_message(
            QueueUrl=AWS_SQS_QUEUE_URL, MaxNumberOfMessages=10, WaitTimeSeconds=10
        )

        messages = response.get("Messages", [])
        logger.info("Received %s messages from SQS queue.", len(messages))
        for message in messages:
            success = await process_message(message)
            if success or "Keyword already exists" in message["Body"]:
                sqs.delete_message(
                    QueueUrl=AWS_SQS_QUEUE_URL, ReceiptHandle=message["ReceiptHandle"]
                )
                logger.info("Message Processed and Deleted: %s", message["MessageId"])
            else:
                logger.error("Failed to process message: %s", message["MessageId"])


async def main():
    """
    Entry point for the asynchronous SQS message processing loop
    """
    await process_sqs_messages()


if __name__ == "__main__":
    asyncio.run(main())
