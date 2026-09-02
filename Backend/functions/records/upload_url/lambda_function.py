"""
Get S3 Upload URL Lambda — POST /records/upload-url
Generates a pre-signed S3 URL for uploading medical document files.
Keys are isolated under s3://bucket/userId/filename
"""
import json
import os
import uuid
import boto3

from shared.auth import get_user_id
from shared.response import ok, error, unauthorized, server_error

s3 = boto3.client("s3")
BUCKET_NAME = os.environ["RECORDS_BUCKET_NAME"]


def lambda_handler(event, context):
    print("Received event:", json.dumps(event))

    try:
        user_id = get_user_id(event)
        if not user_id:
            return unauthorized()

        body = json.loads(event.get("body") or "{}")
        file_name = body.get("fileName")
        file_type = body.get("fileType", "application/pdf")

        if not file_name:
            return error("Missing required field: fileName")

        # Key isolated by userId
        object_key = f"{user_id}/{uuid.uuid4()}_{file_name}"

        upload_url = s3.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": BUCKET_NAME,
                "Key": object_key,
                "ContentType": file_type,
            },
            ExpiresIn=300,  # 5 minutes
        )

        return ok({
            "uploadUrl": upload_url,
            "objectKey": object_key,
            "fileName": file_name,
        })

    except Exception as exc:
        print("Error:", str(exc))
        return server_error()
