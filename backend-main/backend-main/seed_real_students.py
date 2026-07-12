"""Real CSE DU batch-29 (reg 2022-xxx) and batch-30 (reg 2023-xxx) students.

The department gave us two roster exports; this module holds that real data and
completes any field a roster didn't capture with deterministic, realistic demo
values (seeded off the registration number, so re-runs are stable).

Consumed by seed_demo.py: every student here gets a real account (login works),
a fully-filled profile, and a pre-approved allowlist entry carrying their
registration number — exactly what the sign-up flow validates against.

`get_real_students()` returns a list of dicts whose keys map 1:1 onto the
Student model columns (+ `email` for the User and `semester`).
"""
import random
import re

# Batch → current semester. MUST match the canonical map in seed_full_routines
# (the single source of truth for routines/courses/terms) and seed_demo, so a
# batch's students, courses, routine, attendance and results all agree on which
# semester they are in.
BATCH_SEM = {29: "3-2", 30: "2-2"}

FEMALE_HALLS = (
    "shamsun nahar", "shamsunnahar", "sufia kamal", "rokeya", "ruqayyah",
    "ruqaiyyah", "rukiyya", "kabi sufia kamal",
)

SCHOOL_POOL = [
    "Govt. Laboratory High School", "Dhaka Residential Model College",
    "Monipur High School & College", "Motijheel Govt. Boys' High School",
    "Rajuk Uttara Model College", "Ideal School & College",
    "Viqarunnisa Noon School", "BAF Shaheen College",
]
COLLEGE_POOL = [
    "Notre Dame College, Dhaka", "Dhaka College", "Dhaka City College",
    "Govt. Science College", "Adamjee Cantonment College",
    "Holy Cross College", "Rajuk Uttara Model College",
]
DISTRICTS = [
    "Dhaka", "Cumilla", "Chattogram", "Rajshahi", "Khulna", "Mymensingh",
    "Tangail", "Bogura", "Rangpur", "Barishal", "Sylhet", "Jashore",
]
GUARDIAN_REL = ["Father", "Mother", "Uncle", "Elder brother", "Guardian"]


def _digits(reg):
    return re.sub(r"\D", "", reg or "")


def _slug(name):
    return re.sub(r"[^a-z]", "", (name.split()[0] if name else "student").lower()) or "student"


def _inst_email(name, reg):
    return f"{_slug(name)}-{_digits(reg)}@cs.du.ac.bd"


def _split_name(full):
    parts = (full or "").strip().split()
    if not parts:
        return "Student", ""
    return parts[0], " ".join(parts[1:])


def _gender_from_hall(hall):
    h = (hall or "").lower()
    return "Female" if any(f in h for f in FEMALE_HALLS) else "Male"


