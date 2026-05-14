import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Home,
  FlaskConical,
  ClipboardList,
  HelpCircle,
  MapPin,
  Plus,
  Square,
  Camera,
  Text,
  Settings,
  Code2,
  ChevronLeft,
  ChevronRight,
  Search,
  UserCircle,
  BookOpen,
  ClipboardCheck,
  FileText,
  Package,
  Bell,
  ArrowLeft, // Add ArrowLeft icon
  Calendar,
  Clock,
  Activity,
  TrendingUp
} from "lucide-react";

import axios from "axios";

import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;


export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [studentInfo, setStudentInfo] = useState({
    num_classes_today: 0,
    num_assignments_remaining_today: 0,
    num_labs_today: 0,
    num_quizzes_today: 0,
  });
  const [todaysClasses, setTodaysClasses] = useState([]);
  const [upcomingTests, setUpcomingTests] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingTests, setLoadingTests] = useState(false);

  const [studentProfile, setStudentProfile] = useState({});

  // Add redirect protection - ensure user is authenticated
  useEffect(() => {
    if(!user?.isAuthenticated){
      navigate("/");
    }
    
  }, []);

  useEffect(() => {
    const fetchStudent = async (userId) => {
      try {
        const response = await axios.get(`${BACKEND_URL}/v1/auth/get/student`, {
          params: { user_id: userId },
        });
        setStudentProfile(response?.data);
      } catch (error) {
        console.error(
          "Failed to fetch student:",
          error.response?.data || error.message
        );
        throw error;
      }
    };

    if (user && user?.id) {
      fetchStudent(user?.id);
    }
  }, [user]);

  useEffect(() => {
    console.log("student profile : ");
    console.log(studentProfile);

    async function fetchStudentInfo(studentId) {
      try {
        const response = await axios.get(
          `${BACKEND_URL}/v1/student/dashboard/student_info/${studentId}`
        );
        setStudentInfo(response.data);
      } catch (error) {
        console.error("Error fetching student info:", error);
      }
    }

    async function fetchTodaysClasses(studentId) {
      setLoadingClasses(true);
      try {
        const response = await axios.get(
          `${BACKEND_URL}/v1/student/dashboard/todays_classes/${studentId}`
        );
        setTodaysClasses(response.data || []);
      } catch (error) {
        console.error("Error fetching today's classes:", error);
        setTodaysClasses([]);
      } finally {
        setLoadingClasses(false);
      }
    }

    async function fetchUpcomingTests(studentId) {
      setLoadingTests(true);
      try {
        const response = await axios.get(
          `${BACKEND_URL}/v1/student/dashboard/upcoming_tests/${studentId}`
        );
        setUpcomingTests(response.data || []);
      } catch (error) {
        console.error("Error fetching upcoming tests:", error);
        setUpcomingTests([]);
      } finally {
        setLoadingTests(false);
      }
    }

    if (studentProfile && studentProfile?.id) {
      fetchStudentInfo(studentProfile?.id);
      fetchTodaysClasses(studentProfile?.id);
      fetchUpcomingTests(studentProfile?.id);
    }
  }, [studentProfile]);

  useEffect(() => {
    console.log("student info: ");
    console.log(studentInfo);
  }, [studentInfo]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-6 bg-white shadow-sm border-b border-slate-200">
        <div className="flex items-center gap-4 mb-4 sm:mb-0">
          <Link
            to="/"
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors duration-200"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Return to Home</span>
          </Link>
          <div className="text-xl sm:text-2xl font-bold text-slate-800">
            Good Morning, {studentProfile?.last_name || "Student"}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {studentProfile?.profile_image ? (
            <img
              src={studentProfile.profile_image}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover border-2 border-slate-300 cursor-pointer 
                hover:border-blue-400 hover:shadow-lg hover:scale-110 transform transition-all duration-300"
              onClick={() => navigate("/settingspage")}
            />
          ) : (
            <UserCircle 
              className="text-slate-500 cursor-pointer hover:text-blue-600 
                hover:scale-110 transform transition-all duration-300" 
              size={32}
              onClick={() => navigate("/settingspage")}
            />
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6">
        <div className="flex space-x-2 sm:space-x-8 overflow-x-auto">
          <button className="flex items-center gap-2 px-3 py-4 text-slate-600 border-b-2 border-blue-600 font-medium
            hover:bg-slate-50 transition-all duration-300 whitespace-nowrap">
            <Home size={16} />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
          <button
            onClick={() => navigate("/enroll-course")}
            className="flex items-center gap-2 px-3 py-4 text-slate-500 hover:text-slate-700 
              hover:bg-slate-50 hover:scale-105 transform transition-all duration-300 whitespace-nowrap"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Enroll</span>
          </button>
          <button
            onClick={() => navigate("/my-courses")}
            className="flex items-center gap-2 px-3 py-4 text-slate-500 hover:text-slate-700 
              hover:bg-slate-50 hover:scale-105 transform transition-all duration-300 whitespace-nowrap"
          >
            <BookOpen size={16} />
            <span className="hidden sm:inline">Courses</span>
          </button>
          <button
            onClick={() => navigate("/resource-hub")}
            className="flex items-center gap-2 px-3 py-4 text-slate-500 hover:text-slate-700 
              hover:bg-slate-50 hover:scale-105 transform transition-all duration-300 whitespace-nowrap"
          >
            <Package size={16} />
            <span className="hidden sm:inline">Resources</span>
          </button>
          <button 
            onClick={() => navigate("/student-notice")}
            className="flex items-center gap-2 px-3 py-4 text-slate-500 hover:text-slate-700 
              hover:bg-slate-50 hover:scale-105 transform transition-all duration-300 whitespace-nowrap"
          >
            <Bell size={16} />
            <span className="hidden sm:inline">Notice</span>
          </button>
          <button 
            onClick={() => navigate("/finance")}
            className="flex items-center gap-2 px-3 py-4 text-slate-500 hover:text-slate-700 
              hover:bg-slate-50 hover:scale-105 transform transition-all duration-300 whitespace-nowrap"
          >
            <ClipboardList size={16} />
            <span className="hidden sm:inline">Finance</span>
          </button>
          <button 
            onClick={() => navigate("/StudentEventShow")}
            className="flex items-center gap-2 px-3 py-4 text-slate-500 hover:text-slate-700 
              hover:bg-slate-50 hover:scale-105 transform transition-all duration-300 whitespace-nowrap"
          >
            <ClipboardList size={16} />
            <span className="hidden sm:inline">Events</span>
          </button>
          <button 
            onClick={() => navigate("/settingspage")}
            className="flex items-center gap-2 px-3 py-4 text-slate-500 hover:text-slate-700 
              hover:bg-slate-50 hover:scale-105 transform transition-all duration-300 whitespace-nowrap">
            <Settings size={16} />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 sm:p-6">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 text-slate-800
          hover:from-blue-100 hover:to-indigo-100 hover:shadow-lg transition-all duration-300 cursor-pointer border border-blue-100">
          <div className="p-2 bg-blue-500 rounded-lg">
            <BookOpen className="text-white" size={20} />
          </div>
          <div>
            <span className="text-sm text-slate-600">Today's Classes</span>
            <div className="text-xl font-bold text-blue-600">
              {studentInfo.num_classes_today}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 text-slate-800
          hover:from-amber-100 hover:to-orange-100 hover:shadow-lg transition-all duration-300 cursor-pointer border border-amber-100">
          <div className="p-2 bg-amber-500 rounded-lg">
            <ClipboardCheck className="text-white" size={20} />
          </div>
          <div>
            <span className="text-sm text-slate-600">Assignments Due</span>
            <div className="text-xl font-bold text-amber-600">
              {studentInfo.num_assignments_remaining_today}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Classes Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="text-blue-600" size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Today's Classes</h2>
              {loadingClasses && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              )}
            </div>

            {loadingClasses ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-slate-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : todaysClasses.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="mx-auto text-slate-400 mb-4" size={48} />
                <h3 className="text-lg font-medium text-slate-600 mb-2">No Classes Today</h3>
                <p className="text-slate-500">Enjoy your free day! Check back tomorrow for your schedule.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todaysClasses.map((classItem, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 rounded-lg border border-slate-200 
                    hover:border-blue-300 hover:shadow-md transition-all duration-300 bg-gradient-to-r from-slate-50 to-white">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="text-blue-600" size={20} />
                      </div>
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-semibold text-slate-800">{classItem.course_name || 'Course Name'}</h3>
                      <p className="text-sm text-slate-600">{classItem.instructor || 'Instructor'}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {classItem.time || 'Time'}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {classItem.room || 'Room'}
                        </span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {classItem.type || 'Lecture'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <button 
              onClick={() => navigate("/my-courses")}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-slate-200 
                hover:border-blue-300 hover:shadow-md hover:scale-105 transition-all duration-300"
            >
              <BookOpen className="text-blue-600" size={24} />
              <span className="text-sm font-medium text-slate-700">My Courses</span>
            </button>
            <button 
              onClick={() => navigate("/resource-hub")}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-slate-200 
                hover:border-green-300 hover:shadow-md hover:scale-105 transition-all duration-300"
            >
              <Package className="text-green-600" size={24} />
              <span className="text-sm font-medium text-slate-700">Resources</span>
            </button>
            <button 
              onClick={() => navigate("/student-notice")}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-slate-200 
                hover:border-yellow-300 hover:shadow-md hover:scale-105 transition-all duration-300"
            >
              <Bell className="text-yellow-600" size={24} />
              <span className="text-sm font-medium text-slate-700">Notices</span>
            </button>
            <button 
              onClick={() => navigate("/finance")}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-slate-200 
                hover:border-purple-300 hover:shadow-md hover:scale-105 transition-all duration-300"
            >
              <ClipboardList className="text-purple-600" size={24} />
              <span className="text-sm font-medium text-slate-700">Finance</span>
            </button>
          </div>
        </div>

        {/* Sidebar - Upcoming Tests & Other Info */}
        <div className="space-y-6">
          {/* Upcoming Tests */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-100 rounded-lg">
                <ClipboardCheck className="text-red-600" size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Upcoming Tests</h3>
              {loadingTests && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
              )}
            </div>

            {loadingTests ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-slate-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : upcomingTests.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardCheck className="mx-auto text-slate-400 mb-3" size={32} />
                <p className="text-slate-500 text-sm">No upcoming tests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingTests.slice(0, 5).map((test, index) => (
                  <div key={test.id || index} className="p-4 rounded-lg border border-slate-200 hover:border-red-300 
                    hover:shadow-sm transition-all duration-300 bg-gradient-to-r from-red-50 to-white">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-slate-800 text-sm">{test.name || 'Test Subject'}</h4>
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                        {test.type || 'Exam'}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>{test.date ? new Date(test.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        }) : 'Date TBD'}</span>
                        <span className="ml-2">
                          {test.date ? new Date(test.date).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : ''}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <MapPin size={12} />
                          <span>Room {test.room || 'TBD'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>{test.duration ? `${test.duration} mins` : 'Duration TBD'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>          
        </div>
      </div>
    </div>
  );
}