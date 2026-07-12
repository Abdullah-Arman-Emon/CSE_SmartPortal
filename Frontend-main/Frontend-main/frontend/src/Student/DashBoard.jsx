import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
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
  TrendingUp,
  MessageSquare,
  GraduationCap,
  Calculator
} from "lucide-react";

import axios from "axios";

import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import NotificationBell from "../components/NotificationBell";

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
  const [routineToday, setRoutineToday] = useState(null); // published routine's view of today
  const [upcomingTests, setUpcomingTests] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingTests, setLoadingTests] = useState(false);
  const [attendance, setAttendance] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [attendanceDetail, setAttendanceDetail] = useState(null);
  const [announcements, setAnnouncements] = useState([]);

  const [studentProfile, setStudentProfile] = useState({});

  const loadAttendanceDetail = async (courseId) => {
    if (!studentProfile?.id) return;
    try {
      const r = await axios.get(
        `${BACKEND_URL}/v1/attendance/student/${studentProfile.id}`,
        { params: { course_id: courseId, detail: true } }
      );
      setAttendanceDetail((r.data || [])[0] || null);
    } catch {
      setAttendanceDetail(null);
    }
  };

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

    async function fetchAttendance(studentId) {
      setLoadingAttendance(true);
      try {
        const response = await axios.get(
          `${BACKEND_URL}/v1/attendance/student/${studentId}`
        );
        setAttendance(response.data || []);
      } catch (error) {
        console.error("Error fetching attendance:", error);
        setAttendance([]);
      } finally {
        setLoadingAttendance(false);
      }
    }

    async function fetchAnnouncements(studentId) {
      try {
        const r = await axios.get(`${BACKEND_URL}/v1/announcements/student/${studentId}`);
        setAnnouncements(r.data || []);
      } catch (error) {
        setAnnouncements([]);
      }
    }

    if (studentProfile && studentProfile?.id) {
      fetchStudentInfo(studentProfile?.id);
      fetchTodaysClasses(studentProfile?.id);
      // Prefer the published batch routine for today's classes (room + times);
      // the enrolled-course list above stays as fallback.
      if (studentProfile?.batch && studentProfile?.current_semester) {
        axios
          .get(`${BACKEND_URL}/v1/routine/today?batch=${studentProfile.batch}&semester=${studentProfile.current_semester}`)
          .then((r) => setRoutineToday(r.data))
          .catch(() => setRoutineToday(null));
      }
      fetchUpcomingTests(studentProfile?.id);
      fetchAttendance(studentProfile?.id);
      fetchAnnouncements(studentProfile?.id);
    }
  }, [studentProfile]);

  useEffect(() => {
  }, [studentInfo]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900">
      {/* Alumni banner — graduated students keep read-only access to results/transcript */}
      {studentProfile?.status === "graduated" && (
        <div className="bg-indigo-600 text-white text-sm px-4 sm:px-6 py-2.5 text-center font-medium">
          🎓 Congratulations, graduate! Your batch has completed the programme. Your
          results, CGPA and transcript remain available — new classes and enrolment are closed.
        </div>
      )}

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
            {(() => {
              const h = new Date().getHours();
              const greet = h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening";
              return `${greet}, ${studentProfile?.last_name || "Student"}`;
            })()}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <NotificationBell />
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
            onClick={() => navigate("/routine")}
            className="flex items-center gap-2 px-3 py-4 text-slate-500 hover:text-slate-700
              hover:bg-slate-50 hover:scale-105 transform transition-all duration-300 whitespace-nowrap"
          >
            <Calendar size={16} />
            <span className="hidden sm:inline">Routine</span>
          </button>
          <button
            onClick={() => navigate("/attendance")}
            className="flex items-center gap-2 px-3 py-4 text-slate-500 hover:text-slate-700
              hover:bg-slate-50 hover:scale-105 transform transition-all duration-300 whitespace-nowrap"
          >
            <TrendingUp size={16} />
            <span className="hidden sm:inline">Attendance</span>
          </button>
          <button
            onClick={() => navigate("/results")}
            className="flex items-center gap-2 px-3 py-4 text-slate-500 hover:text-slate-700
              hover:bg-slate-50 hover:scale-105 transform transition-all duration-300 whitespace-nowrap"
          >
            <GraduationCap size={16} />
            <span className="hidden sm:inline">Results</span>
          </button>
          <button
            onClick={() => navigate("/cgpa-calculator")}
            className="flex items-center gap-2 px-3 py-4 text-slate-500 hover:text-slate-700
              hover:bg-slate-50 hover:scale-105 transform transition-all duration-300 whitespace-nowrap"
          >
            <Calculator size={16} />
            <span className="hidden sm:inline">CGPA</span>
          </button>
          <button
            onClick={() => navigate("/messages")}
            className="flex items-center gap-2 px-3 py-4 text-slate-500 hover:text-slate-700
              hover:bg-slate-50 hover:scale-105 transform transition-all duration-300 whitespace-nowrap"
          >
            <MessageSquare size={16} />
            <span className="hidden sm:inline">Messages</span>
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
              {routineToday?.day && (
                <span className="text-sm text-slate-400">· {routineToday.day}</span>
              )}
              {loadingClasses && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              )}
              <button
                onClick={() => navigate("/routine")}
                className="ml-auto text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                Weekly routine →
              </button>
            </div>

            {routineToday?.holiday ? (
              <div className="text-center py-12">
                <Calendar className="mx-auto text-amber-400 mb-4" size={48} />
                <h3 className="text-lg font-medium text-slate-600 mb-2">
                  Today is off — {routineToday.holiday.title}
                </h3>
                <p className="text-slate-500">No classes today. Enjoy the break!</p>
              </div>
            ) : routineToday?.classes?.length > 0 ? (
              <div className="space-y-4">
                {routineToday.classes.map((c) => (
                  <div key={c.id} className="flex items-center gap-4 p-4 rounded-lg border border-slate-200
                    hover:border-blue-300 hover:shadow-md transition-all duration-300 bg-gradient-to-r from-slate-50 to-white">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="text-blue-600" size={20} />
                      </div>
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-semibold text-slate-800">
                        {c.course_code}{c.course_title ? ` — ${c.course_title}` : ""}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {c.teacher_names?.length ? c.teacher_names.join(", ") : c.teacher_initials || ""}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {c.period_label}
                        </span>
                        {c.room && (
                          <span className="flex items-center gap-1">
                            <MapPin size={14} />
                            Room {c.room}
                          </span>
                        )}
                      </div>
                    </div>
                    {c.group_label && (
                      <div className="flex-shrink-0">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          {c.group_label}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : loadingClasses ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-slate-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : !studentProfile?.batch || !studentProfile?.current_semester ? (
              <div className="text-center py-12">
                <Calendar className="mx-auto text-amber-400 mb-4" size={48} />
                <h3 className="text-lg font-medium text-slate-600 mb-2">Batch &amp; semester not set</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                  Your routine appears once your batch and current semester are assigned.
                  Please ask an admin to set them on your student profile.
                </p>
              </div>
            ) : todaysClasses.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="mx-auto text-slate-400 mb-4" size={48} />
                <h3 className="text-lg font-medium text-slate-600 mb-2">No Classes Today</h3>
                <p className="text-slate-500">
                  {routineToday
                    ? `No classes scheduled for ${routineToday.day}. Enjoy your free day!`
                    : "Enjoy your free day! Check back tomorrow for your schedule."}
                </p>
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

          {/* Attendance (missing classes) */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <TrendingUp className="text-emerald-600" size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Attendance</h3>
              {loadingAttendance && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
              )}
              <button
                onClick={() => navigate("/attendance")}
                className="ml-auto text-xs font-medium text-emerald-600 hover:text-emerald-700"
              >
                View full →
              </button>
            </div>

            {loadingAttendance ? (
              <div className="animate-pulse h-40 bg-slate-200 rounded-lg" />
            ) : attendance.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="mx-auto text-slate-400 mb-3" size={32} />
                <p className="text-slate-500 text-sm">No attendance records yet</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-500 mb-3">Attendance % by course (≥75% = exam eligible)</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={attendance}>
                    <XAxis dataKey="course_code" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                      {attendance.map((a, i) => (
                        <Cell key={i} fill={a.eligible ? "#10b981" : "#ef4444"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                {/* Per-course date-wise detail */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {attendance.map((a) => (
                    <button
                      key={a.course_id}
                      onClick={() =>
                        attendanceDetail?.course_id === a.course_id
                          ? setAttendanceDetail(null)
                          : loadAttendanceDetail(a.course_id)
                      }
                      className={`text-xs px-2.5 py-1 rounded-full border ${
                        attendanceDetail?.course_id === a.course_id
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : "bg-white text-slate-600 border-slate-300 hover:border-emerald-400"
                      }`}
                    >
                      {a.course_code} details
                    </button>
                  ))}
                </div>
                {attendanceDetail && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-lg max-h-48 overflow-y-auto">
                    <p className="text-xs font-semibold text-slate-600 mb-2">
                      {attendanceDetail.course_title} — {attendanceDetail.attended}/{attendanceDetail.total_sessions} attended
                    </p>
                    {(attendanceDetail.records || []).length === 0 ? (
                      <p className="text-xs text-slate-400">No records yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {attendanceDetail.records.map((r) => (
                          <span
                            key={r.date}
                            title={`${r.date}: ${r.status}`}
                            className={`text-[11px] px-2 py-0.5 rounded ${
                              r.status === "present"
                                ? "bg-green-100 text-green-700"
                                : r.status === "late"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {r.date.slice(5)} {r.status === "present" ? "P" : r.status === "late" ? "L" : "A"}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Announcements */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell className="text-blue-600" size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Announcements</h3>
            </div>
            {announcements.length === 0 ? (
              <p className="text-slate-500 text-sm">No announcements.</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {announcements.slice(0, 8).map((a) => (
                  <div key={a.id} className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-700">{a.text}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {a.course_code} · {a.created_at ? new Date(a.created_at).toLocaleDateString() : ""}
                    </p>
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