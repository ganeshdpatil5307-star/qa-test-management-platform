# QA Testing App

QA testing application with a Spring Boot backend and React/Vite frontend.

- Backend: `backend/`, Java 17, Maven, Spring Data JPA, and MySQL
- Frontend: `frontend/`, React, Vite, Axios, and React Router

## Prerequisites

- Java 17
- Maven 3.9+
- Docker Desktop (for the included MySQL container)

## Run

Start MySQL from the repository root:

```powershell
docker compose up -d mysql
```

Start the backend:

```powershell
Push-Location backend
mvn spring-boot:run
Pop-Location
```

Start the frontend in a second terminal:

```powershell
Push-Location frontend
npm ci
npm run dev
Pop-Location
```

Verify the application:

```powershell
Invoke-RestMethod http://localhost:8080/api/health
```

Expected response:

```json
{"status":"UP"}
```

The backend datasource can be overridden with `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, and `SPRING_DATASOURCE_PASSWORD`. Production also requires `JWT_SECRET` and `APP_CORS_ALLOWED_ORIGINS`. The frontend production API base URL is configured with `VITE_API_URL`.

## Package Layout

- `backend/src`: Spring Boot source and tests
- `backend/pom.xml`: Maven build descriptor
- `frontend`: React/Vite application
- `.github/workflows`: backend and frontend CI

- `controller`: HTTP endpoints
- `service`: application and business logic
- `repository`: Spring Data persistence interfaces
- `entity`: JPA entities
- `dto`: API data-transfer objects
- `exception`: domain exceptions and REST exception handling
- `config`: application configuration
