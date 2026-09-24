# Documentacion de la API

Para entender la arquitectura completa, el funcionamiento interno y la conexion entre frontend, microservicios y bases de datos, consulta la [guia de arquitectura](architecture.md).

La API se consume normalmente a traves del gateway:

```text
http://localhost:8080
```

Las rutas funcionales de los microservicios se exponen bajo `/api`. Los endpoints protegidos esperan:

```http
Authorization: Bearer <token>
```

## Guias por servicio

- [Gateway y health checks](gateway.md)
- [AuthService](auth.md)
- [CreditService](credits.md)
- [SimulationService](simulations.md)
- [DocumentService](documents.md)

## Flujo recomendado

1. Registrar un usuario con `POST /api/auth/register`.
2. Usar el `token` de la respuesta para las llamadas protegidas.
3. Crear un credito con `POST /api/credits` o simular directamente con datos.
4. Crear una simulacion con `POST /api/simulations`.
5. Consultar el historial o descargar el CSV de la simulacion.

La interfaz de prueba esta disponible en `http://localhost:3000` cuando el stack de Docker esta levantado.
