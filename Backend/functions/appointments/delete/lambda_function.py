"""
Delete Appointment Lambda — DELETE /appointments/{id}
Deletes an appointment record for the authenticated patient.
"""
import json
import os

import boto3

from shared.auth import get_user_id
from shared.response import ok, error, unauthorized, server_error

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["APPOINTMENTS_TABLE_NAME"])


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

        table.delete_item(
            Key={"userId": user_id, "appointmentId": appointment_id}
        )

        return ok({"message": "Appointment deleted successfully"})

    except Exception as exc:
        print("Error:", str(exc))
        return server_error()
