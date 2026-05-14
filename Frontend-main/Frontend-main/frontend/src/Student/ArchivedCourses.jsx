import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, UserCircle, Archive, MoreVertical } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";


const ArchivedCourses = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [archivedCourses, setArchivedCourses] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const mockArchivedCourses = [
    {
      id: 5,
      code: "CSE 101",
      title: "Introduction to Programming",
      instructor: "Dr. Robert Kim",
      credits: 3,
      session: "2019-20",
      students: 150,
      category: "CORE",
      status: "archived"
    }
  ];

  useEffect(() => {
    
    if (!user?.isAuthenticated) {
      navigate('/login');
      return;
    }
    
  }, [navigate]);

  const handleUnarchive = (courseId) => {
    setArchivedCourses(archivedCourses.filter(course => course.id !== courseId));
    setActiveDropdown(null);
    // Add API call and redirect logic to move back to active courses
  };

  const CourseCard = ({ course }) => (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="h-48 bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-6xl font-bold relative opacity-75">
        {course.category}
        <div className="absolute top-4 right-4 relative">
          <button 
            onClick={() => setActiveDropdown(activeDropdown === course.id ? null : course.id)}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <MoreVertical size={20} />
          </button>
          
          {activeDropdown === course.id && (
            <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-20 min-w-[150px]">
              <button
                onClick={() => handleUnarchive(course.id)}
                className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700"
              >
                <Archive size={16} />
                Unarchive Course
              </button>
            </div>
          )}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm bg-black/50 px-3 py-1 rounded-full">ARCHIVED</span>
        </div>
      </div>
      
      <div className="p-6">
        <div className="mb-4">
          <span className="text-sm text-slate-500 font-medium">{course.category}</span>
          <h3 className="text-xl font-bold text-slate-800 mb-1">{course.title}</h3>
        </div>
        
        <div className="flex items-center justify-between text-sm text-slate-600 mb-4">
          <span>{course.session}</span>
          <span>{course.students} students</span>
        </div>
        
        <button 
          className="w-full bg-slate-400 text-white py-2 px-4 rounded-lg font-medium cursor-not-allowed"
          disabled
        >
          Archived
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-white shadow-sm">
        <div className="flex items-center gap-4">
          <Link 
            to="/my-courses" 
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back to My Courses</span>
          </Link>
          <div className="text-xl font-bold">Archived Courses</div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
            <UserCircle className="text-white" size={20} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <Archive size={48} className="mx-auto text-slate-400 mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Archived Courses</h1>
          <p className="text-slate-600">Courses you have archived for future reference</p>
        </div>

        {archivedCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {archivedCourses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Archive size={48} className="mx-auto text-slate-400 mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 mb-2">No Archived Courses</h3>
            <p className="text-slate-600 mb-6">You haven't archived any courses yet.</p>
            <Link 
              to="/my-courses"
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Go to My Courses
            </Link>
          </div>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {activeDropdown && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setActiveDropdown(null)}
        />
      )}
    </div>
  );
};

export default ArchivedCourses;
