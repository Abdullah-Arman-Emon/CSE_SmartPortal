import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { Users, Search, ShieldCheck, ShieldOff, KeyRound, MailPlus, Trash2, GraduationCap, UserCog, Shield, ArrowLeftRight, Check, X, Eye } from "lucide-react";
import { AuthContext } from "../context/AuthContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const ROLE_STYLES = {
  admin: "bg-red-100 text-red-800",
  teacher: "bg-purple-100 text-purple-800",
  student: "bg-blue-100 text-blue-800",
};

function AdminUsers() {
  const { user } = useContext(AuthContext);
  const adminId = user?.id;
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [message, setMessage] = useState({ type: "", text: "" });

  // Sign-up allowlist state
  const [allowed, setAllowed] = useState([]);
  const [allowedSearch, setAllowedSearch] = useState("");
  const [newEmails, setNewEmails] = useState("");
  const [newRole, setNewRole] = useState("student");
  const [adding, setAdding] = useState(false);

  // Full student-profile viewer
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const viewProfile = async (u) => {
    setProfile({ __loading: true, name: u.name, email: u.email });
    setProfileLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/v1/auth/students/${u.id}/profile`);
      setProfile(res.data);
    } catch (err) {
      flash("error", err.response?.data?.detail || "No profile found for this user");
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchAllowed = () => {
    if (!adminId) return;
    axios
      .get(`${BACKEND_URL}/v1/auth/allowed-emails?user_id=${adminId}`)
      .then((res) => setAllowed(res.data || []))
      .catch((err) => console.error("allowed-emails", err));
  };

  useEffect(fetchAllowed, [adminId]);

  const addAllowed = async () => {
    // For students each line may carry the registration number (and name):
    //   email, registration_number, Full Name
    // For teachers, or students without a reg number, a plain email is fine.
    const lines = newEmails.split(/[\n;]+/).map((s) => s.trim()).filter(Boolean);
    if (lines.length === 0) return flash("error", "Paste at least one email.");

    const entries = [];
    const emails = [];
    lines.forEach((line) => {
      const parts = line.split(",").map((s) => s.trim());
      const email = parts[0];
      if (!email) return;
      if (newRole === "student" && parts.length > 1) {
        entries.push({
          email,
          registration_number: parts[1] || null,
          full_name: parts.slice(2).join(", ") || null,
        });
      } else {
        emails.push(email);
      }
    });

    const payload = { role: newRole };
    if (entries.length) payload.entries = entries;
    if (emails.length) payload.emails = emails;

    setAdding(true);
    try {
      const res = await axios.post(
        `${BACKEND_URL}/v1/auth/allowed-emails?user_id=${adminId}`,
        payload
      );
      const { added, skipped, invalid } = res.data;
      let text = `${added} email${added !== 1 ? "s" : ""} approved`;
      if (skipped.length) text += `, ${skipped.length} already in the list`;
      if (invalid.length) text += `, ${invalid.length} invalid (${invalid.join(", ")})`;
      flash(invalid.length ? "error" : "success", text);
      setNewEmails("");
      fetchAllowed();
    } catch (err) {
      flash("error", err.response?.data?.detail || "Failed to add emails");
    } finally {
      setAdding(false);
    }
  };

  const removeAllowed = async (entry) => {
    if (!window.confirm(`Remove ${entry.email} from the sign-up allowlist?`)) return;
    try {
      await axios.delete(`${BACKEND_URL}/v1/auth/allowed-emails/${entry.id}?user_id=${adminId}`);
      setAllowed((prev) => prev.filter((a) => a.id !== entry.id));
      flash("success", `${entry.email} removed`);
    } catch (err) {
      flash("error", err.response?.data?.detail || "Failed to remove");
    }
  };

  const filteredAllowed = allowed.filter((a) =>
    a.email.includes(allowedSearch.toLowerCase())
  );

  const fetchUsers = () => {
    setLoading(true);
    axios
      .get(`${BACKEND_URL}/v1/auth/users`)
      .then((res) => setUsers(res.data || []))
      .catch((err) => console.error("users", err))
      .finally(() => setLoading(false));
  };

  useEffect(fetchUsers, []);

  // Batch-change requests (drop / readmission / full-semester retake)
  const [changeReqs, setChangeReqs] = useState([]);
  const fetchChangeReqs = () => {
    if (!adminId) return;
    axios
      .get(`${BACKEND_URL}/v1/batch-change/admin/list?user_id=${adminId}&status=pending`)
      .then((res) => setChangeReqs(res.data || []))
      .catch(() => {});
  };
  useEffect(fetchChangeReqs, [adminId]);

  const decideChange = async (req, action) => {
    const note = action === "reject"
      ? (window.prompt("Reason (optional, shown to student):") || "")
      : "";
    try {
      await axios.put(
        `${BACKEND_URL}/v1/batch-change/admin/${req.id}/${action}?user_id=${adminId}`,
        { note }
      );
      flash("success", action === "approve"
        ? `${req.student_name} moved to Batch ${req.to_batch} (${req.to_semester})`
        : `Request from ${req.student_name} rejected`);
      fetchChangeReqs();
      fetchUsers();
    } catch (err) {
      flash("error", err.response?.data?.detail || "Failed");
    }
  };

  const flash = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const toggleActive = async (u) => {
    try {
      await axios.put(`${BACKEND_URL}/v1/auth/users/${u.id}/active?active=${!u.is_active}`);
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_active: !u.is_active } : x)));
      flash("success", `${u.email} ${!u.is_active ? "activated" : "deactivated"}`);
    } catch (err) {
      flash("error", err.response?.data?.detail || "Failed to update");
    }
  };

  const deleteUser = async (u) => {
    if (!window.confirm(`Permanently delete ${u.name || u.email} (${u.role})? This cannot be undone.`)) return;
    try {
      await axios.delete(`${BACKEND_URL}/v1/auth/users/${u.id}?actor_id=${adminId}`);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      flash("success", `${u.email} deleted`);
    } catch (err) {
      flash("error", err.response?.data?.detail || "Failed to delete user");
    }
  };

  const resetPassword = async (u) => {
    const pwd = window.prompt(`New password for ${u.email} (min 6 chars):`);
    if (!pwd) return;
    if (pwd.length < 6) return flash("error", "Password must be at least 6 characters.");
    try {
      await axios.put(
        `${BACKEND_URL}/v1/auth/users/${u.id}/reset-password?new_password=${encodeURIComponent(pwd)}`
      );
      flash("success", `Password reset for ${u.email}`);
    } catch (err) {
      flash("error", err.response?.data?.detail || "Failed to reset password");
    }
  };

  const filtered = users.filter(
    (u) =>
      (roleFilter === "all" || u.role === roleFilter) &&
      ((u.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (u.name || "").toLowerCase().includes(search.toLowerCase()))
  );

  const counts = {
    total: users.length,
    student: users.filter((u) => u.role === "student").length,
    teacher: users.filter((u) => u.role === "teacher").length,
    admin: users.filter((u) => u.role === "admin").length,
  };
  const STAT_CARDS = [
    { key: "all", label: "Total Users", value: counts.total, Icon: Users, tint: "text-slate-600 bg-slate-100" },
    { key: "student", label: "Students", value: counts.student, Icon: GraduationCap, tint: "text-blue-600 bg-blue-50" },
    { key: "teacher", label: "Teachers", value: counts.teacher, Icon: UserCog, tint: "text-purple-600 bg-purple-50" },
    { key: "admin", label: "Admins", value: counts.admin, Icon: Shield, tint: "text-red-600 bg-red-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-1">Oversee accounts — activate, deactivate, reset passwords, or delete.</p>
      </div>

      {/* Role counts */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STAT_CARDS.map((c) => (
          <button
            key={c.key}
            onClick={() => setRoleFilter(c.key)}
            className={`bg-white rounded-xl border p-4 flex items-center gap-3 text-left transition hover:shadow-sm ${
              roleFilter === c.key ? "border-orange-400 ring-1 ring-orange-200" : "border-gray-200"
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.tint}`}>
              <c.Icon size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{c.label}</p>
              <p className="text-xl font-bold text-gray-900">{c.value}</p>
            </div>
          </button>
        ))}
      </div>

      {message.text && (
        <div
          className={`px-4 py-3 rounded-lg border ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Batch-change requests — approve/reject student moves */}
      {changeReqs.length > 0 && (
        <div className="bg-white rounded-lg border border-indigo-200 p-5 space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ArrowLeftRight size={18} className="text-indigo-500" /> Batch-change Requests
            <span className="text-xs bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5">{changeReqs.length} pending</span>
          </h2>
          <div className="divide-y divide-gray-100">
            {changeReqs.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="flex-1 min-w-[240px]">
                  <p className="text-sm font-medium text-gray-800">{r.student_name}</p>
                  <p className="text-xs text-gray-500">
                    Batch {r.from_batch ?? "—"} ({r.from_semester ?? "—"}) →{" "}
                    <b className="text-indigo-700">Batch {r.to_batch} ({r.to_semester})</b>
                  </p>
                  {r.reason && <p className="text-xs text-gray-400 mt-0.5">Reason: {r.reason}</p>}
                </div>
                <button onClick={() => decideChange(r, "approve")}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700">
                  <Check size={14} /> Approve
                </button>
                <button onClick={() => decideChange(r, "reject")}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white border text-red-600 hover:bg-red-50">
                  <X size={14} /> Reject
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sign-up allowlist — only these emails can register */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <MailPlus size={18} className="text-orange-500" /> Sign-up Allowlist
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Only CSE DU emails you approve here can create an account. One entry per line.
            For <b>students</b>, include the registration number (and name) so sign-up can
            verify identity: <code className="bg-gray-100 px-1 rounded">email, registration_no, Full Name</code>.
            Teachers can be a plain email.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <textarea
            value={newEmails}
            onChange={(e) => setNewEmails(e.target.value)}
            rows={3}
            placeholder={"arik-2022715876@cs.du.ac.bd, 2022-715-876, Arik Islam\nteacher@cse.du.ac.bd"}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <div className="flex sm:flex-col gap-2">
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
            <button
              onClick={addAllowed}
              disabled={adding}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
            >
              {adding ? "Adding…" : "Approve"}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <input
            value={allowedSearch}
            onChange={(e) => setAllowedSearch(e.target.value)}
            placeholder="Search approved emails…"
            className="flex-1 max-w-xs border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <span className="text-xs text-gray-500">
            {allowed.length} approved · {allowed.filter((a) => a.registered).length} signed up
          </span>
        </div>
        <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 border border-gray-100 rounded-lg">
          {filteredAllowed.length === 0 ? (
            <p className="p-4 text-sm text-gray-400">
              {allowed.length === 0
                ? "No approved emails yet — nobody can sign up until you add some."
                : "No match."}
            </p>
          ) : (
            filteredAllowed.map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                <span className="flex-1 min-w-0 text-gray-800 truncate">
                  {a.email}
                  {a.registration_number && (
                    <span className="ml-2 text-xs text-gray-400">#{a.registration_number}</span>
                  )}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_STYLES[a.role] || "bg-gray-100 text-gray-700"}`}>
                  {a.role}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${a.registered ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {a.registered ? "Signed up" : "Pending"}
                </span>
                <button onClick={() => removeAllowed(a)} className="text-red-500 hover:text-red-700">
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email…"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="all">All roles</option>
          <option value="student">Students</option>
          <option value="teacher">Teachers</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No users found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {u.name || "—"}
                      {u.batch && <span className="ml-2 text-xs text-gray-400">Batch {u.batch}</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {u.registration_number || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_STYLES[u.role] || "bg-gray-100 text-gray-700"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${u.is_active === false ? "bg-gray-200 text-gray-600" : "bg-green-100 text-green-800"}`}>
                        {u.is_active === false ? "Inactive" : "Active"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {u.role === "student" && (
                          <button
                            onClick={() => viewProfile(u)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                          >
                            <Eye size={14} /> Profile
                          </button>
                        )}
                        <button
                          onClick={() => toggleActive(u)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium ${
                            u.is_active === false
                              ? "bg-green-50 text-green-700 hover:bg-green-100"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {u.is_active === false ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
                          {u.is_active === false ? "Activate" : "Deactivate"}
                        </button>
                        <button
                          onClick={() => resetPassword(u)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-50 text-orange-700 hover:bg-orange-100"
                        >
                          <KeyRound size={14} /> Reset
                        </button>
                        <button
                          onClick={() => deleteUser(u)}
                          disabled={u.id === adminId}
                          title={u.id === adminId ? "You can't delete your own account" : "Delete user"}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Full student-profile viewer */}
      {profile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setProfile(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
              <h3 className="text-lg font-bold text-gray-900">Student Profile</h3>
              <button onClick={() => setProfile(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            {profileLoading || profile.__loading ? (
              <div className="p-10 text-center text-gray-500">Loading…</div>
            ) : (
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                    {profile.profile_image ? (
                      <img src={profile.profile_image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Users size={28} className="text-gray-300" />
                    )}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {[profile.first_name, profile.last_name].filter(Boolean).join(" ") || "—"}
                      {profile.nickname && <span className="text-sm text-gray-400"> ({profile.nickname})</span>}
                    </p>
                    <p className="text-sm text-gray-500">
                      Batch {profile.batch ?? "—"} · {profile.current_semester || "—"} ·{" "}
                      <span className="capitalize">{profile.status || "active"}</span>
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  {[
                    ["Registration ID", profile.registration_number],
                    ["Class roll", profile.roll],
                    ["Merit rank", profile.merit_rank],
                    ["Department", profile.department],
                    ["Gender", profile.gender],
                    ["Blood group", profile.blood_group],
                    ["Date of birth", profile.date_of_birth],
                    ["Mobile", profile.phone],
                    ["Guardian mobile", profile.guardian_mobile],
                    ["Institutional email", profile.institutional_email],
                    ["Personal email", profile.personal_email],
                    ["School", profile.school],
                    ["College", profile.college],
                    ["Allotted hall", profile.hall],
                    ["Present address", profile.present_address],
                    ["Permanent address", profile.permanent_address],
                    ["Facebook", profile.facebook_url],
                    ["Other social", profile.other_social],
                    ["Bio", profile.bio],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
                      <p className="text-gray-800 break-words">{value || "—"}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;
