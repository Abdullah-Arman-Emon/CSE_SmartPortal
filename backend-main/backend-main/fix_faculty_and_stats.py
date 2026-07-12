"""One-shot maintenance: correct the public-site faculty roster + photos and the
department stats, using real data crawled from du.ac.bd/body/FacultyMembers/CSE.

- Downloads each faculty photo into RESOURCES/faculty/ and rewrites image_url to a
  local /resources/... path (robust against du.ac.bd hotlink/referrer blocking).
- Fixes name/designation to the official values.
- Updates seed_data/public_site.json (fresh installs) AND the live DB Person rows.
- Sets dept_stats Students -> 300.

Idempotent: re-running just re-verifies/overwrites with the same values.
Run:  python fix_faculty_and_stats.py
"""
import json
import re
import ssl
import urllib.request
from pathlib import Path

from app.core.database import SessionLocal
from app.Rakib.model.publicsite import Person, SiteContent

HERE = Path(__file__).parent
RES_DIR = HERE / "RESOURCES" / "faculty"
JSON_FILE = HERE / "seed_data" / "public_site.json"

_CTX = ssl.create_default_context()
_CTX.check_hostname = False
_CTX.verify_mode = ssl.CERT_NONE

# Authoritative roster (name, official designation, source photo URL) — crawled
# from the department faculty page. Order = professors → assoc → asst → lecturers.
FACULTY = [
    ("Dr. Md. Abdur Razzaque", "Professor & Chairman", "https://ssl.du.ac.bd/fontView/assets/faculty_image/image_1768_new.jpg"),
    ("Dr. Suraiya Pervin", "Professor", "https://ssl.du.ac.bd/fontView/assets/faculty_image/cse_suraiya.jpg"),
    ("Dr. Md. Haider Ali", "Professor", "https://ssl.du.ac.bd/fontView/assets/faculty_image/image_1762_new.JPG"),
    ("Dr. Hafiz Md. Hasan Babu", "Professor", "https://ssl.du.ac.bd/fontView/assets/faculty_image/image_1930_new.jpg"),
    ("Dr. Md. Rezaul Karim", "Professor", "https://ssl.du.ac.bd/fontView/assets/faculty_image/cse_rkarim.jpg"),
    ("Dr. Md. Hasanuzzaman", "Professor (On Leave)", "https://ssl.du.ac.bd/fontView/assets/faculty_image/image_2555.jpg"),
    ("Dr. Shabbir Ahmed", "Professor", "https://ssl.du.ac.bd/fontView/assets/faculty_image/image_1759.jpg"),
    ("Dr. Md. Mustafizur Rahman", "Professor", "https://ssl.du.ac.bd/fontView/assets/faculty_image/image_1766.jpg"),
    ("Dr. Saifuddin Md. Tareeq", "Professor", "https://ssl.du.ac.bd/fontView/assets/faculty_image/image_1767.jpg"),
    ("Dr. Chowdhury Farhan Ahmed", "Professor", "https://duap.du.ac.bd/upload/img/cse_farhan.jpg"),
    ("Dr. Md. Mamun-Or-Rashid", "Professor", "https://ssl.du.ac.bd/fontView/assets/faculty_image/1769_mamun_academic.jpg"),
    ("Dr. Mosaddek Hossain Kamal", "Professor", "https://ssl.du.ac.bd/fontView/assets/faculty_image/image_1764.JPG"),
    ("Dr. Muhammad Asif Hossain Khan", "Professor", "https://ssl.du.ac.bd/fontView/assets/faculty_image/cse_asif.jpg"),
    ("Dr. Upama Kabir", "Professor", "https://ssl.du.ac.bd/fontView/assets/faculty_image/1765_UK.jpg"),
    ("Dr. Moinul Islam Zaber", "Professor (On Leave)", "https://ssl.du.ac.bd/fontView/assets/faculty_image/1782_MoinulZaber-COLOUR.jpg"),
    ("Abu Ahmed Ferdaus", "Associate Professor", "https://ssl.du.ac.bd/fontView/assets/faculty_image/cse_ferdaus.jpg"),
    ("Dr. Mosarrat Jahan", "Associate Professor", "https://ssl.du.ac.bd/fontView/assets/faculty_image/cse_mosarratjahan.jpg"),
    ("Dr. Ismat Rahman", "Associate Professor", "https://ssl.du.ac.bd/fontView/assets/faculty_image/image_4669_new.jpeg"),
    ("Dr. Sarker Tanveer Ahmed Rumee", "Associate Professor", "https://ssl.du.ac.bd/fontView/assets/faculty_image/image_2585.jpg"),
    ("Dr. Md. Mosaddek Khan", "Associate Professor", "https://ssl.du.ac.bd/fontView/assets/faculty_image/2557_MMKforsite.png"),
    ("Dr. Muhammad Ibrahim", "Associate Professor", "https://ssl.du.ac.bd/fontView/assets/faculty_image/4167_Me_photo_2020_b.jpg"),
    ("Hasnain Heickal", "Assistant Professor (Study Leave)", "https://ssl.du.ac.bd/fontView/assets/faculty_image/image_2556.jpg"),
    ("Md. Mahmudur Rahman", "Assistant Professor", "https://ssl.du.ac.bd/fontView/assets/faculty_image/image_2562.jpg"),
    ("Md. Ashraful Islam", "Assistant Professor (Study Leave)", "https://ssl.du.ac.bd/fontView/assets/faculty_image/image_4168.JPG"),
    ("Md. Fahim Arefin", "Lecturer", "https://ssl.du.ac.bd/fontView/assets/faculty_image/image_61068_new.png"),
    ("Redwan Ahmed Rizvee", "Lecturer (On Leave)", "https://ssl.du.ac.bd/fontView/assets/faculty_image/image_61070_new.jpg"),
    ("Md. Tanvir Alam", "Lecturer", "https://ssl.du.ac.bd/fontView/assets/faculty_image/image_61083_new.JPG"),
    ("Jargis Ahmed", "Lecturer", "https://ssl.du.ac.bd/fontView/assets/faculty_image/76908_315534097_3288402398090050_8467021205814801729_n.jpg"),
    ("Palash Roy", "Lecturer", "https://ssl.du.ac.bd/fontView/assets/faculty_image/76909_Palash_Roy_Formal.jpg"),
    ("Md. Ahasanul Alam", "Lecturer", "https://ssl.du.ac.bd/fontView/assets/faculty_image/83796_Ahasan_photo.jpeg"),
    ("Md. Aminul Kader Bulbul", "Lecturer", "https://ssl.du.ac.bd/fontView/assets/faculty_image/83861_CGPT-Me-2.png"),
    ("Shabab Murshed", "Lecturer", "https://ssl.du.ac.bd/fontView/assets/faculty_image/image_83860_new.jpg"),
]


