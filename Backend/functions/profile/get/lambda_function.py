"""
Get Profile Lambda — GET /profile
Retrieves the authenticated patient's profile from DynamoDB.
"""
import json
import os

import boto3

from shared.auth import get_user_id
from shared.response import ok, not_found, unauthorized, server_error

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["PROFILE_TABLE_NAME"])


def lambda_handler(event, context):
    print("Received event:", json.dumps(event))

    try:
        user_id = get_user_id(event)
        if not user_id:
            return unauthorized()

        response = table.get_item(Key={"userId": user_id})
        item = response.get("Item")

        if not item:
            return not_found("Profile not found")

        return ok(item)

    except Exception as exc:
        print("Error:", str(exc))
        return server_error()
