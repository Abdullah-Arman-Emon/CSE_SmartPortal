import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

import CreateNewCourse from "./CreateNewCourse";
import MyCourses from "./MyCourses";
import TeacherSettings from "./TeacherSettings";
import TeacherMeeting from "./TeacherMeeting";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function TeacherDashboard() {
  const [activePage, setActivePage] = useState("Dashboard");
  const { user, setToken, setUser } = useContext(AuthContext);
  const [teacherProfile, setTeacherProfile] = useState({});
  const [dashboardData, setDashboardData] = useState({
    assignments_to_check: 0,
    running_courses: 0,
    total_students: 0,
    recent_activity: [],
    today_schedule: [],
  });
  // Add state for mobile sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // Close sidebar when changing pages on mobile
  const handlePageChange = (page) => {
    setActivePage(page);
    setSidebarOpen(false);
  };

  // Toggle sidebar for mobile
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Authentication check
  useEffect(() => {
    if (!user?.isAuthenticated) {
      navigate("/login");
      return;
    }
  }, [navigate]);

  useEffect(() => {
    const fetchTeacherProfile = async (userId) => {
      try {
        const response = await axios.get(
          `${BACKEND_URL}/v1/teacher/profile/get`,
          {
            params: { userId },
          }
        );
        setTeacherProfile(response.data);
      } catch (error) {
        console.error("Failed to fetch teacher profile:", error);
      }
    };

    if (user && user?.id) {
      fetchTeacherProfile(user?.id);
    }
  }, [user]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!teacherProfile?.id) return;

      try {
        const response = await axios.get(
          `${BACKEND_URL}/v1/teacher/dashboard/${teacherProfile.id}`
        );
        setDashboardData(response.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      }
    };

    if (teacherProfile?.id) {
      fetchDashboardData();
    }
  }, [teacherProfile]);

  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to logout?");
    if (confirmLogout) {
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");

      // console.log("After logout:", localStorage.getItem("token"));

      // Reset context
      setToken(null);
      setUser(null);

      // Navigate to home page
      navigate("/");
    }
  };

  const DashboardOverview = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-serif font-bold text-slate-800">
          Academic Dashboard
        </h1>
        <p className="text-sm text-slate-500 font-serif">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-lg font-serif font-medium text-slate-700">
              Pending Assessments
            </h3>
          </div>
          <div className="p-5 flex items-center">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-amber-100 text-amber-700 mr-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <div>
              <p className="text-3xl font-serif font-bold text-amber-700">
                {dashboardData.assignments_to_check}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Requires your attention
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-lg font-serif font-medium text-slate-700">
              Active Courses
            </h3>
          </div>
          <div className="p-5 flex items-center">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700 mr-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M12 14l9-5-9-5-9 5 9 5z" />
                <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
                />
              </svg>
            </div>
            <div>
              <p className="text-3xl font-serif font-bold text-emerald-700">
                {dashboardData.running_courses}
              </p>
              <p className="text-xs text-slate-500 mt-1">Current semester</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-lg font-serif font-medium text-slate-700">
              Enrolled Students
            </h3>
          </div>
          <div className="p-5 flex items-center">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 mr-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-3xl font-serif font-bold text-blue-700">
                {dashboardData.total_students}
              </p>
              <p className="text-xs text-slate-500 mt-1">Across all courses</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-lg font-serif font-medium text-slate-700 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-slate-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Today's Schedule
            </h3>
            <span className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-700 rounded">
              Academic Calendar
            </span>
          </div>
          {dashboardData.today_schedule.length === 0 ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-slate-600 font-serif">
                No classes scheduled for today
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Enjoy your day off from teaching
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {dashboardData.today_schedule.map((schedule, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-4 hover:bg-slate-50"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-slate-700 font-serif">
                        {schedule.course_title}
                      </p>
                      <p className="text-xs text-slate-500">
                        Room {schedule.room || "TBA"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-700">
                      {schedule.time}
                    </p>
                    <p className="text-xs text-slate-500">
                      {schedule.duration || "1 hour"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderPage = () => {
    switch (activePage) {
      case "Dashboard":
        return <DashboardOverview />;
      case "Create New Course":
        return <CreateNewCourse />;
      case "My Courses":
        return <MyCourses />;
      case "Profile":
        return <TeacherSettings />;
      case "Meetings":
        return <TeacherMeeting user={user} teacherProfile={teacherProfile} />;

      default:
        return <div className="text-xl">404 Not Found</div>;
    }
  };

  return (
    <div className="flex h-screen relative overflow-hidden">
      {/* Mobile overlay - only shown when sidebar is open on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Mobile header with menu button - removed Academia text */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white z-10 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-slate-700 hover:bg-slate-100"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        {/* Academia text removed */}
        <Link
          to="/"
          className="p-2 rounded-lg text-amber-600 hover:bg-amber-50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7m-7-7v14"
            />
          </svg>
        </Link>
      </div>

      {/* Academic Sidebar - responsive, removed branding section */}
      <div
        className={`fixed lg:relative inset-y-0 left-0 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-300 ease-in-out z-30 w-72 bg-slate-800 text-white flex flex-col shrink-0`}
      >
        {/* Close button container - only for mobile */}
        <div className="flex justify-end p-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Teacher Profile */}
        <div className="p-6 flex items-center border-b border-slate-700/50">
          <div className="relative">
            <img
              src={
                teacherProfile.profile_image ||
                "https://ui-avatars.com/api/?name=" +
                  teacherProfile.first_name +
                  "&background=475569&color=fff"
              }
              alt="Profile"
              className="w-12 h-12 rounded-full object-cover ring-2 ring-amber-500/50"
            />
            <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-400 ring-2 ring-slate-800"></span>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-white font-serif">
              {teacherProfile.first_name
                ? `${teacherProfile.first_name} ${teacherProfile.last_name}`
                : "Teacher"}
            </p>
            <p className="text-xs text-slate-300">{teacherProfile.work}</p>
          </div>
        </div>

        {/* Home Button */}
        <Link
          to="/"
          className="mx-4 mt-4 hidden lg:flex items-center justify-center px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium transition-all duration-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7m-7-7v14"
            />
          </svg>
          University Homepage
        </Link>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-4 px-3">
          <div className="mb-2 px-4 text-xs font-medium uppercase tracking-wider text-slate-400">
            Main Menu
          </div>
          <ul className="space-y-1">
            <li>
              <button
                className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors ${
                  activePage === "Dashboard"
                    ? "bg-amber-600 text-white"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
                onClick={() => handlePageChange("Dashboard")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
                <span className="font-serif">Dashboard</span>
              </button>
            </li>
            <li>
              <button
                className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors ${
                  activePage === "My Courses"
                    ? "bg-amber-600 text-white"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
                onClick={() => handlePageChange("My Courses")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                <span className="font-serif">My Courses</span>
              </button>
            </li>
            <li>
              <button
                className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors ${
                  activePage === "Create New Course"
                    ? "bg-amber-600 text-white"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
                onClick={() => handlePageChange("Create New Course")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-serif">Create Course</span>
              </button>
            </li>

            <li>
              <button
                className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors ${
                  activePage === "Meetings"
                    ? "bg-amber-600 text-white"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
                onClick={() => handlePageChange("Meetings")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-serif">Meetings</span>
              </button>
            </li>
          </ul>

          <div className="mt-8 mb-2 px-4 text-xs font-medium uppercase tracking-wider text-slate-400">
            Account
          </div>
          <ul className="space-y-1">
            <li>
              <button
                className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors ${
                  activePage === "Profile"
                    ? "bg-amber-600 text-white"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
                onClick={() => handlePageChange("Profile")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="font-serif">Faculty Profile</span>
              </button>
            </li>
          </ul>
        </div>

        {/* Footer Section */}
        <div className="p-4 border-t border-slate-700/50 mt-auto">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 rounded-lg text-slate-300 hover:bg-red-700/30 hover:text-white transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span className="font-serif">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content - adjusted for mobile */}
      <div className="flex-1 bg-slate-50 overflow-auto w-full pt-14 lg:pt-0">
        <div className="p-4 sm:p-6 md:p-8">{renderPage()}</div>
      </div>
    </div>
  );
}

export default TeacherDashboard;
