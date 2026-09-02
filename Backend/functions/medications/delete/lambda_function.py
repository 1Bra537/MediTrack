"""
Delete Medication Lambda — DELETE /medications/{id}
Deletes a medication record for the authenticated patient.
"""
import json
import os

import boto3

from shared.auth import get_user_id
from shared.response import ok, error, unauthorized, server_error

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["MEDICATIONS_TABLE_NAME"])


def lambda_handler(event, context):
    print("Received event:", json.dumps(event))

    try:
        user_id = get_user_id(event)
        if not user_id:
            return unauthorized()

        medication_id = (
            event.get("pathParameters") or {}
        ).get("id")

        if not medication_id:
            return error("Missing medication ID in path")

        table.delete_item(
            Key={"userId": user_id, "medicationId": medication_id}
        )

        return ok({"message": "Medication deleted successfully"})

    except Exception as exc:
        print("Error:", str(exc))
        return server_error()
