"""
Idempotent DU CSE BSc curriculum catalog seeder.

Run inside the backend container (workdir /app):
    docker compose exec backend python seed_curriculum.py

Source: https://du.ac.bd/undergrad/cse (BSc Honours, 150 credits).
Safe to run multiple times: rows are keyed by course_code; existing rows get
their title/credit/category/is_lab/year/semester_no refreshed, so re-running
also syncs corrections. MSc courses are NOT seeded (DU publishes no fixed MSc
course list) — admins add those from the Curriculum page.

Also runs the same try/except ALTER-TABLE migrations style as seed_demo.py for
columns that Base.metadata.create_all() cannot add to existing tables.
"""

from app.core.database import SessionLocal, Base, engine
from app.core.migrations import run_migrations

# Import every model so metadata + relationships are registered.
from app.Emon.model.userModel import User
from app.Emon.model.teacher import Teacher
from app.Emon.model.course import Course
from app.Emon.model.schedule import Schedule
from app.Emon.model.curriculum import CurriculumCourse
from app.Emon.model.assignment import Assignment
from app.Emon.model.submission import Submission
from app.Rakib.model.student import Student
from app.Rakib.model.result import Result
from app.Rakib.model.equipment import Equipment, StudentEquipment
from app.Rakib.model.missingClassOnMonth import MissingClassOnMonth

