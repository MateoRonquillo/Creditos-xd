# CreditService

Rutas publicadas bajo `/api/credits`. Todas requieren `Authorization: Bearer <jwt>` y solo operan sobre los creditos del usuario autenticado.

## Modelo de credito

```json
{"name":"Credito personal","amount":10000,"annualInterestRate":18,"termMonths":12,"amortizationType":"french"}
```

`amount` debe ser mayor que cero, `annualInterestRate` no puede ser negativa y `termMonths` debe ser mayor que cero. `amortizationType` acepta `french`/`frances`/`francesa` o `german`/`aleman`/`alemana`; la respuesta lo normaliza a `french` o `german`.

## `GET /api/credits`

Lista los creditos del usuario, ordenados del mas reciente al mas antiguo.

Respuesta `200`: arreglo de creditos.

## `GET /api/credits/{id}`

Obtiene un credito por UUID. Responde `200`, `401` sin token o `404` si no pertenece al usuario o no existe.

## `POST /api/credits`

Crea un credito.

Respuesta `201`: credito creado con `id`, `userId` y `createdAtUtc`.

Respuesta `400` si falla la validacion.

## `PUT /api/credits/{id}`

Actualiza nombre, monto, tasa, plazo y tipo de amortizacion. Responde `200` con el credito actualizado o `404` si no existe para el usuario.

## `DELETE /api/credits/{id}`

Elimina un credito. Responde `204` si se elimino o `404` si no existe para el usuario.
