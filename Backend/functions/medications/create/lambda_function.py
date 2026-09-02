"""
Create Medication Lambda — POST /medications
Adds a new medication record for the authenticated patient.
"""
import json
import os
import uuid
from datetime import datetime, timezone

import boto3

from shared.auth import get_user_id
from shared.response import created, error, unauthorized, server_error

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["MEDICATIONS_TABLE_NAME"])

REQUIRED_FIELDS = ["name", "dosage", "frequency"]


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
        medication = {
            "userId": user_id,
            "medicationId": str(uuid.uuid4()),
            "name": body["name"],
            "dosage": body["dosage"],
            "frequency": body["frequency"],
            "prescribedBy": body.get("prescribedBy", ""),
            "startDate": body.get("startDate", ""),
            "endDate": body.get("endDate", ""),
            "notes": body.get("notes", ""),
            "isActive": body.get("isActive", True),
            "createdAt": now,
            "updatedAt": now,
        }

        table.put_item(Item=medication)

        return created({"message": "Medication added successfully", "medication": medication})

    except Exception as exc:
        print("Error:", str(exc))
        return server_error()
