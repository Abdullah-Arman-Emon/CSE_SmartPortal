import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const CreateNewCourse = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [teacherProfile, setTeacherProfile] = useState({});
  const [loading, setLoading] = useState(false);

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
    console.log("teacher profile");
    console.log(teacherProfile);

    if (teacherProfile) {
      setFormData((prev) => ({
        ...prev,
        teacher_id: teacherProfile.id,
      }));
    }
  }, [teacherProfile]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    other_links: "",
    semester: "",
    batch: "",
    type: "Theory",
    image_url: "",
  });

  const [schedules, setSchedules] = useState([
    { day: "Sunday", start_time: "09:00" }
  ]);

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Course title is required";
    }

    if (!formData.semester) {
      newErrors.semester = "Semester is required";
    }

    if (!formData.batch) {
      newErrors.batch = "Batch is required";
    } else if (isNaN(formData.batch) || formData.batch <= 0) {
      newErrors.batch = "Batch must be a positive number";
    }

    if (schedules.length === 0) {
      newErrors.schedules = "At least one schedule is required";
    }

    if (!teacherProfile?.id) {
      newErrors.teacher = "Teacher profile not loaded";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleScheduleChange = (index, field, value) => {
    const updatedSchedules = [...schedules];
    updatedSchedules[index][field] = value;
    setSchedules(updatedSchedules);
  };

  const addSchedule = () => {
    setSchedules([...schedules, { day: "Sunday", start_time: "09:00" }]);
  };

  const removeSchedule = (index) => {
    if (schedules.length > 1) {
      const updatedSchedules = schedules.filter((_, i) => i !== index);
      setSchedules(updatedSchedules);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setMessage("");

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      other_links: formData.other_links.trim() || null,
      semester: formData.semester,
      batch: parseInt(formData.batch),
      type: formData.type,
      image_url: formData.image_url.trim() || null,
      teacher_id: teacherProfile.id,
      schedules: schedules,
      running: true, // Setting default as true for new courses
    };

    try {
      const res = await axios.post(`${BACKEND_URL}/v1/courses/create`, payload);
      setMessage({
        type: "success",
        text: res.data.message || "Course created successfully",
      });

      // Reset form
      setFormData({
        title: "",
        description: "",
        other_links: "",
        semester: "",
        batch: "",
        type: "Theory",
        image_url: "",
      });
      setSchedules([{ day: "Sunday", start_time: "09:00" }]);
    } catch (err) {
      console.error("Failed to create course:", err);
      const errorMessage = err.response?.data?.detail || "Failed to create course";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow-lg rounded-lg p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">
          Create New Course
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Course Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Title *
            </label>
            <input
              type="text"
              name="title"
              placeholder="Enter course title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                errors.title ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              placeholder="Enter course description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Semester and Batch */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Semester *
              </label>
              <select
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  errors.semester ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select Semester</option>
                <option value="1-1">1-1</option>
                <option value="1-2">1-2</option>
                <option value="2-1">2-1</option>
                <option value="2-2">2-2</option>
                <option value="3-1">3-1</option>
                <option value="3-2">3-2</option>
                <option value="4-1">4-1</option>
                <option value="4-2">4-2</option>
              </select>
              {errors.semester && (
                <p className="text-red-500 text-sm mt-1">{errors.semester}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batch *
              </label>
              <input
                type="number"
                name="batch"
                placeholder="Enter batch number"
                value={formData.batch}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  errors.batch ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.batch && (
                <p className="text-red-500 text-sm mt-1">{errors.batch}</p>
              )}
            </div>
          </div>

          {/* Course Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Type
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="Theory">Theory</option>
              <option value="Lab">Lab</option>
            </select>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Image URL (Optional)
            </label>
            <input
              type="url"
              name="image_url"
              placeholder="Enter image URL"
              value={formData.image_url}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              Leave empty to use a random default image
            </p>
          </div>

          {/* Schedules */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Schedule *
            </label>
            {schedules.map((schedule, index) => (
              <div key={index} className="flex mb-3 space-x-2 items-end">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Day</label>
                  <select
                    value={schedule.day}
                    onChange={(e) => handleScheduleChange(index, "day", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="Sunday">Sunday</option>
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={schedule.start_time}
                    onChange={(e) => handleScheduleChange(index, "start_time", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeSchedule(index)}
                  disabled={schedules.length <= 1}
                  className={`px-3 py-2 rounded-lg ${
                    schedules.length <= 1
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-red-100 text-red-600 hover:bg-red-200"
                  }`}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addSchedule}
              className="mt-2 text-sm text-orange-600 hover:text-orange-800 flex items-center"
            >
              <span className="mr-1">+</span> Add Another Schedule
            </button>
            {errors.schedules && (
              <p className="text-red-500 text-sm mt-1">{errors.schedules}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-orange-500 hover:bg-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            }`}
          >
            {loading ? "Creating Course..." : "Create Course"}
          </button>
        </form>

        {/* Message Display */}
        {message && (
          <div
            className={`mt-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        {errors.teacher && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{errors.teacher}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateNewCourse;