# CLAUDE.md — CSEDU University Management System

> ⛔ **Rule: NEVER `git push`.** Commit locally if asked, কিন্তু push সবসময় শুধু user করবে — Claude কখনো push করবে না (কোনো branch-এ নয়, prod তো নয়ই)।


Monorepo: FastAPI + React + MySQL, Docker + host-nginx (TLS) দিয়ে deploy। LogicLoop team, prod = `logicloop.farefin.com`।
Roles: guest/admission · student · teacher · admin। Domains: courses, assignments/submissions, finance/payments, events+RSVP, notices, meetings, equipment, exams, admissions, resource hub।

## Layout (⚠️ double-nested paths)
```
backend-main/backend-main/          # FastAPI root (cwd for uvicorn), :8080
  main.py                           # app + CORS + router includes + table registration
  app/core/                         # auth.py, config.py, database.py, jwt_utils.py
  app/Emon/{api,model,schema}/      # dev namespace: user, teacher, course, meeting, finance
  app/Rakib/{api,model,schema}/     # dev namespace: student, admin, event, notice, exam, equipment, admission
  RESOURCES/                        # uploaded files, served at /resources
Frontend-main/Frontend-main/frontend/   # Vite root (cwd for npm), :8081
  src/{Admin,Student,Teacher,Admissions}/  # role-based pages
  src/context/AuthContext.jsx, src/RequireAuth.jsx, src/api.js
docker-compose.yml                  # mysql + backend(:8080) + frontend(:8081)
server-nginx.conf                   # host nginx: TLS + /api,/resources -> backend, / -> frontend
```

## Backend conventions
- FastAPI, SQLAlchemy (pymysql/MySQL), JWT (python-jose), pydantic-settings।
- Routers per-feature in `app/<dev>/api/*.py`, সব `main.py`-তে include করতে হয়।
- Router prefixes: `/v1/*` (auth, courses, finance, meetings, teacher*, student dashboard/courses) **এবং** `/admin/*`, `/student/*`, `/utility/*`, `/guest/*`।
- Auth: `get_current_user` (`app/core/auth.py`, Bearer JWT, `user_id` claim, 7-day expiry)।
- Config env (`app/core/config.py`): `DATABASE_URL`, `SECRET_KEY`, `RESOURCE_HUB`।

## Frontend conventions
- React 19, Vite 7, TailwindCSS 4, react-router-dom 7, axios, framer-motion, recharts, lucide।
- Protected routes: `<RequireAuth allowedRole="student|teacher|admin">` (`src/App.jsx`)।
- Backend base = `import.meta.env.VITE_BACKEND_URL` (prod = `/api`)। **Fallback `|| "localhost"` দেওয়া যাবে না** (empty string falsy → localhost bug)।

## Run
- Full stack: `docker compose up --build` (backend :8080, frontend :8081)।
- Backend dev: `cd backend-main/backend-main && uvicorn main:app --reload`।
- Frontend dev: `cd Frontend-main/Frontend-main/frontend && npm run dev` (vite proxy `/v1,/utility,/guest` → localhost:8000, শুধু dev-এ)।

## Production deploy & gotchas (কেন local এ চলে, server এ নয়)
- **Routing**: browser → host nginx (`server-nginx.conf`, TLS)। `location /api/` → backend `:8080` (prefix strip), `/resources/` → backend, `/` → frontend `:8081`। Frontend build হয় `VITE_BACKEND_URL=/api` দিয়ে → সব call `/api/...`। **নতুন backend route এমনিতেই কাজ করে, nginx বদলাতে হয় না।**
- **Frontend build-time bundle**: যেকোনো frontend পরিবর্তনে `docker compose build frontend --no-cache && docker compose up -d frontend` লাগে; শুধু code pull যথেষ্ট নয়। `VITE_*` env build-এ inline হয়।
- **⚠️ DB schema drift**: `main.py`-র `Base.metadata.create_all` শুধু অনুপস্থিত table বানায়, **বিদ্যমান table ALTER করে না**। বিদ্যমান model-এ নতুন column যোগ করলে server-এর পুরনো MySQL table-এ আসে না → query fail (local fresh DB-তে চলে, server-এ ভাঙে)। migration নেই — column বদলালে manual `ALTER TABLE`, নয়তো data ফেলে দেওয়া গেলে `docker compose down -v`। দীর্ঘমেয়াদে Alembic যোগ করা উচিত।
- **নতুন model**: `main.py`-তে import না করলে table তৈরি হয় না।
- **File upload**: `UtilityApi.upload` relative `/resources/<name>` URL দেয় (proxy-safe)। uvicorn `--proxy-headers` সহ চলে; nginx-এ `client_max_body_size 50M`।
- **Chatbot** (`components/Chatbot.jsx`): `/api/chatbot/query` backend route নেই (404); Gemini key client-এ hardcoded/exposed (রোটেট করা উচিত)।

## Don't read (token waste — see .claudeignore)
Deployment markdown (`DEPLOYMENT_*.md`, `CLOUD_DEPLOYMENT.md`, `COMPLETE_STATUS.md`, `DIAGNOSTIC_REPORT.md`), `*.sh`, media (`public/*.{mp4,jpg,png}`), `package-lock.json`, `node_modules/`, `RESOURCES/`।
