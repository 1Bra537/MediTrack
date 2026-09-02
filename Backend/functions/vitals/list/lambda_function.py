"""
List Vitals Lambda — GET /vitals
Returns all vital sign readings for the authenticated patient.
Supports optional ?type= query parameter to filter by vital type.
"""
import json
import os

import boto3
from boto3.dynamodb.conditions import Key, Attr

from shared.auth import get_user_id
from shared.response import ok, unauthorized, server_error

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["VITALS_TABLE_NAME"])


def lambda_handler(event, context):
    print("Received event:", json.dumps(event))

    try:
        user_id = get_user_id(event)
        if not user_id:
            return unauthorized()

        # Optional filter by vital type
        query_params = event.get("queryStringParameters") or {}
        vital_type_filter = query_params.get("type")

        query_kwargs = {
            "KeyConditionExpression": Key("userId").eq(user_id),
            "ScanIndexForward": False,  # Most recent first (timestamp DESC)
        }

        if vital_type_filter:
            query_kwargs["FilterExpression"] = Attr("type").eq(vital_type_filter)

        response = table.query(**query_kwargs)
        items = response.get("Items", [])

        return ok({"vitals": items, "count": len(items)})

    except Exception as exc:
        print("Error:", str(exc))
        return server_error()