# ---------------------------------------------------------------------------
# Batch 29 — reg 2022-xxx.  Columns:
#   roll | reg | full_name | nick | gender | blood | phone | present_address |
#   hall | dob | personal_email | facebook
# (school/college/merit/permanent/guardian are completed by _fill.)
# ---------------------------------------------------------------------------
_B29 = """
1|2022-715-876|Arik Islam|Arik|Male|B+|01612843054|186/B, West Kafrul, Agargaon-Taltola, Sher-E-Bangla Nagar, Dhaka-1207|Fazlul Haque Hall|28/09/2004|arik.islam2809@gmail.com|
2|2022-615-877|Anika Sanzida Upoma|Anika|Female|B+|01752895770|Kabi Sufia Kamal Hall, Dhaka University|Kabi Sufia Kamal Hall|19/02/2005|anikasanzida31593@gmail.com|https://www.facebook.com/sAda.idur.31
3|2022-515-878|Abdullah Evne Masood|Regan|Male|B-|01540155088|Ruposhi pro active village, Mirpur 13, Dhaka|Amar Ekushe Hall|03/12/2002|abdullahibnemasoodr@gmail.com|https://m.facebook.com/abdullah.ebne.masood
5|2022-215-880|Md. Akram Khan|Akram|Male|A+|01819538418|7Q, Aziz Super Market, Shahbag, Dhaka|Amar Ekushe Hall|31/12/2004|thankyouakramkhan@gmail.com|https://www.facebook.com/profile.php?id=100093278333977
6|2022-115-881|Dipta Bhattacharjee|Dipta|Male|O+|01757086359|Bokshibajar, Dhaka|Jagannath Hall|11/09/2003|diptabhattacharjee117@gmail.com|https://www.facebook.com/profile.php?id=100095482174210
7|2022-015-882|Sumaiya Rahman Soma|Soma|Female|O+|01879272520|507/C North Shahjahanpur, Dhaka-1217|Kabi Sufia Kamal Hall|14/05/2004|sumaiyarahman.soma@gmail.com|https://www.facebook.com/profile.php?id=100052282907198
8|2022-915-883|Shaila Jaman Priti|Shaila|Female|B+|01743491458|South Mugda, Dhaka|Shamsun Nahar Hall|13/04/2004|shailajaman00@gmail.com|
9|2022-815-884|Aditto Raihan|Adi|Male|B+|01521202602|House-02, Road-01, Block-F, Nasimbag, Mirpur-02, Dhaka-1216|Shahidullah Hall|23/11/2005|adittoraihan19@gmail.com|https://www.facebook.com/raihanaditto1225
10|2022-715-885|Istiak Ahammed Rhyme|Istiak|Male|A+|01868880897|Bakshi Bazar, Dhaka|Shahidullah Hall|15/07/2003|istiakrhyme840@gmail.com|https://www.facebook.com/istiak.ahammed.3572
11|2022-615-886|Md Shakin Alam Kabbo|Shakin|Male|O+|01521726775|Joynag Road, Lalbag, Dhaka|Shahidullah Hall|05/11/2003|kabboshakin088@gmail.com|https://www.facebook.com/shakin.alamkabya.1
12|2022-515-887|Mir Md. Ishrak Faisal|Ishrak|Male|O+|01810773026|Dhaka Cantonment, Mirpur-14, Dhaka-1206|Fazlul Haque Hall|19/08/2003|ishrakfaisal100@gmail.com|https://www.facebook.com/profile.php?id=100082099510651
13|2022-415-888|H.M. Mehedi Hasan|Mehedi|Male|B+|01319926696|ka-196, Joar Shahara, Kuril, Vatara, Dhaka|Fazlul Haque Hall|05/08/2005|hasanmehedi26696@gmail.com|https://www.facebook.com/profile.php?id=100048432489289
14|2022-315-889|Md. Sarif|Sarif|Male|AB+|01402396990|Kazi Villa, kha-119, South Badda, Dhaka|Amar Ekushe Hall|15/05/2004|shahariansharif990@gmail.com|
15|2022-115-890|Srabon Aich|Srabon|Male|B+|01980023660|24/5, Omar Ali Lane, West Rampura, Dhaka-1219|Jagannath Hall|25/07/2003|srabonaich@gmail.com|https://www.facebook.com/srabon.aich.3
16|2022-015-891|Ibna Afra Roza|Roza|Female|B+|01720429444|House-358, Road-10, Block-C, Bashundhara R/A, Dhaka|Shamsun Nahar Hall|07/04/2004|roza.cse29@gmail.com|https://www.facebook.com/rz.Rozaa7
17|2022-915-892|Suraya Jannat Mim|Mim|Female|B+|01776792494|Kabi Sufia Kamal Hall, Dhaka University|Kabi Sufia Kamal Hall|03/07/2004|mimrobo1726@gmail.com|https://www.facebook.com/profile.php?id=61550237978591
18|2022-815-893|Swapon Chandra Roy|Swapon|Male|A+|01516514574|Chankharpool Lane, Chawkbazar, Dhaka|Jagannath Hall|21/02/2004|swaponbarman44@gmail.com|https://www.facebook.com/profile.php?id=100058619710814
19|2022-715-894|Anisha Tabassum|Anisha|Female|A+|01977332537|Azimpur, Dhaka|Kabi Sufia Kamal Hall|09/11/2003|tabassumanisha09@gmail.com|https://www.facebook.com/anisha.tabassum.09
20|2022-615-895|Md. Ashif Mahmud Kayes|Kayes|Male|A+|01788368352|112/g, Hazaribag, Dhaka|Amar Ekushe Hall|26/10/2003|ashifsarkar28@gmail.com|https://www.facebook.com/ashifmahmud.kayes
21|2022-515-896|Abantika Paul|Abantika|Female|O+|01771444111|8/A, Siddheswari Road, Dhaka|Kabi Sufia Kamal Hall|18/06/2003|abantikapaul1806@gmail.com|https://www.facebook.com/profile.php?id=100095120379662
22|2022-415-897|Mehedi Hasan|Mehedi|Male|B+|01980285290|Koborsthan Road, Khortoil, Sataish, Tongi, Gazipur|Shahidullah Hall|08/03/2004|mehedi200105075@gmail.com|https://www.facebook.com/profile.php?id=100027011960450
23|2022-315-898|Jubayer Ahmed Sojib|Sojib|Male|O+|01401550813|Boksibazar, Lalbagh, Dhaka|Shahidullah Hall|14/07/2004|jubayerahmedsojib23@gmail.com|https://www.facebook.com/jubayerahmed.sojib.7
24|2022-215-899|Jobaer Hossain Tamim|Tamim|Male|A+|01964702804|Donia, Dhaka|Shahidullah Hall|13/01/2004|jobaertamim7@gmail.com|https://www.facebook.com/jobaierhossain.tamim
25|2022-915-900|Md. Shahria Hasan Jony|Jony|Male|B+|01844921502|33 Chankharpul Lane, Dhaka|Fazlul Haque Hall|23/06/2004|shahriarhasan12020@gmail.com|https://www.facebook.com/shahriar.hasan.7524
26|2022-815-901|Sonia Akter|Sonia|Female|O+|01610650023|Narayanganj|Kabi Sufia Kamal Hall|25/12/2004|soniaakter016106@gmail.com|https://www.facebook.com/sonia.akterprithy
27|2022-715-902|Md. Sadman Sakib|Sadman|Male|A+|01841724901|110/1, Mokroba Road, NagarKhanpur, Narayanganj|Fazlul Haque Hall|01/07/2003|mdsadmansakibmss@gmail.com|https://www.facebook.com/mdsadmansakibmss
28|2022-615-903|Dibbajothy Sarker|Dibba|Male|O+|01533193043|Chankharpul, Dhaka|Jagannath Hall|04/04/2005|dibbajothy2@gmail.com|https://www.facebook.com/Dibbajothy
29|2022-515-904|Md Mohasin Molla|Mohasin|Male|A+|01620420561|Bakshibajar, Dhaka|Amar Ekushe Hall|10/02/2004|mohosinkamal880@gmail.com|
30|2022-415-905|Md. Mahmudur Rahman Moin|Moin|Male|B+|01873169331|194/1, Wasa Road, West Shewrapara, Mirpur, Dhaka|Amar Ekushe Hall|29/05/2004|mrmoin529@gmail.com|https://www.facebook.com/profile.php?id=100055706464314
31|2022-315-906|Jotish Biswas|Jotish|Male|B+|01893683978|Jagannath Hall, Dhaka University|Jagannath Hall|01/04/2005|1rjbiswas@gmail.com|
32|2022-215-907|Saad Bin Ashad|Saad|Male|A+|01783365400|2A/10, 2nd Lane, Gopibagh, Dhaka|Shahidullah Hall|15/07/2003|saadbinashad2003@gmail.com|https://www.facebook.com/profile.php?id=100009716375817
33|2022-115-908|Sharfraz Khan|Hridue|Male|A+|01314860405|House-10, 130/A, Malibagh 1st Lane, Dhaka|Shahidullah Hall|27/05/2004|sharfraz9999@gmail.com|https://www.facebook.com/sharfraz.khan.77128
34|2022-015-909|Abdullah Ash Sakafy|Sakafy|Male|B+|01638343384|205/2 West Manikdi, Dhaka Cantonment, Dhaka-1206|Shahidullah Hall|11/12/2004|abdullahsakafy@gmail.com|https://www.facebook.com/abdullah.sakafy
35|2022-815-910|Farhan Bin Rabbani|Farhan|Male|B+|01675000289|86/C, Shahid Giasuddin Ahmed R/A, Nilkhet, Dhaka-1000|Fazlul Haque Hall|03/01/2004|farhanbinrabbani@gmail.com|https://www.facebook.com/farhan.rabbani.02457
36|2022-715-911|Md. Sadman Shihab|Shihab|Male|B+|01303664552|Mohammadpur, Dhaka|Fazlul Haque Hall|13/07/2003|sadmanshihab716@gmail.com|https://www.facebook.com/sadman.shihab.10297
37|2022-615-912|Labonya Pal|Labonya|Female|O+|01794565619|C-2, Square ABC Residence, Milk Vita Road, Mirpur-7, Dhaka|Kabi Sufia Kamal Hall|11/09/2003|labonyapal@gmail.com|https://www.facebook.com/anamika.pal.labonno
38|2022-515-913|Ahnaf Mahbub Khan|Ahnaf|Male|B+|01581673357|10 Minto Road, Ramna, Dhaka|Amar Ekushe Hall|14/04/2004|ahnafkhan414@gmail.com|https://www.facebook.com/ahnaf.khan.9440234
39|2022-415-914|Tamal Kanti Sarker|Tamal|Male|B+|01777446089|Bokshibazar, Dhaka|Jagannath Hall|27/10/2004|tamalkanti223@gmail.com|https://www.facebook.com/tamalkanti.tamal
40|2022-315-915|Nafisha Akhter|Tuli|Female|O+|01521779710|Isha Khan Road, Dhaka University|Shamsun Nahar Hall|31/12/2004|nafisha3588@gmail.com|https://www.facebook.com/nafisha.akhter.56
41|2022-215-916|Md. Rushan Jamil|Rushan|Male|B+|01774678956|113/1, 1 No Goli, South Mughda, Dhaka|Amar Ekushe Hall|25/08/2003|rushanjamil03@gmail.com|https://www.facebook.com/rushan.jamil.338
42|2022-115-917|S M Shamiun Ferdous|Shamiun|Male|B+|01729373372|Bijoy Rakeen City, Mirpur-13, Dhaka|Shahidullah Hall|24/10/2003|shamiunferdous1234@gmail.com|https://www.facebook.com/samiun.ferdose
43|2022-015-918|Hasanat Ashrafy|Ashrafy|Female|B+|01858561686|D1, 1/1, Shelter Kazishal, Kalyanpur, Mirpur, Dhaka|Shamsun Nahar Hall|12/10/2004|asharfy193945@gmail.com|https://www.facebook.com/hasanat.ashrafy
44|2022-915-919|Md Nadim Mahmud Chowdhury|Nadim|Male|B+|01923888894|Bokshibazar, Lalbagh, Dhaka|Shahidullah Hall|01/11/2003|nadimc119@gmail.com|https://www.facebook.com/mdnadim.mahmud.315428
45|2022-715-920|Ariful Islam|Arif|Male|B+|01609270872|Board Bazar, Gazipur|Shahidullah Hall|07/04/2005|arafislam0015@gmail.com|https://www.facebook.com/profile.php?id=100027511987040
46|2022-615-921|Ahil Islam Aurnob|Aurnob|Male|B+|01944947352|Muktijoddha Road, Azampur Kanchabazar, Uttara, Dhaka|Fazlul Haque Hall|03/12/2003|aheelislam03@gmail.com|https://www.facebook.com/ronin.ronin.79677471
47|2022-515-922|Md. Abu Bakar Siddique|Abu Bakar|Male|O+|01631172611|27 Azimpur, New Palton, Dhaka-1205|Fazlul Haque Hall|01/01/2003|bojackabs@gmail.com|https://www.facebook.com/Abu.Bakar.Siddique.abs.1224566
48|2022-415-923|Farhana Alam|Farhana|Female|O+|01550446492|B-43/F-9, Motijheel AGB Colony, Dhaka-1000|Kabi Sufia Kamal Hall|01/10/2004|falam3399@gmail.com|https://www.facebook.com/cubie.fa.9
49|2022-315-924|Atiya Fahmida Noshin|Atiya|Female|B+|01533378966|Bosila, Dhaka|Kabi Sufia Kamal Hall|24/12/2003|atiyafahmida42@gmail.com|https://www.facebook.com/sanjidachowdhury.chowdhury.5
50|2022-215-925|Biplob Pal|Biplob|Male|A+|01798172129|Jagannath Hall, Dhaka University|Jagannath Hall|15/08/2004|paulbiplob100@gmail.com|
51|2022-115-926|Tasnova Shahrin|Tasnova|Female|A+|01939273574|22/1, South Mugdapara, Dhaka|Kabi Sufia Kamal Hall|31/08/2004|shahrintasnova@gmail.com|
52|2022-015-927|Most. Ishrat Jahan Mim|Ishrat|Female|A+|01787728101|Azimpur, Dhaka-1205|Kabi Sufia Kamal Hall|13/11/2004|ishratjahan7711@gmail.com|https://www.facebook.com/profile.php?id=100072324909691
53|2022-915-928|Abul Hasan Anik|Anik|Male|O+|01717034644|Salimullah Road, Mohammadpur, Dhaka|Shahidullah Hall|30/01/2005|akashhasananik@gmail.com|https://www.facebook.com/akashhasan.srabon
54|2022-815-929|Mst. Tasmia Sultana Sumi|Tasmia|Female|B+|01643299331|Kabi Sufia Kamal Hall, Dhaka University|Kabi Sufia Kamal Hall|25/11/2004|sumitasmia515@gmail.com|https://www.facebook.com/tasmia123
55|2022-615-930|Chowdhury Shafahid Rahman|Shafahid|Male|B+|01712928212|911/1, Monipur, Mirpur-2, Dhaka-1216|Amar Ekushe Hall|06/04/2003|shafahid666@gmail.com|https://www.facebook.com/shafahid.rahman
56|2022-515-931|Tabassum Kabir|Tabassum|Female|A+|01314337076|Farmgate, Dhaka|Shamsun Nahar Hall|15/03/2004|sanjidaakter2310@gmail.com|https://www.facebook.com/shammi.akter.12935756
57|2022-415-932|N. M Rashidujjaman Masum|Masum|Male|O+|01522105332|Mohammadpur, Dhaka|Shahidullah Hall|10/11/2003|nmrmasumbdkk531@gmail.com|https://www.facebook.com/nmrmasumbd
58|2022-315-933|Sara Faria Sundra|Sara|Female|AB+|01612959977|Mohammadpur, Dhaka|Shamsun Nahar Hall|20/12/2005|sarafaria924@gmail.com|https://www.facebook.com/profile.php?id=100093108595139
59|2022-215-934|Jubair Ahammad|Adib|Male|A+|01791569553|House-20, Road-5, Janata Housing, Agargaon, Dhaka-1207|Shahidullah Hall|31/07/2003|akteradib007@gmail.com|https://www.facebook.com/ahmedsativa.adib
60|2022-115-935|Md. Mahmudul Hassan|Arafat|Male|O+|01876887554|153/gho, East Rajabajar, Sher-e-Bangla Nagar, Dhaka|Shahidullah Hall|24/12/2003|mharafat06@gmail.com|https://www.facebook.com/mharafat06
80|2021-711-231|Md. Rafeul Islam|Sagor|Male|A+|01740883684|Chankharpul, Dhaka|Fazlul Haque Hall|20/12/2002|rafeulsagor@gmail.com|https://www.facebook.com/profile.php?id=100071691518376
"""

