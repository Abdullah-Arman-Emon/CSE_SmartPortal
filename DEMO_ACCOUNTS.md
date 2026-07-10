# Demo Accounts — CSE SmartPortal

Seed with (inside the backend container, workdir `/app`):

```bash
docker compose exec backend python seed_demo.py
```

Idempotent — safe to run multiple times.

| Role | Email | Password | Notes |
|---|---|---|---|
| Admin | `admin@cse.du.ac.bd` | `Admin@123` | Full admin panel |
| Teacher | `razzaque@cse.du.ac.bd` | `Teacher@123` | Prof. & Chairman; owns CSE 4113 |
| Teacher | `suraiya@cse.du.ac.bd` | `Teacher@123` | Prof.; owns CSE 4111 (NLP) |
| Student | `rakib@cs.du.ac.bd` | `Student@123` | Batch 27 |
| Student | `emon@cs.du.ac.bd` | `Student@123` | Batch 27 |

## Seeded demo content
- 2 courses (`CSE4113IPL`, `CSE4111NLP`) with schedules; both students enrolled
- Assignment (Homework) + a Resource + one student submission
- 2 notices (Department, Chairman)
- 1 event (Tech Fest 2026), 2 exams (Final, Midterm — future dates)
- 2 meetings + 1 RSVP
- 2 equipment items + 1 borrow order
- 1 finance event + 1 pending payment
- 1 admission application, 1 attendance record

All dates are relative to the run time, so they stay current.

> ⚠️ Change these passwords before any real/public use.
