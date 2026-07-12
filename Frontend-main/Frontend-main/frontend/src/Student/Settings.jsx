import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserCircle2, ArrowLeft } from "lucide-react";

import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { toast } from "../components/ui/toast";
import ImageInput from "../components/ui/ImageInput";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Editable profile fields (registration number & institutional email are fixed
// at sign-up and shown read-only). Grouped for a clean two-column layout.
const TEXT_FIELDS = [
  { name: "first_name", label: "First name", type: "text" },
  { name: "last_name", label: "Last name", type: "text" },
  { name: "nickname", label: "Nick name", type: "text" },
  { name: "gender", label: "Gender", type: "select", options: ["", "Male", "Female", "Other"] },
  { name: "blood_group", label: "Blood group", type: "select",
    options: ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] },
  { name: "date_of_birth", label: "Date of birth", type: "text", placeholder: "DD/MM/YYYY" },
  { name: "phone", label: "Mobile number (active)", type: "tel" },
  { name: "guardian_mobile", label: "Guardian / emergency mobile", type: "tel" },
  { name: "roll", label: "Class roll", type: "text" },
  { name: "merit_rank", label: "Merit of admission (rank)", type: "text" },
  { name: "department", label: "Department", type: "text" },
  { name: "hall", label: "Allotted hall", type: "text" },
  { name: "school", label: "School", type: "text" },
  { name: "college", label: "College", type: "text" },
  { name: "personal_email", label: "Personal email", type: "email" },
  { name: "facebook_url", label: "Facebook profile link", type: "text" },
  { name: "other_social", label: "Any other social (where you can be found)", type: "text" },
];
const AREA_FIELDS = [
  { name: "present_address", label: "Present address" },
  { name: "permanent_address", label: "Permanent address" },
  { name: "bio", label: "Bio / description" },
];

const ALL_KEYS = [...TEXT_FIELDS, ...AREA_FIELDS].map((f) => f.name);

const SettingsPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [studentProfile, setStudentProfile] = useState(null);
  const [form, setForm] = useState({});
  const [profileImgPath, setProfileImgPath] = useState("");
  const [preview, setPreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    axios
      .get(`${BACKEND_URL}/v1/auth/get/student`, { params: { user_id: user.id } })
      .then((res) => setStudentProfile(res.data))
      .catch((err) =>
        console.error("Failed to fetch student:", err.response?.data || err.message)
      );
  }, [user]);

  useEffect(() => {
    if (!studentProfile) return;
    const next = {};
    ALL_KEYS.forEach((k) => (next[k] = studentProfile[k] || ""));
    setForm(next);
    setProfileImgPath(studentProfile.profile_image || "");
    setPreview(null);
  }, [studentProfile]);

  const setField = (name, value) => setForm((p) => ({ ...p, [name]: value }));

  const hasUnsavedChanges =
    studentProfile &&
    (ALL_KEYS.some((k) => (form[k] || "") !== (studentProfile[k] || "")) ||
      profileImgPath !== (studentProfile.profile_image || ""));

  const handleBackClick = (e) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      if (
        window.confirm(
          "You have unsaved changes. Go back and discard them?"
        )
      )
        navigate("/student-dashboard");
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    try {
      setUploadingImage(true);
      const fd = new FormData();
      fd.append("file", file);
      const res = await axios.post(`${BACKEND_URL}/utility/upload`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfileImgPath(res.data?.url);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Image upload failed:", err);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentProfile) return;
    setSaving(true);
    try {
      const payload = { ...form, profile_image: profileImgPath || "" };
      const res = await axios.put(
        `${BACKEND_URL}/student/settings/update_profile/${studentProfile.id}`,
        payload
      );
      toast.success("Profile updated!");
      setStudentProfile(res.data);
    } catch (err) {
      console.error("Update failed:", err);
      toast.error("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400";
  const readOnlyCls =
    "w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-700";

  const profileImg = preview || profileImgPath;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="flex justify-between items-center px-6 py-4 bg-white shadow">
        <Link
          to="/student-dashboard"
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
          onClick={handleBackClick}
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Back to Dashboard</span>
        </Link>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-6 py-8 w-full">
        {hasUnsavedChanges && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              You have unsaved changes. Don't forget to save your profile updates.
            </p>
          </div>
        )}

        <section className="mb-12">
          <h2 className="text-xl font-bold mb-1 text-gray-800">My Profile</h2>
          <p className="text-sm text-gray-500 mb-6">
            Keep your student record up to date — the department admin can see this
            information.
          </p>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Left: photo + identity */}
            <div className="bg-white p-6 rounded-lg shadow flex flex-col items-center md:w-1/3">
              <div className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden mb-4 flex items-center justify-center">
                {profileImg ? (
                  <img src={profileImg} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <UserCircle2 className="w-24 h-24 text-gray-400" />
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files[0] && handleImageUpload(e.target.files[0])}
                className="hidden"
                id="upload"
                disabled={uploadingImage}
              />
              <label
                htmlFor="upload"
                className={`text-orange-500 font-semibold cursor-pointer hover:underline ${
                  uploadingImage ? "opacity-50" : ""
                }`}
              >
                {uploadingImage ? "Uploading..." : "Upload Photo"}
              </label>
              <p className="mt-2 text-sm text-gray-500 text-center">Under 1MB • 1:1 Ratio</p>

              <div className="mt-4 w-full">
                <ImageInput
                  label="…or paste a photo link"
                  value={profileImgPath}
                  onChange={(v) => {
                    setProfileImgPath(v);
                    setPreview(null);
                  }}
                  placeholder="https://…/photo.jpg"
                  previewClass="h-20 w-20 rounded-full"
                />
              </div>

              <div className="mt-6 w-full space-y-3 text-sm">
                <div>
                  <p className="text-gray-500">Registration ID</p>
                  <p className="font-semibold text-gray-800 break-all">
                    {studentProfile?.registration_number || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Institutional email</p>
                  <p className="font-medium text-gray-800 break-all">{user?.email}</p>
                </div>
                <div className="flex gap-4">
                  <div>
                    <p className="text-gray-500">Batch</p>
                    <p className="font-medium text-gray-800">{studentProfile?.batch ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Semester</p>
                    <p className="font-medium text-gray-800">
                      {studentProfile?.current_semester || "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: editable form */}
            <form className="md:w-2/3 bg-white p-6 rounded-lg shadow" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {TEXT_FIELDS.map((f) => (
                  <div key={f.name}>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      {f.label}
                    </label>
                    {f.type === "select" ? (
                      <select
                        value={form[f.name] || ""}
                        onChange={(e) => setField(f.name, e.target.value)}
                        className={inputCls}
                      >
                        {f.options.map((o) => (
                          <option key={o} value={o}>
                            {o || "Select…"}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={f.type}
                        value={form[f.name] || ""}
                        placeholder={f.placeholder || ""}
                        onChange={(e) => setField(f.name, e.target.value)}
                        className={inputCls}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-4">
                {AREA_FIELDS.map((f) => (
                  <div key={f.name}>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      {f.label}
                    </label>
                    <textarea
                      rows={2}
                      value={form[f.name] || ""}
                      onChange={(e) => setField(f.name, e.target.value)}
                      className={inputCls}
                    />
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={saving}
                className="mt-6 w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-2 rounded-md transition"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
};

export default SettingsPage;
