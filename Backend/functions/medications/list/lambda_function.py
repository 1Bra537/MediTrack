"""
List Medications Lambda — GET /medications
Returns all medication records for the authenticated patient.
"""
import json
import os

import boto3
from boto3.dynamodb.conditions import Key

from shared.auth import get_user_id
from shared.response import ok, unauthorized, server_error

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["MEDICATIONS_TABLE_NAME"])


def lambda_handler(event, context):
    print("Received event:", json.dumps(event))

    try:
        user_id = get_user_id(event)
        if not user_id:
            return unauthorized()

        response = table.query(
            KeyConditionExpression=Key("userId").eq(user_id)
        )

        items = response.get("Items", [])
        # Sort by createdAt descending (most recent first)
        items.sort(key=lambda x: x.get("createdAt", ""), reverse=True)

        return ok({"medications": items, "count": len(items)})

    except Exception as exc:
        print("Error:", str(exc))
        return server_error()
