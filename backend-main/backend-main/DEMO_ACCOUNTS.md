# CSEDU — Demo Accounts

All demo data is created by `seed_demo.py` (idempotent — safe to re-run):

```bash
docker compose exec backend python seed_demo.py    # in Docker
python seed_demo.py                                 # on host (venv active)
```

Sign-up is **allowlist-gated**: only emails an admin has pre-approved
(`/v1/auth/allowed-emails`, admin UI in **Admin → Users → Sign-up Allowlist**)
can register. The seeder pre-approves every account below, plus a handful of
"pending" (approved but not-yet-registered) emails to demo the flow.

## Passwords (same for every account of a role)

| Role | Password |
|---|---|
| Admin | `Admin@123` |
| Teacher | `Teacher@123` |
| Student | `Student@123` |

## Key logins

| Role | Email | Notes |
|---|---|---|
| Admin | `admin@cse.du.ac.bd` | full admin panel |
| Teacher | `razzaque@cse.du.ac.bd` | Prof. & Chairman |
| Teacher | `suraiya@cse.du.ac.bd` | Professor (NLP) |
| Teacher | `palash@cse.du.ac.bd`, `fahim@cse.du.ac.bd`, `tanvir@cse.du.ac.bd`, … | 16 faculty total, all `<slug>@cse.du.ac.bd` |
| Student (Batch 28, 4-1) | `rakib@cs.du.ac.bd` | 4th-year, full result history |
| Student (Batch 28, 4-1) | `emon@cs.du.ac.bd` | 4th-year |
| Student (Batch 29, 3-1) | `sumaiya.karim29@cs.du.ac.bd` | 3rd-year |
| Student (Batch 30, 2-1) | `sabbir.alam30@cs.du.ac.bd` | 2nd-year |
| Student (Batch 31, 1-1) | `rubaiya.uddin31@cs.du.ac.bd` | 1st-year (no result history yet) |

> The full student roster is `<first>.<last><batch>@cs.du.ac.bd` — 15 students
> per batch across batches 28–31 (60 total). List them in **Admin → Users**.

## What is seeded

Curriculum catalog (real DU BSc, 150 cr) · 16 faculty + 60 students · sign-up
allowlist · courses + enrolment · **4 published batch routines** (conflict-free)
+ slot swap/move requests · assignments + graded submissions · attendance
(with <75% ineligibility cases) · results/CGPA history · finance events +
payments · course chat (group + DM) · notifications · exams · meetings + RSVPs
· equipment + orders · events · announcements · notices.

> ⚠️ Demo passwords are intentionally weak — **change them before any real /
> public deployment.**
