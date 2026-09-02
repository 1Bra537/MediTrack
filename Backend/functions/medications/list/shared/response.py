"""
Shared response builder for MediTrack Lambda functions.
Provides consistent JSON responses with CORS headers.
"""
import json

CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
}


def ok(data: dict | list, status: int = 200) -> dict:
    """Return a successful response."""
    return {
        "statusCode": status,
        "headers": CORS_HEADERS,
        "body": json.dumps(data, default=str),
    }


def created(data: dict) -> dict:
    """Return a 201 Created response."""
    return ok(data, status=201)


def error(message: str, status: int = 400) -> dict:
    """Return an error response."""
    return {
        "statusCode": status,
        "headers": CORS_HEADERS,
        "body": json.dumps({"message": message}),
    }


def not_found(message: str = "Resource not found") -> dict:
    return error(message, status=404)


def unauthorized(message: str = "Unauthenticated request") -> dict:
    return error(message, status=401)


def server_error(message: str = "Internal server error") -> dict:
    return error(message, status=500)
