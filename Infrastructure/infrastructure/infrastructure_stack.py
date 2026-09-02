"""
MediTrack CDK Infrastructure Stack

Provisions all AWS resources for the MediTrack medical tracking platform:
  - Amazon Cognito User Pool (authentication)
  - Amazon DynamoDB tables (profiles, medications, appointments, vitals)
  - Amazon S3 Bucket (encrypted medical records & document storage)
  - AWS Lambda functions (CRUD operations & pre-signed URL generation)
  - Amazon API Gateway REST API with Cognito authorisation & Gateway CORS responses
  - Amazon CloudWatch Log Groups for each Lambda

Resource naming follows the pattern MediTrack<Domain><Resource>.
Every user's data is strictly partitioned by Cognito `userId` (sub) across DynamoDB keys and S3 prefixes.
"""
from aws_cdk import (
    Duration,
    RemovalPolicy,
    Stack,
    CfnOutput,
    aws_dynamodb as dynamodb,
    aws_apigateway as apigateway,
    aws_lambda as lambda_,
    aws_cognito as cognito,
    aws_s3 as s3,
    aws_logs as logs,
)
from constructs import Construct


def make_lambda(
    scope: Stack,
    construct_id: str,
    handler_path: str,
    environment: dict,
    description: str = "",
) -> lambda_.Function:
    """Factory for MediTrack Lambda functions with 256MB RAM and 30s timeout."""
    log_group = logs.LogGroup(
        scope,
        f"{construct_id}LogGroup",
        log_group_name=f"/aws/lambda/MediTrack-{construct_id}",
        retention=logs.RetentionDays.TWO_WEEKS,
        removal_policy=RemovalPolicy.DESTROY,
    )

    return lambda_.Function(
        scope,
        construct_id,
        runtime=lambda_.Runtime.PYTHON_3_12,
        handler="lambda_function.lambda_handler",
        code=lambda_.Code.from_asset(handler_path),
        environment=environment,
        memory_size=256,
        timeout=Duration.seconds(30),
        description=description,
        log_group=log_group,
    )


