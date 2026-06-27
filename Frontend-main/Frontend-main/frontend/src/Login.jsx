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
} from "lucide-react";

import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const schedule = [
  { label: "Class CSE 4225", image: "/class.jpg" },
  { label: "Lab CSE 4225", image: "/lab.jpg" },
  { label: "Assignment CSE 4225", image: "/assignment.jpg" },
];

const notices = [
  { date: "12 May", text: "Midterm Exam Schedule Published" },
  { date: "12 May", text: "New Course Material Available" },
];

const tests = [
  { subject: "Math for CS", date: "27th May" },
  { subject: "Midterm Exam", date: "5th June" },
];

const chartData = [
  { month: "Jan", missed: 14 },
  { month: "Feb", missed: 4 },
  { month: "Mar", missed: 8 },
  { month: "Apr", missed: 15 },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [studentInfo, setStudentInfo] = useState({
    num_classes_today: 0,
    num_assignments_remaining_today: 0,
    num_labs_today: 0,
    num_quizzes_today: 0,
  });

  const [studentProfile, setStudentProfile] = useState({});

  useEffect(() => {
    const storedUser =
      JSON.parse(localStorage.getItem("user")) ||
      JSON.parse(sessionStorage.getItem("user"));

    console.log("stored user: ");
    console.log(storedUser);

    if (storedUser?.isAuthenticated && !user) {
      setUser(storedUser);
    }
  }, []);

  useEffect(() => {
    const fetchStudent = async (userId) => {
      try {
        const response = await axios.get(`${BACKEND_URL}/v1/auth/get/student`, {
          params: { user_id: userId },
        });
        setStudentProfile(response?.data);
        console.log("Student profile response:", response.data);
        if (response?.data?.id) {
          localStorage.setItem('student_id', response.data.id);
          sessionStorage.setItem('student_id', response.data.id);
        }else{
          console.log("Student ID not found");
        }
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

    if (studentProfile && studentProfile?.id) {
      fetchStudentInfo(studentProfile?.id);
    }
  }, [studentProfile]);

  useEffect(() => {
    console.log("student info: ");
    console.log(studentInfo);
  }, [studentInfo]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-white shadow-sm">
        <div className="text-xl font-bold">
          Good Morning, {studentProfile?.last_name || "Student"}
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
            <Search
              className="absolute left-3 top-2.5 text-slate-400"
              size={16}
            />
          </div>
          <UserCircle className="text-slate-500" size={28} />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 px-4">
        <div className="flex space-x-8 overflow-x-auto">
          <button className="flex items-center gap-2 px-3 py-4 text-slate-600 border-b-2 border-slate-600 font-medium">
            <Home size={16} />
            Dashboard
          </button>
          <button className="flex items-center gap-2 px-3 py-4 text-slate-500 hover:text-slate-700 transition-colors">
            <Plus size={16} />
            Enroll in New Course
          </button>
          <button className="flex items-center gap-2 px-3 py-4 text-slate-500 hover:text-slate-700 transition-colors">
            <BookOpen size={16} />
            My Courses
          </button>
          <button
            onClick={() => navigate("/resource-hub")}
            className="flex items-center gap-2 px-3 py-4 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <Package size={16} />
            Resource Hub
          </button>
          <button className="flex items-center gap-2 px-3 py-4 text-slate-500 hover:text-slate-700 transition-colors">
            <ClipboardList size={16} />
            Finance
          </button>
          <button className="flex items-center gap-2 px-3 py-4 text-slate-500 hover:text-slate-700 transition-colors">
            <Settings size={16} />
            Settings
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 p-4">
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-800">
          <BookOpen />
          <span>Classes</span>
          <span className="text-sm font-bold">
            {studentInfo.num_classes_today}
          </span>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-800">
          <ClipboardCheck />
          <span>Assignments</span>
          <span className="text-sm font-bold">
            {studentInfo.num_assignments_remaining_today}
          </span>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-200 text-slate-800">
          <FlaskConical />
          <span>Labs</span>
          <span className="text-sm font-bold">
            {studentInfo.num_labs_today}
          </span>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 text-gray-800">
          <FileText />
          <span>Quizzes</span>
          <span className="text-sm font-bold">
            {studentInfo.num_quizzes_today}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-12 gap-4 p-4">
        {/* Left Panel - Notices */}
        <div className="col-span-3 bg-white rounded-xl p-4 shadow">
          <h2 className="font-semibold mb-4">Notices</h2>
          {notices.map((item, idx) => (
            <div key={idx} className="mb-2">
              <div className="text-xs text-slate-400">{item.date}</div>
              <div>{item.text}</div>
            </div>
          ))}
        </div>

        {/* Middle Panel - Schedule */}
        <div className="col-span-6 bg-white rounded-xl p-4 shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Today's Schedule</h2>
            <div className="flex gap-2">
              <ChevronLeft className="cursor-pointer" />
              <ChevronRight className="cursor-pointer" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {schedule.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center bg-slate-100 p-4 rounded-lg"
              >
                <img
                  src={item.image}
                  alt="task"
                  className="h-24 object-contain mb-2"
                />
                <div className="mb-2 font-medium text-center">{item.label}</div>
                <button className="text-sm bg-slate-600 text-white px-3 py-1 rounded hover:bg-slate-700">
                  Mark Completed
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div className="col-span-3 flex flex-col gap-4">
          {/* Upcoming Tests */}
          <div className="bg-white rounded-xl p-4 shadow">
            <h2 className="font-semibold mb-2">Upcoming Tests This Semester</h2>
            {tests.map((test, idx) => (
              <div key={idx} className="mb-2">
                <div className="font-medium">{test.subject}</div>
                <div className="text-xs text-slate-400">{test.date}</div>
              </div>
            ))}
          </div>

          {/* Missing Classes Chart */}
          <div className="bg-white rounded-xl p-4 shadow">
            <h2 className="font-semibold mb-2">
              Missing Classes This Semester
            </h2>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="missed" fill="#f87171" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-sm text-green-600 mt-1">
              +4% since last month
            </div>
          </div>
        </div>
      </div>

      {/* Footer Icons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-md p-2 flex justify-around">
        <MapPin />
        <Plus />
        <Square />
        <Camera />
        <Text />
        <Plus className="bg-slate-600 text-white p-1 rounded-full" />
        <Settings />
        <Code2 />
      </div>
    </div>
  );
}