# (course_code, title, credit, category, is_lab)
# year/semester_no are derived from the code digits (digit1=year, digit2=semester),
# which holds for every BSc course including electives (32xx -> 3-2, 42xx -> 4-2).
CATALOG = [
    # ---- General Education (34.25 cr) ----
    ("HUM 1109", "History of Emergence of Bangladesh", 2.0, "general", False),
    ("HUM 4105", "Professional Ethics and Environment", 2.0, "general", False),
    ("MIS 4203", "IT Project Management", 2.0, "general", False),
    ("BUS 4205", "ICT Business Entrepreneurship", 2.0, "general", False),
    ("PHY 1205", "Physics", 3.0, "general", False),
    ("PHY 1206", "Physics Lab", 0.75, "general", True),
    ("MATH 1107", "Differential and Integral Calculus", 3.0, "general", False),
    ("MATH 1207", "Linear Algebra", 3.0, "general", False),
    ("MATH 2107", "Differential Equations, Laplace Transform and Fourier Analysis", 3.0, "general", False),
    ("STAT 2207", "Probability and Statistics", 3.0, "general", False),
    ("STAT 3107", "Random Processes", 3.0, "general", False),
    ("EEE 1105", "Electrical Circuits", 3.0, "general", False),
    ("EEE 1106", "Electrical Circuits Lab", 0.75, "general", True),
    ("EEE 1209", "Electronic Devices and Circuits", 3.0, "general", False),
    ("EEE 1210", "Electronic Devices and Circuits Lab", 0.75, "general", True),
    # ---- Core (95.25 cr) ----
    ("CSE 1101", "Discrete Mathematics", 3.0, "core", False),
    ("CSE 1103", "Computational Problem Solving", 3.0, "core", False),
    ("CSE 1104", "Computational Problem Solving Lab", 1.5, "core", True),
    ("CSE 1201", "Structured Programming", 3.0, "core", False),
    ("CSE 1202", "Structured Programming Lab", 1.5, "core", True),
    ("CSE 1203", "Digital Logic Design", 3.0, "core", False),
    ("CSE 1204", "Digital Logic Design Lab", 0.75, "core", True),
    ("CSE 2101", "Data Structures and Algorithms", 3.0, "core", False),
    ("CSE 2102", "Data Structures and Algorithms Lab", 1.5, "core", True),
    ("CSE 2103", "Object Oriented Design and Programming", 3.0, "core", False),
    ("CSE 2104", "Object Oriented Design and Programming Lab", 1.5, "core", True),
    ("CSE 2105", "Computer Architecture and Microprocessor", 3.0, "core", False),
    ("CSE 2106", "Microprocessor and Assembly Language Lab", 1.5, "core", True),
    ("CSE 2109", "Data and Telecommunication", 3.0, "core", False),
    ("CSE 2201", "Database Management System", 3.0, "core", False),
    ("CSE 2202", "Database Management System Lab", 1.5, "core", True),
    ("CSE 2203", "Design and Analysis of Algorithms", 3.0, "core", False),
    ("CSE 2204", "Design and Analysis of Algorithms Lab", 1.5, "core", True),
    ("CSE 2205", "Microcontroller and Embedded System", 3.0, "core", False),
    ("CSE 2206", "Microcontroller and Embedded System Lab", 1.5, "core", True),
    ("CSE 2209", "Numerical Methods", 3.0, "core", False),
    ("CSE 3101", "Software Engineering", 3.0, "core", False),
    ("CSE 3102", "Software Design and Development Project", 1.5, "core", True),
    ("CSE 3103", "Web Engineering and Technology", 3.0, "core", False),
    ("CSE 3104", "Web Engineering and Technology Lab", 1.5, "core", True),
    ("CSE 3105", "Algorithm Engineering", 3.0, "core", False),
    ("CSE 3109", "Operating System", 3.0, "core", False),
    ("CSE 3110", "Operating System Lab", 1.5, "core", True),
    ("CSE 3201", "Computer Network", 3.0, "core", False),
    ("CSE 3202", "Computer Network Lab", 1.5, "core", True),
    ("CSE 3203", "Artificial Intelligence", 3.0, "core", False),
    ("CSE 3204", "Artificial Intelligence Lab", 1.5, "core", True),
    ("CSE 3205", "Information Security", 3.0, "core", False),
    ("CSE 3206", "Information Security Lab", 1.5, "core", True),
    ("CSE 3207", "Theory of Computation", 3.0, "core", False),
    ("CSE 4101", "Machine Learning", 3.0, "core", False),
    ("CSE 4102", "Machine Learning Lab", 1.5, "core", True),
    ("CSE 4103", "Internet of Things", 3.0, "core", False),
    ("CSE 4104", "Internet of Things Lab", 1.5, "core", True),
    ("CSE 4201", "Parallel and Distributed Systems", 3.0, "core", False),
    ("CSE 4202", "Parallel and Distributed Systems Lab", 1.5, "core", True),
    # ---- Elective I (3-2: one theory + its lab) ----
    ("CSE 3209", "Digital Image Processing", 3.0, "elective1", False),
    ("CSE 3210", "Digital Image Processing Lab", 1.5, "elective1", True),
    ("CSE 3211", "Introduction to Data Science", 3.0, "elective1", False),
    ("CSE 3212", "Introduction to Data Science Lab", 1.5, "elective1", True),
    ("CSE 3213", "Bioinformatics", 3.0, "elective1", False),
    ("CSE 3214", "Bioinformatics Lab", 1.5, "elective1", True),
    ("CSE 3215", "Mobile Application Development", 3.0, "elective1", False),
    ("CSE 3216", "Mobile Application Development Lab", 1.5, "elective1", True),
    ("CSE 3217", "Simulation and Modeling", 3.0, "elective1", False),
    ("CSE 3218", "Simulation and Modeling Lab", 1.5, "elective1", True),
    ("CSE 3219", "Computer Graphics", 3.0, "elective1", False),
    ("CSE 3220", "Computer Graphics Lab", 1.5, "elective1", True),
    ("CSE 3221", "Wireless Networks", 3.0, "elective1", False),
    ("CSE 3222", "Wireless Networks Lab", 1.5, "elective1", True),
    # ---- Elective II (4-2: one theory + its 1.0-cr lab) ----
    ("CSE 4211", "Deep Neural Network", 3.0, "elective2", False),
    ("CSE 4212", "Deep Neural Network Lab", 1.0, "elective2", True),
    ("CSE 4213", "Natural Language Processing", 3.0, "elective2", False),
    ("CSE 4214", "Natural Language Processing Lab", 1.0, "elective2", True),
    ("CSE 4215", "Data Mining", 3.0, "elective2", False),
    ("CSE 4216", "Data Mining Lab", 1.0, "elective2", True),
    ("CSE 4217", "Digital Forensics", 3.0, "elective2", False),
    ("CSE 4218", "Digital Forensics Lab", 1.0, "elective2", True),
    ("CSE 4219", "Software Security", 3.0, "elective2", False),
    ("CSE 4220", "Software Security Lab", 1.0, "elective2", True),
    ("CSE 4221", "Compiler Design", 3.0, "elective2", False),
    ("CSE 4222", "Compiler Design Lab", 1.0, "elective2", True),
    ("CSE 4223", "Cloud Computing", 3.0, "elective2", False),
    ("CSE 4224", "Cloud Computing Lab", 1.0, "elective2", True),
    # ---- Elective III (4-2: one theory, no lab) ----
    ("CSE 4225", "Big Data Analytics", 3.0, "elective3", False),
    ("CSE 4227", "Information Retrieval", 3.0, "elective3", False),
    ("CSE 4229", "Human Robot Interaction", 3.0, "elective3", False),
    ("CSE 4231", "Computer Vision", 3.0, "elective3", False),
    ("CSE 4233", "Software Testing and Quality Assurance", 3.0, "elective3", False),
    ("CSE 4235", "VLSI Design and Formal Verification", 3.0, "elective3", False),
    ("CSE 4237", "Parallel and Distributed Database Systems", 3.0, "elective3", False),
    ("CSE 4239", "Applied Cryptography", 3.0, "elective3", False),
    ("CSE 4241", "Wireless Network Security", 3.0, "elective3", False),
    ("CSE 4243", "Graph Theory", 3.0, "elective3", False),
    ("CSE 4245", "Operations Research", 3.0, "elective3", False),
    ("CSE 4247", "Quantum Computing", 3.0, "elective3", False),
    ("CSE 4249", "Game Theory", 3.0, "elective3", False),
    ("CSE 4251", "Human Computer Interaction", 3.0, "elective3", False),
    # ---- Final Year Project & Internship (even codes but NOT labs) ----
    ("CSE 4100", "Internship", 3.0, "project", False),
    ("CSE 4110", "Final Year Project - Part A", 2.0, "project", False),
    ("CSE 4210", "Final Year Project - Part B", 4.0, "project", False),
]


def seed():
    Base.metadata.create_all(bind=engine)
    run_migrations(engine)
    db = SessionLocal()
    created = updated = 0
    try:
        for code, title, credit, category, is_lab in CATALOG:
            digits = code.split(" ")[1]
            fields = dict(
                program="bsc",
                title=title,
                credit=credit,
                category=category,
                is_lab=is_lab,
                year=int(digits[0]),
                semester_no=int(digits[1]),
            )
            row = db.query(CurriculumCourse).filter_by(course_code=code).first()
            if row:
                changed = False
                for k, v in fields.items():
                    if getattr(row, k) != v:
                        setattr(row, k, v)
                        changed = True
                if changed:
                    updated += 1
            else:
                db.add(CurriculumCourse(course_code=code, **fields))
                created += 1
        db.commit()
        total = db.query(CurriculumCourse).count()
        print(f"Curriculum seed done: {created} created, {updated} updated, {total} total rows.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
