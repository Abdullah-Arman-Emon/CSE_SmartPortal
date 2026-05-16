import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
    Bell,
    Calendar,
    Clock,
    AlertCircle,
    Eye,
    Filter,
    Search,
    Users,
    BookOpen,
    ArrowLeft,
} from "lucide-react";

import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const StudentNotice = () => {
    const [notices, setNotices] = useState([]);
    const [selectedNotice, setSelectedNotice] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const { user } = useContext(AuthContext);


    useEffect(() => {
        const fetchNoticesInternal = async () => {
            setLoading(true);
            setError(null);
           
            let userString = user;
            let studentId = null;

            if (user) {
                try {
                    const userObj = user;
                    studentId = userObj.id; // or userObj.student_id if that's the field
                    // If batch is also present and you need it, use userObj.batch
                } catch (e) {
                    console.error(
                        "Failed to parse user from sessionStorage:",
                        e
                    );
                }
            }
            console.log(studentId);
            if (!studentId) {
               studentId = user?.id;
            }
            if (!studentId) {
                setError("Student ID not found. Please log in again.");
                setLoading(false);
                return;
            }

            try {
                // Notices are sent to all batches, no batch filtering needed
                //const studentId = localStorage.getItem('student_id');

                //const response = await axios.get(`${BACKEND_URL}/student/notice/upcoming`);
                const response = await axios.get(
                    `${BACKEND_URL}/student/notice/upcoming?student_id=${studentId}`
                );
                // Sort notices by date and time (newest first)
                const sortedNotices = response.data.sort((a, b) => {
                    return new Date(b.date) - new Date(a.date);
                });

                setNotices(sortedNotices);
            } catch (error) {
                console.error("Error fetching notices:", error);
                setError("Failed to load notices. Please try again.");
                // Set some mock data for testing
                setNotices([
                    {
                        id: 1,
                        title: "Mid Term Examination Schedule",
                        description:
                            "Mid term examinations will be held from July 20-25, 2025. Please check your individual schedules.",
                        date: "2025-07-20T09:00:00",
                        batch: null,
                        created_at: "2025-07-14T10:00:00",
                    },
                    {
                        id: 2,
                        title: "Holiday Announcement",
                        description:
                            "University will remain closed on July 30, 2025 due to national holiday.",
                        date: "2025-07-30T00:00:00",
                        batch: null,
                        created_at: "2025-07-14T11:00:00",
                    },
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchNoticesInternal();
    }, []);

    const fetchSpecificNotice = async (noticeId) => {
        try {
            const response = await axios.get(
                `${BACKEND_URL}/student/notice/${noticeId}`
            );
            setSelectedNotice(response.data);
            console.log("Selected notice:", response.data); // <-- Add this line
            setShowModal(true);
        } catch (error) {
            console.error("Error fetching specific notice:", error);
            setError("Failed to load notice details. Please try again.");
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const isUpcoming = (dateString) => {
        return new Date(dateString) > new Date();
    };

    const getTimeUntil = (dateString) => {
        const now = new Date();
        const noticeDate = new Date(dateString);
        const diffTime = noticeDate - now;

        if (diffTime < 0) return "Past";

        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Tomorrow";
        if (diffDays < 7) return `In ${diffDays} days`;
        if (diffDays < 30) return `In ${Math.ceil(diffDays / 7)} weeks`;
        return `In ${Math.ceil(diffDays / 30)} months`;
    };

    // Filter notices based on search
    const filteredNotices = notices.filter(
        (notice) =>
            notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            notice.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const closeModal = () => {
        setShowModal(false);
        setSelectedNotice(null);
    };

    // If no backend URL, show error message
    if (!BACKEND_URL) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h2 className="text-lg font-semibold text-red-800 mb-2">
                        Configuration Error
                    </h2>
                    <p className="text-red-700">
                        Backend URL is not configured. Please check your
                        environment variables.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        to="/student-dashboard"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors duration-200 mb-4"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">Back to Dashboard</span>
                    </Link>
                    <div className="flex items-center mb-4">
                        <Bell className="w-8 h-8 text-blue-600 mr-3" />
                        <h1 className="text-3xl font-bold text-gray-900">
                            Notice Board
                        </h1>
                    </div>
                    <p className="text-gray-600">
                        Stay updated with important announcements and upcoming
                        events for all students
                    </p>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search notices..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                        <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                        <span className="text-red-700">{error}</span>
                    </div>
                )}

                {/* Notices List */}
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : filteredNotices.length === 0 ? (
                    <div className="text-center py-12">
                        <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No Notices Found
                        </h3>
                        <p className="text-gray-500">
                            {searchTerm
                                ? "No notices match your search."
                                : "There are no upcoming notices at the moment."}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredNotices.map((notice) => (
                            <div
                                key={notice.id}
                                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                                onClick={() => fetchSpecificNotice(notice.id)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center mb-2">
                                            <h3 className="text-lg font-semibold text-gray-900 mr-3">
                                                {notice.title}
                                            </h3>
                                            {notice.batch ? (
                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                                    Batch {notice.batch}
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                                    All Batches
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-gray-600 mb-4 line-clamp-2">
                                            {notice.description}
                                        </p>

                                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                                            <div className="flex items-center">
                                                <Calendar className="w-4 h-4 mr-1" />
                                                {formatDate(notice.date)}
                                            </div>
                                            <div className="flex items-center">
                                                <Clock className="w-4 h-4 mr-1" />
                                                {formatTime(notice.date)}
                                            </div>
                                            <div
                                                className={`flex items-center font-medium ${
                                                    isUpcoming(notice.date)
                                                        ? "text-blue-600"
                                                        : "text-gray-500"
                                                }`}
                                            >
                                                <AlertCircle className="w-4 h-4 mr-1" />
                                                {getTimeUntil(notice.date)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="ml-4 flex items-center">
                                        <Eye className="w-5 h-5 text-gray-400" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Notice Detail Modal */}
                {showModal && selectedNotice && (
                    <div className="fixed inset-0 bg-black/20 bg-opacity-50 backdrop-blur-lg flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center">
                                        <Bell className="w-6 h-6 text-blue-600 mr-2" />
                                        <h2 className="text-xl font-bold text-gray-900">
                                            {selectedNotice.title}
                                        </h2>
                                    </div>
                                    <button
                                        onClick={closeModal}
                                        className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                                    >
                                        ×
                                    </button>
                                </div>

                                <div className="mb-4 flex items-center space-x-3">
                                    {selectedNotice.batch ? (
                                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                                            Batch {selectedNotice.batch}
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                                            All Batches
                                        </span>
                                    )}
                                    <span
                                        className={`px-3 py-1 text-sm font-medium rounded-full ${
                                            isUpcoming(selectedNotice.date)
                                                ? "bg-blue-100 text-blue-800"
                                                : "bg-gray-100 text-gray-800"
                                        }`}
                                    >
                                        {getTimeUntil(selectedNotice.date)}
                                    </span>
                                </div>

                                <div className="mb-6 space-y-2">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        Notice Date:{" "}
                                        {formatDateTime(selectedNotice.date)}
                                    </div>
                                    {selectedNotice.created_at && (
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Clock className="w-4 h-4 mr-2" />
                                            Posted:{" "}
                                            {formatDateTime(
                                                selectedNotice.created_at
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                        Description
                                    </h3>
                                    <div className="text-gray-700 whitespace-pre-wrap">
                                        {selectedNotice.description ||
                                            selectedNotice.content}
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        onClick={closeModal}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentNotice;
