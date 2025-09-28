import json
import base64
import os
import datetime
import boto3
from botocore.exceptions import ClientError

# Environment variables (for local testing/mocking)
S3_BUCKET_NAME = os.environ.get("S3_BUCKET_NAME", "user-documents")
DYNAMODB_TABLE_NAME = os.environ.get("DYNAMODB_TABLE_NAME", "user_documents")

AWS_REGION = os.environ.get("AWS_DEFAULT_REGION", "us-east-1")
s3_client = boto3.client("s3", region_name=AWS_REGION)
dynamodb_resource = boto3.resource("dynamodb", region_name=AWS_REGION)
dynamodb_table = dynamodb_resource.Table(DYNAMODB_TABLE_NAME)

def handler(event, context):
    """
    Main handler for the Lambda function.
    Routes requests based on HTTP method and path.
    """
    http_method = event.get("httpMethod")
    path = event.get("path")

    if http_method == "POST" and path == "/documents":
        return upload_document(event)
    elif http_method == "GET" and path.startswith("/documents/"):
        return get_document(event)
    else:
        return {
            "statusCode": 404,
            "body": json.dumps({"message": "Not Found"})
        }

def upload_document(event):
    """
    Handles POST /documents requests to upload a document.
    """
    try:
        body = json.loads(event.get("body", "{}"))
        user_id = body.get("user_id")
        document_type = body.get("document_type")
        file_content_base64 = body.get("file_content")

        if not all([user_id, document_type, file_content_base64]):
            return {
                "statusCode": 400,
                "body": json.dumps({"message": "Payload malformado: user_id, document_type y file_content son requeridos."})
            }

        try:
            file_content = base64.b64decode(file_content_base64)
        except Exception:
            return {
                "statusCode": 400,
                "body": json.dumps({"message": "Payload inválido: file_content no es un base64 válido."})
            }

        timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
        s3_key = f"{user_id}/{timestamp.split('T')[0]}_{document_type}.pdf" # Using date part for simplicity in key

        # Upload to S3
        try:
            s3_client.put_object(Bucket=S3_BUCKET_NAME, Key=s3_key, Body=file_content, ContentType="application/pdf")
        except ClientError as e:
            print(f"Error uploading to S3: {e}")
            return {
                "statusCode": 500,
                "body": json.dumps({"message": "Error al guardar el documento en S3."})
            }

        # Persist metadata to DynamoDB
        metadata = {
            "user_id": user_id,
            "document_type": document_type,
            "s3_key": s3_key,
            "uploaded_at": timestamp
        }
        try:
            dynamodb_table.put_item(Item=metadata)
        except ClientError as e:
            print(f"Error saving metadata to DynamoDB: {e}")
            return {
                "statusCode": 500,
                "body": json.dumps({"message": "Error al guardar la metadata en DynamoDB."})
            }

        return {
            "statusCode": 200,
            "body": json.dumps({"message": "Documento subido exitosamente", "s3_key": s3_key})
        }

    except json.JSONDecodeError:
        return {
            "statusCode": 400,
            "body": json.dumps({"message": "Payload malformado: El cuerpo de la solicitud no es un JSON válido."})
        }
    except Exception as e:
        print(f"Unexpected error in upload_document: {e}")
        return {
            "statusCode": 500,
            "body": json.dumps({"message": "Error interno del servidor."})
        }

def get_document(event):
    """
    Handles GET /documents/{user_id}/{document_type} requests to retrieve a document.
    """
    try:
        path_parts = event.get("path").split("/")
        if len(path_parts) < 4:
            return {
                "statusCode": 400,
                "body": json.dumps({"message": "Ruta inválida. Formato esperado: /documents/{user_id}/{document_type}"})
            }
        user_id = path_parts[2]
        document_type = path_parts[3]

        # Query DynamoDB for the latest document
        response = dynamodb_table.query(
            IndexName="DocumentTypeIndex", # Use the GSI
            KeyConditionExpression="user_id = :uid AND document_type = :dtype",
            ExpressionAttributeValues={
                ":uid": user_id,
                ":dtype": document_type
            },
            Limit=1,
            ScanIndexForward=False # Get the latest item
        )
        items = response.get("Items")

        if not items:
            return {
                "statusCode": 404,
                "body": json.dumps({"message": "Documento no encontrado."})
            }

        latest_document = items[0]
        s3_key = latest_document["s3_key"]

        # Retrieve from S3
        try:
            s3_object = s3_client.get_object(Bucket=S3_BUCKET_NAME, Key=s3_key)
            file_content = s3_object["Body"].read()
            file_content_base64 = base64.b64encode(file_content).decode("utf-8")
        except ClientError as e:
            if e.response["Error"]["Code"] == "NoSuchKey":
                print(f"S3 object not found for key: {s3_key}")
                return {
                    "statusCode": 404,
                    "body": json.dumps({"message": "Archivo en S3 no encontrado, pero la metadata existe."})
                }
            print(f"Error retrieving from S3: {e}")
            return {
                "statusCode": 500,
                "body": json.dumps({"message": "Error al recuperar el documento de S3."})
            }

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json"
            },
            "body": json.dumps({
                "user_id": user_id,
                "document_type": document_type,
                "uploaded_at": latest_document["uploaded_at"],
                "file_content_base64": file_content_base64
            })
        }

    except Exception as e:
        print(f"Unexpected error in get_document: {e}")
        return {
            "statusCode": 500,
            "body": json.dumps({"message": "Error interno del servidor."})
        }
