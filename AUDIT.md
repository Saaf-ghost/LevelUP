# Project Audit Report

This document outlines the current problems and potential issues that may prevent the LevelUP project from running perfectly, especially as it scales or moves towards deployment.

## 1. Frontend Configuration & Hardcoded API URL
- **Problem:** The Vite frontend currently ignores the `.env` file located at the project root because Vite only looks for `.env` files within its own directory (`frontend/`) by default. Consequently, the API base URL is hardcoded in `frontend/src/api/axios.ts` as `http://localhost:8082/api`.
- **Potential Impact:** If the backend port changes or if the application is deployed to production, the frontend source code must be manually altered. This defeats the purpose of environment variables.
- **Recommended Fix:** 
  1. Add `envDir: '../'` to the `defineConfig` in `frontend/vite.config.ts`.
  2. Update `axios.ts` to use `import.meta.env.VITE_API_BASE_URL` instead of the hardcoded string.

## 2. Conflicting Port Specifications in `.env`
- **Problem:** The `.env` file specifies `VITE_API_BASE_URL=http://localhost:8080/api` (port 8080). However, the Spring Boot backend defaults to port `8082` (via `application.properties`), and no `PORT` environment variable is provided to override it.
- **Potential Impact:** If the frontend is fixed to actually use the `.env` file, it will suddenly break because it will try to hit port `8080` while the backend is running on `8082`.
- **Recommended Fix:** Change `VITE_API_BASE_URL` in the `.env` file to `http://localhost:8082/api` to align with the backend's actual port.

## 3. Frontend Bundle Size (Performance)
- **Problem:** Running the production build for the frontend (`npm run build`) results in the warning: `(!) Some chunks are larger than 500 kB after minification.`
- **Potential Impact:** A monolithic JavaScript bundle increases the initial load time of the application, leading to a degraded user experience, particularly on slower networks.
- **Recommended Fix:** Implement route-level code splitting using `React.lazy()` and `Suspense` so that only the necessary code is loaded for the active page.

## 4. Hardcoded Database Credentials in Docker Compose
- **Problem:** The `docker-compose.yml` explicitly hardcodes `POSTGRES_USER: levelup` and `POSTGRES_PASSWORD: levelup`.
- **Potential Impact:** If these configurations are accidentally used in a public or production environment, the database is highly vulnerable to unauthorized access.
- **Recommended Fix:** Update `docker-compose.yml` to read these values from the `.env` file (e.g., `${DB_USERNAME}` and `${DB_PASSWORD}`).

## 5. Weak Default JWT Secret
- **Problem:** The `.env` file and `application.properties` use a placeholder JWT secret (`change-this-development-jwt-secret-at-least-32-chars`).
- **Potential Impact:** This is acceptable for local development but represents a critical vulnerability if deployed to an exposed environment.
- **Recommended Fix:** Ensure your deployment pipeline securely injects a strong, cryptographically random `JWT_SECRET`.
