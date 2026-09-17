# DocumentService

Rutas publicadas bajo `/api/documents`.

## `GET /api/documents/simulations/{simulationId}`

Genera y descarga un reporte CSV de una simulacion.

Header recomendado:

```http
Authorization: Bearer <jwt>
```

El servicio consulta la simulacion en SimulationService reenviando ese token, por lo que la simulacion debe pertenecer al usuario autenticado.

Respuesta `200`:

- Content-Type: `text/csv`
- Nombre: `simulacion-{id}.csv`
- Incluye datos generales y las columnas `Periodo,Pago,Capital,Interes,Saldo`.

Respuesta `404` si la simulacion no existe, no es accesible o SimulationService no responde.

Ejemplo con curl:

```bash
curl -L \
  -H "Authorization: Bearer <jwt>" \
  "http://localhost:8080/api/documents/simulations/<simulation-uuid>" \
  -o simulacion.csv
```
