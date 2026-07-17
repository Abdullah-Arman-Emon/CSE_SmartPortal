import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Mail, Lock, UserCog, Hash, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";

import AuthLayout from "./AuthLayout";
import Spinner from "../components/ui/Spinner";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const SignUp = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "student",
    batch: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = {
        email: formData.email,
        password: formData.password,
        role: formData.role.toLowerCase(),
      };
      if (user.role === "student") {
        user.batch = formData.batch ? parseInt(formData.batch) : null;
      }
      await axios.post(`${BACKEND_URL}/v1/auth/register`, user);
      navigate("/login");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    "w-full pl-11 pr-4 py-3 bg-slate-800/70 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40 transition-colors";

  const domainHint =
    formData.role === "student" ? "@cs.du.ac.bd" : "@cse.du.ac.bd";

  return (
    <AuthLayout
      subtitle={
        <div className="mb-8 text-center lg:text-left">
          <h1 className="text-3xl font-bold text-white mb-1">Create your account</h1>
          <p className="text-slate-400 text-sm">Create your account to access the student portal experience.</p>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-300 bg-red-500/10 border border-red-500/30 px-3 py-2.5 rounded-lg">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-slate-400 text-sm mb-2">Email</label>
          <div className="relative">
            <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="email" id="email" name="email"
              value={formData.email} onChange={handleChange} required
              placeholder={`example${domainHint}`} className={inputCls}
            />
          </div>
          <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-500">
            <CheckCircle2 size={12} /> Use your university email ({domainHint}).
          </p>
        </div>

        <div>
          <label htmlFor="password" className="block text-slate-400 text-sm mb-2">Password</label>
          <div className="relative">
            <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="password" id="password" name="password"
              value={formData.password} onChange={handleChange} required minLength={6}
              placeholder="At least 6 characters" className={inputCls}
            />
          </div>
        </div>

        <div>
          <label htmlFor="role" className="block text-slate-400 text-sm mb-2">Role</label>
          <div className="relative">
            <UserCog size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <select
              id="role" name="role" value={formData.role} onChange={handleChange} required
              className={`${inputCls} appearance-none`}
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
            <p className="mt-1.5 text-xs text-slate-500">
              Sign-up is limited to CSE DU emails pre-approved by the department admin.
            </p>
          </div>
        </div>

        {formData.role === "student" && (
          <div>
            <label htmlFor="batch" className="block text-slate-400 text-sm mb-2">Batch</label>
            <div className="relative">
              <Hash size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="number" id="batch" name="batch"
                value={formData.batch} onChange={handleChange} required
                placeholder="e.g., 27" className={inputCls}
              />
            </div>
          </div>
        )}

        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-slate-300">
          <div className="flex items-center gap-2 font-medium text-amber-300">
            <Sparkles size={16} /> Demo note
          </div>
          <p className="mt-1">This portal is designed for role-based access and a smoother onboarding experience for new students.</p>
        </div>

        <button
          type="submit" disabled={submitting}
          className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
        >
          {submitting && <Spinner size={18} />}
          {submitting ? "Creating account…" : "Sign Up"}
        </button>

        <p className="text-center text-slate-400 text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300">Log in</Link>
        </p>
        <p className="text-center">
          <Link to="/" className="text-slate-500 hover:text-slate-400 text-sm">← Back to homepage</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default SignUp;
