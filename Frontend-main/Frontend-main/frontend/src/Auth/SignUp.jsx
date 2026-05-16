import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const SignUp = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        role: "student", // Default role
        batch: "", // <- Add this
    });

    const [error, setError] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            // Prepare data to send, exclude rememberMe and fullname (if backend doesn't expect fullname)
            const user = {
                email: formData.email,
                password: formData.password,
                role: formData.role.toLowerCase(),
            };

            if (user.role === "student") {
                user.batch = formData.batch;
            }

            // Replace the URL with your actual backend URL
            const response = await axios.post(
                `${BACKEND_URL}/v1/auth/register`,
                user
            );

            console.log("Registration response:", response.data);

            // On success, navigate to login page
            navigate("/login");
        } catch (err) {
            // Axios error might not have response or data, so fallback safely
            setError(
                err.response?.data?.detail || // FastAPI typically uses `detail`
                    err.response?.data?.message || // or `message` if custom
                    "Registration failed. Please try again."
            );
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left side (signup form) */}
            <div className="w-full lg:w-1/2 bg-slate-900 flex items-center justify-center p-4">
                <div className="w-full max-w-md p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Create an Account
                        </h1>
                        <p className="text-slate-400 text-sm">
                            Sign up to get started with our platform.
                        </p>
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm text-center bg-red-100/10 py-2 rounded-lg mb-6">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-slate-400 text-sm mb-2"
                            >
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                placeholder="example@domain.com"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="block text-slate-400 text-sm mb-2"
                            >
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                placeholder="Enter your password"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="role"
                                className="block text-slate-400 text-sm mb-2"
                            >
                                Select Role
                            </label>
                            <select
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="student">Student</option>
                                <option value="teacher">Teacher</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        {formData.role === "student" && (
                            <div>
                                <label
                                    htmlFor="batch"
                                    className="block text-slate-400 text-sm mb-2"
                                >
                                    Batch
                                </label>
                                <input
                                    type="number"
                                    id="batch"
                                    name="batch"
                                    value={formData.batch}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    placeholder="e.g., 27"
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-800"
                        >
                            Sign Up
                        </button>

                        <p className="text-center text-slate-400 text-sm">
                            Already have an account?{" "}
                            <a
                                href="/login"
                                className="text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                Login Here
                            </a>
                        </p>

                        <div className="text-center mt-4">
                            <a
                                href="/"
                                className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
                            >
                                Back to Homepage
                            </a>
                        </div>
                    </form>
                </div>
            </div>

            {/* Right side (blank white area) */}
            <div className="hidden lg:block lg:w-1/2 bg-white"></div>
        </div>
    );
};

export default SignUp;
