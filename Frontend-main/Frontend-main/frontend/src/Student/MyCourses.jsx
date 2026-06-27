import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const MyCourses = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [studentProfile, setStudentProfile] = useState({});
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("courses"); // 'courses' or 'assignments'
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCourses, setFilteredCourses] = useState([]);

  // File upload states
  const [uploadingAssignment, setUploadingAssignment] = useState(null);
  const [fileLinks, setFileLinks] = useState("");
  const [selectedFiles, setSelectedFiles] = useState({});
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Authentication check
  useEffect(() => {
    if (!user?.isAuthenticated) {
      navigate("/login");
      return;
    }
  }, [navigate]);

  // Fetch student profile
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
      }
    };

    if (user?.id) {
      fetchStudent(user.id);
    }
  }, [user]);

  // Fetch student courses
  useEffect(() => {
    const fetchMyCourses = async () => {
      if (!studentProfile.id) return;

      setLoading(true);
      try {
        const response = await axios.get(
          `${BACKEND_URL}/v1/student/courses/my_classes/${studentProfile.id}`
        );
        setCourses(response.data);
        setFilteredCourses(response.data);
      } catch (error) {
        console.error(
          "Failed to fetch courses:",
          error.response?.data || error.message
        );
        setMessage({ type: "error", text: "Failed to load courses" });
      } finally {
        setLoading(false);
      }
    };

    fetchMyCourses();
  }, [studentProfile.id]);

  // Search filter
  useEffect(() => {
    const filtered = courses.filter(
      (course) =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCourses(filtered);
  }, [searchTerm, courses]);

  // Fetch assignments for a course
  const fetchAssignments = async (courseId) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${BACKEND_URL}/v1/student/courses/assignments/get/all?course_id=${courseId}`
      );
      setAssignments(response.data);

      // Fetch submissions for each assignment
      const submissionPromises = response.data.map(async (assignment) => {
        try {
          const submissionResponse = await axios.get(
            `${BACKEND_URL}/v1/student/courses/get/submission?assignment_id=${assignment.id}&student_id=${studentProfile.id}`
          );
          return { [assignment.id]: submissionResponse.data };
        } catch (error) {
          // No submission found for this assignment
          return { [assignment.id]: null };
        }
      });

      const submissionResults = await Promise.all(submissionPromises);
      const submissionsMap = submissionResults.reduce(
        (acc, curr) => ({ ...acc, ...curr }),
        {}
      );
      setSubmissions(submissionsMap);
    } catch (error) {
      console.error(
        "Failed to fetch assignments:",
        error.response?.data || error.message
      );
      setMessage({ type: "error", text: "Failed to load assignments" });
    } finally {
      setLoading(false);
    }
  };

  // Handle course selection
  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
    setActiveTab("assignments");
    fetchAssignments(course.id);
  };

  // Handle file selection
  const handleFileSelect = (assignmentId, files) => {
    setSelectedFiles((prev) => ({
      ...prev,
      [assignmentId]: Array.from(files),
    }));
  };

  // Function to get total size of selected files
  const getTotalFileSize = (files) => {
    if (!files || files.length === 0) return 0;
    return files.reduce((total, file) => total + file.size, 0);
  };

  // Clear selected files when switching assignments
  const clearSelectedFiles = (assignmentId) => {
    setSelectedFiles((prev) => {
      const updated = { ...prev };
      delete updated[assignmentId];
      return updated;
    });
    setFileLinks("");
    setUploadingAssignment(null);
  };

  // Upload files to server
  const uploadFiles = async (files) => {
    const uploadPromises = files.map(async (file) => {
      const formData = new FormData();
      formData.append("file", file);

      try {
        console.log(
          `Uploading file: ${file.name} (${formatFileSize(file.size)})`
        );
        const response = await axios.post(
          `${BACKEND_URL}/utility/upload`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        console.log(`Successfully uploaded ${file.name}:`, response.data.url);
        return response.data.url;
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        throw new Error(`Failed to upload ${file.name}`);
      }
    });

    return Promise.all(uploadPromises);
  };

  const isValidURL = (url) => {
    try {
      new URL(url);
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  // Handle assignment submission with file upload
  const handleSubmissionUploadWithFiles = async (assignmentId) => {
    const files = selectedFiles[assignmentId] || [];
    const manualLinks = fileLinks
      .trim()
      .split(",")
      .map((link) => link.trim())
      .filter((link) => link && isValidURL(link));

    if (files.length === 0 && manualLinks.length === 0) {
      setMessage({
        type: "error",
        text: "Please select files or provide file links",
      });
      return;
    }

    setUploadingAssignment(assignmentId);
    setUploadingFiles(true);

    try {
      let uploadedUrls = [];

      // Upload selected files if any
      if (files.length > 0) {
        uploadedUrls = await uploadFiles(files);
      }

      // Combine uploaded URLs with manual links
      const allFileLinks = [...uploadedUrls, ...manualLinks];

      // Create file_links object with filename as key and URL as value
      // const fileLinksObject = {};

      // For uploaded files, use the original filename
      // if (files.length > 0) {
      //   files.forEach((file, index) => {
      //     if (uploadedUrls[index]) {
      //       fileLinksObject[file.name] = uploadedUrls[index];
      //     }
      //   });
      // }

      // For manual links, generate a generic filename
      // manualLinks.forEach((link, index) => {
      //   const linkIndex = files.length + index + 1;
      //   fileLinksObject[`Manual_File_${linkIndex}`] = link;
      // });

      console.log("Sending submission data:", {
        assignment_id: assignmentId,
        student_id: studentProfile.id,
        file_links: allFileLinks,
      });

      const submissionData = {
        assignment_id: assignmentId,
        student_id: studentProfile.id,
        file_links: allFileLinks,
      };

      let response;
      if (submissions[assignmentId]) {
        // Update existing submission
        response = await axios.post(
          `${BACKEND_URL}/v1/student/courses/update/submission`,
          submissionData
        );
      } else {
        // Create new submission
        response = await axios.post(
          `${BACKEND_URL}/v1/student/courses/create/submission`,
          submissionData
        );
      }

      setSubmissions((prev) => ({ ...prev, [assignmentId]: response.data }));
      setFileLinks("");
      setSelectedFiles((prev) => ({ ...prev, [assignmentId]: [] }));
      // setMessage({ type: 'success', text: 'Submission uploaded successfully!' });
      console.log("Submission successful:", response.data);
    } catch (error) {
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Failed to upload submission";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setUploadingAssignment(null);
      setUploadingFiles(false);
    }
  };

  // Handle leaving a course
  const handleLeaveCourse = async (courseId) => {
    if (!window.confirm("Are you sure you want to leave this course?")) return;

    setLoading(true);
    try {
      await axios.get(
        `${BACKEND_URL}/v1/student/courses/leave_class/${studentProfile.id}/${courseId}`
      );
      setCourses((prev) => prev.filter((course) => course.id !== courseId));
      setFilteredCourses((prev) =>
        prev.filter((course) => course.id !== courseId)
      );
      setMessage({ type: "success", text: "Successfully left the course" });

      if (selectedCourse?.id === courseId) {
        setSelectedCourse(null);
        setActiveTab("courses");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.detail || "Failed to leave course";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Check if assignment is overdue
  const isOverdue = (dueDateString) => {
    return new Date(dueDateString) < new Date();
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header with gradient background */}
      <div className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link
              to="/student-dashboard"
              className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span className="font-medium">Back to Dashboard</span>
            </Link>

            <Link
              to="/enroll-course"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 active:bg-indigo-800 focus:outline-none focus:border-indigo-900 focus:ring ring-indigo-300 disabled:opacity-25 transition ease-in-out duration-150 shadow-sm hover:shadow"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Enroll in Course
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message Display with animation */}
        {message.text && (
          <div className="mb-6 animate-fadeIn">
            <div
              className={`p-4 rounded-lg flex items-center gap-3 shadow-sm ${
                message.type === "success"
                  ? "bg-green-50 border-l-4 border-green-500 text-green-800"
                  : "bg-red-50 border-l-4 border-red-500 text-red-800"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {message.type === "success" ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                )}
              </svg>
              <span className="font-medium">{message.text}</span>
            </div>
          </div>
        )}

        {/* Show Course Header for Selected Course with improved styling */}
        {selectedCourse && activeTab === "assignments" && (
          <div className="rounded-2xl shadow-lg overflow-hidden mb-8 transform transition-all duration-300 hover:shadow-xl">
            <div
              className="relative h-56 sm:h-72 bg-cover bg-center"
              style={{
                backgroundImage: `url(${
                  selectedCourse.image_url ||
                  "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80"
                })`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/90 via-indigo-900/70 to-blue-800/30 backdrop-blur-sm"></div>

              <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs font-medium border border-white/10 shadow-sm">
                {selectedCourse.type || "Course"}
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <div className="flex items-center mb-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-md bg-indigo-500/30 backdrop-blur-sm text-sm font-medium text-white mr-2 shadow-sm">
                    {selectedCourse.code}
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold mb-3 text-shadow">
                  {selectedCourse.title}
                </h1>

                <div className="flex flex-wrap gap-3 mt-4">
                  <div className="flex items-center text-sm bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full text-white shadow-sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    Batch: {selectedCourse.batch || "N/A"}
                  </div>
                  <div className="flex items-center text-sm bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full text-white shadow-sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                    Semester: {selectedCourse.semester || "N/A"}
                  </div>
                  <div className="flex items-center text-sm bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full text-white shadow-sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1.5"
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
                    {selectedCourse.running ? "Active" : "Inactive"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs with improved styling */}
        <div className="bg-white rounded-xl shadow-md mb-6 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => {
                setActiveTab("courses");
                setSelectedCourse(null);
              }}
              className={`flex-1 px-6 py-4 font-medium border-b-2 transition-all duration-200 ${
                activeTab === "courses"
                  ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50/50"
              }`}
            >
              <div className="flex items-center gap-2 justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                All Courses ({courses.length})
              </div>
            </button>
            {selectedCourse && (
              <button
                onClick={() => setActiveTab("assignments")}
                className={`flex-1 px-6 py-4 font-medium border-b-2 transition-all duration-200 ${
                  activeTab === "assignments"
                    ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50/50"
                }`}
              >
                <div className="flex items-center gap-2 justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  {selectedCourse.title} - Assignments
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Loading State with improved animation */}
        {loading && (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-14 w-14 border-4 border-indigo-200 border-t-4 border-t-indigo-600 shadow-md"></div>
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === "courses" && !loading && (
          <div>
            {/* Search Bar with improved styling */}
            <div className="mb-6 bg-white rounded-xl shadow-md p-6">
              <div className="relative">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search courses by title, code, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
                />
              </div>
            </div>

            {/* Courses Grid with empty state */}
            {filteredCourses.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <div className="animate-pulse inline-flex items-center justify-center w-24 h-24 bg-indigo-100 text-indigo-400 rounded-full mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-medium text-gray-700 mb-2">
                  {searchTerm ? "No courses found" : "No courses enrolled"}
                </h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                  {searchTerm
                    ? "Try adjusting your search terms or check for any typos"
                    : "Start your learning journey by enrolling in a course using the course code"}
                </p>
                {!searchTerm && (
                  <Link
                    to="/enroll-course"
                    className="inline-flex items-center px-5 py-3 bg-indigo-600 border border-transparent rounded-md font-semibold text-sm text-white tracking-wide hover:bg-indigo-700 active:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Enroll in Course
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-white border border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
                  >
                    {/* Course Image */}
                    <div
                      className="relative h-48 bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${
                          course.image_url ||
                          "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80"
                        })`,
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/90 via-indigo-900/60 to-blue-800/20"></div>

                      <div className="absolute top-3 right-3">
                        <span
                          className={`px-2.5 py-1.5 rounded-full text-xs font-medium ${
                            course.running
                              ? "bg-green-100/90 text-green-800 backdrop-blur-sm border border-green-200/50"
                              : "bg-gray-100/90 text-gray-800 backdrop-blur-sm border border-gray-200/50"
                          } shadow-sm`}
                        >
                          {course.running ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <div className="absolute top-3 left-3">
                        <button
                          onClick={() => handleLeaveCourse(course.id)}
                          className="bg-red-500/80 hover:bg-red-600/90 text-white p-1.5 rounded-full transition-colors backdrop-blur-sm border border-red-400/30 shadow-sm"
                          title="Leave Course"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
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
                        </button>
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <div className="flex items-center mb-1">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-indigo-500/30 backdrop-blur-sm text-xs font-medium text-white border border-indigo-400/20 shadow-sm">
                            {course.code}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold mb-1 text-shadow truncate">
                          {course.title}
                        </h3>
                      </div>
                    </div>

                    {/* Course Content */}
                    <div className="p-5">
                      {course.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {course.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2 mb-4 text-xs">
                        <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full border border-gray-200 shadow-sm">
                          Semester: {course.semester}
                        </span>
                        <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full border border-gray-200 shadow-sm">
                          Batch: {course.batch}
                        </span>
                        <span
                          className={`px-2.5 py-1 rounded-full border shadow-sm ${
                            course.type === "Theory"
                              ? "bg-blue-100 text-blue-800 border-blue-200"
                              : "bg-green-100 text-green-800 border-green-200"
                          }`}
                        >
                          {course.type}
                        </span>
                      </div>

                      {/* Schedule */}
                      {course.schedules && course.schedules.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs text-gray-500 mb-2 font-medium">
                            Schedule:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {course.schedules.map((schedule, index) => (
                              <span
                                key={index}
                                className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200 shadow-sm"
                              >
                                {schedule.day} at {schedule.start_time}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Button */}
                      <button
                        onClick={() => handleCourseSelect(course)}
                        className="w-full bg-indigo-600 text-white text-sm py-3 px-4 rounded-lg hover:bg-indigo-700 transition-all duration-200 font-medium shadow-sm hover:shadow flex items-center justify-center gap-2"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
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
                        View Assignments
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Assignments Tab with improved styling */}
        {activeTab === "assignments" && selectedCourse && !loading && (
          <div>
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold flex items-center text-gray-800">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 mr-2 text-indigo-600"
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
                    Course Assignments
                  </h2>
                  <button
                    onClick={() => {
                      setActiveTab("courses");
                      setSelectedCourse(null);
                    }}
                    className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
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

                {assignments.length === 0 ? (
                  <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 text-indigo-400 rounded-full mb-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-10 w-10"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-medium text-gray-700 mb-2">
                      No assignments yet
                    </h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      Assignments will appear here when posted by your
                      instructor
                    </p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {assignments.map((assignment) => {
                      const submission = submissions[assignment.id];
                      const overdue =
                        assignment.due_date &&
                        assignment.type &&
                        assignment.type.toLowerCase() !== "resource" &&
                        isOverdue(assignment.due_date);

                      return (
                        <div
                          key={assignment.id}
                          className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                        >
                          {/* Assignment Header with color coding */}
                          <div
                            className={`p-1 ${
                              submission
                                ? "bg-gradient-to-r from-green-500 to-emerald-600"
                                : overdue
                                ? "bg-gradient-to-r from-red-500 to-rose-600"
                                : "bg-gradient-to-r from-indigo-500 to-blue-600"
                            }`}
                          ></div>
                          <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  <div
                                    className={`p-2.5 rounded-xl ${
                                      assignment.type === "Homework"
                                        ? "bg-orange-100 text-orange-600"
                                        : "bg-blue-100 text-blue-600"
                                    }`}
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
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                      />
                                    </svg>
                                  </div>
                                  <div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                      {assignment.title}
                                    </h3>
                                    <span
                                      className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                                        assignment.type === "Homework"
                                          ? "bg-orange-100 text-orange-800 border border-orange-200"
                                          : "bg-blue-100 text-blue-800 border border-blue-200"
                                      } shadow-sm`}
                                    >
                                      {assignment.type}
                                    </span>
                                  </div>
                                </div>

                                {assignment.description && (
                                  <p className="text-gray-700 mb-4">
                                    {assignment.description}
                                  </p>
                                )}

                                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                  <div className="flex items-center bg-gray-100 px-3 py-1.5 rounded-full shadow-sm">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-4 w-4 mr-1.5 text-gray-600"
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
                                    Posted: {formatDate(assignment.given_date)}
                                  </div>
                                  {assignment.due_date &&
                                    assignment.type &&
                                    assignment.type.toLowerCase() !==
                                      "resource" && (
                                      <div
                                        className={`flex items-center rounded-full px-3 py-1.5 shadow-sm ${
                                          overdue && !submission
                                            ? "bg-red-100 text-red-700 font-medium"
                                            : "bg-gray-100 text-gray-700"
                                        }`}
                                      >
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="h-4 w-4 mr-1.5"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                          />
                                        </svg>
                                        Due: {formatDate(assignment.due_date)}
                                        {overdue && !submission && (
                                          <span className="ml-1">
                                            (Overdue)
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  {/* ✅ Only show if NOT a "resource" and max_marks exists */}
                                  {assignment.type?.toLowerCase() !==
                                    "resource" &&
                                    assignment.max_marks && (
                                      // ✅ This entire block will be skipped if type === "resource"
                                      <div className="flex items-center bg-gray-100 px-3 py-1.5 rounded-full shadow-sm">
                                        {/* ✅ No change here — just reused your existing SVG */}
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="mr-1.5 h-4 w-4 text-gray-600"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                          />
                                        </svg>
                                        Max&nbsp;Marks:&nbsp;
                                        {assignment.max_marks}
                                      </div>
                                    )}
                                </div>
                              </div>

                              {/* Submission Status Badge */}
                              <div className="ml-4">
                                {submission ? (
                                  <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-2 rounded-lg border border-green-200 shadow-sm">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-5 w-5"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                      />
                                    </svg>
                                    <span className="font-medium">
                                      Submitted
                                    </span>
                                  </div>
                                ) : (
                                  <div
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border shadow-sm ${
                                      overdue
                                        ? "bg-red-100 text-red-700 border-red-200"
                                        : "bg-gray-100 text-gray-600 border-gray-200"
                                    }`}
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-5 w-5"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                      />
                                    </svg>
                                    <span className="font-medium">
                                      {overdue ? "Overdue" : "Not Submitted"}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Assignment Files with improved styling */}
                            {assignment.file_links &&
                              Object.keys(assignment.file_links).length > 0 && (
                                <div className="mb-5 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                                  <p className="text-sm font-medium text-indigo-800 mb-3 flex items-center">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-4 w-4 mr-1.5"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                      />
                                    </svg>
                                    Assignment Files:
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {Object.entries(assignment.file_links).map(
                                      ([fileName, url]) => (
                                        <a
                                          key={fileName}
                                          href={url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm bg-white px-3 py-2 rounded-lg border border-indigo-200 hover:border-indigo-300 transition-colors shadow-sm hover:shadow"
                                        >
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                          </svg>
                                          {fileName}
                                        </a>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}

                            {/* Submission Section with enhanced UI */}
                            {assignment.type &&
                              assignment.type.toLowerCase() !== "resource" && (
                                <div className="border-t border-gray-200 pt-5 mt-4">
                                  {submission ? (
                                    <div className="bg-green-50 border border-green-200 p-5 rounded-xl shadow-inner">
                                      <div className="flex items-center gap-2 mb-3">
                                        <div className="bg-green-100 p-2 rounded-full text-green-700">
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                          </svg>
                                        </div>
                                        <span className="font-medium text-green-800">
                                          Submitted on{" "}
                                          {formatDate(submission.submitted_at)}
                                        </span>
                                      </div>

                                      {submission.file_links &&
                                        Object.keys(submission.file_links)
                                          .length > 0 && (
                                          <div className="mb-4 ml-9">
                                            <p className="text-sm text-green-700 mb-2">
                                              Submitted Files:
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                              {Object.entries(
                                                submission.file_links
                                              ).map(
                                                ([fileName, url], index) => (
                                                  <a
                                                    key={index}
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-green-600 hover:text-green-800 text-sm bg-white px-3 py-1.5 rounded-lg border border-green-200 hover:border-green-300 transition-colors shadow-sm hover:shadow inline-flex items-center gap-1.5"
                                                  >
                                                    <svg
                                                      xmlns="http://www.w3.org/2000/svg"
                                                      className="h-4 w-4"
                                                      fill="none"
                                                      viewBox="0 0 24 24"
                                                      stroke="currentColor"
                                                    >
                                                      <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                      />
                                                    </svg>
                                                    {fileName}
                                                  </a>
                                                )
                                              )}
                                            </div>
                                          </div>
                                        )}

                                      {submission.checked &&
                                        submission.marks !== null && (
                                          <div className="mb-4 ml-9 p-3.5 bg-white rounded-lg border border-green-200 shadow-sm">
                                            <span className="text-green-800 font-medium flex items-center">
                                              <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5 mr-1.5 text-green-600"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth={2}
                                                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                                />
                                              </svg>
                                              Grade: {submission.marks}/
                                              {assignment.max_marks || "N/A"}
                                            </span>
                                          </div>
                                        )}

                                      {/* Update Submission */}
                                      <div className="mt-4 ml-9">
                                        <p className="text-sm text-green-700 mb-3 font-medium">
                                          Update Submission:
                                        </p>

                                        {/* File Upload Section */}
                                        <div className="space-y-3 mb-4">
                                          <div>
                                            <label className="flex items-center justify-between text-xs text-green-600 mb-1 font-medium">
                                              <span className="flex items-center">
                                                <svg
                                                  xmlns="http://www.w3.org/2000/svg"
                                                  className="h-3.5 w-3.5 mr-1"
                                                  fill="none"
                                                  viewBox="0 0 24 24"
                                                  stroke="currentColor"
                                                >
                                                  <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                                  />
                                                </svg>
                                                Upload Files (Multiple files
                                                supported)
                                              </span>
                                            </label>
                                            <div className="relative border-2 border-dashed border-green-300 rounded-lg p-4 transition-all hover:border-green-500 bg-green-50 hover:bg-green-100/50">
                                              <input
                                                type="file"
                                                multiple
                                                onChange={(e) =>
                                                  handleFileSelect(
                                                    assignment.id,
                                                    e.target.files
                                                  )
                                                }
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                              />
                                              <div className="text-center">
                                                <svg
                                                  xmlns="http://www.w3.org/2000/svg"
                                                  className="mx-auto h-8 w-8 text-green-500"
                                                  fill="none"
                                                  viewBox="0 0 24 24"
                                                  stroke="currentColor"
                                                >
                                                  <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                                  />
                                                </svg>
                                                <p className="mt-1 text-sm text-green-600">
                                                  Drag and drop files here or
                                                  click to browse
                                                </p>
                                                <p className="text-xs text-green-500 mt-1">
                                                  You can select multiple files
                                                  at once
                                                </p>
                                              </div>
                                            </div>

                                            {selectedFiles[assignment.id] &&
                                              selectedFiles[assignment.id]
                                                .length > 0 && (
                                                <div className="mt-3 bg-white p-3 rounded-lg border border-green-200 shadow-sm">
                                                  <div className="flex items-center justify-between mb-2">
                                                    <p className="text-xs text-green-600 font-medium">
                                                      {
                                                        selectedFiles[
                                                          assignment.id
                                                        ].length
                                                      }{" "}
                                                      file(s) selected •{" "}
                                                      {formatFileSize(
                                                        getTotalFileSize(
                                                          selectedFiles[
                                                            assignment.id
                                                          ]
                                                        )
                                                      )}
                                                    </p>
                                                    <button
                                                      onClick={() =>
                                                        clearSelectedFiles(
                                                          assignment.id
                                                        )
                                                      }
                                                      className="text-xs text-red-500 hover:text-red-700 flex items-center"
                                                    >
                                                      <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-3.5 w-3.5 mr-1"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                      >
                                                        <path
                                                          strokeLinecap="round"
                                                          strokeLinejoin="round"
                                                          strokeWidth={2}
                                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                        />
                                                      </svg>
                                                      Clear all
                                                    </button>
                                                  </div>
                                                  <div className="max-h-32 overflow-y-auto pr-1">
                                                    <div className="space-y-1">
                                                      {selectedFiles[
                                                        assignment.id
                                                      ].map((file, index) => (
                                                        <div
                                                          key={index}
                                                          className="flex items-center justify-between text-xs bg-green-50 p-2 rounded border border-green-200"
                                                        >
                                                          <div className="flex items-center gap-1 truncate mr-2">
                                                            <svg
                                                              xmlns="http://www.w3.org/2000/svg"
                                                              className="h-3.5 w-3.5 flex-shrink-0 text-green-600"
                                                              fill="none"
                                                              viewBox="0 0 24 24"
                                                              stroke="currentColor"
                                                            >
                                                              <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                              />
                                                            </svg>
                                                            <span className="truncate font-medium">
                                                              {file.name}
                                                            </span>
                                                          </div>
                                                          <span className="flex-shrink-0 text-green-600 font-medium">
                                                            {formatFileSize(
                                                              file.size
                                                            )}
                                                          </span>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  </div>
                                                </div>
                                              )}
                                          </div>

                                          <div className="text-xs text-green-600 text-center">
                                            OR
                                          </div>

                                          <div>
                                            <label className="block text-xs text-green-600 mb-1 font-medium">
                                              Manual File Links:
                                            </label>
                                            <input
                                              type="text"
                                              placeholder="Enter file links (comma-separated)"
                                              value={
                                                uploadingAssignment ===
                                                assignment.id
                                                  ? fileLinks
                                                  : ""
                                              }
                                              onChange={(e) => {
                                                if (
                                                  uploadingAssignment ===
                                                  assignment.id
                                                ) {
                                                  setFileLinks(e.target.value);
                                                }
                                              }}
                                              onFocus={() =>
                                                setUploadingAssignment(
                                                  assignment.id
                                                )
                                              }
                                              className="w-full px-3.5 py-2.5 border border-green-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm"
                                            />
                                          </div>
                                        </div>

                                        <button
                                          onClick={() =>
                                            handleSubmissionUploadWithFiles(
                                              assignment.id
                                            )
                                          }
                                          disabled={
                                            uploadingAssignment ===
                                              assignment.id &&
                                            !fileLinks.trim() &&
                                            (!selectedFiles[assignment.id] ||
                                              selectedFiles[assignment.id]
                                                .length === 0)
                                          }
                                          className="w-full bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                          {uploadingFiles ? (
                                            <>
                                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                              Uploading...
                                            </>
                                          ) : (
                                            <>
                                              <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-4 w-4"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth={2}
                                                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                                />
                                              </svg>
                                              Update Submission
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div
                                      className={`p-5 rounded-xl border-2 border-dashed ${
                                        overdue
                                          ? "border-red-300 bg-red-50"
                                          : "border-indigo-300 bg-indigo-50"
                                      } shadow-inner`}
                                    >
                                      <div className="text-center mb-5">
                                        <div
                                          className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${
                                            overdue
                                              ? "bg-red-100 text-red-500"
                                              : "bg-indigo-100 text-indigo-500"
                                          }`}
                                        >
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-8 w-8"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                            />
                                          </svg>
                                        </div>
                                        <p
                                          className={`text-lg font-medium ${
                                            overdue
                                              ? "text-red-800"
                                              : "text-indigo-700"
                                          }`}
                                        >
                                          {overdue
                                            ? "Assignment Overdue"
                                            : "Submit Your Assignment"}
                                        </p>
                                        <p
                                          className={`text-sm mt-1 ${
                                            overdue
                                              ? "text-red-600"
                                              : "text-indigo-600"
                                          }`}
                                        >
                                          {overdue
                                            ? "You can still submit, but it will be marked as late"
                                            : "Upload your work before the deadline"}
                                        </p>
                                      </div>

                                      <div className="space-y-4">
                                        {/* File Upload Section */}
                                        <div>
                                          <label
                                            className={`block text-sm font-medium mb-2 ${
                                              overdue
                                                ? "text-red-700"
                                                : "text-indigo-700"
                                            }`}
                                          >
                                            Upload Files:
                                          </label>
                                          <input
                                            type="file"
                                            multiple
                                            onChange={(e) =>
                                              handleFileSelect(
                                                assignment.id,
                                                e.target.files
                                              )
                                            }
                                            className={`block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium transition-colors ${
                                              overdue
                                                ? "text-red-600 file:bg-red-100 file:text-red-700 hover:file:bg-red-200"
                                                : "text-indigo-600 file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200"
                                            }`}
                                          />
                                          {selectedFiles[assignment.id] &&
                                            selectedFiles[assignment.id]
                                              .length > 0 && (
                                              <div className="mt-2">
                                                <div className="flex items-center justify-between mb-1">
                                                  <p
                                                    className={`text-xs mb-1 ${
                                                      overdue
                                                        ? "text-red-600"
                                                        : "text-indigo-600"
                                                    }`}
                                                  >
                                                    Selected files:
                                                  </p>
                                                  <button
                                                    onClick={() =>
                                                      clearSelectedFiles(
                                                        assignment.id
                                                      )
                                                    }
                                                    className={`text-xs hover:underline ${
                                                      overdue
                                                        ? "text-red-600 hover:text-red-800"
                                                        : "text-indigo-600 hover:text-indigo-800"
                                                    }`}
                                                  >
                                                    Clear all
                                                  </button>
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                  {selectedFiles[
                                                    assignment.id
                                                  ].map((file, index) => (
                                                    <span
                                                      key={index}
                                                      className={`text-xs px-2 py-1 rounded border flex items-center gap-1 ${
                                                        overdue
                                                          ? "bg-red-100 text-red-700 border-red-200"
                                                          : "bg-indigo-100 text-indigo-700 border-indigo-200"
                                                      }`}
                                                    >
                                                      <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-3 w-3"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                      >
                                                        <path
                                                          strokeLinecap="round"
                                                          strokeLinejoin="round"
                                                          strokeWidth={2}
                                                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                        />
                                                      </svg>
                                                      <span>{file.name}</span>
                                                      <span
                                                        className={
                                                          overdue
                                                            ? "text-red-600"
                                                            : "text-indigo-600"
                                                        }
                                                      >
                                                        (
                                                        {formatFileSize(
                                                          file.size
                                                        )}
                                                        )
                                                      </span>
                                                    </span>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                        </div>

                                        <div
                                          className={`text-center text-sm font-medium ${
                                            overdue
                                              ? "text-red-600"
                                              : "text-indigo-600"
                                          }`}
                                        >
                                          OR
                                        </div>

                                        <div>
                                          <label
                                            className={`block text-sm font-medium mb-2 ${
                                              overdue
                                                ? "text-red-700"
                                                : "text-indigo-700"
                                            }`}
                                          >
                                            Manual File Links:
                                          </label>
                                          <input
                                            type="text"
                                            placeholder="Enter file links (comma-separated)"
                                            value={
                                              uploadingAssignment ===
                                              assignment.id
                                                ? fileLinks
                                                : ""
                                            }
                                            onChange={(e) => {
                                              if (
                                                uploadingAssignment ===
                                                assignment.id
                                              ) {
                                                setFileLinks(e.target.value);
                                              }
                                            }}
                                            onFocus={() =>
                                              setUploadingAssignment(
                                                assignment.id
                                              )
                                            }
                                            className={`w-full px-3.5 py-2.5 border rounded-lg text-sm shadow-sm ${
                                              overdue
                                                ? "border-red-300 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                                : "border-indigo-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            }`}
                                          />
                                        </div>

                                        <button
                                          onClick={() =>
                                            handleSubmissionUploadWithFiles(
                                              assignment.id
                                            )
                                          }
                                          disabled={
                                            uploadingAssignment ===
                                              assignment.id &&
                                            !fileLinks.trim() &&
                                            (!selectedFiles[assignment.id] ||
                                              selectedFiles[assignment.id]
                                                .length === 0)
                                          }
                                          className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium text-white shadow-sm hover:shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                                            overdue
                                              ? "bg-red-600 hover:bg-red-700"
                                              : "bg-indigo-600 hover:bg-indigo-700"
                                          }`}
                                        >
                                          {uploadingFiles ? (
                                            <>
                                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                              Uploading...
                                            </>
                                          ) : (
                                            <>
                                              <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-4 w-4"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth={2}
                                                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                                />
                                              </svg>
                                              Submit Assignment
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCourses;
