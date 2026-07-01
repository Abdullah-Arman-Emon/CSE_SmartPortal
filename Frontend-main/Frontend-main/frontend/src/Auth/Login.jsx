import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, AlertCircle } from "lucide-react";

import { AuthContext } from "../context/AuthContext";
import AuthLayout from "./AuthLayout";
import Spinner from "../components/ui/Spinner";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function Login() {
  const { setToken, user, setUser, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/v1/auth/login`, {
        email: formData.email,
        password: formData.password,
      });
      const token = response.data?.access_token;
      if (formData.rememberMe) {
        localStorage.setItem("token", token);
      } else {
        sessionStorage.setItem("token", token);
      }
      setToken(token); // AuthProvider fetches the user automatically
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed. Check your credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!loading && user?.isAuthenticated) {
      switch (user.role) {
        case "admin":
          navigate("/admin-dashboard");
          break;
        case "teacher":
          navigate("/teacher-dashboard");
          break;
        case "student":
          navigate("/student-dashboard");
          break;
        default:
          navigate("/");
      }
    }
  }, [user, loading, navigate]);

  if (!loading && user?.isAuthenticated) return null;

  const inputCls =
    "w-full pl-11 pr-4 py-3 bg-slate-800/70 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40 transition-colors";

  return (
    <AuthLayout
      subtitle={
        <div className="mb-8 text-center lg:text-left">
          <h1 className="text-3xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-slate-400 text-sm">Log in to access your dashboard.</p>
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
              type="text" id="email" name="email"
              value={formData.email} onChange={handleChange} required
              placeholder="you@cs.du.ac.bd" className={inputCls}
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-slate-400 text-sm mb-2">Password</label>
          <div className="relative">
            <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="password" id="password" name="password"
              value={formData.password} onChange={handleChange} required
              placeholder="••••••••" className={inputCls}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-slate-400 text-sm cursor-pointer">
            <input
              type="checkbox" name="rememberMe"
              checked={formData.rememberMe} onChange={handleChange}
              className="w-4 h-4 rounded accent-indigo-500"
            />
            Remember me
          </label>
          <span className="text-slate-600 text-sm cursor-not-allowed" title="Please contact the department office">
            Forgot password?
          </span>
        </div>

        <button
          type="submit" disabled={submitting}
          className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
        >
          {submitting && <Spinner size={18} />}
          {submitting ? "Logging in…" : "Login"}
        </button>

        <p className="text-center text-slate-400 text-sm">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="text-indigo-400 hover:text-indigo-300">Sign up</Link>
        </p>
        <p className="text-center">
          <Link to="/" className="text-slate-500 hover:text-slate-400 text-sm">← Back to homepage</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default Login;
