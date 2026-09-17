# AuthService

Rutas publicadas bajo `/api/auth`.

## `POST /api/auth/register`

Registra un usuario y devuelve un token.

Cuerpo:

```json
{"name":"Ana Lopez","email":"ana@example.com","password":"secreto123"}
```

Reglas: nombre y email obligatorios; la contrasena debe tener al menos 6 caracteres; el email se normaliza a minusculas; no se permiten emails repetidos.

Respuesta `201`:

```json
{"token":"<jwt>","user":{"id":"<uuid>","name":"Ana Lopez","email":"ana@example.com","createdAtUtc":"<date-time>"}}
```

Respuesta `400` si los datos son invalidos o el email ya existe.

## `POST /api/auth/login`

Autentica un usuario existente.

Cuerpo:

```json
{"email":"ana@example.com","password":"secreto123"}
```

Respuesta `200`: mismo formato de token y usuario que `register`.

Respuesta `401` si las credenciales no son validas.

## `GET /api/auth/me`

Devuelve el usuario asociado al token.

Header requerido:

```http
Authorization: Bearer <jwt>
```

Respuesta `200`: objeto `user` sin contrasena.

Respuesta `401` si el token falta, es invalido o expiro.
