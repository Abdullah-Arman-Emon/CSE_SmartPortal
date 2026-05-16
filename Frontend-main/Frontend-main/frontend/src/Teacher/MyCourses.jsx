import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";


const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const Skeleton = ({ className = "h-6 w-full" }) => {
  return <div className={`bg-gray-200 animate-pulse rounded ${className}`} />;
};

const CourseCard = ({ course, onDelete }) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${course.title}"?`)) {
      return;
    }

    setDeleting(true);
    try {
      await axios.delete(`${BACKEND_URL}/v1/courses/delete/course${course.id}`);
      onDelete(course.id);
    } catch (error) {
      console.error("Failed to delete course:", error);
      alert("Failed to delete course");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        <img
          src={course.image_url || "https://via.placeholder.com/400x200"}
          alt={course.title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-4 right-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            course.type === "Theory" 
              ? "bg-blue-100 text-blue-800" 
              : "bg-green-100 text-green-800"
          }`}>
            {course.type}
          </span>
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{course.title}</h3>
        
        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <p><span className="font-medium">Code:</span> {course.code}</p>
          <p><span className="font-medium">Semester:</span> {course.semester}</p>
          <p><span className="font-medium">Batch:</span> {course.batch}</p>
          <p><span className="font-medium">Status:</span> 
            <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
              course.running 
                ? "bg-green-100 text-green-800" 
                : "bg-red-100 text-red-800"
            }`}>
              {course.running ? "Running" : "Stopped"}
            </span>
          </p>
        </div>

        {course.description && (
          <p className="text-gray-700 text-sm mb-4 line-clamp-3">
            {course.description}
          </p>
        )}

        <div className="flex gap-2">
          <Link
            to={`/teacher/classroom/${course.id}`}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-center py-2 px-4 rounded-lg font-medium transition-colors"
          >
            Enter Classroom
          </Link>
          
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              deleting
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-red-500 hover:bg-red-600 text-white"
            }`}
          >
            {deleting ? "..." : "🗑️"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function MyCourses() {
  const { user } = useContext(AuthContext);
  const [teacherProfile, setTeacherProfile] = useState({});


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

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      if (!teacherProfile?.id) return;

      try {
        setLoading(true);
        const response = await axios.get(
          `${BACKEND_URL}/v1/teacher/courses/my_classes/${teacherProfile.id}`
        );
        setCourses(response.data);
      } catch (err) {
        console.error("Failed to fetch courses:", err);
        setError("Failed to load courses");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [teacherProfile]);

  const handleCourseDelete = (courseId) => {
    setCourses(prev => prev.filter(course => course.id !== courseId));
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">My Courses</h1>
          <div className="text-sm text-gray-600">
            Total: {courses.length} courses
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80 w-full rounded-2xl" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-gray-600 mb-2">No courses yet</h2>
            <p className="text-gray-500">Create your first course to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard 
                key={course.id} 
                course={course} 
                onDelete={handleCourseDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
