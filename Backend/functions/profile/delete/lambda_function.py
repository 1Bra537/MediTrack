"""
Delete Profile Lambda — DELETE /profile
Permanently deletes the authenticated patient's profile from DynamoDB.
"""
import json
import os

import boto3

from shared.auth import get_user_id
from shared.response import ok, unauthorized, server_error

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["PROFILE_TABLE_NAME"])


def lambda_handler(event, context):
    print("Received event:", json.dumps(event))

    try:
        user_id = get_user_id(event)
        if not user_id:
            return unauthorized()

        table.delete_item(Key={"userId": user_id})

        return ok({"message": "Profile deleted successfully"})

    except Exception as exc:
        print("Error:", str(exc))
        return server_error()
