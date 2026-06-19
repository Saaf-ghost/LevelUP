# How to Run LevelUP

Follow these direct and concise steps to get the full application (Database, Backend, and Frontend) running smoothly on your local machine.

### Prerequisites
Make sure you have installed:
- **Docker & Docker Compose** (for the database)
- **Java 21** (for the Spring Boot backend)
- **Node.js & npm** (for the Vite React frontend)

---

### Step 1: Start the Database (PostgreSQL)
The application relies on a PostgreSQL database containerized with Docker.

1. Open your terminal at the **root** of the project (`LevelUP` folder).
2. Start the database in the background:
   ```bash
   docker-compose up -d
   ```
*(This spins up the database container and maps it to port `55432` on your machine, as defined in `docker-compose.yml`.)*

---

### Step 2: Start the Backend (Spring Boot)
The backend is built with Spring Boot and managed with Maven.

1. Open a **new terminal** and navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Run the application using the included Maven wrapper:
   ```bash
   ./mvnw spring-boot:run
   ```
   *(On Windows Command Prompt, use `mvnw spring-boot:run`)*

*(The backend will launch on port **8082** by default and automatically connect to your PostgreSQL database).*

---

### Step 3: Start the Frontend (React / Vite)
The frontend is a React application powered by Vite and Tailwind CSS.

1. Open a **new terminal** and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install the required Node dependencies (only needed the first time):
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
*(The application will be accessible in your browser at **http://localhost:5173**).*

---

### 💡 Important Note on Environment Variables
The project uses a `.env` file at the root level for configuration. 
- If the frontend fails to connect to the backend, ensure your `.env` file is loaded or copy it into the `frontend/` directory so Vite can read the `VITE_API_BASE_URL`.
- If the backend fails to connect to the database, verify that the `DB_URL` corresponds to `jdbc:postgresql://localhost:55432/levelup`.
