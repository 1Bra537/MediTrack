#!/usr/bin/env python3
"""
bundle_lambdas.py — Pre-deployment helper script.

Copies the shared/ utilities directory into each Lambda function folder
so that they can be imported as `from shared.auth import ...` etc.

Run this script before `cdk deploy` from the Infrastructure/ directory:
    python bundle_lambdas.py

Or it is called automatically by the CDK stack via BundlingOptions.
"""
import os
import shutil
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent
FUNCTIONS_DIR = REPO_ROOT / "Backend" / "functions"
SHARED_DIR = FUNCTIONS_DIR / "shared"


def get_all_lambda_dirs() -> list[Path]:
    """Return all directories that contain a lambda_function.py file."""
    return [
        p.parent
        for p in FUNCTIONS_DIR.rglob("lambda_function.py")
    ]


def copy_shared_to_lambda(lambda_dir: Path) -> None:
    """Copy the shared/ directory into the given Lambda folder."""
    dest = lambda_dir / "shared"
    if dest.exists():
        shutil.rmtree(dest)
    shutil.copytree(SHARED_DIR, dest)
    print(f"  [OK] Copied shared/ -> {lambda_dir.relative_to(REPO_ROOT)}/shared/")


def main() -> None:
    print("Bundling shared utilities into Lambda functions...")
    lambda_dirs = get_all_lambda_dirs()

    for lambda_dir in lambda_dirs:
        # Skip if this IS the shared directory itself
        if lambda_dir == SHARED_DIR:
            continue
        copy_shared_to_lambda(lambda_dir)

    print(f"\nDone. Bundled shared/ into {len(lambda_dirs)} Lambda function(s).")


if __name__ == "__main__":
    main()
