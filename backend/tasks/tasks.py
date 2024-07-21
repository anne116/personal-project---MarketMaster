"""
This module handles the SQS configuration and job submission
"""
import os
import json
import logging
import boto3
from dotenv import load_dotenv

load_dotenv()

aws_sqs_queue_url = os.getenv("AWS_SQS_QUEUE_URL")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

sqs = boto3.client(
    "sqs",
    region_name=os.getenv("AWS_REGION"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)


def add_crawl_task(keyword, sessionId):
    """send message to SQS queue"""
    response = sqs.send_message(
        QueueUrl=aws_sqs_queue_url,
        MessageBody=json.dumps({"keyword": keyword, "sessionId": sessionId}),
    )
    logger.info("Message sent to SQS queue for keyword: %s", keyword)
    logger.info("SQS Response: %s", response)
    return response