# ---------------------------------------------------------------------------
# Batch 30 — reg 2023-xxx.  Columns:
#   reg | full_name | blood | phone | school | college | roll | merit |
#   present_address | permanent_address | hall | personal_email | facebook |
#   guardian_mobile
# (gender inferred from hall; nickname/dob completed by _fill.)
# ---------------------------------------------------------------------------
_B30 = """
2023-915-990|Nahid Shadman|A+|01893409677|Police Line Secondary School Jashore|Government MM College Jashore|47|561|Azimpur, Dhaka|Jashore|Fazlul Haque Hall|rishadriad631@gmail.com|https://www.facebook.com/profile.php?id=61558690526776|01913699447
2023-115-970|Adeba Jahan|A+|01577097816|SOS Hermann Gmeiner College|Holy Cross College|27|431|House-06, Road-21, Block-C, Mirpur-10, Dhaka|House-06, Road-21, Block-C, Mirpur-10, Dhaka|Shamsun Nahar Hall|cocomelonrighthere98@gmail.com|https://www.facebook.com/share/1Bwwm7T1vD/|01720257884
2023-515-949|Istiak Mahmud|O+|01603289510|Rajshahi Collegiate School|Notre Dame College, Dhaka|06|250|Lalbagh, Dhaka|Bagmara, Rajshahi|Shahidullah Hall|itsjoy003@gmail.com|https://www.facebook.com/istiak33.mahmud|01712523173
2023-715-983|Mohammad Mahmudul Kabir Fahmid|B+|01779975359|Motijheel Govt. Boys High School|Notre Dame College|40|511|Ka-1/1, Bangladesh Bank Staff Quarters, Motijheel, Dhaka-1000|Laskarpur, Habiganj|Amar Ekushey Hall|gfhmid5975@gmail.com|https://www.facebook.com/share/16JB8ytB6g/|01724945730
2023-815-964|Ariba Hasan|A+|01531948802|Viqarunnisa Noon School and College|Viqarunnisa Noon School and College|21|395|Flat B-4, Oriental Orchid, 1 New Bailey Road, Dhaka|Bolla, Balla Bazaar, Kalihati, Tangail|Shamsun Nahar Hall|aribahasan04@gmail.com|https://m.facebook.com/profile.php?id=61555283075930|01711533125
2023-715-965|Md. Abdullah Bin Sorwar Chowdhury|B+|01767882955|Chattogram Cantonment Public College|Notre Dame College|22|408|7/B, Silver Spring, Purbanchal Rd. 25, North Badda, Dhaka|Meah Bari, Mithanala, Mirsarai, Chattogram|Dr. Muhammad Shahidullah Hall|mdabdullahbins0009@gmail.com|https://www.facebook.com/share/1694QXa1NT/|01768135583
2023-015-980|Arin Saha Turja|A+|01718557126|Monipur High School & College|Notre Dame College|37|483|O.P.H.G-9, Agargaon, Sher-E-Bangla Nagar, Dhaka-1207|Nazunbag, Jahidganj, Ghatail, Tangail|Jagannath Hall|turja2k21@gmail.com|https://www.facebook.com/profile.php?id=100049558020130|01846395286
2023-815-973|Samarina Sarwar Sachi|A+|01577088172|Rajuk Uttara Model College|Rajuk Uttara Model College|30|444|Farmgate, Dhaka|Nazipur Pouroshova, Patnitala, Naogaon|Rokeya Hall|samarinasachi12@gmail.com|https://www.facebook.com/share/167wiuT8jS/|01714765111
2023-515-994|Dipa Biswas|O+|01877341641|YWCA Higher Secondary Girls' School|Dhaka City College|51|587|73/G Central Road, Dhaka-1205|73/G Central Road, Dhaka-1205|Ruqayyah Hall|dipabiswasdu@gmail.com|https://www.facebook.com/share/1ByacwHVb6/|01716166165
2023-016-006|Tamim Hasan|O+|01316204876|Brahmondi K.K.M. Govt. High School, Narsingdi|Dhaka City College|63|849|Atoshkhana Lane, Lalbag, Dhaka|Brahmondi, Narsingdi Sadar, Narsingdi|Shahidullah Hall|tamimhasan50505@gmail.com|https://www.facebook.com/share/152UcCCVHJ/|01721745563
2023-615-948|Rubaiya Sultana|B+|01302335218|Rajbari Govt. Girls' High School|Rajbari Govt. College|05|228|Azimpur Govt. Colony, Dhaka|Rajbari Sadar, Rajbari|Shamsun Nahar Hall|srishtirubaiya@gmail.com|https://www.facebook.com/share/1557rkwAH9/|01767167454
2023-715-974|Shuchita Islam Shuvra|B+|01754711589|Ideal School and College, Banasree|Ideal School and College, Motijheel|31|446|180/F/1, East Rampura, Titas Road, Dhaka-1219|Dhangargor, Islampur, Jamalpur|Kabi Sufia Kamal Hall|shuchita318@gmail.com|https://www.facebook.com/share/1FQJb2629s/|01716445044
2023-515-958|Rishita Sharmin|A+|01746742500|Al-Amin Academy School & College|Chandpur Govt. Girls' College|15|326|Azimpur, Dhaka|Dhanua, Chandpur, Chattogram|Kabi Sufia Kamal Hall|rishitasharmin6@gmail.com|https://www.facebook.com/share/1BrYHj5E4K/|01726408798
2023-615-984|Mahzabin Mim|O+|01903922627|Ideal School & College|Ideal School & College|41|512|K.M. Das Lane, Tikatuli, Dhaka|Terki, Kalihati, Tangail|Kabi Sufia Kamal Hall|mahzabinmim13913@gmail.com|https://www.facebook.com/mim.mahzabin.me|01713374986
2023-115-989|Raisa Tabassum|A+|01733247240|Viqarunnisa Noon School|Viqarunnisa Noon College|46|552|Rampura Banasree, D Block, Dhaka|Madartek, Basabo, Dhaka|Shamsun Nahar Hall|raisapayal510@gmail.com|https://www.facebook.com/share/1KLRkp9Pic/|01913375520
2023-116-005|Mayesha Binte Liton|O+|01725833208|Vidyamayee Govt. Girls' High School, Mymensingh|Muminunnisa Govt. Womens' College|62|806|9/B, 75 Nayapaltan Masjid Road, Dhaka|6/B, Muminunnisa Excel Tower, Panditpara, Mymensingh|Kabi Sufia Kamal Hall|mayeshacse15@gmail.com|https://www.facebook.com/share/1ACqTgiYon/|01707068782
2023-115-961|Md. Sakhawat Hosen|O+|01875682372|Rammohan Tomizia High School|Govt. Science College|18|372|Shahidullah Hall, Dhaka University|Bhakshar, Maizkhar, Chandina, Cumilla|Dr. Muhammad Shahidullah Hall|mdsakhawat560@gmail.com|https://www.facebook.com/share/1CAAmqLxNd/|01824866147
2023-815-946|Kazi Maheru Tafannum|O+|01781524281|Viqarunnisa Noon School|Holy Cross College|03|177|98 Lake Circus, Kalabagan, Dhaka-1205|98 Lake Circus, Kalabagan, Dhaka-1205|Ruqayyah Hall|kazimaheru21@gmail.com|https://www.facebook.com/profile.php?id=61557900261493|01712036924
2023-015-944|MD. Jahidul Islam Sarker|B+|01719007801|Ispahani Public School & College|Ispahani Public School & College|01|63|Nischintopur, Uttar Durgapur, Cumilla|Adarsha Sadar, Cumilla|Amar Ekushey Hall|mdjahidulislamsarker@gmail.com|https://www.facebook.com/share/199ejvD73A/|01719007857
2023-215-979|Swarlok Samadder|O+|01794004201|Pirojpur Govt. High School|Notre Dame College, Dhaka|36|482|546, East Kazipara, Kafrul, Mirpur, Dhaka-1216|546, East Kazipara, Kafrul, Mirpur, Dhaka-1216|Jagannath Hall|sswarlok@gmail.com|https://www.facebook.com/swarloksamadder|01794004255
2023-915-954|Soumik Deb|A+|01761582569|Moulvibazar Govt High School|Moulvibazar Govt College|11|316|Jagannath Hall, Dhaka University|Raysree, Moulvibazar|Jagannath Hall|soumik2004j@gmail.com|https://www.facebook.com/share/19JjLxq3A7/|01717616352
2023-216-004|Shahriar Islam|A+|01726061144|Azim Uddin High School|Notre Dame College|61|713|House-15, Road-5, G-Block, Mirpur-2, Dhaka|Nogua, Kishoreganj Sadar, Kishoreganj|Dr. Muhammad Shahidullah Hall|tshahriar53@gmail.com|https://www.facebook.com/share/163Qs11KU7/|01765734322
2023-215-997|Md. Ariful Islam|AB+|01878671573|North Bengal Paper Mills High School|Govt. Edward College, Pabna|54|630|Dr. Mohammad Shahidullah Hall, DU|Char-Ruppur, Pakshey, Ishwardi, Pabna|Dr. Muhammad Shahidullah Hall|10ariful11@gmail.com|https://www.facebook.com/share/1Bgc84TxeC/|01752367048
2023-315-978|Md. Irfan Iqbal|O+|01961483876|Ideal School and College|Government Science College|35|477|58/19/A City Ideal Tower, Uttar Mugda, Dhaka|120/ka Uttar Kolapara, Parshuram, Feni|Fazlul Haque Hall|irfan10rafi@gmail.com|https://www.facebook.com/share/18es5yNbZt/|01408715799
2023-715-947|Syed Muhtasim Apon|B+|01886196575|Government Laboratory High School|Notre Dame College|04|185|60 Green Road, New Market, Dhaka|Block-U-1-2, Newtown, Dinajpur Sadar, Dinajpur|Dr. Muhammad Shahidullah Hall|syedmuhtasimapon@gmail.com|https://www.facebook.com/share/192QvLFZWU/|01711196575
2023-516-001|Md. Shahadat Hossain Riyad|AB+|01572908407|Mymensingh Zilla School|Ananda Mohan College, Mymensingh|58|678|Chankharpul, Dhaka|Mymensingh Sadar, Mymensingh|Amar Ekushey Hall|riyadsani3@gmail.com|https://www.facebook.com/share/16MvJCUY4C/|01775529619
2023-515-967|Sudipto Debnath|O+|01312155044|Amua Bandar Amir Molla Secondary School|Government Science College Tejgaon|24|416|Jagannath Hall, Dhaka University|Chonauta, Amua, Kathalia, Jhalakathi|Jagannath Hall|sudiptodebnath0000@gmail.com|https://www.facebook.com/share/1A2WxhApMn/|01301286068
2023-215-988|Mishkatul Ferdousi Saima|O+|01533062100|Jhenaidah Government Girls High School|Holy Cross College|45|545|West Nakhalpara, Tejgaon, Dhaka|Jhenaidah|Shamsun Nahar Hall|mishkatul.ferdousi@gmail.com|https://www.facebook.com/share/1D21upaQAU/|01714502150
2023-615-993|Sayed Mahatab Hossen|A+|01793494865|Lalmohan Hamim Residential School|Notre Dame College|50|581|Amar Ekushey Hall, Dhaka University|Lalmohan High School Road, Lalmohan, Bhola|Amar Ekushey Hall|mahatab4002@gmail.com|https://www.facebook.com/share/1923wQdjx4/|01311822210
2023-316-003|S. Humaira|O+|01926672912|Adarsha School, Narayanganj|Narayanganj Government Mohila College|60|712|130 Niribili Housing Area, Masdair, Narayanganj|Saina, Dhabri, Kawkhali, Pirojpur|Kabi Sufia Kamal Hall|shumaira17385@gmail.com|https://www.facebook.com/share/1Y2po4wEzq/|01926672911
2023-915-945|Md. Samiul Islam Siam|A+|01883908986|I.E.T. Govt. High School, Narayanganj|Govt. Tolaram College, Narayanganj|02|119|30/A Wabdapool, Haziganj, Fatulla, Narayanganj-1420|Bahirkhola, Nabagram, Manikganj Sadar, Manikganj|Amar Ekushey Hall|samiul908986@gmail.com|https://www.facebook.com/share/16DwiDzzds/|01747283175
2023-315-950|Partho Kumar Mondal|A+|01987463535|Konda High School|Notre Dame College|07|267|Holding 430, Ward 06, Nagar Konda, Savar, Dhaka|Charbiharia, Ektarpur Hat, Khoksa, Kushtia|Jagannath Hall|partho2006ss@gmail.com|https://www.facebook.com/profile.php?id=100072378627042|01912078225
2023-616-000|Md Tahsinur Rahman|B+|01747351885|Dhanmondi Govt Boys' High School|Notre Dame College|57|673|House-211, East Kazipara, Mirpur, Dhaka-1216|144 Aymajamalpur, Panchbibi, Joypurhat|Fazlul Haque Hall|brentorockshox@gmail.com|https://www.facebook.com/tahsinur.rahman.brento|01716293014
2023-515-985|Jahid Hasan Dani|O+|01920952668|Baushi A.C. Higher Secondary School|Ryal Media College|42|516|Dr. Md Shahidullah Hall, Ex-02, Room-2111|Maijgonga, Kalmakanda, Netrakona|Dr. Muhammad Shahidullah Hall|jahidhasandani@gmail.com|https://www.facebook.com/share/18UCA8GZMG/|01812457752
2023-315-987|Faiaz Ibne Iqbal|B+|01307454575|Monipur High School and College|Noubahini College, Dhaka|44|536|278/1 Tulip Garden, Mirpur, Dhaka-1216|363/18 North Pirerbag, Mirpur, Dhaka-1216|Dr. Muhammad Shahidullah Hall|faiazibneiqbal@gmail.com|https://www.facebook.com/faiaz.ibne.iqbal|01715623809
2023-515-959|Ibna Md. Al Rifat|B+|01774258181|Public High School|Govt. Bangla College|16|345|Nakhal Para, Tejgaon, Dhaka|Reajnagar, Parbatipur, Dinajpur|Amar Ekushey Hall|alrifat3088@gmail.com|https://www.facebook.com/ibnamd.alrifat|01782701180
2023-315-996|Shezad Mahbub|B+|01917624433|Hasan Ali Govt. High School|Chandpur Govt. College|53|606|Shewrapara, Dhaka|Shewrapara, Dhaka|Dr. Muhammad Shahidullah Hall|wraw551@gmail.com||01568269785
2023-415-986|Md Rakibul Hassan|B+|01776053566|BNMPC|Notre Dame College|43|525|Zigatola, Dhanmondi, Dhaka|Haziganj, Chandpur|Dr. Muhammad Shahidullah Hall|mdrakibul3130@gmail.com||01716401432
2023-215-960|Md Sajidul Islam|B+|01963159991|Hossainpur Adarsha High School|Notre Dame College, Mymensingh|17|357|Hossainpur, Kishoreganj|Hossainpur, Kishoreganj|Dr. Muhammad Shahidullah Hall|sajidulislam01623@gmail.com|https://www.facebook.com/profile.php?id=100044676219635|01733604433
2023-416-002|MD. Sazzad Shahriar Ragib|B+|01315528870|Cantonment Public School and College, Rangpur|Cantonment Public School and College, Rangpur|59|711|Amar Ekushe Hall, Dhaka University|Latifpur, Mithapukur, Rangpur|Amar Ekushey Hall|sazzadshahriarragib59@gmail.com|https://www.facebook.com/share/1AGA3uT2oL/|01717974361
2023-615-975|Khaza Asif Karim Shromi|B+|01521761071|Dhaka Residential Model College|Notre Dame College|32|466|H-1/1, Road-19, Block-D, Mirpur-6, Dhaka|Alaiyarpur, Begunganj, Noakhali|Dr. Muhammad Shahidullah Hall|shromi3.14@gmail.com|https://www.facebook.com/The.Dark.Knight.958|01715189171
2023-915-963|Shashwata Nandi|A+|01736090279|Barishal Zilla School|Govt. BM College, Barishal|20|383|Jagannath Hall, Dhaka University|Kalibari Road, Barishal|Jagannath Hall|nandisantu274@gmail.com|https://www.facebook.com/share/15aVsRsre4/|01716512750
2023-315-969|Sojib Ahmed|O+|01334189989|Moulvi Abdur Rahman High School|Govt. Debendra College|26|427|Amar Ekushey Hall, Dhaka University|Manikganj|Amar Ekushey Hall|sojibahmed142776@gmail.com|https://www.facebook.com/share/1WrcrwdZ5t/|01713570488
2021-111-237|Shoeb Hasnat|B+|01700841617|Police Line Secondary School Jashore|Govt. MM College Jashore|85|999|Newtown, Dhaka|Jashore|Shahidullah Hall|shoabhasnat50@gmail.com|https://www.facebook.com/shoebhasnat|01743749304
2023-215-951|Farhan Labib|AB+|01912584460|R.B Govt High School|Notre Dame College, Dhaka|08|273|Uttar Badda, Dhaka|Joypurhat Sadar, Joypurhat|Dr. Muhammad Shahidullah Hall|farhanlabibahan@gmail.com|https://www.facebook.com/farhanlabibaham|01645379727
2023-115-998|Nahian Ash-hab|AB+|01755780380|Motijheel Govt. Boys' High School|Notre Dame College, Dhaka|55|644|Flat 4B, House 149, Daira Complex, Azimpur, Dhaka-1205|House 964, Heru Mia Road, South Manda, Dhaka-1214|Fazlul Haque Hall|nahianashhab@gmail.com|https://www.facebook.com/share/16PsaW3qRp/|01817630190
2023-615-957|Shadman Zaman Sajid|O+|01611456983|Dhaka Residential Model College|Notre Dame College|14|325|41/9 Road-04, Block C, Chand Mia Housing, Mohammadpur, Dhaka|Nuthurchor, K Mohanpur, Gopalpur, Tangail|Amar Ekushey Hall|shadmansajid876@gmail.com|https://www.facebook.com/shadmanzaman.sajid|01711456983
2023-015-953|Salwa Baki|O+|01924728422|Monipur High School|Holy Cross College|10|310|60 Feet, Mirpur, Dhaka-1216|Bhaopur, Monohorganj, Cumilla|Ruqayyah Hall|salwabaki0017@gmail.com|https://www.facebook.com/share/1VTWUP1Hds/|01716375412
2023-415-968|Mashfikuzzaman Taeen|A+|01623032037|Motijheel Govt. Boys' High School|Notre Dame College|25|418|434/C Khilgaon, Dhaka-1219|434/C Khilgaon, Dhaka-1219|Fazlul Haque Hall|taeen3738@gmail.com|https://www.facebook.com/mashfiktaeen|01683104705
2023-515-976|Shahriar Hossain Thesun|O+|01572903038|Ramchandrapur R.K High School|Notre Dame College|33|467|17/3 South Mugda, Dhaka|Ramchandrapur, Muradnagar, Cumilla|Dr. Muhammad Shahidullah Hall|shahriarhossainthesun@gmail.com|https://www.facebook.com/share/1BQEb4TKVy/|01626025259
2023-115-952|Md. Sazid Alam|O+|01751969913|Dinajpur Zilla School|Dinajpur Govt. College|09|305|Zigatala, Dhaka|Golden Tower Flat 2A, Fakirpara, Sadar, Dinajpur|Fazlul Haque Hall|sazidalam2005@gmail.com|https://www.facebook.com/Sazid.Alam2005|01717447880
2023-715-992|Nafees Mubarrat Saad|O+|01331992449|Dinajpur Zilla School|Pabna Cadet College|49|579|Amar Ekushey Hall, Dhaka University|Dinajpur Sadar, Dinajpur|Amar Ekushey Hall|nafeesmubarrat@gmail.com|https://www.facebook.com/share/16V2B5rZuC/|01992217526
2023-815-991|Tukabbir Hossain Sadi|A+|01795392497|Dhubni Kanchibari High School|Rangpur Government College|48|565|Fazlul Haque Hall, Dhaka University|Sundarganj, Gaibandha|Fazlul Haque Hall|tukabbirhossainsadi@gmail.com|https://www.facebook.com/tukabbir.hossain.sadi|01733255962
2023-915-972|Akhtaruzzaman Imran|O+|01918079296|Mohammadpur High School|Agricultural University College|29|442|East Raza Bazar, Sher-e-Bangla Nagar, Farmgate, Dhaka|Harirampur, Trishal, Mymensingh|Dr. Muhammad Shahidullah Hall|aktimarn@gmail.com|https://www.facebook.com/akhtaruzzaman.imran.3|01760451645
2023-615-966|Tahjir Tansim|A+|01522106116|Rajshahi Collegiate School|Notre Dame College, Dhaka|23|412|Gupipara, Uttar Badda, Dhaka-1212|Baliyapukur, Boalia, Rajshahi|Fazlul Haque Hall|tahjirtansim11@gmail.com|https://www.facebook.com/tahjir.tansim|01718698453
2023-015-962|Raisa Hossain Ratri|B+|01859938900|Viqarunnisa Noon School|Viqarunnisa Noon College|19|374|New Eskaton, Holy Family Red Crescent Road, Dhaka-1000|New Eskaton, Holy Family Red Crescent Road, Dhaka-1000|Kabi Sufia Kamal Hall|ratri262004@gmail.com|https://www.facebook.com/share/1Dk1ZZBxLz/|01711660612
2023-815-955|Ahmed Reza Tausif|B+|01406734829|Rajuk Uttara Model College|Notre Dame College|12|317|271 South Goran, Khilgaon, Dhaka-1219|271 South Goran, Khilgaon, Dhaka-1219|Fazlul Haque Hall|ahmedrezatausif@gmail.com|https://www.facebook.com/ahmedreza.tausif.9|01911298586
2023-915-981|Md. Niyamul Goni Sourav|A+|01645218101|Mymensingh Zilla School|Notre Dame College, Dhaka|38|493|Fazlul Haque Hall, Dhaka University|Trishal, Mymensingh|Fazlul Haque Hall|niyamulsourav42@gmail.com|https://www.facebook.com/niyamul.sourav|01870995795
2023-815-982|Sakib Mujbain Sadat|B+|01978706923|BN School and College, Ctg|Adamjee Cantonment College|39|495|12/16 Navy Colony, Mirpur-14, Dhaka|Teani Monirum, Kandir Hat, Pirgacha, Rangpur|Amar Ekushey Hall|sakibsadat122@gmail.com|https://www.facebook.com/sakibmujbain|01816435744
2023-415-995|Tahsin Mubasshir|O+|01533081352|Narail Govt. High School|Narail Govt. Victoria College|52|603|West Shewrapara, Mirpur, Dhaka|Mohishkhola, Narail|Dr. Muhammad Shahidullah Hall|tahsinmubasshir15@gmail.com|https://www.facebook.com/share/1AfyAkJpNr/|01731577761
"""


