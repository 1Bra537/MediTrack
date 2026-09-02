"""
Delete Vital Lambda — DELETE /vitals/{timestamp}
Deletes a specific vital sign reading for the authenticated patient.
"""
import json
import os

import boto3

from shared.auth import get_user_id
from shared.response import ok, error, unauthorized, server_error

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["VITALS_TABLE_NAME"])


def lambda_handler(event, context):
    print("Received event:", json.dumps(event))

    try:
        user_id = get_user_id(event)
        if not user_id:
            return unauthorized()

        # The sort key for vitals is timestamp
        timestamp = (
            event.get("pathParameters") or {}
        ).get("timestamp")

        if not timestamp:
            return error("Missing timestamp in path")

        # URL-decode the timestamp (colons are encoded as %3A)
        timestamp = timestamp.replace("%3A", ":")

        table.delete_item(
            Key={"userId": user_id, "timestamp": timestamp}
        )

        return ok({"message": "Vital sign deleted successfully"})

    except Exception as exc:
        print("Error:", str(exc))
        return server_error()
