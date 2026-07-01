# CLAUDE.md — CSEDU University Management System

Monorepo: FastAPI + React + MySQL, Docker/nginx দিয়ে deploy করা university management app।
Roles: guest/admission · student · teacher · admin। Domains: courses, assignments/submissions, finance/payments, events+RSVP, notices, meetings, equipment, exams, admissions, resource hub।

## Layout (⚠️ double-nested paths)
```
backend-main/backend-main/          # FastAPI root (cwd for uvicorn)
  main.py                           # app + router includes + table registration
  app/core/                         # auth.py, config.py, database.py, jwt_utils.py (shared)
  app/Emon/{api,model,schema}/      # dev namespace: user, teacher, course, meeting, finance
  app/Rakib/{api,model,schema}/     # dev namespace: student, admin, event, notice, exam, equipment, admission
  RESOURCES/                        # uploaded files, served at /resources
Frontend-main/Frontend-main/frontend/   # Vite root (cwd for npm)
  src/{Admin,Student,Teacher,Admissions}/  # role-based pages
  src/context/AuthContext.jsx, src/RequireAuth.jsx  # auth
  src/api.js                        # endpoint URL helpers
docker-compose.yml                  # mysql + backend + frontend + nginx
```

## Backend conventions
- Stack: FastAPI, SQLAlchemy (pymysql/MySQL), JWT via python-jose, pydantic-settings।
- Routers live per-feature in `app/<dev>/api/*.py`, all included in `main.py`। **নতুন model বানালে `main.py`-তে import করতে হবে** নইলে `Base.metadata.create_all` টেবিল বানাবে না।
- API prefix `/v1` (e.g. `/v1/finance/events`, `/v1/auth/login`)।
- Auth: `get_current_user` dependency in `app/core/auth.py` (Bearer JWT, `user_id` claim)।
- Config: `app/core/config.py` reads env — `DATABASE_URL`, `SECRET_KEY`, `RESOURCE_HUB`।

## Frontend conventions
- Stack: React 19, Vite 7, TailwindCSS 4, react-router-dom 7, axios, framer-motion, recharts, lucide-react।
- Protected routes wrap in `<RequireAuth allowedRole="student|teacher|admin">` (see `src/App.jsx`)।
- Backend base URL = `import.meta.env.VITE_BACKEND_URL` (prod = `/api`)। Endpoints via helper objects in `src/api.js` (`${BACKEND_URL}/${API_VERSION}/...`)।

## Run
- Full stack: `docker compose up --build` → app at `http://localhost:8080` (nginx proxies `/api` → backend)।
- Backend dev: `cd backend-main/backend-main && uvicorn main:app --reload`।
- Frontend dev: `cd Frontend-main/Frontend-main/frontend && npm run dev`।

## Don't read (token waste — see .claudeignore)
Deployment markdown (`DEPLOYMENT_*.md`, `CLOUD_DEPLOYMENT.md`, `COMPLETE_STATUS.md`, `DIAGNOSTIC_REPORT.md`), `*.sh` scripts, media (`public/*.{mp4,jpg,png}`), `package-lock.json`, `RESOURCES/`। এগুলো architecture বুঝতে দরকার নেই।