def _fill_common(rec, rng):
    """Fill any field a roster didn't provide with deterministic demo data."""
    rec.setdefault("department", "Computer Science and Engineering")
    rec.setdefault("other_social", "")
    if not rec.get("school"):
        rec["school"] = SCHOOL_POOL[rng.randrange(len(SCHOOL_POOL))]
    if not rec.get("college"):
        rec["college"] = COLLEGE_POOL[rng.randrange(len(COLLEGE_POOL))]
    if not rec.get("merit_rank"):
        rec["merit_rank"] = str(rng.randint(50, 900))
    if not rec.get("permanent_address"):
        rec["permanent_address"] = rec.get("present_address") or (
            f"Village & Post: {rng.choice(['Char', 'Uttar', 'Dakshin', 'Purbo'])}para, "
            f"{rng.choice(DISTRICTS)}")
    if not rec.get("guardian_mobile"):
        rec["guardian_mobile"] = f"01{rng.randint(5,9)}{rng.randint(10**7, 10**8-1)}"
    if not rec.get("date_of_birth"):
        rec["date_of_birth"] = f"{rng.randint(1,28):02d}/{rng.randint(1,12):02d}/{rng.choice([2003,2004,2005])}"
    if not rec.get("nickname"):
        rec["nickname"] = rec["first_name"]
    return rec


