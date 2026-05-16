import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
    ArrowLeft,
    Calendar,
    MapPin,
    Clock,
    Award,
    X,
    Search,
} from "lucide-react"; // Added Search icon

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function StudentEventShow() {
    const [events, setEvents] = useState([]);
    const [hovered, setHovered] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        axios
            .get(`${BACKEND_URL}/admin/events/get/all`)
            .then((res) => setEvents(res.data))
            .catch(() => setEvents([]));
    }, []);

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return "Unknown date";

        const options = {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        };

        try {
            return new Date(dateString).toLocaleDateString("en-US", options);
        } catch {
            return dateString;
        }
    };

    // Filter events based on search term
    const filteredEvents = events.filter(
        (event) =>
            event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.description
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            event.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-slate-100">
            {/* Sticky Header */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="py-4 md:py-6 flex items-center justify-between">
                        <Link
                            to="/student-dashboard"
                            className="inline-flex items-center gap-2 text-slate-600 hover:text-orange-600 transition-colors"
                        >
                            <ArrowLeft size={18} />
                            <span className="text-sm font-medium">
                                Back to Dashboard
                            </span>
                        </Link>

                        {/* Search bar */}
                        <div className="relative max-w-xs w-full hidden md:block">
                            <input
                                type="text"
                                placeholder="Search events..."
                                className="w-full py-2 pl-10 pr-4 rounded-full border border-slate-200 focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-16">
                {/* Page header with decorative background */}
                <div className="mb-10 relative">
                    <div className="absolute inset-0 -z-10 bg-gradient-to-r from-orange-100 to-orange-50 rounded-2xl opacity-70"></div>
                    <div className="relative z-10 px-6 py-8 md:py-10 rounded-2xl">
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-800 mb-3">
                            Upcoming Events
                        </h1>
                        <div className="w-20 h-1.5 bg-orange-500 rounded-full mb-4"></div>
                        <p className="text-slate-600 max-w-2xl text-sm md:text-base">
                            Discover and participate in the latest events
                            happening at our institution. Stay connected and
                            engaged with various activities throughout the
                            academic year.
                        </p>

                        {/* Mobile search */}
                        <div className="relative max-w-xs mt-4 md:hidden">
                            <input
                                type="text"
                                placeholder="Search events..."
                                className="w-full py-2 pl-10 pr-4 rounded-full border border-slate-200 focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        </div>
                    </div>
                </div>

                {/* Events grid with responsive columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {filteredEvents.length === 0 ? (
                        <div className="col-span-full bg-white rounded-xl shadow-lg p-12 text-center border border-slate-100">
                            <div className="bg-orange-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                                <Calendar className="h-8 w-8 text-orange-500" />
                            </div>
                            <h2 className="text-xl font-semibold text-slate-800 mb-3">
                                {searchTerm
                                    ? "No matching events found"
                                    : "No Events Available"}
                            </h2>
                            <p className="text-slate-600 max-w-md mx-auto">
                                {searchTerm
                                    ? "Try using different keywords or check back later for new events."
                                    : "There are currently no upcoming events to display. Check back later for new events."}
                            </p>
                        </div>
                    ) : (
                        filteredEvents.map((event) => (
                            <motion.div
                                key={event.id}
                                className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col cursor-pointer border border-slate-100 transition-all hover:shadow-xl h-full"
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.4,
                                    delay: 0.1 * event.id,
                                }}
                                whileHover={{ scale: 1.02, y: -5 }}
                                onClick={() => setSelectedEvent(event)}
                            >
                                <div
                                    className="relative w-full h-48 overflow-hidden"
                                    onMouseEnter={() => setHovered(event.id)}
                                    onMouseLeave={() => setHovered(null)}
                                >
                                    {hovered === event.id &&
                                    event.video_url &&
                                    event.video_url.startsWith("http") ? (
                                        <motion.video
                                            src={event.video_url}
                                            autoPlay
                                            muted
                                            loop
                                            className="object-cover w-full h-full"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    ) : (
                                        <motion.img
                                            src={event.image_url}
                                            alt={event.name}
                                            className="object-cover w-full h-full transition-transform duration-500 ease-in-out hover:scale-110"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    )}

                                    {/* Event date ribbon */}
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md">
                                        <div className="text-xs font-medium text-orange-700">
                                            {new Date(
                                                event.start_date
                                            ).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 md:p-6 flex flex-col flex-1 border-t border-slate-100">
                                    <h3 className="text-lg md:text-xl font-bold text-orange-700 mb-2">
                                        {event.name}
                                    </h3>
                                    <p className="text-slate-600 mb-4 line-clamp-2 text-sm md:text-base">
                                        {event.description}
                                    </p>

                                    <div className="space-y-2 mb-5">
                                        <div className="flex items-center text-sm text-slate-500">
                                            <MapPin className="h-4 w-4 mr-2 text-orange-400 flex-shrink-0" />
                                            <span className="truncate">
                                                {event.location}
                                            </span>
                                        </div>

                                        <div className="flex items-center text-sm text-slate-500">
                                            <Calendar className="h-4 w-4 mr-2 text-orange-400 flex-shrink-0" />
                                            <span>
                                                Starts:{" "}
                                                {
                                                    formatDate(
                                                        event.start_date
                                                    ).split(",")[0]
                                                }
                                            </span>
                                        </div>

                                        <div className="flex items-center text-sm text-slate-500">
                                            <Clock className="h-4 w-4 mr-2 text-orange-400 flex-shrink-0" />
                                            <span>
                                                Ends:{" "}
                                                {
                                                    formatDate(
                                                        event.end_date
                                                    ).split(",")[0]
                                                }
                                            </span>
                                        </div>

                                        <div className="flex items-center text-sm text-slate-500">
                                            <Award className="h-4 w-4 mr-2 text-orange-400 flex-shrink-0" />
                                            <span>
                                                Register by:{" "}
                                                {
                                                    formatDate(
                                                        event.registration_deadline
                                                    ).split(",")[0]
                                                }
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        {event.registration_link &&
                                        event.registration_link.startsWith(
                                            "http"
                                        ) ? (
                                            <a
                                                href={event.registration_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-block w-full text-center py-2.5 px-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition shadow-sm hover:shadow focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                Register Now
                                            </a>
                                        ) : (
                                            <button
                                                className="inline-block w-full text-center py-2.5 px-4 bg-slate-200 text-slate-500 rounded-lg font-semibold cursor-not-allowed"
                                                disabled
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                Registration Unavailable
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Modal for event details - made scrollable */}
                <AnimatePresence>
                    {selectedEvent && (
                        <motion.div
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedEvent(null)}
                        >
                            <motion.div
                                className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] relative overflow-hidden flex flex-col"
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 10 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Modal header with image/video */}
                                <div className="relative">
                                    {selectedEvent.video_url &&
                                    selectedEvent.video_url.startsWith(
                                        "http"
                                    ) ? (
                                        <video
                                            src={selectedEvent.video_url}
                                            controls
                                            className="w-full h-56 md:h-64 object-cover"
                                        />
                                    ) : (
                                        <img
                                            src={selectedEvent.image_url}
                                            alt={selectedEvent.name}
                                            className="w-full h-56 md:h-64 object-cover"
                                        />
                                    )}

                                    {/* Close button */}
                                    <button
                                        className="absolute top-4 right-4 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 transition-colors"
                                        onClick={() => setSelectedEvent(null)}
                                        aria-label="Close"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                {/* Modal content - made scrollable */}
                                <div className="p-6 md:p-8 overflow-y-auto flex-1">
                                    <h2 className="text-xl md:text-2xl font-bold text-orange-700 mb-3">
                                        {selectedEvent.name}
                                    </h2>
                                    <p className="mb-6 text-slate-700 leading-relaxed text-sm md:text-base">
                                        {selectedEvent.description}
                                    </p>

                                    <div className="bg-slate-50 rounded-lg p-4 mb-6 space-y-3 border border-slate-100">
                                        <div className="flex items-center text-slate-700">
                                            <MapPin className="h-5 w-5 mr-3 text-orange-500 flex-shrink-0" />
                                            <div>
                                                <div className="font-medium">
                                                    Location
                                                </div>
                                                <div className="text-slate-600">
                                                    {selectedEvent.location}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center text-slate-700">
                                            <Calendar className="h-5 w-5 mr-3 text-orange-500 flex-shrink-0" />
                                            <div>
                                                <div className="font-medium">
                                                    Start Date & Time
                                                </div>
                                                <div className="text-slate-600">
                                                    {formatDate(
                                                        selectedEvent.start_date
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center text-slate-700">
                                            <Clock className="h-5 w-5 mr-3 text-orange-500 flex-shrink-0" />
                                            <div>
                                                <div className="font-medium">
                                                    End Date & Time
                                                </div>
                                                <div className="text-slate-600">
                                                    {formatDate(
                                                        selectedEvent.end_date
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center text-slate-700">
                                            <Award className="h-5 w-5 mr-3 text-orange-500 flex-shrink-0" />
                                            <div>
                                                <div className="font-medium">
                                                    Registration Deadline
                                                </div>
                                                <div className="text-slate-600">
                                                    {formatDate(
                                                        selectedEvent.registration_deadline
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="sticky bottom-0 bg-white pt-4">
                                        {selectedEvent.registration_link &&
                                        selectedEvent.registration_link.startsWith(
                                            "http"
                                        ) ? (
                                            <a
                                                href={
                                                    selectedEvent.registration_link
                                                }
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-block w-full text-center py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition shadow-md hover:shadow-lg focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                                            >
                                                Register for This Event
                                            </a>
                                        ) : (
                                            <button
                                                className="inline-block w-full text-center py-3 px-4 bg-slate-200 text-slate-500 rounded-lg font-semibold cursor-not-allowed"
                                                disabled
                                            >
                                                Registration Unavailable
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
