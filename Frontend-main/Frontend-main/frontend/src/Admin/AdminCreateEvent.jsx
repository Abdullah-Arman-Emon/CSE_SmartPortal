import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
    FaCalendarAlt,
    FaUpload,
    FaCheckCircle,
    FaExclamationCircle,
    FaMapMarkerAlt,
    FaClock,
    FaLink,
    FaVideo,
    FaFileImage,
} from "react-icons/fa";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function AdminCreateEvent() {
    const [form, setForm] = useState({
        name: "",
        description: "",
        start_date: "",
        end_date: "",
        location: "",
        registration_deadline: "",
        image_url: "",
        video_url: "",
        registration_link: "",
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [imgUploading, setImgUploading] = useState(false);
    const [videoUploading, setVideoUploading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    // Handle image upload
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImgUploading(true);
        setError("");
        try {
            const data = new FormData();
            data.append("file", file);
            const res = await axios.post(
                `${BACKEND_URL}/utility/upload`,
                data,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );
            setForm((prev) => ({ ...prev, image_url: res.data.url }));
        } catch (err) {
            setError("Failed to upload image.");
        } finally {
            setImgUploading(false);
        }
    };

    // Handle video upload
    const handleVideoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setVideoUploading(true);
        setError("");
        try {
            const data = new FormData();
            data.append("file", file);
            const res = await axios.post(
                `${BACKEND_URL}/utility/upload`,
                data,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );
            setForm((prev) => ({ ...prev, video_url: res.data.url }));
        } catch (err) {
            setError("Failed to upload video.");
        } finally {
            setVideoUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccess("");
        setError("");
        try {
            await axios.post(`${BACKEND_URL}/admin/events/create`, form);
            setSuccess("🎉 Event created successfully!");
            setForm({
                name: "",
                description: "",
                start_date: "",
                end_date: "",
                location: "",
                registration_deadline: "",
                image_url: "",
                video_url: "",
                registration_link: "",
            });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Failed to create event. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.4,
                when: "beforeChildren",
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.3 } },
    };

    return (
        <motion.div
            className="w-full"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div variants={itemVariants} className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">
                    Create New Event
                </h2>
                <p className="text-slate-600 text-sm">
                    Add a new event for students and faculty members
                </p>
            </motion.div>

            {/* Success Message */}
            {success && (
                <motion.div
                    className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center"
                    variants={itemVariants}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <FaCheckCircle className="mr-2 text-green-500" />
                    {success}
                </motion.div>
            )}

            {/* Error Message */}
            {error && (
                <motion.div
                    className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center"
                    variants={itemVariants}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <FaExclamationCircle className="mr-2 text-red-500" />
                    {error}
                </motion.div>
            )}

            <motion.form
                onSubmit={handleSubmit}
                className="space-y-6 bg-white rounded-lg border border-slate-100 p-6 shadow-sm"
                variants={containerVariants}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Event Name */}
                    <motion.div
                        className="flex flex-col gap-2"
                        variants={itemVariants}
                    >
                        <label
                            htmlFor="event-name"
                            className="flex items-center gap-2 font-medium text-sm text-slate-700"
                        >
                            <FaCalendarAlt className="text-orange-500" />
                            Event Name
                        </label>
                        <input
                            id="event-name"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Enter event name"
                            className="border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                            required
                        />
                    </motion.div>

                    {/* Location */}
                    <motion.div
                        className="flex flex-col gap-2"
                        variants={itemVariants}
                    >
                        <label
                            htmlFor="event-location"
                            className="flex items-center gap-2 font-medium text-sm text-slate-700"
                        >
                            <FaMapMarkerAlt className="text-orange-500" />
                            Location
                        </label>
                        <input
                            id="event-location"
                            name="location"
                            value={form.location}
                            onChange={handleChange}
                            placeholder="Enter event location"
                            className="border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                            required
                        />
                    </motion.div>

                    {/* Start Date */}
                    <motion.div
                        className="flex flex-col gap-2"
                        variants={itemVariants}
                    >
                        <label
                            htmlFor="event-start-date"
                            className="flex items-center gap-2 font-medium text-sm text-slate-700"
                        >
                            <FaClock className="text-orange-500" />
                            Start Date & Time
                        </label>
                        <input
                            id="event-start-date"
                            name="start_date"
                            type="datetime-local"
                            value={form.start_date}
                            onChange={handleChange}
                            className="border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                            required
                        />
                    </motion.div>

                    {/* End Date */}
                    <motion.div
                        className="flex flex-col gap-2"
                        variants={itemVariants}
                    >
                        <label
                            htmlFor="event-end-date"
                            className="flex items-center gap-2 font-medium text-sm text-slate-700"
                        >
                            <FaClock className="text-orange-500" />
                            End Date & Time
                        </label>
                        <input
                            id="event-end-date"
                            name="end_date"
                            type="datetime-local"
                            value={form.end_date}
                            onChange={handleChange}
                            className="border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                            required
                        />
                    </motion.div>

                    {/* Registration Deadline */}
                    <motion.div
                        className="flex flex-col gap-2"
                        variants={itemVariants}
                    >
                        <label
                            htmlFor="event-registration-deadline"
                            className="flex items-center gap-2 font-medium text-sm text-slate-700"
                        >
                            <FaClock className="text-orange-500" />
                            Registration Deadline
                        </label>
                        <input
                            id="event-registration-deadline"
                            name="registration_deadline"
                            type="datetime-local"
                            value={form.registration_deadline}
                            onChange={handleChange}
                            className="border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                            required
                        />
                    </motion.div>

                    {/* Registration Link */}
                    <motion.div
                        className="flex flex-col gap-2"
                        variants={itemVariants}
                    >
                        <label
                            htmlFor="event-registration-link"
                            className="flex items-center gap-2 font-medium text-sm text-slate-700"
                        >
                            <FaLink className="text-orange-500" />
                            Registration Link
                        </label>
                        <input
                            id="event-registration-link"
                            name="registration_link"
                            value={form.registration_link}
                            onChange={handleChange}
                            placeholder="https://registration-link.com"
                            className="border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        />
                    </motion.div>

                    {/* Image Upload */}
                    <motion.div
                        className="flex flex-col gap-2"
                        variants={itemVariants}
                    >
                        <label
                            htmlFor="event-image"
                            className="flex items-center gap-2 font-medium text-sm text-slate-700"
                        >
                            <FaFileImage className="text-orange-500" />
                            Event Image
                        </label>
                        <div className="relative">
                            <input
                                id="event-image"
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                                disabled={imgUploading}
                            />
                            <div className="border border-slate-200 rounded-lg p-3 text-slate-500 flex items-center justify-center gap-2 h-12 bg-slate-50 hover:bg-slate-100 transition-colors">
                                <FaUpload className="text-orange-500" />
                                <span className="text-sm">
                                    {imgUploading
                                        ? "Uploading..."
                                        : "Choose Image File"}
                                </span>
                            </div>
                        </div>
                        {form.image_url && (
                            <div className="mt-2 rounded-lg overflow-hidden border border-slate-200 relative group">
                                <img
                                    src={form.image_url}
                                    alt="Event"
                                    className="w-full h-32 object-cover"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 flex items-center justify-center transition-all">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setForm({ ...form, image_url: "" })
                                        }
                                        className="bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Video Upload */}
                    <motion.div
                        className="flex flex-col gap-2"
                        variants={itemVariants}
                    >
                        <label
                            htmlFor="event-video"
                            className="flex items-center gap-2 font-medium text-sm text-slate-700"
                        >
                            <FaVideo className="text-orange-500" />
                            Event Video
                        </label>
                        <div className="relative">
                            <input
                                id="event-video"
                                type="file"
                                accept="video/*"
                                onChange={handleVideoUpload}
                                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                                disabled={videoUploading}
                            />
                            <div className="border border-slate-200 rounded-lg p-3 text-slate-500 flex items-center justify-center gap-2 h-12 bg-slate-50 hover:bg-slate-100 transition-colors">
                                <FaUpload className="text-orange-500" />
                                <span className="text-sm">
                                    {videoUploading
                                        ? "Uploading..."
                                        : "Choose Video File"}
                                </span>
                            </div>
                        </div>
                        {form.video_url && (
                            <div className="mt-2 rounded-lg overflow-hidden border border-slate-200 relative group">
                                <video
                                    src={form.video_url}
                                    controls
                                    className="w-full h-32 object-cover"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 flex items-center justify-center transition-all">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setForm({ ...form, video_url: "" })
                                        }
                                        className="bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Event Description */}
                <motion.div
                    className="flex flex-col gap-2"
                    variants={itemVariants}
                >
                    <label
                        htmlFor="event-description"
                        className="flex items-center gap-2 font-medium text-sm text-slate-700"
                    >
                        <FaCalendarAlt className="text-orange-500" />
                        Event Description
                    </label>
                    <textarea
                        id="event-description"
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        placeholder="Provide a detailed description of the event"
                        className="border border-slate-200 rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all min-h-[120px]"
                        rows={4}
                        required
                    />
                </motion.div>

                {/* Submit Button */}
                <motion.div
                    variants={itemVariants}
                    className="pt-4 border-t border-slate-100"
                >
                    <button
                        type="submit"
                        className="w-full py-3 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-base shadow-sm transition-all flex items-center justify-center gap-2"
                        disabled={loading || imgUploading || videoUploading}
                    >
                        <FaCalendarAlt />
                        {loading ? "Creating Event..." : "Create Event"}
                    </button>
                </motion.div>
            </motion.form>
        </motion.div>
    );
}
