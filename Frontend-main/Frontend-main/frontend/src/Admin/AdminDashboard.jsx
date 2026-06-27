import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';


import {
    Users,
    Calendar,
    BookOpen,
    BarChart3,
    Plus,
    Clock,
    UserCheck,
    FileText,
    Package,
    GraduationCap,
    CalendarDays,
    Bell,
    DollarSign,
    Home,
    Menu,
    X,
} from "lucide-react";
import axios from "axios";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FaCalendarAlt } from "react-icons/fa";
import AdminMeeting from "./AdminMeeting";
import AdminAdmission from "./AdminAdmission";
import AdminEquipment from "./AdminEquipment";
import AdminExam from "./AdminExam";
import AdminEvent from "./AdminEvent";
import AdminNotice from "./AdminNotice";
import AdminFinance from "./AdminFinance";


const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

function AdminDashboard() {
    const [activeTab, setActiveTab] = useState("dashboard");
    const { user, setUser } = useContext(AuthContext);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [dashboardData, setDashboardData] = useState({
        totalStudents: 0,
        totalTeachers: 0,
        totalCourses: 0,
        upcomingMeetings: 0,
        totalApplications: 0,
        recentApplications: 0,
        totalEquipment: 0,
        equipmentInUse: 0,
        totalExams: 0,
        examsSoon: 0,
        totalEvents: 0,
        upcomingEvents: 0,
        runningEvents: 0,
        totalNotices: 0,
        urgentNotices: 0,
        totalFinanceEvents: 0,
        pendingPayments: 0,
        totalRevenue: 0,
    });
    const [recentMeetings, setRecentMeetings] = useState([]);


    // Fetch dashboard data
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch upcoming meetings
                const meetingsResponse = await axios.get(
                    `${BACKEND_URL}/v1/meetings/upcoming`
                );
                const meetings = meetingsResponse.data;
                setRecentMeetings(meetings.slice(0, 3)); // Show only first 3

                // Fetch admission applications with error handling
                let applications = [];
                try {
                    const admissionsResponse = await axios.get(
                        `${BACKEND_URL}/admin/admission/list`
                    );
                    applications = admissionsResponse.data;
                } catch (admissionError) {
                    console.error(
                        "Failed to fetch admissions:",
                        admissionError
                    );
                    console.log(
                        "Admissions API Error Details:",
                        admissionError.response?.data
                    );
                    applications = [];
                }

                // Fetch equipment data with error handling
                let equipmentList = [];
                try {
                    const equipmentResponse = await axios.get(
                        `${BACKEND_URL}/admin/equipment/list`
                    );
                    equipmentList = equipmentResponse.data;
                } catch (equipmentError) {
                    console.error("Failed to fetch equipment:", equipmentError);
                    console.log(
                        "Equipment API Error Details:",
                        equipmentError.response?.data
                    );
                    equipmentList = [];
                }

                // Fetch student equipment orders
                const ordersResponse = await axios.get(
                    `${BACKEND_URL}/admin/equipment/student-equipments/list-all`
                );
                const orders = ordersResponse.data;
                const equipmentInUse = orders.filter(
                    (order) => !order.returned
                ).length;

                // Fetch exam data
                const examsResponse = await axios.get(
                    `${BACKEND_URL}/admin/exams/list`
                );
                const examsList = examsResponse.data;

                // Calculate exams happening soon (within 24 hours)
                const now = new Date();
                const examsSoon = examsList.filter((exam) => {
                    const examDate = new Date(exam.date);
                    const diffHours = (examDate - now) / (1000 * 60 * 60);
                    return diffHours <= 24 && diffHours > 0;
                }).length;

                // Fetch event data with error handling
                let eventsList = [];
                try {
                    const eventsResponse = await axios.get(
                        `${BACKEND_URL}/admin/events/get/all`
                    );
                    eventsList = eventsResponse.data;
                } catch (eventsError) {
                    console.error("Failed to fetch events:", eventsError);
                    console.log(
                        "Events API Error Details:",
                        eventsError.response?.data
                    );
                    eventsList = [];
                }

                // Calculate upcoming and running events
                const upcomingEvents = eventsList.filter((event) => {
                    const startDate = new Date(event.start_date);
                    return startDate > now;
                }).length;

                const runningEvents = eventsList.filter((event) => {
                    const startDate = new Date(event.start_date);
                    const endDate = event.end_date
                        ? new Date(event.end_date)
                        : startDate;
                    return startDate <= now && endDate >= now;
                }).length;

                // Fetch notice data with error handling
                let noticesList = [];
                let urgentNotices = 0;
                try {
                    const noticesResponse = await axios.get(
                        `${BACKEND_URL}/admin/notices/all`
                    );
                    // Sort notices by date and time (newest first)
                    noticesList = noticesResponse.data.sort((a, b) => {
                        return new Date(b.date) - new Date(a.date);
                    });

                    // Calculate urgent notices (published within last 24 hours)
                    const twentyFourHoursAgo = new Date();
                    twentyFourHoursAgo.setHours(
                        twentyFourHoursAgo.getHours() - 24
                    );

                    urgentNotices = noticesList.filter((notice) => {
                        const noticeDate = new Date(notice.date);
                        return noticeDate >= twentyFourHoursAgo;
                    }).length;
                } catch (noticesError) {
                    console.error("Failed to fetch notices:", noticesError);
                    console.log(
                        "Notices API Error Details:",
                        noticesError.response?.data
                    );
                    noticesList = [];
                    urgentNotices = 0;
                }

                // Fetch finance data
                const financeEventsResponse = await axios.get(
                    `${BACKEND_URL}/v1/finance/events`
                );
                const financeEventsList = financeEventsResponse.data;

                // Fetch pending payments
                const pendingPaymentsResponse = await axios.get(
                    `${BACKEND_URL}/v1/finance/payments/pending`
                );
                const pendingPaymentsList = pendingPaymentsResponse.data;

                // Fetch paid payments
                const paidPaymentsResponse = await axios.get(
                    `${BACKEND_URL}/v1/finance/payments/paid`
                );
                const paidPaymentsList = paidPaymentsResponse.data;

                // Calculate total revenue
                const totalRevenue = paidPaymentsList.reduce((sum, payment) => {
                    const event = financeEventsList.find(
                        (e) => e.id === payment.event_id
                    );
                    return sum + (event ? event.amount : 0);
                }, 0);

                // Calculate recent applications (last 7 days)
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                const recentApps = applications.filter((app) => {
                    const submittedDate = new Date(app.form_given_on);
                    return submittedDate >= sevenDaysAgo;
                });

                // Update dashboard stats
                setDashboardData((prev) => ({
                    ...prev,
                    upcomingMeetings: meetings.length,
                    totalApplications: applications.length,
                    recentApplications: recentApps.length,
                    totalEquipment: equipmentList.length,
                    equipmentInUse: equipmentInUse,
                    totalExams: examsList.length,
                    examsSoon: examsSoon,
                    totalEvents: eventsList.length,
                    upcomingEvents: upcomingEvents,
                    runningEvents: runningEvents,
                    totalNotices: noticesList.length,
                    urgentNotices: urgentNotices,
                    totalFinanceEvents: financeEventsList.length,
                    pendingPayments: pendingPaymentsList.length,
                    totalRevenue: totalRevenue,
                }));

                // TODO: Add API calls for students, teachers, and courses count when available
                // For now, using mock data
                setDashboardData((prev) => ({
                    ...prev,
                    totalStudents: 150,
                    totalTeachers: 25,
                    totalCourses: 35,
                }));
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            }
        };

        fetchDashboardData();
    }, []);

    const formatDateTime = (dateTimeString) => {
        const date = new Date(dateTimeString);
        return {
            date: date.toLocaleDateString(),
            time: date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            }),
        };
    };

    const navigationItems = [
        { id: "dashboard", label: "Dashboard", icon: BarChart3 },
        { id: "meetings", label: "Meetings", icon: Calendar },
        { id: "admissions", label: "Admissions", icon: FileText },
        { id: "equipment", label: "Equipment", icon: Package },
        { id: "exams", label: "Exams", icon: GraduationCap },
        { id: "events", label: "Events", icon: CalendarDays },
        { id: "notices", label: "Notices", icon: Bell },
        { id: "finance", label: "Finance", icon: DollarSign },
    ];

    const statsCards = [
        {
            title: "Upcoming Meetings",
            value: dashboardData.upcomingMeetings,
            icon: Calendar,
            color: "bg-orange-500",
            bgColor: "bg-orange-50",
        },
        {
            title: "Total Applications",
            value: dashboardData.totalApplications,
            icon: FileText,
            color: "bg-indigo-500",
            bgColor: "bg-indigo-50",
        },
        {
            title: "Recent Applications",
            value: dashboardData.recentApplications,
            icon: FileText,
            color: "bg-pink-500",
            bgColor: "bg-pink-50",
        },
        {
            title: "Total Equipment",
            value: dashboardData.totalEquipment,
            icon: Package,
            color: "bg-teal-500",
            bgColor: "bg-teal-50",
        },
        {
            title: "Equipment In Use",
            value: dashboardData.equipmentInUse,
            icon: Package,
            color: "bg-amber-500",
            bgColor: "bg-amber-50",
        },
        {
            title: "Total Exams",
            value: dashboardData.totalExams,
            icon: GraduationCap,
            color: "bg-violet-500",
            bgColor: "bg-violet-50",
        },
        {
            title: "Exams Soon",
            value: dashboardData.examsSoon,
            icon: GraduationCap,
            color: "bg-rose-500",
            bgColor: "bg-rose-50",
        },
        {
            title: "Total Events",
            value: dashboardData.totalEvents,
            icon: CalendarDays,
            color: "bg-cyan-500",
            bgColor: "bg-cyan-50",
        },
        {
            title: "Upcoming Events",
            value: dashboardData.upcomingEvents,
            icon: CalendarDays,
            color: "bg-emerald-500",
            bgColor: "bg-emerald-50",
        },
        {
            title: "Running Events",
            value: dashboardData.runningEvents,
            icon: CalendarDays,
            color: "bg-lime-500",
            bgColor: "bg-lime-50",
        },
        {
            title: "Total Notices",
            value: dashboardData.totalNotices,
            icon: Bell,
            color: "bg-yellow-500",
            bgColor: "bg-yellow-50",
        },
        {
            title: "Urgent Notices",
            value: dashboardData.urgentNotices,
            icon: Bell,
            color: "bg-red-500",
            bgColor: "bg-red-50",
        },
        {
            title: "Finance Events",
            value: dashboardData.totalFinanceEvents,
            icon: DollarSign,
            color: "bg-green-500",
            bgColor: "bg-green-50",
        },
        {
            title: "Pending Payments",
            value: dashboardData.pendingPayments,
            icon: Clock,
            color: "bg-orange-500",
            bgColor: "bg-orange-50",
        },
        {
            title: "Total Revenue",
            value: `৳${dashboardData.totalRevenue.toLocaleString()}`,
            icon: DollarSign,
            color: "bg-emerald-500",
            bgColor: "bg-emerald-50",
        },
    ];

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.4,
                when: "beforeChildren",
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.3 } },
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
                <div className="px-4 sm:px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                                Admin Dashboard
                            </h1>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4">
                            <div className="hidden md:block text-sm text-gray-500">
                                {new Date().toLocaleDateString("en-US", {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                })}
                            </div>
                            <Link
                                to="/"
                                className="flex items-center gap-1 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
                            >
                                <Home size={16} />
                                <span className="text-sm font-medium hidden sm:inline">
                                    Home
                                </span>
                            </Link>
                            <button
                                className="md:hidden p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
                                onClick={toggleMobileMenu}
                            >
                                {isMobileMenuOpen ? (
                                    <X size={24} />
                                ) : (
                                    <Menu size={24} />
                                )}
                            </button>
                        </div>

                    </div>
                </div>
            </header>

            <div className="flex flex-col md:flex-row">
                {/* Sidebar - Desktop */}
                <aside
                    className={`hidden md:block w-64 bg-white shadow-sm min-h-[calc(100vh-73px)] sticky top-[73px]`}
                >
                    <nav className="p-4">
                        <ul className="space-y-2">
                            {navigationItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <li key={item.id}>
                                        <button
                                            onClick={() =>
                                                setActiveTab(item.id)
                                            }
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                                                activeTab === item.id
                                                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-sm"
                                                    : "text-gray-600 hover:bg-orange-50 hover:text-orange-700"
                                            }`}
                                        >
                                            <Icon size={20} />
                                            {item.label}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>
                </aside>


                {/* Mobile Navigation */}
                <div
                    className={`${
                        isMobileMenuOpen ? "block" : "hidden"
                    } md:hidden bg-white shadow-lg border-b border-gray-200 w-full`}
                >
                    <nav className="p-4">
                        <ul className="space-y-2">
                            {navigationItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <li key={item.id}>
                                        <button
                                            onClick={() => {
                                                setActiveTab(item.id);
                                                setIsMobileMenuOpen(false);
                                            }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                                                activeTab === item.id
                                                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-sm"
                                                    : "text-gray-600 hover:bg-orange-50 hover:text-orange-700"
                                            }`}
                                        >
                                            <Icon size={20} />
                                            {item.label}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>
                </div>


                {/* Main Content */}
                <main className="flex-1 p-4 sm:p-6">
                    {activeTab === "dashboard" && (
                        <motion.div
                            className="space-y-6"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {/* Stats Cards */}
                            <motion.div
                                variants={itemVariants}
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
                            >
                                {statsCards.map((card, index) => {
                                    const Icon = card.icon;
                                    const isEventCard =
                                        card.title.includes("Events") ||
                                        card.title === "Running Events" ||
                                        card.title === "Upcoming Events" ||
                                        card.title === "Total Events";

                                    return (
                                        <motion.div
                                            key={index}
                                            variants={itemVariants}
                                            className={`${
                                                isEventCard
                                                    ? "bg-orange-50 border-orange-200"
                                                    : card.bgColor
                                            } rounded-lg p-4 sm:p-6 border shadow-sm hover:shadow-md transition-shadow`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-600">
                                                        {card.title}
                                                    </p>
                                                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
                                                        {card.value}
                                                    </p>
                                                </div>
                                                <div
                                                    className={`${
                                                        isEventCard
                                                            ? "bg-gradient-to-r from-orange-500 to-orange-600"
                                                            : card.color
                                                    } p-3 rounded-lg`}
                                                >
                                                    <Icon
                                                        size={24}
                                                        className="text-white"
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>

                            {/* Recent Activity */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Upcoming Meetings */}
                                <motion.div
                                    variants={itemVariants}
                                    className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm"
                                >
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            Upcoming Meetings
                                        </h2>
                                        <button
                                            onClick={() =>
                                                setActiveTab("meetings")
                                            }
                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                        >
                                            View All
                                        </button>
                                    </div>

                                    {recentMeetings.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            <Calendar
                                                size={48}
                                                className="mx-auto mb-4 text-gray-300"
                                            />
                                            <p>No upcoming meetings</p>
                                            <button
                                                onClick={() =>
                                                    setActiveTab("meetings")
                                                }
                                                className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                                            >
                                                Create a meeting
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {recentMeetings.map((meeting) => {
                                                const { date, time } =
                                                    formatDateTime(
                                                        meeting.date_time
                                                    );
                                                return (
                                                    <div
                                                        key={meeting.id}
                                                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                                                    >
                                                        <div className="bg-blue-100 p-2 rounded-lg">
                                                            <Calendar
                                                                size={16}
                                                                className="text-blue-600"
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-gray-900 truncate">
                                                                {meeting.title}
                                                            </p>
                                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                                <Clock
                                                                    size={14}
                                                                />
                                                                {date} at {time}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </motion.div>

                                {/* Quick Actions */}
                                <motion.div
                                    variants={itemVariants}
                                    className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm"
                                >
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                        Quick Actions
                                    </h2>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        <button
                                            onClick={() =>
                                                setActiveTab("meetings")
                                            }
                                            className="flex flex-col items-center gap-2 p-3 sm:p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                                        >
                                            <div className="bg-blue-500 p-2 rounded-lg">
                                                <Plus
                                                    size={18}
                                                    className="text-white"
                                                />
                                            </div>
                                            <span className="text-xs sm:text-sm font-medium text-blue-700 text-center">
                                                Create Meeting
                                            </span>
                                        </button>

                                        <button
                                            onClick={() =>
                                                setActiveTab("admissions")
                                            }
                                            className="flex flex-col items-center gap-2 p-3 sm:p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                                        >
                                            <div className="bg-indigo-500 p-2 rounded-lg">
                                                <FileText
                                                    size={18}
                                                    className="text-white"
                                                />
                                            </div>
                                            <span className="text-xs sm:text-sm font-medium text-indigo-700 text-center">
                                                Manage Admissions
                                            </span>
                                        </button>

                                        <button
                                            onClick={() =>
                                                setActiveTab("equipment")
                                            }
                                            className="flex flex-col items-center gap-2 p-3 sm:p-4 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
                                        >
                                            <div className="bg-teal-500 p-2 rounded-lg">
                                                <Package
                                                    size={18}
                                                    className="text-white"
                                                />
                                            </div>
                                            <span className="text-xs sm:text-sm font-medium text-teal-700 text-center">
                                                Manage Equipment
                                            </span>
                                        </button>

                                        <button
                                            onClick={() =>
                                                setActiveTab("exams")
                                            }
                                            className="flex flex-col items-center gap-2 p-3 sm:p-4 bg-violet-50 rounded-lg hover:bg-violet-100 transition-colors"
                                        >
                                            <div className="bg-violet-500 p-2 rounded-lg">
                                                <GraduationCap
                                                    size={18}
                                                    className="text-white"
                                                />
                                            </div>
                                            <span className="text-xs sm:text-sm font-medium text-violet-700 text-center">
                                                Manage Exams
                                            </span>
                                        </button>

                                        <button
                                            onClick={() =>
                                                setActiveTab("events")
                                            }
                                            className="flex flex-col items-center gap-2 p-3 sm:p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                                        >
                                            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-2 rounded-lg">
                                                <FaCalendarAlt
                                                    size={18}
                                                    className="text-white"
                                                />
                                            </div>
                                            <span className="text-xs sm:text-sm font-medium text-orange-700 text-center">
                                                Manage Events
                                            </span>
                                        </button>

                                        <button
                                            onClick={() =>
                                                setActiveTab("notices")
                                            }
                                            className="flex flex-col items-center gap-2 p-3 sm:p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
                                        >
                                            <div className="bg-yellow-500 p-2 rounded-lg">
                                                <Bell
                                                    size={18}
                                                    className="text-white"
                                                />
                                            </div>
                                            <span className="text-xs sm:text-sm font-medium text-yellow-700 text-center">
                                                Manage Notices
                                            </span>
                                        </button>

                                        <button
                                            onClick={() =>
                                                setActiveTab("finance")
                                            }
                                            className="flex flex-col items-center gap-2 p-3 sm:p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                                        >
                                            <div className="bg-green-500 p-2 rounded-lg">
                                                <DollarSign
                                                    size={18}
                                                    className="text-white"
                                                />
                                            </div>
                                            <span className="text-xs sm:text-sm font-medium text-green-700 text-center">
                                                Manage Finance
                                            </span>
                                        </button>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Events Summary Section */}
                            {dashboardData.totalEvents > 0 && (
                                <motion.div
                                    variants={itemVariants}
                                    className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="inline-flex items-center justify-center p-2 bg-orange-100 rounded-full">
                                                <FaCalendarAlt className="text-orange-600 text-xl" />
                                            </div>
                                            <h2 className="text-lg font-semibold text-gray-900">
                                                Events Summary
                                            </h2>
                                        </div>
                                        <button
                                            onClick={() =>
                                                setActiveTab("events")
                                            }
                                            className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                                        >
                                            Manage Events
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                                            <h3 className="text-sm font-medium text-orange-800 mb-2">
                                                Total Events
                                            </h3>
                                            <div className="flex items-center justify-between">
                                                <p className="text-2xl font-bold text-orange-900">
                                                    {dashboardData.totalEvents}
                                                </p>
                                                <CalendarDays
                                                    size={24}
                                                    className="text-orange-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                                            <h3 className="text-sm font-medium text-orange-800 mb-2">
                                                Upcoming Events
                                            </h3>
                                            <div className="flex items-center justify-between">
                                                <p className="text-2xl font-bold text-orange-900">
                                                    {
                                                        dashboardData.upcomingEvents
                                                    }
                                                </p>
                                                <CalendarDays
                                                    size={24}
                                                    className="text-orange-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                                            <h3 className="text-sm font-medium text-orange-800 mb-2">
                                                Running Events
                                            </h3>
                                            <div className="flex items-center justify-between">
                                                <p className="text-2xl font-bold text-orange-900">
                                                    {
                                                        dashboardData.runningEvents
                                                    }
                                                </p>
                                                <CalendarDays
                                                    size={24}
                                                    className="text-orange-500"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <button
                                            onClick={() =>
                                                setActiveTab("events")
                                            }
                                            className="w-full py-2 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg transition-colors"
                                        >
                                            <Plus size={18} />
                                            <span className="font-medium">
                                                Create New Event
                                            </span>
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === "meetings" && <AdminMeeting />}

                    {activeTab === "admissions" && <AdminAdmission />}

                    {activeTab === "equipment" && <AdminEquipment />}

                    {activeTab === "exams" && <AdminExam />}

                    {activeTab === "events" && <AdminEvent />}

                    {activeTab === "notices" && <AdminNotice />}

                    {activeTab === "finance" && <AdminFinance />}
                </main>
            </div>
        </div>
    );

}

export default AdminDashboard;
