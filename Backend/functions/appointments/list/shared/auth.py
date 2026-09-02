"""
Shared auth helper for MediTrack Lambda functions.
Extracts the authenticated user's sub (userId) from the Cognito JWT claims
embedded in the API Gateway request context.
"""


def get_user_id(event: dict) -> str | None:
    """
    Extract the Cognito user ID (sub) from the API Gateway request context.

    Returns the user ID string if found, otherwise None.
    """
    authorizer = (
        event
        .get("requestContext", {})
        .get("authorizer", {})
    )
    claims = authorizer.get("claims", {})
    return claims.get("sub") or None


def get_user_email(event: dict) -> str | None:
    """
    Extract the user's email from Cognito JWT claims.
    """
    authorizer = (
        event
        .get("requestContext", {})
        .get("authorizer", {})
    )
    claims = authorizer.get("claims", {})
    return claims.get("email") or None
