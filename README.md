#Prueba Técnica – Plataforma Pensionados

dentro de cada folder se encuentra un archivo readme, donde se explica la ejecucion de cada proyecto.


El objetivo de esta prueba es evaluar tu capacidad para diseñar e implementar flujos de autenticación frontend y procesamiento seguro de documentos en backend. No buscamos que memorices comandos ni que montes infra completa en AWS: queremos ver criterio técnico, buenas prácticas de seguridad, y cómo estructuras tu código y tus pruebas. El entregable final debería ser un único repositorio dividido en carpetas.

#Parte 1 – Frontend (Next.js + Auth con Mock API)
Objetivo
Implementar un flujo de autenticación en Next.js 13+ (App Router) usando JWT, consumiendo un API Gateway simulado (mock, sin backend real).
Requerimientos funcionales
Login (/login):


Formulario con email y password.
Validación de campos en frontend.
Enviar credenciales a POST /users/login (mockeado con msw, json-server o un handler local).
Manejar expiración y refresco con POST /users/refresh.
Página protegida (/dashboard)

#Página de perfil (/me):
Consumir GET /users/me (mock).
Mostrar nombre, email y fecha de creación.
Permitir editar el nombre con PUT /users/me.

#Protección de rutas:
Implementar un middleware para restringir acceso directo a /dashboard y /me.

#Entregables
Código en /frontend.
Mock API incluida en el repo.
Instrucciones de ejecución en README.md.


#Parte 2 – Backend (Python Lambda + S3 + DynamoDB)
#Objetivo

Diseñar una Lambda en Python 3.11 que maneje documentos de usuarios dentro de una VPC privada usando solo VPC Endpoints (sin NAT Gateway).
No es necesario desplegar en AWS. Se evaluará el código, la estructura del paquete y las pruebas automatizadas. El uso de moto/boto3 mocks es suficiente para simular S3 y DynamoDB.
Requerimiento funcional

1. Subir documento (POST /documents)

La Lambda debe:
Validar datos:
Payload malformado → retornar 400.
Procesar archivo:
Decodificar base64.

Guardar en S3 bajo:

 s3://user-documents/{user_id}/{timestamp}_{document_type}.pdf

Persistir metadata en DynamoDB (user_documents):

 {
  "user_id": "123",
  "document_type": "cedula",
  "s3_key": "123/2025-09-24_cedula.pdf",
  "uploaded_at": "2025-09-24T14:22:00Z"
}
Errores:

Payload inválido → 400.
Error en S3/Dynamo → 500 + log en CloudWatch.

2. Consultar documento (GET /documents/{user_id}/{document_type})
La Lambda debe:
Buscar en DynamoDB el último documento del usuario con ese document_type.

Si existe, traer el archivo desde S3 y retornarlo en base64

Si no existe → retornar 404.

Restricciones técnicas
Sin NAT Gateway: solo VPC Endpoints (S3 + DynamoDB).

Evitar dependencias innecesarias (ej: no pandas).

Empaquetar con requirements.txt + lambda_function.py.

Entregables
Código en /backend/lambdas/.

README.md con instrucciones para probar localmente con pytest + mocks (moto, boto3).

Pruebas unitarias en tests/test_handler.py que validen:

Upload válido.

Payload inválido.

Error en S3/Dynamo.

Consulta de documento existente.

Consulta de documento inexistente (404).


