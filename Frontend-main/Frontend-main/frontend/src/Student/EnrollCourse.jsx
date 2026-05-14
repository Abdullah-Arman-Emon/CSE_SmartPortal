import React, { useState, useEffect } from 'react';
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const EnrollCourse = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [studentProfile, setStudentProfile] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    courseCode: ''
  });

  // Authentication check
    useEffect(() => {
      if (!user?.isAuthenticated) {
        navigate("/login");
        return;
      }
    }, [navigate]);

  useEffect(() => {
    const fetchStudent = async (userId) => {
      try {
        const response = await axios.get(`${BACKEND_URL}/v1/auth/get/student`, {
          params: { user_id: userId },
        });
        setStudentProfile(response?.data);
      } catch (error) {
        console.error("Failed to fetch student:", error.response?.data || error.message);
      }
    };

    if (user && user?.id) {
      fetchStudent(user?.id);
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Using the correct API endpoint from StudentMyClassesApi.py
      const response = await axios.get(
        `${BACKEND_URL}/v1/student/courses/enroll_by_code/${studentProfile.id}/${formData.courseCode}`
      );

      setMessage({ 
        type: 'success', 
        text: 'Successfully enrolled in the course! You can now view it in "My Courses".' 
      });
      
      // Reset course code field
      setFormData(prev => ({ ...prev, courseCode: '' }));
      
      // Redirect to My Courses after 2 seconds
      setTimeout(() => {
        navigate('/my-courses');
      }, 2000);
      
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Enrollment failed. Please check the course code and try again.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-white shadow-sm">
        <div className="flex items-center gap-4">
          <Link 
            to="/student-dashboard" 
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </Link>
          <div className="text-xl font-bold">
            Enroll in Course
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Enroll in a new course</h1>
          <p className="text-slate-600">Enter the course code provided by your instructor</p>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Enrollment Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Course Code */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Course Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="courseCode"
                  placeholder="Enter course code"
                  value={formData.courseCode}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                  maxLength={50}
                />
                <div className="absolute right-3 top-3 text-sm text-slate-400">
                  {formData.courseCode.length}/50
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Enter the course code provided by your instructor.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !formData.courseCode.trim() || !studentProfile.id}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white py-3 px-6 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
            >
              {loading ? 'Enrolling...' : 'Enroll'}
            </button>
          </form>

          {/* Additional Information */}
          <div className="mt-8 p-4 bg-slate-50 rounded-lg">
            <h3 className="font-semibold text-slate-800 mb-2">Important Notes:</h3>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• Make sure the course code is correct before submitting</li>
              <li>• Each course has a unique code that instructors provide</li>
              <li>• Once enrolled, you'll have immediate access to course materials</li>
              <li>• If you have trouble enrolling, contact your instructor</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnrollCourse;