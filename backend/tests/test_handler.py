import pytest
import json
import base64
import os
from unittest.mock import patch
from moto import mock_aws
import boto3
from botocore.exceptions import ClientError

# Import the handler from your lambda_function.py
import lambdas.lambda_function
from lambdas.lambda_function import handler, S3_BUCKET_NAME, DYNAMODB_TABLE_NAME

# Mock environment variables for testing
os.environ["S3_BUCKET_NAME"] = "test-user-documents"
os.environ["DYNAMODB_TABLE_NAME"] = "test_user_documents"

@pytest.fixture(scope="function")
def aws_credentials():
    """Mocked AWS Credentials for moto."""
    os.environ["AWS_ACCESS_KEY_ID"] = "testing"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
    os.environ["AWS_SECURITY_TOKEN"] = "testing"
    os.environ["AWS_SESSION_TOKEN"] = "testing"
    os.environ["AWS_DEFAULT_REGION"] = "us-east-1"

@pytest.fixture(scope="function")
def s3_and_dynamodb(aws_credentials):
    with mock_aws():
        # Setup S3
        s3_client_mock = boto3.client("s3", region_name="us-east-1")
        s3_client_mock.create_bucket(Bucket=S3_BUCKET_NAME)

        # Setup DynamoDB
        dynamodb_client_mock = boto3.client("dynamodb", region_name="us-east-1")
        dynamodb_client_mock.create_table(
            TableName=DYNAMODB_TABLE_NAME,
            KeySchema=[
                {"AttributeName": "user_id", "KeyType": "HASH"},
                {"AttributeName": "uploaded_at", "KeyType": "RANGE"}
            ],
            AttributeDefinitions=[
                {"AttributeName": "user_id", "AttributeType": "S"},
                {"AttributeName": "uploaded_at", "AttributeType": "S"},
                {"AttributeName": "document_type", "AttributeType": "S"}
            ],
            ProvisionedThroughput={"ReadCapacityUnits": 1, "WriteCapacityUnits": 1},
            GlobalSecondaryIndexes=[
                {
                    "IndexName": "DocumentTypeIndex",
                    "KeySchema": [
                        {"AttributeName": "user_id", "KeyType": "HASH"},
                        {"AttributeName": "document_type", "KeyType": "RANGE"}
                    ],
                    "Projection": {"ProjectionType": "ALL"},
                    "ProvisionedThroughput": {"ReadCapacityUnits": 1, "WriteCapacityUnits": 1}
                }
            ]
        )

        # Re-initialize the module-level clients in lambda_function.py
        # This ensures they pick up the mocked AWS environment
        from lambdas.lambda_function import s3_client, dynamodb_resource, dynamodb_table, AWS_REGION
        lambdas.lambda_function.s3_client = boto3.client("s3", region_name=AWS_REGION)
        lambdas.lambda_function.dynamodb_resource = boto3.resource("dynamodb", region_name=AWS_REGION)
        lambdas.lambda_function.dynamodb_table = lambdas.lambda_function.dynamodb_resource.Table(DYNAMODB_TABLE_NAME)
        yield

def create_upload_event(user_id, document_type, file_content_str):
    return {
        "httpMethod": "POST",
        "path": "/documents",
        "body": json.dumps({
            "user_id": user_id,
            "document_type": document_type,
            "file_content": base64.b64encode(file_content_str.encode("utf-8")).decode("utf-8")
        })
    }

def create_get_event(user_id, document_type):
    return {
        "httpMethod": "GET",
        "path": f"/documents/{user_id}/{document_type}"
    }

# Test cases

def test_upload_valid_document(s3_and_dynamodb):
    event = create_upload_event("user123", "cedula", "Contenido de la cédula")
    response = handler(event, None)

    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["message"] == "Documento subido exitosamente"
    assert "s3_key" in body

    # Verify S3 content
    s3_client = boto3.client("s3", region_name="us-east-1")
    s3_object = s3_client.get_object(Bucket=S3_BUCKET_NAME, Key=body["s3_key"])
    assert s3_object["Body"].read().decode("utf-8") == "Contenido de la cédula"

    # Verify DynamoDB metadata
    dynamodb_resource = boto3.resource("dynamodb", region_name="us-east-1")
    table = dynamodb_resource.Table(DYNAMODB_TABLE_NAME)
    db_response = table.get_item(Key={"user_id": "user123", "uploaded_at": json.loads(response["body"])["s3_key"].split('/')[1].split('_')[0] + "T00:00:00Z"}) # Simplified for test
    # Note: The uploaded_at in the actual lambda uses isoformat with seconds, which is more precise.
    # For testing, we might need to adjust how we retrieve or compare.
    # A better approach for testing would be to query by user_id and document_type and then check the latest.
    # For now, let's just check if an item exists for the user_id.
    db_response = table.query(
        KeyConditionExpression="user_id = :uid",
        ExpressionAttributeValues={":uid": "user123"}
    )
    assert len(db_response["Items"]) > 0
    assert db_response["Items"][0]["document_type"] == "cedula"
    assert db_response["Items"][0]["s3_key"] == body["s3_key"]


