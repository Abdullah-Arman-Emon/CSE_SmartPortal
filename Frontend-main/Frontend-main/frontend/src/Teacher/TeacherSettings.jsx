import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, UserCircle2, Eye, EyeOff, ArrowLeft } from "lucide-react";

import axios from "axios";

import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const TeacherSettings = () => {
  // State for password visibility toggles
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // State for form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [work, setWork] = useState("");
  const [bio, setBio] = useState("");
  const [profileImg, setProfileImg] = useState("");
  const [profileImgPath, setProfileImgPath] = useState(""); // Added state for image path
  const [uploadingImage, setUploadingImage] = useState(false); // Added state for upload status

  // Profile links
  const [website, setWebsite] = useState("");
  const [googleScholar, setGoogleScholar] = useState("");
  const [academia, setAcademia] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [twitter, setTwitter] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [researchgate, setResearchgate] = useState("");

  const [preview, setPreview] = useState(null);
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const { user } = useContext(AuthContext);
  const [teacherProfile, setTeacherProfile] = useState({});
  const [originalProfile, setOriginalProfile] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const navigate = useNavigate();

  // Authentication check
  useEffect(() => {
    if (!user?.isAuthenticated) {
      navigate("/login");
      return;
    }
  }, [navigate]);

  useEffect(() => {
    const fetchTeacher = async (userId) => {
      try {
        const response = await axios.get(
          `${BACKEND_URL}/v1/teacher/profile/get`,
          {
            params: { userId },
          }
        );
        setTeacherProfile(response?.data);
      } catch (error) {
        console.error(
          "Failed to fetch teacher:",
          error.response?.data || error.message
        );
      }
    };

    if (user && user?.id) {
      fetchTeacher(user?.id);
    }
  }, [user]);

  useEffect(() => {
    if (teacherProfile) {
      setFirstName(teacherProfile?.first_name || "");
      setLastName(teacherProfile?.last_name || "");
      setDepartment(teacherProfile?.department || "");
      setPhone(teacherProfile?.phone || "");
      setWork(teacherProfile?.work || "");
      setBio(teacherProfile?.bio || "");
      setWebsite(teacherProfile?.website || "");
      setGoogleScholar(teacherProfile?.google_scholar || "");
      setAcademia(teacherProfile?.academia || "");
      setLinkedin(teacherProfile?.linkedin || "");
      setTwitter(teacherProfile?.twitter || "");
      setWhatsapp(teacherProfile?.whatsapp || "");
      setResearchgate(teacherProfile?.researchgate || "");

      // Handle profile image from backend
      if (teacherProfile?.profile_image) {
        // // Check if it's a path or base64
        // if (teacherProfile.profile_image.startsWith('/')) {
        //   setProfileImgPath(teacherProfile.profile_image);
        //   setProfileImg(teacherProfile.profile_image);
        // } else {
        //   setProfileImg(`data:image/jpeg;base64,${teacherProfile.profile_image}`);
        // }
        setProfileImgPath(teacherProfile.profile_image);
        setProfileImg(teacherProfile.profile_image);
      }

      // Store original profile for comparison
      setOriginalProfile({
        first_name: teacherProfile?.first_name,
        last_name: teacherProfile?.last_name,
        department: teacherProfile?.department,
        phone: teacherProfile?.phone,
        work: teacherProfile?.work,
        bio: teacherProfile?.bio,
        website: teacherProfile?.website,
        google_scholar: teacherProfile?.google_scholar,
        academia: teacherProfile?.academia,
        linkedin: teacherProfile?.linkedin,
        twitter: teacherProfile?.twitter,
        whatsapp: teacherProfile?.whatsapp,
        researchgate: teacherProfile?.researchgate,
        profile_image: teacherProfile?.profile_image,
      });
    }
  }, [teacherProfile]);

  // Check for unsaved changes
  useEffect(() => {
    const hasChanges =
      firstName !== originalProfile.first_name ||
      lastName !== originalProfile.last_name ||
      department !== originalProfile.department ||
      phone !== originalProfile.phone ||
      work !== originalProfile.work ||
      bio !== originalProfile.bio ||
      website !== originalProfile.website ||
      googleScholar !== originalProfile.google_scholar ||
      academia !== originalProfile.academia ||
      linkedin !== originalProfile.linkedin ||
      twitter !== originalProfile.twitter ||
      whatsapp !== originalProfile.whatsapp ||
      researchgate !== originalProfile.researchgate ||
      preview !== null ||
      profileImgPath !== originalProfile.profile_image;

    setHasUnsavedChanges(hasChanges);
  }, [
    firstName,
    lastName,
    department,
    phone,
    work,
    bio,
    website,
    googleScholar,
    academia,
    linkedin,
    twitter,
    whatsapp,
    researchgate,
    preview,
    profileImgPath,
    originalProfile,
  ]);

  const handleBackClick = (e) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      const shouldDiscard = window.confirm(
        "You have unsaved changes. Are you sure you want to go back? Your changes will be discarded."
      );
      if (shouldDiscard) {
        navigate("/teacher-dashboard");
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const payload = {
        first_name: firstName,
        last_name: lastName,
        department: department,
        phone: phone,
        work: work,
        bio: bio,
        profile_image: profileImgPath || null, // Use image path instead of base64
        website: website,
        google_scholar: googleScholar,
        academia: academia,
        linkedin: linkedin,
        twitter: twitter,
        whatsapp: whatsapp,
        researchgate: researchgate,
        papers: [], // Add papers if needed
      };

      const res = await axios.put(
        `${BACKEND_URL}/v1/teacher/profile/${teacherProfile.id}`,
        payload
      );

      alert("Profile updated successfully!");
      setHasUnsavedChanges(false);
      setPreview(null);

      // Auto reload the page to refresh all data
      window.location.reload();
    } catch (err) {
      console.error("Update failed:", err);
      alert("Failed to update profile.");
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (!user?.email || !oldPass || !newPass) return;

    if (newPass !== confirmPass) {
      alert("New passwords don't match");
      return;
    }

    try {
      const payload = {
        email: user?.email,
        old_pass: oldPass,
        new_pass: newPass,
      };

      const res = await axios.post(
        `${BACKEND_URL}/v1/auth/password_change`,
        payload
      );
      alert(res.data.message || "Password changed successfully!");
      setOldPass("");
      setNewPass("");
      setConfirmPass("");
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to change password");
    }
  };

  // Function to handle image upload to the server
  const handleImageUpload = async (file) => {
    if (!file) return;

    // Validate file size (1MB limit)
    // if (file.size > 1024 * 1024) {
    //   alert("File size must be under 1MB");
    //   return;
    // }

    try {
      setUploadingImage(true);

      // Create form data for file upload
      const formData = new FormData();
      formData.append("file", file);

      // Send file to backend
      const response = await axios.post(
        `${BACKEND_URL}/utility/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Main content */}
      <main className="flex-1 max-w-5xl mx-auto px-6 py-8 w-full">
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
                  uploadingImage ? "opacity-50" : ""
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

              {/* Department and Work */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-gray-700">
                    Department
                  </label>
                  <input
                    type="text"
                    placeholder="Department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-gray-700">
                    Position/Title
                  </label>
                  <input
                    type="text"
                    placeholder="Position or Title"
                    value={work}
                    onChange={(e) => setWork(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
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

              {/* Bio */}
              <div>
                <label className="block font-semibold mb-1 text-gray-700">
                  Bio
                </label>
                <textarea
                  rows="4"
                  maxLength={500}
                  placeholder="Tell us about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              {/* Profile Links */}
              <div>
                <h3 className="font-semibold mb-3 text-gray-700">
                  Profile Links
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="url"
                    placeholder="Website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <input
                    type="url"
                    placeholder="Google Scholar"
                    value={googleScholar}
                    onChange={(e) => setGoogleScholar(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <input
                    type="url"
                    placeholder="Academia.edu"
                    value={academia}
                    onChange={(e) => setAcademia(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <input
                    type="url"
                    placeholder="LinkedIn"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <input
                    type="url"
                    placeholder="Twitter"
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <input
                    type="url"
                    placeholder="ResearchGate"
                    value={researchgate}
                    onChange={(e) => setResearchgate(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <input
                  type="text"
                  placeholder="WhatsApp Number"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full mt-4 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
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
export default TeacherSettings;
