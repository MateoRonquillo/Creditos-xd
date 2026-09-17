# SimulationService

Rutas publicadas bajo `/api/simulations`. Todas requieren `Authorization: Bearer <jwt>`.

## `POST /api/simulations`

Genera una tabla de amortizacion y guarda la simulacion.

Ejemplo con datos directos:

```json
{"creditId":null,"amount":10000,"annualInterestRate":18,"termMonths":12,"amortizationType":"french"}
```

Ejemplo reutilizando un credito:

```json
{"creditId":"<credit-uuid>","amount":0,"annualInterestRate":0,"termMonths":0,"amortizationType":"french"}
```

Cuando `creditId` existe, el servicio obtiene el credito del CreditService y usa sus valores. Cuando no existe, valida directamente monto, tasa, plazo y amortizacion.

Respuesta `201`:

```json
{"id":"<uuid>","userId":"<uuid>","creditId":null,"amount":10000,"annualInterestRate":18,"termMonths":12,"amortizationType":"french","totalInterest":<number>,"totalPayment":<number>,"schedule":[{"period":1,"payment":<number>,"principal":<number>,"interest":<number>,"balance":<number>}],"createdAtUtc":"<date-time>"}
```

Errores: `400` por datos o amortizacion invalidos, `401` sin token y `404` si el credito indicado no existe.

## `GET /api/simulations/history`

Lista las simulaciones del usuario, ordenadas de la mas reciente a la mas antigua. Respuesta `200` con un arreglo.

## `GET /api/simulations/{id}`

Obtiene el detalle y tabla de amortizacion de una simulacion propia. Responde `200`, `401` sin token o `404` si no existe para el usuario.

## Estrategias

- `french`: cuota periodica estable con interes decreciente.
- `german`: amortizacion de capital constante y cuota decreciente.
