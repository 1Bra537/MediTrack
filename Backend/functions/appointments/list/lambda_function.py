"""
List Appointments Lambda — GET /appointments
Returns all appointments for the authenticated patient.
"""
import json
import os

import boto3
from boto3.dynamodb.conditions import Key

from shared.auth import get_user_id
from shared.response import ok, unauthorized, server_error

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["APPOINTMENTS_TABLE_NAME"])


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
        # Sort by date ascending (upcoming first)
        items.sort(key=lambda x: (x.get("date", ""), x.get("time", "")))

        return ok({"appointments": items, "count": len(items)})

    except Exception as exc:
        print("Error:", str(exc))
        return server_error()
