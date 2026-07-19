# CSE SmartPortal
- Team Name: LogicLoop 
- Project Deployed URL: http://logicloop.farefin.com/
- Deployed github Branch Name: prod
  
CSE SmartPortal is a production-oriented university management and student engagement platform for the Department of Computer Science and Engineering. It provides a role-based digital workspace for guests, students, teachers, and administrators to manage admissions, academic activities, communications, finance, events, and departmental resources from a single system.

## Project Overview

This application is designed for a university environment where different user groups need access to tailored functionality:

- Students can view dashboards, routines, notices, assignments, results, finance information, and course resources.
- Teachers can manage classrooms, attendance, submissions, meeting participation, and course-related communication.
- Administrators can oversee admissions, academic content, notices, exams, finance verification, equipment, events, and public website content.
- Guests and applicants can explore public information and submit admission applications.

The system is implemented as a full-stack web application with a FastAPI backend, a React + Vite frontend, and a MySQL database, and it is packaged for containerized deployment with Docker Compose.

## Key Modules and Features

### 1. Authentication and Role-Based Access

- Secure login and registration flow
- JWT-based authentication
- Role-aware access for student, teacher, and admin users
- Protected dashboard routes and role-based UI behavior

### 2. Student Portal

- Student dashboard with academic summaries and quick access to key features
- Course enrollment and course management
- Assignment submission and tracking
- Exam and results viewing
- Attendance and routine access
- Finance and payment-related views
- Notices, events, resource hub, and chat support

### 3. Teacher Portal

- Teacher dashboard and profile management
- Classroom and course management
- Attendance marking and reporting
- Assignment submission review
- Routine and slot request handling
- Meetings and RSVP interaction
- Course announcements and communication

### 4. Admin Portal

- User and access management
- Admission application review and status updates
- Exam, event, notice, and equipment management
- Finance event and payment verification
- Public site content administration
- Curriculum and academic content control

### 5. Public and Admissions Experience

- Public-facing department information
- People directory and chairman profile pages
- Department meetings and notices
- Admission hub with application forms and confirmation flow
- Program and course information pages

### 6. Communication and Collaboration

- Internal messaging and chat support
- Announcements and notifications
- Event RSVPs and department communications
- Resource uploads and file-serving support

## Architecture and Tech Stack

### Frontend

- React 19
- Vite 7
- React Router DOM 7
- Tailwind CSS 4
- Axios for API communication
- Framer Motion for animations
- Recharts for analytics and visual data displays
- Lucide and Heroicons for UI icons

### Backend

- FastAPI
- SQLAlchemy ORM
- Pydantic settings and validation
- JWT authentication via python-jose
- Password hashing with passlib and bcrypt
- File upload handling with python-multipart
- MySQL database connectivity through PyMySQL

### Database

- MySQL 8
- SQLAlchemy-managed models and table creation
- Seed scripts for demo data and public site content

### Deployment and Infrastructure

- Docker Compose for container orchestration
- Nginx reverse proxy for production routing
- Static file serving for uploaded resources
- Environment-based configuration for backend settings

## Directory Structure

```text
CSE_SmartPortal/
├── backend-main/
│   └── backend-main/
│       ├── app/
│       │   ├── core/
│       │   ├── Emon/
│       │   └── Rakib/
│       ├── RESOURCES/
│       ├── main.py
│       ├── requirements.txt
│       ├── seed_demo.py
│       ├── seed_public_site.py
│       └── seed_routine.py
├── Frontend-main/
│   └── Frontend-main/
│       └── frontend/
│           ├── public/
│           ├── src/
│           │   ├── Admin/
│           │   ├── Admissions/
│           │   ├── Auth/
│           │   ├── Student/
│           │   ├── Teacher/
│           │   ├── components/
│           │   ├── context/
│           │   ├── pages/
│           │   └── data/
│           ├── package.json
│           ├── vite.config.js
│           └── nginx.conf
├── docker-compose.yml
├── server-nginx.conf
├── deploy.sh
└── deploy.bat
```

## Local Development Setup

### Prerequisites

Make sure the following tools are installed:

- Python 3.12+
- Node.js 20+
- npm
- Docker and Docker Compose

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <repository-folder>
```

### 2. Backend Setup

Create a backend environment file at `backend-main/backend-main/.env` with values similar to:

```env
DATABASE_URL=mysql+pymysql://root:Password@localhost:3307/csedu
SECRET_KEY=supersecretkey
RESOURCE_HUB=RESOURCES
```

Install Python dependencies:

```bash
cd backend-main/backend-main
pip install -r requirements.txt
```

Run the backend locally:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup

Install frontend dependencies:

```bash
cd Frontend-main/Frontend-main/frontend
npm install
```

Run the frontend locally:

```bash
npm run dev
```

The Vite development server will proxy API requests to the backend during local development.

### 4. Run the Full Stack with Docker

From the project root:

```bash
docker compose up --build
```

This will start:

- MySQL on port `3307`
- Backend on port `8080`
- Frontend on port `8081`

### 5. Seed Demo Data (Optional)

To load demo users and sample content:

```bash
docker compose exec backend python seed_demo.py
```

## Production Deployment Notes

The production deployment is configured around:

- Nginx routing for `/api/` and `/resources/`
- Frontend served through the web server on port `8081`
- Backend running as a containerized FastAPI service
- MySQL persistence via Docker volume

For production deployments, ensure that environment values, secrets, and allowed origins are configured correctly before exposing the service publicly.

## License

This project is intended for departmental and academic use. Please confirm licensing and usage terms with the project owners before redistribution or commercial deployment.