class InfrastructureStack(Stack):
    """
    Single CDK stack containing all MediTrack infrastructure.
    """

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # ------------------------------------------------------------------ #
        # S3 Bucket for Medical Documents & Records                          #
        # ------------------------------------------------------------------ #
        records_bucket = s3.Bucket(
            self,
            "MediTrackRecordsBucket",
            bucket_name=None,  # Auto-generated unique name
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.RETAIN,
            cors=[
                s3.CorsRule(
                    allowed_methods=[
                        s3.HttpMethods.GET,
                        s3.HttpMethods.PUT,
                        s3.HttpMethods.POST,
                        s3.HttpMethods.DELETE,
                        s3.HttpMethods.HEAD,
                    ],
                    allowed_origins=["*"],
                    allowed_headers=["*"],
                )
            ],
        )

        # ------------------------------------------------------------------ #
        # DynamoDB Tables (Partitioned by userId)                            #
        # ------------------------------------------------------------------ #

        profile_table = dynamodb.TableV2(
            self,
            "MediTrackProfileTable",
            table_name="MediTrackProfiles",
            partition_key=dynamodb.Attribute(
                name="userId",
                type=dynamodb.AttributeType.STRING,
            ),
            removal_policy=RemovalPolicy.RETAIN,
        )

        medications_table = dynamodb.TableV2(
            self,
            "MediTrackMedicationsTable",
            table_name="MediTrackMedications",
            partition_key=dynamodb.Attribute(
                name="userId",
                type=dynamodb.AttributeType.STRING,
            ),
            sort_key=dynamodb.Attribute(
                name="medicationId",
                type=dynamodb.AttributeType.STRING,
            ),
            removal_policy=RemovalPolicy.RETAIN,
        )

        appointments_table = dynamodb.TableV2(
            self,
            "MediTrackAppointmentsTable",
            table_name="MediTrackAppointments",
            partition_key=dynamodb.Attribute(
                name="userId",
                type=dynamodb.AttributeType.STRING,
            ),
            sort_key=dynamodb.Attribute(
                name="appointmentId",
                type=dynamodb.AttributeType.STRING,
            ),
            removal_policy=RemovalPolicy.RETAIN,
        )

        vitals_table = dynamodb.TableV2(
            self,
            "MediTrackVitalsTable",
            table_name="MediTrackVitals",
            partition_key=dynamodb.Attribute(
                name="userId",
                type=dynamodb.AttributeType.STRING,
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.STRING,
            ),
            removal_policy=RemovalPolicy.RETAIN,
        )

        # ------------------------------------------------------------------ #
        # Cognito User Pool                                                     #
        # ------------------------------------------------------------------ #

        user_pool = cognito.UserPool(
            self,
            "MediTrackUserPool",
            user_pool_name="MediTrackUsers",
            sign_in_aliases=cognito.SignInAliases(email=True),
            self_sign_up_enabled=True,
            auto_verify=cognito.AutoVerifiedAttrs(email=True),
            password_policy=cognito.PasswordPolicy(
                min_length=8,
                require_lowercase=True,
                require_uppercase=True,
                require_digits=True,
                require_symbols=False,
            ),
            account_recovery=cognito.AccountRecovery.EMAIL_ONLY,
            removal_policy=RemovalPolicy.RETAIN,
        )

        user_pool_client = user_pool.add_client(
            "MediTrackWebClient",
            auth_flows=cognito.AuthFlow(
                user_password=True,
                user_srp=True,
            ),
        )

        # ------------------------------------------------------------------ #
        # API Gateway                                                           #
        # ------------------------------------------------------------------ #

        api = apigateway.RestApi(
            self,
            "MediTrackApi",
            rest_api_name="MediTrack API",
            description="REST API for the MediTrack medical tracking platform",
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=apigateway.Cors.ALL_ORIGINS,
                allow_methods=apigateway.Cors.ALL_METHODS,
                allow_headers=[
                    "Content-Type",
                    "Authorization",
                    "X-Amz-Date",
                    "X-Api-Key",
                    "X-Amz-Security-Token",
                ],
            ),
            deploy_options=apigateway.StageOptions(
                stage_name="prod",
                throttling_rate_limit=100,
                throttling_burst_limit=200,
            ),
        )

        # Ensure Gateway 4xx & 5xx responses always return CORS headers
        api.add_gateway_response(
            "GatewayResponse4XX",
            type=apigateway.ResponseType.DEFAULT_4_XX,
            response_headers={
                "Access-Control-Allow-Origin": "'*'",
                "Access-Control-Allow-Headers": "'Content-Type,Authorization'",
                "Access-Control-Allow-Methods": "'GET,POST,PATCH,DELETE,OPTIONS'",
            },
        )
        api.add_gateway_response(
            "GatewayResponse5XX",
            type=apigateway.ResponseType.DEFAULT_5_XX,
            response_headers={
                "Access-Control-Allow-Origin": "'*'",
                "Access-Control-Allow-Headers": "'Content-Type,Authorization'",
                "Access-Control-Allow-Methods": "'GET,POST,PATCH,DELETE,OPTIONS'",
            },
        )

        authorizer = apigateway.CognitoUserPoolsAuthorizer(
            self,
            "MediTrackCognitoAuthorizer",
            cognito_user_pools=[user_pool],
        )

        def cognito_integration(fn: lambda_.Function) -> tuple:
            return (
                apigateway.LambdaIntegration(fn),
                {
                    "authorization_type": apigateway.AuthorizationType.COGNITO,
                    "authorizer": authorizer,
                },
            )

        # ------------------------------------------------------------------ #
        # Shared Lambda Environment Variables                                   #
        # ------------------------------------------------------------------ #

        base = "../Backend/functions"
        profile_env = {"PROFILE_TABLE_NAME": profile_table.table_name}
        med_env = {"MEDICATIONS_TABLE_NAME": medications_table.table_name}
        appt_env = {"APPOINTMENTS_TABLE_NAME": appointments_table.table_name}
        vitals_env = {"VITALS_TABLE_NAME": vitals_table.table_name}
        records_env = {"RECORDS_BUCKET_NAME": records_bucket.bucket_name}

        # ------------------------------------------------------------------ #
        # Profile Domain                                                        #
        # ------------------------------------------------------------------ #

        create_profile_fn = make_lambda(self, "CreateProfile", f"{base}/profile/create", profile_env, "Create patient profile")
        get_profile_fn = make_lambda(self, "GetProfile", f"{base}/profile/get", profile_env, "Get patient profile")
        update_profile_fn = make_lambda(self, "UpdateProfile", f"{base}/profile/update", profile_env, "Update patient profile")
        delete_profile_fn = make_lambda(self, "DeleteProfile", f"{base}/profile/delete", profile_env, "Delete patient profile")

        profile_table.grant_read_write_data(create_profile_fn)
        profile_table.grant_read_data(get_profile_fn)
        profile_table.grant_write_data(update_profile_fn)
        profile_table.grant_write_data(delete_profile_fn)

        profile_resource = api.root.add_resource("profile")
        integration, auth_opts = cognito_integration(create_profile_fn)
        profile_resource.add_method("POST", integration, **auth_opts)
        integration, auth_opts = cognito_integration(get_profile_fn)
        profile_resource.add_method("GET", integration, **auth_opts)
        integration, auth_opts = cognito_integration(update_profile_fn)
        profile_resource.add_method("PATCH", integration, **auth_opts)
        integration, auth_opts = cognito_integration(delete_profile_fn)
        profile_resource.add_method("DELETE", integration, **auth_opts)

        # ------------------------------------------------------------------ #
        # Medications Domain                                                    #
        # ------------------------------------------------------------------ #

        create_med_fn = make_lambda(self, "CreateMedication", f"{base}/medications/create", med_env, "Add medication")
        list_meds_fn = make_lambda(self, "ListMedications", f"{base}/medications/list", med_env, "List medications")
        update_med_fn = make_lambda(self, "UpdateMedication", f"{base}/medications/update", med_env, "Update medication")
        delete_med_fn = make_lambda(self, "DeleteMedication", f"{base}/medications/delete", med_env, "Delete medication")

        medications_table.grant_read_write_data(create_med_fn)
        medications_table.grant_read_data(list_meds_fn)
        medications_table.grant_write_data(update_med_fn)
        medications_table.grant_write_data(delete_med_fn)

        meds_resource = api.root.add_resource("medications")
        integration, auth_opts = cognito_integration(create_med_fn)
        meds_resource.add_method("POST", integration, **auth_opts)
        integration, auth_opts = cognito_integration(list_meds_fn)
        meds_resource.add_method("GET", integration, **auth_opts)

        med_id_resource = meds_resource.add_resource("{id}")
        integration, auth_opts = cognito_integration(update_med_fn)
        med_id_resource.add_method("PATCH", integration, **auth_opts)
        integration, auth_opts = cognito_integration(delete_med_fn)
        med_id_resource.add_method("DELETE", integration, **auth_opts)

        # ------------------------------------------------------------------ #
        # Appointments Domain                                                   #
        # ------------------------------------------------------------------ #

        create_appt_fn = make_lambda(self, "CreateAppointment", f"{base}/appointments/create", appt_env, "Schedule appt")
        list_appts_fn = make_lambda(self, "ListAppointments", f"{base}/appointments/list", appt_env, "List appts")
        update_appt_fn = make_lambda(self, "UpdateAppointment", f"{base}/appointments/update", appt_env, "Update appt")
        delete_appt_fn = make_lambda(self, "DeleteAppointment", f"{base}/appointments/delete", appt_env, "Delete appt")

        appointments_table.grant_read_write_data(create_appt_fn)
        appointments_table.grant_read_data(list_appts_fn)
        appointments_table.grant_write_data(update_appt_fn)
        appointments_table.grant_write_data(delete_appt_fn)

        appts_resource = api.root.add_resource("appointments")
        integration, auth_opts = cognito_integration(create_appt_fn)
        appts_resource.add_method("POST", integration, **auth_opts)
        integration, auth_opts = cognito_integration(list_appts_fn)
        appts_resource.add_method("GET", integration, **auth_opts)

        appt_id_resource = appts_resource.add_resource("{id}")
        integration, auth_opts = cognito_integration(update_appt_fn)
        appt_id_resource.add_method("PATCH", integration, **auth_opts)
        integration, auth_opts = cognito_integration(delete_appt_fn)
        appt_id_resource.add_method("DELETE", integration, **auth_opts)

        # ------------------------------------------------------------------ #
        # Vitals Domain                                                         #
        # ------------------------------------------------------------------ #

        log_vital_fn = make_lambda(self, "LogVital", f"{base}/vitals/log", vitals_env, "Log vital")
        list_vitals_fn = make_lambda(self, "ListVitals", f"{base}/vitals/list", vitals_env, "List vitals")
        delete_vital_fn = make_lambda(self, "DeleteVital", f"{base}/vitals/delete", vitals_env, "Delete vital")

        vitals_table.grant_read_write_data(log_vital_fn)
        vitals_table.grant_read_data(list_vitals_fn)
        vitals_table.grant_write_data(delete_vital_fn)

        vitals_resource = api.root.add_resource("vitals")
        integration, auth_opts = cognito_integration(log_vital_fn)
        vitals_resource.add_method("POST", integration, **auth_opts)
        integration, auth_opts = cognito_integration(list_vitals_fn)
        vitals_resource.add_method("GET", integration, **auth_opts)

        vital_ts_resource = vitals_resource.add_resource("{timestamp}")
        integration, auth_opts = cognito_integration(delete_vital_fn)
        vital_ts_resource.add_method("DELETE", integration, **auth_opts)

        # ------------------------------------------------------------------ #
        # Records Domain (S3 Document Upload Pre-signed URL)                   #
        # ------------------------------------------------------------------ #

        upload_url_fn = make_lambda(self, "GetUploadUrl", f"{base}/records/upload_url", records_env, "Get S3 upload URL")
        records_bucket.grant_read_write(upload_url_fn)

        records_resource = api.root.add_resource("records")
        upload_url_resource = records_resource.add_resource("upload-url")
        integration, auth_opts = cognito_integration(upload_url_fn)
        upload_url_resource.add_method("POST", integration, **auth_opts)

        # ------------------------------------------------------------------ #
        # CloudFormation Outputs                                                #
        # ------------------------------------------------------------------ #

        CfnOutput(self, "ApiUrl", value=api.url, description="MediTrack API Gateway base URL")
        CfnOutput(self, "UserPoolId", value=user_pool.user_pool_id, description="Cognito User Pool ID")
        CfnOutput(self, "UserPoolClientId", value=user_pool_client.user_pool_client_id, description="Cognito App Client ID")
        CfnOutput(self, "RecordsBucketName", value=records_bucket.bucket_name, description="S3 Medical Records bucket")
        CfnOutput(self, "ProfileTableName", value=profile_table.table_name)
        CfnOutput(self, "MedicationsTableName", value=medications_table.table_name)
        CfnOutput(self, "AppointmentsTableName", value=appointments_table.table_name)
        CfnOutput(self, "VitalsTableName", value=vitals_table.table_name)
