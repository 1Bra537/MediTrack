"""
Log Vital Lambda — POST /vitals
Records a new vital sign reading for the authenticated patient.
"""
import json
import os
import uuid
from datetime import datetime, timezone

import boto3

from shared.auth import get_user_id
from shared.response import created, error, unauthorized, server_error

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["VITALS_TABLE_NAME"])

VALID_TYPES = {
    "bloodPressure", "heartRate", "weight",
    "bloodGlucose", "temperature", "oxygenSaturation",
}


def lambda_handler(event, context):
    print("Received event:", json.dumps(event))

    try:
        user_id = get_user_id(event)
        if not user_id:
            return unauthorized()

        body = json.loads(event.get("body") or "{}")

        vital_type = body.get("type")
        value = body.get("value")
        unit = body.get("unit")

        if not vital_type:
            return error("Missing required field: type")
        if vital_type not in VALID_TYPES:
            return error(f"Invalid vital type. Must be one of: {', '.join(VALID_TYPES)}")
        if value is None:
            return error("Missing required field: value")

        now = datetime.now(timezone.utc).isoformat()
        vital = {
            "userId": user_id,
            "timestamp": now,
            "vitalId": str(uuid.uuid4()),
            "type": vital_type,
            "value": str(value),
            "unit": unit or "",
            "systolic": str(body.get("systolic", "")) if vital_type == "bloodPressure" else "",
            "diastolic": str(body.get("diastolic", "")) if vital_type == "bloodPressure" else "",
            "notes": body.get("notes", ""),
            "recordedAt": body.get("recordedAt", now),
        }

        table.put_item(Item=vital)

        return created({"message": "Vital sign recorded successfully", "vital": vital})

    except Exception as exc:
        print("Error:", str(exc))
        return server_error()
