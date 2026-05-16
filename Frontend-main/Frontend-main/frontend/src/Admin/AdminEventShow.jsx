import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function getEventStatus(start, end) {
    const now = new Date();
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (now < startDate) return "Upcoming";
    if (now > endDate) return "Completed";
    return "Ongoing";
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function AdminEventPage() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editEvent, setEditEvent] = useState(null);
    const [editLoading, setEditLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        axios
            .get(`${BACKEND_URL}/admin/events/get/all`)
            .then((res) => setEvents(res.data))
            .catch(() => setEvents([]))
            .finally(() => setLoading(false));
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this event?"))
            return;
        setDeleteLoading(id);
        try {
            await axios.delete(`${BACKEND_URL}/admin/events/delete/${id}`);
            setEvents(events.filter((e) => e.id !== id));
        } catch (err) {
            setError("Failed to delete event.");
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleEditSave = async () => {
        setEditLoading(true);
        setError("");
        try {
            await axios.put(
                `${BACKEND_URL}/admin/events/update/${editEvent.id}`,
                editEvent
            );
            setEvents(
                events.map((e) => (e.id === editEvent.id ? editEvent : e))
            );
            setEditEvent(null);
        } catch (err) {
            setError("Failed to update event.");
        } finally {
            setEditLoading(false);
        }
    };

    return (
        <motion.div
            className="min-h-screen bg-white py-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <motion.h2
                className="text-3xl font-extrabold text-center mb-10 text-purple-700"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
            >
                All Events
            </motion.h2>
            {loading ? (
                <div className="text-center text-lg text-purple-500">
                    Loading events...
                </div>
            ) : (
                <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                    {events.length === 0 && (
                        <div className="col-span-2 text-center text-gray-500">
                            No events found.
                        </div>
                    )}
                    {events.map((event) => {
                        const status = getEventStatus(
                            event.start_date,
                            event.end_date
                        );
                        return (
                            <motion.div
                                key={event.id}
                                className="bg-white rounded-2xl shadow-xl p-7 flex flex-col gap-3 border-2 border-purple-100 hover:shadow-2xl transition"
                                initial={{ y: 30, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                whileHover={{
                                    scale: 1.02,
                                    borderColor: "#a78bfa",
                                }}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                                            status === "Upcoming"
                                                ? "bg-blue-100 text-blue-700"
                                                : status === "Ongoing"
                                                ? "bg-yellow-100 text-yellow-700"
                                                : "bg-green-100 text-green-700"
                                        }`}
                                    >
                                        {status}
                                    </span>
                                    <span className="text-gray-400 text-xs">
                                        ID: {event.id}
                                    </span>
                                </div>
                                <div className="flex gap-4 items-center">
                                    {event.image_url &&
                                    event.image_url !== "string" ? (
                                        <img
                                            src={event.image_url}
                                            alt={event.name}
                                            className="w-24 h-24 object-cover rounded-xl border"
                                        />
                                    ) : (
                                        <div className="w-24 h-24 bg-purple-100 rounded-xl flex items-center justify-center text-purple-400 text-3xl font-bold">
                                            📅
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <div className="text-xl font-bold text-purple-700">
                                            {event.name}
                                        </div>
                                        <div className="text-gray-600 mb-2">
                                            {event.description}
                                        </div>
                                        <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                                            <span>
                                                <b>Location:</b>{" "}
                                                {event.location}
                                            </span>
                                            <span>
                                                <b>Start:</b>{" "}
                                                {formatDate(event.start_date)}
                                            </span>
                                            <span>
                                                <b>End:</b>{" "}
                                                {formatDate(event.end_date)}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-2 text-xs mt-1">
                                            <span>
                                                <b>Registration Deadline:</b>{" "}
                                                {formatDate(
                                                    event.registration_deadline
                                                )}
                                            </span>
                                            {event.registration_link &&
                                                event.registration_link !==
                                                    "string" && (
                                                    <a
                                                        href={
                                                            event.registration_link
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 underline ml-2"
                                                    >
                                                        Register
                                                    </a>
                                                )}
                                            {event.video_url &&
                                                event.video_url !==
                                                    "string" && (
                                                    <a
                                                        href={event.video_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-pink-600 underline ml-2"
                                                    >
                                                        Watch Video
                                                    </a>
                                                )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <button
                                        className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 text-xs"
                                        onClick={() => setEditEvent(event)}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 text-xs"
                                        onClick={() => handleDelete(event.id)}
                                        disabled={deleteLoading === event.id}
                                    >
                                        {deleteLoading === event.id
                                            ? "Deleting..."
                                            : "Delete"}
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
            {error && (
                <div className="text-center text-red-600 mb-4">{error}</div>
            )}
            {/* Edit Modal */}
            {editEvent && (
                <div className="fixed inset-0 bg-black/20 bg-opacity-50 backdrop-blur-lg flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 w-full max-w-lg shadow-xl">
                        <h3 className="text-xl font-bold mb-4 text-purple-700">
                            Edit Event
                        </h3>
                        <div className="space-y-3">
                            <input
                                className="w-full border rounded p-2"
                                value={editEvent.name}
                                onChange={(e) =>
                                    setEditEvent({
                                        ...editEvent,
                                        name: e.target.value,
                                    })
                                }
                                placeholder="Event Name"
                            />
                            <textarea
                                className="w-full border rounded p-2"
                                value={editEvent.description}
                                onChange={(e) =>
                                    setEditEvent({
                                        ...editEvent,
                                        description: e.target.value,
                                    })
                                }
                                placeholder="Description"
                            />
                            <input
                                className="w-full border rounded p-2"
                                type="datetime-local"
                                value={editEvent.start_date?.slice(0, 16)}
                                onChange={(e) =>
                                    setEditEvent({
                                        ...editEvent,
                                        start_date: e.target.value,
                                    })
                                }
                            />
                            <input
                                className="w-full border rounded p-2"
                                type="datetime-local"
                                value={editEvent.end_date?.slice(0, 16)}
                                onChange={(e) =>
                                    setEditEvent({
                                        ...editEvent,
                                        end_date: e.target.value,
                                    })
                                }
                            />
                            <input
                                className="w-full border rounded p-2"
                                value={editEvent.location}
                                onChange={(e) =>
                                    setEditEvent({
                                        ...editEvent,
                                        location: e.target.value,
                                    })
                                }
                                placeholder="Location"
                            />
                            <input
                                className="w-full border rounded p-2"
                                type="datetime-local"
                                value={editEvent.registration_deadline?.slice(
                                    0,
                                    16
                                )}
                                onChange={(e) =>
                                    setEditEvent({
                                        ...editEvent,
                                        registration_deadline: e.target.value,
                                    })
                                }
                            />
                            <input
                                className="w-full border rounded p-2"
                                value={editEvent.registration_link}
                                onChange={(e) =>
                                    setEditEvent({
                                        ...editEvent,
                                        registration_link: e.target.value,
                                    })
                                }
                                placeholder="Registration Link"
                            />
                            <input
                                className="w-full border rounded p-2"
                                value={editEvent.image_url}
                                onChange={(e) =>
                                    setEditEvent({
                                        ...editEvent,
                                        image_url: e.target.value,
                                    })
                                }
                                placeholder="Image URL"
                            />
                            <input
                                className="w-full border rounded p-2"
                                value={editEvent.video_url}
                                onChange={(e) =>
                                    setEditEvent({
                                        ...editEvent,
                                        video_url: e.target.value,
                                    })
                                }
                                placeholder="Video URL"
                            />
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                                onClick={() => setEditEvent(null)}
                                disabled={editLoading}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                                onClick={handleEditSave}
                                disabled={editLoading}
                            >
                                {editLoading ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
