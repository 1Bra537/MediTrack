"""
Create Profile Lambda — POST /profile
Creates a new patient profile in DynamoDB.
"""
import json
import os
from datetime import datetime, timezone

import boto3

from shared.auth import get_user_id
from shared.response import created, error, unauthorized, server_error

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["PROFILE_TABLE_NAME"])

REQUIRED_FIELDS = ["firstName", "lastName", "dateOfBirth", "phone"]


def lambda_handler(event, context):
    print("Received event:", json.dumps(event))

    try:
        user_id = get_user_id(event)
        if not user_id:
            return unauthorized()

        body = json.loads(event.get("body") or "{}")

        for field in REQUIRED_FIELDS:
            if not body.get(field):
                return error(f"Missing required field: {field}")

        now = datetime.now(timezone.utc).isoformat()
        profile = {
            "userId": user_id,
            "firstName": body["firstName"],
            "lastName": body["lastName"],
            "dateOfBirth": body["dateOfBirth"],
            "phone": body["phone"],
            "bloodType": body.get("bloodType", ""),
            "allergies": body.get("allergies", ""),
            "emergencyContact": body.get("emergencyContact", ""),
            "gender": body.get("gender", ""),
            "address": body.get("address", ""),
            "createdAt": now,
            "updatedAt": now,
        }

        table.put_item(Item=profile)

        return created({"message": "Profile created successfully", "profile": profile})

    except Exception as exc:
        print("Error:", str(exc))
        return server_error()
