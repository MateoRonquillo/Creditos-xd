# Creditos-xd

Plataforma de simulacion de creditos compuesta por microservicios .NET, un API Gateway y una interfaz React para probar los endpoints.

## Accesos locales

- Frontend y panel de pruebas: `http://localhost:3000`
- API Gateway: `http://localhost:8080`

## Documentacion

Consulta la documentacion completa por servicio en [`/docs`](docs/README.md):

- Gateway y health checks
- AuthService
- CreditService
- SimulationService
- DocumentService

## Inicio rapido

```bash
docker compose up -d --build
```

Para detener el stack:

```bash
docker compose down
```
