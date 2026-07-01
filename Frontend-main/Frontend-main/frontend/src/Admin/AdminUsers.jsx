import { useState, useEffect } from "react";
import axios from "axios";
import { Users, Search, ShieldCheck, ShieldOff, KeyRound } from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const ROLE_STYLES = {
  admin: "bg-red-100 text-red-800",
  teacher: "bg-purple-100 text-purple-800",
  student: "bg-blue-100 text-blue-800",
};

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [message, setMessage] = useState({ type: "", text: "" });

  const fetchUsers = () => {
    setLoading(true);
    axios
      .get(`${BACKEND_URL}/v1/auth/users`)
      .then((res) => setUsers(res.data || []))
      .catch((err) => console.error("users", err))
      .finally(() => setLoading(false));
  };

  useEffect(fetchUsers, []);

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
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-1">Oversee accounts — activate, deactivate, or reset passwords.</p>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{u.email}</td>
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminUsers;
