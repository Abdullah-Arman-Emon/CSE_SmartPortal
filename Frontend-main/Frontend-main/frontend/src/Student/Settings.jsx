import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  UserCircle2,
  Eye,
  EyeOff,
  ArrowLeft,
  MapPin,
  Plus,
  Square,
  Camera,
  Type,
  Settings,
  Code,
} from "lucide-react";

import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const SettingsPage = () => {
  // State for password visibility toggles

  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // State for description input (for char count)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [profileImg, setProfileImg] = useState("");
  const [profileImgPath, setProfileImgPath] = useState(""); // Added state for image path
  const [uploadingImage, setUploadingImage] = useState(false); // Added state for upload status

  const [preview, setPreview] = useState(null);
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const { user , setUser} = useContext(AuthContext);
  const [studentProfile, setStudentProfile] = useState({});
  const [originalProfile, setOriginalProfile] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const navigate = useNavigate();

  

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

    if (studentProfile) {
      setFirstName(studentProfile?.first_name);
      setLastName(studentProfile?.last_name);
      setDescription(studentProfile?.bio);
      setPhone(studentProfile?.phone);
      
      // Handle profile image from backend
      if (studentProfile?.profile_image) {
        setProfileImgPath(studentProfile.profile_image);
        setProfileImg(studentProfile.profile_image);
      }

      // Store original profile for comparison
      setOriginalProfile({
        first_name: studentProfile?.first_name,
        last_name: studentProfile?.last_name,
        bio: studentProfile?.bio,
        phone: studentProfile?.phone,
        profile_image: studentProfile?.profile_image,
      });
    }
  }, [studentProfile]);

  // Check for unsaved changes
  useEffect(() => {
    const hasChanges =
      firstName !== originalProfile.first_name ||
      lastName !== originalProfile.last_name ||
      description !== originalProfile.bio ||
      phone !== originalProfile.phone ||
      preview !== null ||
      profileImgPath !== originalProfile.profile_image;

    setHasUnsavedChanges(hasChanges);
  }, [firstName, lastName, description, phone, preview, profileImgPath, originalProfile]);

  const handleBackClick = (e) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      const shouldDiscard = window.confirm(
        "You have unsaved changes. Are you sure you want to go back? Your changes will be discarded."
      );
      if (shouldDiscard) {
        navigate("/student-dashboard");
      }
    }
  };

  // Function to handle image upload to the server
  const handleImageUpload = async (file) => {
    if (!file) return;

    try {
      setUploadingImage(true);
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', file);

      // Send file to backend
      const response = await axios.post(
        `${BACKEND_URL}/utility/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Get the file path from response
      const filePath = response.data?.url;
      setProfileImgPath(filePath);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
      
    } catch (error) {
      console.error("Image upload failed:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent full page reload

    try {
      const payload = {
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        bio: description,
        batch: studentProfile.batch,
        profile_image: profileImgPath || "", // Use image path instead of base64
      };

      const res = await axios.put(
        `${BACKEND_URL}/student/settings/update_profile/${studentProfile.id}`,
        payload
      );

      alert("Profile updated!");
      setStudentProfile(res.data);
      setHasUnsavedChanges(false);
      setPreview(null);
    } catch (err) {
      console.error("Update failed:", err);
      alert("Failed to update profile.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 bg-white shadow">
        <div className="flex items-center gap-4">
          <Link
            to="/student-dashboard"
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
            onClick={handleBackClick}
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </Link>
        </div>
        
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-5xl mx-auto px-6 py-8 w-full">
        {/* Unsaved changes indicator */}
        {hasUnsavedChanges && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              You have unsaved changes. Don't forget to save your profile updates.
            </p>
          </div>
        )}

        {/* Account Settings */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-6 text-gray-800">
            Account settings
          </h2>
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left column: Profile image */}
            <div className="bg-white p-6 rounded-lg shadow flex flex-col items-center">
              <div className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden mb-4 flex items-center justify-center">
                {preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : profileImg ? (
                  <img
                    src={profileImg}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserCircle2 className="w-24 h-24 text-gray-400" />
                )}
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    handleImageUpload(file);
                  }
                }}
                className="hidden"
                id="upload"
                disabled={uploadingImage}
              />

              <label
                htmlFor="upload"
                className={`text-orange-500 font-semibold cursor-pointer hover:underline ${
                  uploadingImage ? 'opacity-50' : ''
                }`}
              >
                {uploadingImage ? "Uploading..." : "Upload Photo"}
              </label>

              <p className="mt-2 text-sm text-gray-500 text-center">
                Under 1MB • 1:1 Ratio
              </p>
            </div>

            {/* Right column: Form */}
            <form
              className="md:w-2/3 bg-white p-6 rounded-lg shadow space-y-6"
              onSubmit={handleSubmit}
            >
              {/* Full Name */}
              <div>
                <label className="block font-semibold mb-1 text-gray-700">
                  Full name
                </label>
                <div className="flex gap-4">
                  <input
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <input
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block font-semibold mb-1 text-gray-700">
                  Email address
                </label>
                <p className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-700">
                  {user?.email}
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold mb-1 text-gray-700 flex justify-between">
                  <span>Description</span>
                </label>
                <input
                  type="text"
                  maxLength={100}
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              {/* Batch */}
              <div>
                <label className="block font-semibold mb-1 text-gray-700">
                  Batch
                </label>
                <p className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-700">
                  {studentProfile?.batch}
                </p>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block font-semibold mb-1 text-gray-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  maxLength={15}
                  placeholder="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              {/* Save button */}
              <button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-md transition"
              >
                Save Changes
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
};

export default SettingsPage;
