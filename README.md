# No Limits for Deaf Children

Platform for managing education centers, students, teachers, parents, and schedules for a non-profit organization helping deaf children speak, learn, and dream.

## Prerequisites

- Node.js v18 or higher
- npm v10.9.2 or higher
- Docker & Docker Compose (for local database and S3)

## Quick Start (Local Development)

### 1. Start Infrastructure Services

```bash
# Start PostgreSQL database and MinIO (S3-compatible storage)
docker-compose up db minio minio-init -d
```

This starts:

| Service | URL | Credentials |
|---------|-----|-------------|
| PostgreSQL | `localhost:5432` | user: `user`, password: `password`, database: `database` |
| MinIO S3 API | `localhost:9000` | access key: `minioadmin`, secret: `minioadmin` |
| MinIO Console | `localhost:9001` | login: `minioadmin` / `minioadmin` |

### 2. Configure Environment Variables

```bash
# API configuration
cp apps/api/.env.example apps/api/.env

# Web configuration  
cp apps/web/.env.example apps/web/.env
```

The default `.env.example` files are pre-configured for local development with:
- Better Auth email/password authentication
- Local PostgreSQL connection
- Local MinIO S3 storage

Configure Better Auth in `apps/api/.env`:

```bash
BETTER_AUTH_URL=https://your-api-domain
BETTER_AUTH_SECRET=replace-with-32-byte-random-secret
BOOTSTRAP_ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Database Migrations

```bash
cd apps/api
npm run db:migrate
cd ../..
```

### 5. Start Development Servers

```bash
npm run dev
```

This starts:
- **API** at http://localhost:3000
- **Web** at http://localhost:5173

## Docker Compose Services

| Service | Port(s) | Description |
|---------|---------|-------------|
| `db` | 5432 | PostgreSQL 16 database |
| `minio` | 9000, 9001 | MinIO S3-compatible storage |
| `minio-init` | - | One-time bucket initialization |

### Common Commands

```bash
# Start infrastructure (recommended for local dev)
docker-compose up db minio minio-init -d

# View logs
docker-compose logs -f db

# Stop all services
docker-compose down

# Stop and remove volumes (reset data)
docker-compose down -v
```

## Production Deployment

The application is designed to deploy on DigitalOcean (or similar platforms):

| Component | Service | Notes |
|-----------|---------|-------|
| **API** | App Platform (Web Service) | Docker build from `apps/api/Dockerfile` |
| **Web** | App Platform (Static Site) | Build: `npm run build`, Output: `dist/` |
| **Database** | Managed PostgreSQL | PostgreSQL 16 recommended |
| **File Storage** | Spaces (S3-compatible) | For document uploads |

### Deployment Notes

- **API**: Uses the Dockerfile at `apps/api/Dockerfile` with tsx runtime
- **Web**: No Dockerfile needed - use static site hosting with:
  - Source Directory: `apps/web`
  - Build Command: `npm install && npm run build`
  - Output Directory: `dist`
- **Migrations**: Run `npm run db:migrate` with production `POSTGRES_URI` after first deployment

## Database Commands

Run these from the `apps/api` directory:

```bash
npm run db:generate  # Generate migrations from schema changes
npm run db:migrate   # Apply pending migrations
npm run db:studio    # Open Drizzle Studio UI
```

## Project Structure

```
├── apps/
│   ├── api/          # Express backend (routing-controllers, drizzle-orm)
│   └── web/          # React frontend (Vite, MUI, React Query)
├── docs/             # Business documentation
├── docker-compose.yml
└── turbo.json        # TurboRepo configuration
```

See `AGENTS.md` for detailed architecture documentation.

## Windows Installation

If you encounter errors related to optional dependencies (e.g., `@rollup/rollup-win32-x64-msvc`):

1. **Clean installation:**
   ```bash
   # Remove existing dependencies
   rm -rf node_modules apps/*/node_modules
   rm -f package-lock.json apps/*/package-lock.json
   ```

2. **Reinstall dependencies:**
   ```bash
   npm install
   ```

3. **Run the application:**
   ```bash
   npm run dev
   ```

**Note:** The `.npmrc` file in the root directory is configured to handle optional dependencies correctly on all platforms. If you still encounter issues, ensure you're using npm v10.9.2 or higher by running `npm --version`.
