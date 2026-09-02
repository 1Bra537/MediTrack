"""
Create Appointment Lambda — POST /appointments
Schedules a new appointment for the authenticated patient.
"""
import json
import os
import uuid
from datetime import datetime, timezone

import boto3

from shared.auth import get_user_id
from shared.response import created, error, unauthorized, server_error

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["APPOINTMENTS_TABLE_NAME"])

REQUIRED_FIELDS = ["title", "doctorName", "date", "time"]


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
        appointment = {
            "userId": user_id,
            "appointmentId": str(uuid.uuid4()),
            "title": body["title"],
            "doctorName": body["doctorName"],
            "date": body["date"],
            "time": body["time"],
            "location": body.get("location", ""),
            "specialty": body.get("specialty", ""),
            "notes": body.get("notes", ""),
            "status": body.get("status", "scheduled"),  # scheduled | completed | cancelled
            "createdAt": now,
            "updatedAt": now,
        }

        table.put_item(Item=appointment)

        return created({"message": "Appointment created successfully", "appointment": appointment})

    except Exception as exc:
        print("Error:", str(exc))
        return server_error()
