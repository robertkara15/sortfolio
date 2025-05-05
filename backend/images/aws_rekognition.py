# This module integrates with AWS Rekognition to analyse images stored in an S3 bucket.
# It uses the AWS SDK (boto3) to detect labels in images, providing a simple interface
# for retrieving image metadata such as objects, scenes, and activities.

import boto3
import os

# Initialize AWS Rekognition client
rekognition = boto3.client(
    "rekognition",
    region_name=os.getenv("AWS_REGION", "us-east-1")
)

def analyze_image(s3_bucket, image_key):
    """Analyze an image in S3 and return detected labels."""
    try:
        response = rekognition.detect_labels(
            Image={"S3Object": {"Bucket": s3_bucket, "Name": image_key}},
            MaxLabels=10,
            MinConfidence=75
        )
        labels = [label["Name"] for label in response["Labels"]]
        return labels
    except Exception as e:
        print(f"AWS Rekognition Error: {e}")
        return []
