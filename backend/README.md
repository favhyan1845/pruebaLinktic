# Prueba Linktic Backend

Este es el repositorio del backend para la prueba técnica de Linktic.

## Descripción

Este proyecto implementa la Parte 2 del backend de la prueba técnica de Linktic, utilizando Python Lambda, S3 y DynamoDB.

### Objetivo
Diseñar una Lambda en Python 3.11 que maneje documentos de usuarios dentro de una VPC privada usando solo VPC Endpoints (sin NAT Gateway).
No es necesario desplegar en AWS. Se evaluará el código, la estructura del paquete y las pruebas automatizadas. El uso de moto/boto3 mocks es suficiente para simular S3 y DynamoDB.

### Requerimiento funcional

#### 1. Subir documento (POST /documents)
La Lambda debe:
- **Validar datos:**
    - Payload malformado → retornar 400.
- **Procesar archivo:**
    - Decodificar base64.
    - Guardar en S3 bajo: `s3://user-documents/{user_id}/{timestamp}_{document_type}.pdf`
- **Persistir metadata en DynamoDB (user_documents):**
    ```json
    {
      "user_id": "123",
      "document_type": "cedula",
      "s3_key": "123/2025-09-24_cedula.pdf",
      "uploaded_at": "2025-09-24T14:22:00Z"
    }
    ```
- **Errores:**
    - Payload inválido → 400.
    - Error en S3/Dynamo → 500 + log en CloudWatch.

#### 2. Consultar documento (GET /documents/{user_id}/{document_type})
La Lambda debe:
- Buscar en DynamoDB el último documento del usuario con ese `document_type`.
- Si existe, traer el archivo desde S3 y retornarlo en base64.
- Si no existe → retornar 404.

### Restricciones técnicas
- **Sin NAT Gateway:** solo VPC Endpoints (S3 + DynamoDB).
- Evitar dependencias innecesarias (ej: no pandas).
- Empaquetar con `requirements.txt` + `lambda_function.py`.

### Entregables
- Código en `/backend/lambdas/`.
- `README.md` con instrucciones para probar localmente con `pytest` + mocks (`moto`, `boto3`).
- Pruebas unitarias en `tests/test_handler.py` que validen:
    - Upload válido.
    - Payload inválido.
    - Error en S3/Dynamo.
    - Consulta de documento existente.
    - Consulta de documento inexistente (404).

## Instalación

Para instalar las dependencias del proyecto, ejecuta:

```bash
pip install -r requirements.txt
```

## Uso

Para probar localmente con `pytest` y mocks (`moto`, `boto3`), ejecuta:

```bash
pytest tests/test_handler.py
```

## Uso

Para iniciar el servidor de desarrollo, ejecuta:

```bash
npm start
```

## Tecnologías

- Python 3.11
- AWS Lambda
- Amazon S3
- Amazon DynamoDB
- `boto3` (para interacción con AWS)
- `moto` (para mocking de AWS en pruebas)
- `pytest` (para pruebas unitarias)
- `base64` (para codificación/decodificación de archivos)

## Contribución

Si deseas contribuir a este proyecto, por favor, sigue los siguientes pasos:

1. Haz un fork del repositorio.
2. Crea una nueva rama (`git checkout -b feature/nueva-funcionalidad`).
3. Realiza tus cambios y haz commit (`git commit -am 'feat: Añadir nueva funcionalidad'`).
4. Sube tus cambios a tu fork (`git push origin feature/nueva-funcionalidad`).
5. Abre un Pull Request.

## Licencia

(Especificar la licencia si aplica)
