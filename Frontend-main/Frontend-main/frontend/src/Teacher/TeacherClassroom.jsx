import { useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function TeacherClassroom() {
  const { course_id } = useParams();
  const [course, setCourse] = useState({});

  const { user } = useContext(AuthContext);
  const [teacherProfile, setTeacherProfile] = useState({});

  useEffect(() => {

    async function getClassById(courseId) {
      try {
        const response = await axios.get(
          `${BACKEND_URL}/v1/teacher/courses/my_class/${courseId}`
        );
        setCourse(response?.data);
      } catch (error) {
        console.error("Failed to fetch class by ID:", error);
        throw error;
      }
    }

    if (course_id) {
      getClassById(course_id);
    }
  }, []);

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

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [assignmentData, setAssignmentData] = useState({
    title: "",
    description: "",
    max_marks: "",
    due_date: "",
    given_date: new Date().toISOString().slice(0, 16), // prefill with now
    type: "Homework", // or "Resource"
    file_links: [], // changed to array for simpler handling
  });

  // Add states for file uploads
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [createError, setCreateError] = useState("");

  // Function to handle file selection
  const handleFileSelect = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  // Function to clear selected files
  const clearSelectedFiles = () => {
    setSelectedFiles([]);
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Upload files to server
  const uploadFiles = async (files) => {
    const uploadPromises = files.map(async (file) => {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await axios.post(
          `${BACKEND_URL}/utility/upload`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        return response.data.url;
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        throw new Error(`Failed to upload ${file.name}`);
      }
    });

    return Promise.all(uploadPromises);
  };

  // Modified handleCreateAssignment to handle file uploads
  const handleCreateAssignment = async () => {
    if (!assignmentData.title.trim()) {
      setCreateError("Title is required");
      return;
    }

    setUploadingFiles(true);
    setCreateError("");
    
    try {
      // Prepare assignment data
      let assignmentPayload = {
        ...assignmentData,
        course_id: course.id,
      };
      
      // Set due_date to 0 for Resource type to prevent errors
      if (assignmentPayload.type === "Resource") {
        assignmentPayload.due_date = "1970-01-01T00:00:00";
        assignmentPayload.max_marks = 0;
      }
      
      // Upload files if any are selected
      if (selectedFiles.length > 0) {
        const uploadedUrls = await uploadFiles(selectedFiles);
        assignmentPayload.file_links = uploadedUrls;
      }
      
      const response = await axios.post(
        `${BACKEND_URL}/v1/teacher/courses/assignments/create?teacher_id=${teacherProfile.id}`,
        assignmentPayload
      );
      
      console.log("Assignment created:", response.data);
      setShowCreateForm(false);
      setAssignmentData({
        title: "",
        description: "",
        max_marks: "",
        due_date: "",
        given_date: new Date().toISOString().slice(0, 16),
        type: "Homework",
        file_links: [],
      });
      setSelectedFiles([]);
      
      // Refresh assignments list
      fetchAssignments();
    } catch (error) {
      console.error("Error creating assignment", error);
      setCreateError(error.response?.data?.detail || "Failed to create assignment");
    } finally {
      setUploadingFiles(false);
    }
  };

  // Add standalone function to fetch assignments
  const fetchAssignments = async () => {
    if (!teacherProfile?.id || !course?.id) return;

    try {
      const res = await axios.get(
        `${BACKEND_URL}/v1/teacher/courses/assignments/get/all`,
        {
          params: {
            teacher_id: teacherProfile.id,
            course_id: course.id,
          },
        }
      );
      setAssignments(res.data);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    }
  };

  const [assignments, setAssignments] = useState([]);
  const [deleteLoading, setDeleteLoading] = useState(null);

  useEffect(() => {
    fetchAssignments();
  }, [teacherProfile, course]);

  useEffect( () => {
    console.log(assignments)
  }, [assignments])

  // Fix the handleDeleteAssignment function to use the correct endpoint format
  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm("Are you sure you want to delete this assignment? This action cannot be undone.")) {
      return;
    }
    
    setDeleteLoading(assignmentId);
    try {
      // Use DELETE HTTP method with query parameter instead of path parameter
      await axios.delete(
        `${BACKEND_URL}/v1/teacher/courses/assignments/delete`,
        {
          params: { assignment_id: assignmentId }
        }
      );
      
      // Remove the deleted assignment from state
      setAssignments(prevAssignments => 
        prevAssignments.filter(assignment => assignment.id !== assignmentId)
      );
      
      // Show success message
      alert("Assignment deleted successfully");
    } catch (error) {
      console.error("Error deleting assignment:", error);
      alert("Failed to delete assignment. Please try again.");
    } finally {
      setDeleteLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with navigation */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            to="/teacher-dashboard"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">Back to Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Course header card - enhanced with course image */}
        <div className="rounded-xl shadow-lg overflow-hidden mb-8">
          <div 
            className="relative h-48 sm:h-64 bg-cover bg-center" 
            style={{ 
              backgroundImage: `url(${course.image_url || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80'})` 
            }}
          >
            {/* Gradient overlay for better text visibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-indigo-900 via-indigo-900/70 to-blue-800/30"></div>
            
            {/* Course badge - in top right */}
            <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-xs font-medium border border-white/10">
              {course.type || "Course"}
            </div>
            
            {/* Course content */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <div className="flex items-center mb-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-indigo-100 bg-opacity-20 text-sm font-medium text-white mr-2">
                  {course.code}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-3 text-shadow-sm">{course.title || "Loading..."}</h1>
              
              <div className="flex flex-wrap gap-2 mt-4">
                <div className="flex items-center text-sm text-indigo-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Batch: {course.batch || "N/A"}
                </div>
                <div className="flex items-center text-sm text-indigo-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Semester: {course.semester || "N/A"}
                </div>
                <div className="flex items-center text-sm text-indigo-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {course.duration ? `${course.duration} weeks` : "Ongoing"}
                </div>
                <div className="flex items-center text-sm text-indigo-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {course.students_count || "0"} Students
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Instructor card */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-800">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Instructor
                </h2>
                <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
                  <img
                    src={teacherProfile.profile_image || "https://via.placeholder.com/100"}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover ring-2 ring-indigo-100"
                  />
                  <div className="text-center sm:text-left">
                    <p className="text-lg font-medium text-gray-800">
                      {teacherProfile.first_name} {teacherProfile.last_name}
                    </p>
                    <p className="text-sm text-gray-500">{teacherProfile.work}</p>
                    <p className="text-sm text-gray-500">{teacherProfile.phone}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Course description */}
            <div className="bg-white rounded-xl shadow-md">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-800">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Course Description
                </h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-line">
                    {course.description || "No description provided."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-md">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold flex items-center text-gray-800">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Assignments
                  </h2>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 active:bg-indigo-800 focus:outline-none focus:border-indigo-900 focus:ring ring-indigo-300 disabled:opacity-25 transition ease-in-out duration-150"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create Assignment
                  </button>
                </div>

                {assignments.length === 0 ? (
                  <div className="text-center py-8">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="mt-2 text-gray-500">No assignments created yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {assignments.map((assignment) => (
                      <div
                        key={assignment?.id}
                        className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
                      >
                        <div className="p-5">
                          <div className="flex items-center justify-between mb-2">
                            <Link to={`/assignments/${assignment?.id}/submissions`}>
                              <h3 className="text-lg font-semibold text-indigo-700 hover:text-indigo-900 transition-colors">
                                {assignment.title}
                              </h3>
                            </Link>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                                {assignment.type}
                              </span>
                              <button
                                onClick={() => handleDeleteAssignment(assignment.id)}
                                disabled={deleteLoading === assignment.id}
                                className="text-red-500 hover:text-red-700 p-1.5 rounded-full hover:bg-red-50 transition-colors disabled:opacity-50"
                                title="Delete assignment"
                              >
                                {deleteLoading === assignment.id ? (
                                  <div className="animate-spin h-5 w-5 border-2 border-red-500 border-t-transparent rounded-full"></div>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {assignment.description || "No description"}
                          </p>
                          
                          {/* File Resources Preview */}
                          <div className="mb-3">
                            <p className="text-xs font-medium text-gray-700 mb-1.5 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Resources:
                            </p>
                            
                            {assignment.file_links && (
                              Array.isArray(assignment.file_links) ? (
                                assignment.file_links.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {assignment.file_links.map((url, index) => {
                                      const fileName = url.split('/').pop();
                                      const extension = fileName.split('.').pop().toLowerCase();
                                      
                                      let iconClass = "text-gray-500";
                                      if (['pdf'].includes(extension)) iconClass = "text-red-500";
                                      else if (['doc', 'docx'].includes(extension)) iconClass = "text-blue-500";
                                      else if (['jpg', 'jpeg', 'png'].includes(extension)) iconClass = "text-green-500";
                                      else if (['ppt', 'pptx'].includes(extension)) iconClass = "text-orange-500";
                                      
                                      return (
                                        <a 
                                          key={index}
                                          href={url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-md border border-gray-200 transition-colors"
                                          title={fileName}
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 mr-1 ${iconClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                          </svg>
                                          <span className="truncate max-w-[100px]">{fileName}</span>
                                        </a>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-500 italic">No resources available</p>
                                )
                              ) : (
                                typeof assignment.file_links === 'object' && Object.keys(assignment.file_links).length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {Object.entries(assignment.file_links).map(([fileName, url], index) => {
                                      const extension = fileName.split('.').pop().toLowerCase();
                                      
                                      let iconClass = "text-gray-500";
                                      if (['pdf'].includes(extension)) iconClass = "text-red-500";
                                      else if (['doc', 'docx'].includes(extension)) iconClass = "text-blue-500";
                                      else if (['jpg', 'jpeg', 'png'].includes(extension)) iconClass = "text-green-500";
                                      else if (['ppt', 'pptx'].includes(extension)) iconClass = "text-orange-500";
                                      
                                      return (
                                        <a 
                                          key={index}
                                          href={url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-md border border-gray-200 transition-colors"
                                          title={fileName}
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 mr-1 ${iconClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                          </svg>
                                          <span className="truncate max-w-[100px]">{fileName}</span>
                                        </a>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-500 italic">No resources available</p>
                                )
                              )
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-y-1 text-xs text-gray-500">
                            <div className="w-full sm:w-1/2 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Given: {new Date(assignment.given_date).toLocaleString("en-GB")}
                            </div>
                            {assignment.due_date && (
                              <div className="w-full sm:w-1/2 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Due: {new Date(assignment.due_date).toLocaleString("en-GB")}
                              </div>
                            )}
                            {assignment.max_marks !== null && (
                              <div className="w-full sm:w-1/2 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Max Marks: {assignment.max_marks}
                              </div>
                            )}
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
      </div>

      {/* Create assignment modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/20 bg-opacity-50 backdrop-blur-lg flex justify-center items-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg relative my-8">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-4 px-6 sticky top-0 z-10">
              <h2 className="text-xl font-semibold text-white">Create Assignment</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="absolute top-4 right-4 text-white hover:text-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {createError && (
                <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
                  <p>{createError}</p>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={assignmentData.type}
                    onChange={(e) => setAssignmentData({...assignmentData, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="Homework">Homework</option>
                    <option value="Resource">Resource</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    {assignmentData.type === "Resource" 
                      ? "Resources do not require submissions or grades" 
                      : "Homework assignments require a due date and can be graded"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="Assignment title"
                    value={assignmentData.title}
                    onChange={(e) => setAssignmentData({...assignmentData, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    placeholder="Assignment description"
                    value={assignmentData.description}
                    onChange={(e) => setAssignmentData({...assignmentData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    rows="3"
                  />
                </div>

                {/* Show Max Marks and Due Date only for Homework type */}
                {assignmentData.type === "Homework" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Marks</label>
                      <input
                        type="number"
                        placeholder="Maximum marks"
                        value={assignmentData.max_marks}
                        onChange={(e) => setAssignmentData({...assignmentData, max_marks: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                      <input
                        type="datetime-local"
                        value={assignmentData.due_date}
                        onChange={(e) => setAssignmentData({...assignmentData, due_date: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </>
                )}

                {/* File Upload Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {assignmentData.type === "Resource" 
                      ? "Upload Files (Recommended)" 
                      : "Upload Files (Optional)"
                    }
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-indigo-500 transition-all">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="mt-2 text-sm text-indigo-600">Click to select files or drag and drop</p>
                      <p className="text-xs text-gray-500">Multiple files are allowed</p>
                    </label>
                  </div>

                  {/* Selected Files Preview */}
                  {selectedFiles.length > 0 && (
                    <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          {selectedFiles.length} files selected
                        </span>
                        <button 
                          type="button"
                          onClick={clearSelectedFiles} 
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Clear all
                        </button>
                      </div>
                      <div className="max-h-40 overflow-y-auto">
                        <ul className="space-y-1">
                          {selectedFiles.map((file, index) => (
                            <li key={index} className="text-xs flex justify-between items-center p-2 bg-white rounded border border-gray-200">
                              <div className="flex items-center gap-2 truncate">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="truncate">{file.name}</span>
                              </div>
                              <span className="text-gray-500">{formatFileSize(file.size)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleCreateAssignment}
                    disabled={uploadingFiles}
                    className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {uploadingFiles ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Assignment...
                      </>
                    ) : (
                      "Create Assignment"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