def _slug(name):
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def download_photos():
    """Download each photo locally; return {name: /resources/... path}."""
    RES_DIR.mkdir(parents=True, exist_ok=True)
    out = {}
    for name, _role, url in FACULTY:
        ext = ".png" if url.lower().endswith(".png") else (
            ".jpeg" if url.lower().endswith(".jpeg") else ".jpg")
        fname = f"{_slug(name)}{ext}"
        dest = RES_DIR / fname
        rel = f"/resources/faculty/{fname}"
        if dest.exists() and dest.stat().st_size > 1000:
            out[name] = rel
            continue
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            data = urllib.request.urlopen(req, timeout=30, context=_CTX).read()
            if len(data) < 1000:
                raise ValueError(f"too small ({len(data)} bytes)")
            dest.write_bytes(data)
            out[name] = rel
            print(f"  downloaded {name} -> {rel} ({len(data)//1024} KB)")
        except Exception as e:
            print(f"  !! FAILED {name}: {str(e)[:60]} — keeping remote URL")
            out[name] = url
    return out


def update_json(photo_map):
    data = json.loads(JSON_FILE.read_text(encoding="utf-8"))
    role_by_name = {n: r for n, r, _ in FACULTY}
    people = data.get("people", [])
    fixed = 0
    for p in people:
        if p["name"] in photo_map:
            p["image_url"] = photo_map[p["name"]]
            p["role"] = role_by_name[p["name"]]
            fixed += 1
    # dept_stats -> Students 300
    stats = json.loads(data["content"]["dept_stats"]) if isinstance(
        data["content"]["dept_stats"], str) else data["content"]["dept_stats"]
    for s in stats:
        if s.get("label", "").lower() == "students":
            s["value"] = "300"
    data["content"]["dept_stats"] = json.dumps(stats, ensure_ascii=False)
    JSON_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"json: updated {fixed} faculty photos/roles; dept_stats Students -> 300")
    return data["content"]["dept_stats"]


def update_db(photo_map, dept_stats_value):
    db = SessionLocal()
    try:
        role_by_name = {n: r for n, r, _ in FACULTY}
        fixed = 0
        for p in db.query(Person).all():
            if p.name in photo_map:
                p.image_url = photo_map[p.name]
                p.role = role_by_name[p.name]
                fixed += 1
        row = db.query(SiteContent).filter(SiteContent.key == "dept_stats").first()
        if row:
            row.value = dept_stats_value
        db.commit()
        print(f"db: updated {fixed} Person photos/roles; dept_stats set")
    finally:
        db.close()


if __name__ == "__main__":
    photos = download_photos()
    dept_stats_value = update_json(photos)
    update_db(photos, dept_stats_value)
    print("done")