def test_upload_payload_malformed(s3_and_dynamodb):
    # Missing user_id
    event = create_upload_event(None, "cedula", "Contenido")
    response = handler(event, None)
    assert response["statusCode"] == 400
    assert "Payload malformado" in json.loads(response["body"])["message"]

    # Missing file_content
    event = {
        "httpMethod": "POST",
        "path": "/documents",
        "body": json.dumps({
            "user_id": "user123",
            "document_type": "cedula",
            "file_content": "" # Empty content is also considered malformed for this check
        })
    }
    response = handler(event, None)
    assert response["statusCode"] == 400
    assert "Payload malformado" in json.loads(response["body"])["message"]

    # Invalid JSON
    event = {
        "httpMethod": "POST",
        "path": "/documents",
        "body": "not a valid json"
    }
    response = handler(event, None)
    assert response["statusCode"] == 400
    assert "Payload malformado" in json.loads(response["body"])["message"]

    # Invalid base64
    event = {
        "httpMethod": "POST",
        "path": "/documents",
        "body": json.dumps({
            "user_id": "user123",
            "document_type": "cedula",
            "file_content": "not-base64-$$$"
        })
    }
    response = handler(event, None)
    assert response["statusCode"] == 400
    assert "Payload inválido" in json.loads(response["body"])["message"]


@patch("lambdas.lambda_function.s3_client")
def test_upload_error_s3(mock_s3_client, s3_and_dynamodb):
    mock_s3_client.put_object.side_effect = ClientError({"Error": {"Code": "500", "Message": "S3 error"}}, "PutObject")
    event = create_upload_event("user123", "cedula", "Contenido")
    response = handler(event, None)
    assert response["statusCode"] == 500
    assert "Error al guardar el documento en S3" in json.loads(response["body"])["message"]


@patch("lambdas.lambda_function.dynamodb_table")
def test_upload_error_dynamodb(mock_dynamodb_table, s3_and_dynamodb):
    mock_dynamodb_table.put_item.side_effect = ClientError({"Error": {"Code": "500", "Message": "DynamoDB error"}}, "PutItem")
    event = create_upload_event("user123", "cedula", "Contenido")
    response = handler(event, None)
    assert response["statusCode"] == 500
    assert "Error al guardar la metadata en DynamoDB" in json.loads(response["body"])["message"]


def test_get_existing_document(s3_and_dynamodb):
    # First, upload a document
    upload_event = create_upload_event("user456", "pasaporte", "Contenido del pasaporte")
    upload_response = handler(upload_event, None)
    assert upload_response["statusCode"] == 200

    # Then, try to retrieve it
    get_event = create_get_event("user456", "pasaporte")
    get_response = handler(get_event, None)

    assert get_response["statusCode"] == 200
    body = json.loads(get_response["body"])
    assert body["user_id"] == "user456"
    assert body["document_type"] == "pasaporte"
    decoded_content = base64.b64decode(body["file_content_base64"]).decode("utf-8")
    assert decoded_content == "Contenido del pasaporte"


def test_get_non_existing_document(s3_and_dynamodb):
    event = create_get_event("nonexistent_user", "cedula")
    response = handler(event, None)
    assert response["statusCode"] == 404
    assert "Documento no encontrado" in json.loads(response["body"])["message"]

def test_get_document_s3_key_not_found(s3_and_dynamodb):
    # Upload a document
    upload_event = create_upload_event("user789", "licencia", "Contenido de la licencia")
    upload_response = handler(upload_event, None)
    assert upload_response["statusCode"] == 200
    s3_key = json.loads(upload_response["body"])["s3_key"]

    # Manually delete the object from S3 to simulate S3 key not found
    s3_client = boto3.client("s3", region_name="us-east-1")
    s3_client.delete_object(Bucket=S3_BUCKET_NAME, Key=s3_key)

    # Try to retrieve it
    get_event = create_get_event("user789", "licencia")
    get_response = handler(get_event, None)

    assert get_response["statusCode"] == 404
    assert "Archivo en S3 no encontrado" in json.loads(get_response["body"])["message"]

def test_get_document_invalid_path():
    event = {
        "httpMethod": "GET",
        "path": "/documents/user123" # Missing document_type
    }
    response = handler(event, None)
    assert response["statusCode"] == 400
    assert "Ruta inválida" in json.loads(response["body"])["message"]