def _parse_b29(block):
    out = []
    for line in block.strip().splitlines():
        c = line.split("|")
        roll, reg, name, nick, gender, blood, phone, present, hall, dob, email, fb = (
            c + [""] * (12 - len(c)))[:12]
        first, last = _split_name(name)
        rng = random.Random(int(_digits(reg)))
        rec = dict(
            batch=29, semester=BATCH_SEM[29],
            email=_inst_email(name, reg), registration_number=reg,
            first_name=first, last_name=last, full_name=name, nickname=nick,
            gender=gender, blood_group=blood, phone=phone, roll=roll,
            present_address=present, hall=hall, date_of_birth=dob,
            personal_email=email, facebook_url=fb,
        )
        out.append(_fill_common(rec, rng))
    return out


def _parse_b30(block):
    out = []
    for line in block.strip().splitlines():
        c = line.split("|")
        (reg, name, blood, phone, school, college, roll, merit, present,
         permanent, hall, email, fb, guardian) = (c + [""] * (14 - len(c)))[:14]
        first, last = _split_name(name)
        rng = random.Random(int(_digits(reg)))
        rec = dict(
            batch=30, semester=BATCH_SEM[30],
            email=_inst_email(name, reg), registration_number=reg,
            first_name=first, last_name=last, full_name=name, nickname="",
            gender=_gender_from_hall(hall), blood_group=blood, phone=phone,
            roll=roll, merit_rank=merit, school=school, college=college,
            present_address=present, permanent_address=permanent, hall=hall,
            personal_email=email, facebook_url=fb, guardian_mobile=guardian,
        )
        out.append(_fill_common(rec, rng))
    return out


_CACHE = None


def get_real_students():
    """All real batch 29 + 30 students as profile dicts (deterministically filled)."""
    global _CACHE
    if _CACHE is None:
        _CACHE = _parse_b29(_B29) + _parse_b30(_B30)
    return _CACHE


# Student-model columns we set directly from a record dict.
PROFILE_COLUMNS = [
    "registration_number", "nickname", "gender", "blood_group",
    "date_of_birth", "roll", "merit_rank", "school", "college", "department",
    "present_address", "permanent_address", "hall", "personal_email",
    "facebook_url", "other_social", "guardian_mobile",
]


if __name__ == "__main__":
    rows = get_real_students()
    print(f"{len(rows)} real students parsed")
    emails = [r["email"] for r in rows]
    regs = [r["registration_number"] for r in rows]
    assert len(set(emails)) == len(emails), "duplicate institutional email!"
    assert len(set(regs)) == len(regs), "duplicate registration number!"
    for r in rows[:3]:
        print(r["email"], r["registration_number"], r["full_name"], r["hall"])
