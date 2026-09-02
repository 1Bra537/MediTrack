"""
Update Appointment Lambda — PATCH /appointments/{id}
Updates an existing appointment for the authenticated patient.
"""
import json
import os
from datetime import datetime, timezone

import boto3
from boto3.dynamodb.conditions import Attr

from shared.auth import get_user_id
from shared.response import ok, error, not_found, unauthorized, server_error

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["APPOINTMENTS_TABLE_NAME"])

UPDATABLE_FIELDS = [
    "title", "doctorName", "date", "time",
    "location", "specialty", "notes", "status",
]


def lambda_handler(event, context):
    print("Received event:", json.dumps(event))

    try:
        user_id = get_user_id(event)
        if not user_id:
            return unauthorized()

        appointment_id = (
            event.get("pathParameters") or {}
        ).get("id")

        if not appointment_id:
            return error("Missing appointment ID in path")

        body = json.loads(event.get("body") or "{}")
        if not body:
            return error("Request body cannot be empty")

        update_parts = []
        expression_values = {}
        expression_names = {}

        for field in UPDATABLE_FIELDS:
            if field in body:
                placeholder = f"#f_{field}"
                value_key = f":v_{field}"
                update_parts.append(f"{placeholder} = {value_key}")
                expression_names[placeholder] = field
                expression_values[value_key] = body[field]

        if not update_parts:
            return error("No valid fields provided for update")

        update_parts.append("#updated = :updated")
        expression_names["#updated"] = "updatedAt"
        expression_values[":updated"] = datetime.now(timezone.utc).isoformat()

        table.update_item(
            Key={"userId": user_id, "appointmentId": appointment_id},
            UpdateExpression="SET " + ", ".join(update_parts),
            ExpressionAttributeNames=expression_names,
            ExpressionAttributeValues=expression_values,
            ConditionExpression=Attr("userId").exists() & Attr("appointmentId").exists(),
        )

        return ok({"message": "Appointment updated successfully"})

    except table.meta.client.exceptions.ConditionalCheckFailedException:
        return not_found("Appointment not found")

    except Exception as exc:
        print("Error:", str(exc))
        return server_error()
