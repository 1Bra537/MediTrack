#!/usr/bin/env python3
import os

import aws_cdk as cdk

from infrastructure.infrastructure_stack import InfrastructureStack


try:
    import bundle_lambdas
    bundle_lambdas.main()
except Exception as err:
    print(f"Warning: Auto-bundling lambdas encountered issue: {err}")

app = cdk.App()
InfrastructureStack(
    app,
    "InfrastructureStack",
    env=cdk.Environment(
        account=os.getenv("CDK_DEFAULT_ACCOUNT"),
        region=os.getenv("CDK_DEFAULT_REGION"),
    ),
)

app.synth()
