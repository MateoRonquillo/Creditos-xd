# Gateway y health checks

## Base URL

```text
http://localhost:8080
```

El gateway reenvia las peticiones `/api/{servicio}/{ruta}` a cada microservicio y conserva headers, query string, cuerpo y codigo de respuesta.

## `GET /health`

Comprueba que el API Gateway esta disponible.

Respuesta `200`:

```json
{"status":"ok","service":"api-gateway"}
```

## Health de servicios

El gateway traduce estas rutas a `/health` dentro del microservicio correspondiente:

| Endpoint | Servicio |
| --- | --- |
| `GET /api/auth/health` | AuthService |
| `GET /api/credits/health` | CreditService |
| `GET /api/simulations/health` | SimulationService |
| `GET /api/documents/health` | DocumentService |

No requieren autenticacion. Una respuesta correcta tiene `200` y el nombre del servicio en el JSON.

## Enrutamiento generico

Acepta `GET`, `POST`, `PUT`, `PATCH`, `DELETE` y `OPTIONS` en:

```text
/api/{service}/{path}
```

Servicios registrados: `auth`, `credits`, `simulations` y `documents`.
