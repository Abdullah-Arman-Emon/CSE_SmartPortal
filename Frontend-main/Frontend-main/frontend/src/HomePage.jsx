import { Link } from "react-router-dom";
import {
    ChevronLeft,
    ChevronRight,
    Calendar,
    Users,
    BookOpen,
    Award,
    TrendingUp,
    Star,
    ExternalLink,
    Mail,
    Phone,
    FileText,
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import Navbar from "./components/Navbar";
import Chatbot from "./components/Chatbot";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function HomePage() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [studentCount, setStudentCount] = useState(0);
    const [teacherCount, setTeacherCount] = useState(0);
    const [staffCount, setStaffCount] = useState(0);

    // News state management
    const [newsItems, setNewsItems] = useState([]);
    const [newsLoading, setNewsLoading] = useState(true);
    const [newsError, setNewsError] = useState(null);

    // Events state management
    const [events, setEvents] = useState([]);
    const [eventsLoading, setEventsLoading] = useState(true);
    const [eventsError, setEventsError] = useState(null);

    // Image gallery slider state
    const galleryImages = [
        "/1.jpg",
        "/3.jpg",
        "/4.jpg",
        "/5.jpg",
        "/6.jpg",
        "/7.jpg",
        "/8.jpg",
    ];

    const [currentGalleryImage, setCurrentGalleryImage] = useState(0);

    const studentResources = [
        {
            title: "Course Registration",
            description: "Register for upcoming semester courses",
            icon: "📚",
            link: "/courses",
        },
        {
            title: "Academic Calendar",
            description: "View important dates and deadlines",
            icon: "📅",
            link: "/calendar",
        },
        {
            title: "Lab Resources",
            description: "Access lab manuals and equipment",
            icon: "🔬",
            link: "/labs",
        },
        {
            title: "Career Services",
            description: "Job placement and internship opportunities",
            icon: "💼",
            link: "/careers",
        },
        {
            title: "Research Opportunities",
            description: "Join ongoing research projects",
            icon: "🔍",
            link: "/research",
        },
        {
            title: "Student Support",
            description: "Academic and personal counseling",
            icon: "🤝",
            link: "/support",
        },
    ];

    // Fetch notices from API for the news carousel
    const fetchNotices = useCallback(async () => {
        setNewsLoading(true);
        try {
            const endpoint = `${BACKEND_URL}/student/notice/all`;

            const response = await axios.get(endpoint);

            // Sort notices by date and time (newest first)
            const sortedNotices = response.data.sort((a, b) => {
                return new Date(b.date) - new Date(a.date);
            });

            // Transform API response to match the expected format for the news carousel
            const formattedNews = sortedNotices.slice(0, 4).map((notice) => ({
                id: notice.id,
                title: notice.title,
                excerpt: notice.content
                    ? notice.content.length > 150
                        ? notice.content.substring(0, 150) + "..."
                        : notice.content
                    : notice.sub_title || "Click to read more",
                date: notice.date,
                category: notice.notice_from || "Announcement",
                image: notice.image_url || "/placeholder-news1.jpg", // Fallback image if none provided
            }));

            setNewsItems(formattedNews);
            setNewsError(null);
        } catch (error) {
            console.error("Error fetching notices:", error);
            setNewsError("Failed to load latest news. Please try again later.");

            // Fallback to static data if API call fails
            setNewsItems([
                {
                    id: 1,
                    title: "CSE Department Receives Excellence Award 2024",
                    excerpt:
                        "Our department has been recognized for outstanding contributions to computer science education and research.",
                    date: "2024-01-15",
                    category: "Achievement",
                    image: "/placeholder-news1.jpg",
                },
                {
                    id: 2,
                    title: "Revolutionary AI Research Published in Nature",
                    excerpt:
                        "Faculty members publish groundbreaking research on machine learning applications in healthcare.",
                    date: "2024-01-10",
                    category: "Research",
                    image: "/placeholder-news2.jpg",
                },
                {
                    id: 3,
                    title: "Annual Tech Summit 2024 Announced",
                    excerpt:
                        "Join us for the biggest technology conference featuring industry leaders and cutting-edge innovations.",
                    date: "2024-01-08",
                    category: "Event",
                    image: "/placeholder-news3.jpg",
                },
                {
                    id: 4,
                    title: "New Quantum Computing Lab Inaugurated",
                    excerpt:
                        "State-of-the-art quantum computing facility opens, expanding research capabilities in quantum algorithms.",
                    date: "2024-01-05",
                    category: "Infrastructure",
                    image: "/placeholder-news4.jpg",
                },
            ]);
        } finally {
            setNewsLoading(false);
        }
    }, []);

    // Fetch events from API
    const fetchEvents = useCallback(async () => {
        setEventsLoading(true);
        try {
            const endpoint = `${BACKEND_URL}/student/events/upcoming`;

            const response = await axios.get(endpoint);

            // Sort events by date (newest first)
            const sortedEvents = response.data.sort((a, b) => {
                return new Date(b.date) - new Date(a.date);
            });

            setEvents(sortedEvents);
            setEventsError(null);
        } catch (error) {
            console.error("Error fetching events:", error);
            setEventsError("Failed to load events. Please try again later.");

            // Fallback to static data if API call fails
            setEvents(recentEvents);
        } finally {
            setEventsLoading(false);
        }
    }, []);

    // Call fetchNotices and fetchEvents when component mounts
    useEffect(() => {
        fetchNotices();
        fetchEvents();
    }, [fetchNotices, fetchEvents]);

    // Animated counter effect
    useEffect(() => {
        const animateCounter = (target, setter) => {
            let current = 0;
            const increment = target / 100;
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    setter(target);
                    clearInterval(timer);
                } else {
                    setter(Math.floor(current));
                }
            }, 20);
        };

        animateCounter(1200, setStudentCount);
        animateCounter(85, setTeacherCount);
        animateCounter(45, setStaffCount);
    }, []);

    // Auto-slide functionality
    useEffect(() => {
        if (newsItems.length === 0) return;

        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % newsItems.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [newsItems.length]);

    const nextSlide = () => {
        if (newsItems.length === 0) return;
        setCurrentSlide((prev) => (prev + 1) % newsItems.length);
    };

    const prevSlide = () => {
        if (newsItems.length === 0) return;
        setCurrentSlide(
            (prev) => (prev - 1 + newsItems.length) % newsItems.length
        );
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return "Unknown date";

        const options = {
            year: "numeric",
            month: "long",
            day: "numeric",
        };

        try {
            return new Date(dateString).toLocaleDateString("en-US", options);
        } catch {
            return dateString;
        }
    };

    const CircularProgress = ({
        value,
        max,
        label,
        color = "stroke-slate-600",
    }) => {
        const percentage = (value / max) * 100;
        const circumference = 2 * Math.PI * 45;
        const strokeDasharray = `${
            (percentage / 100) * circumference
        } ${circumference}`;

        return (
            <div className="flex flex-col items-center">
                <div className="relative w-32 h-32">
                    <svg
                        className="w-32 h-32 transform -rotate-90"
                        viewBox="0 0 100 100"
                    >
                        <circle
                            cx="50"
                            cy="50"
                            r="45"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="none"
                            className="text-slate-200"
                        />
                        <circle
                            cx="50"
                            cy="50"
                            r="45"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="none"
                            strokeDasharray={strokeDasharray}
                            strokeLinecap="round"
                            className={`${color} transition-all duration-1000 ease-out`}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-slate-800">
                            {value}
                        </span>
                    </div>
                </div>
                <span className="mt-2 text-sm font-medium text-slate-600">
                    {label}
                </span>
            </div>
        );
    };

    // const FacultySpotlight = () => (
    //     <div className="bg-gradient-to-r from-slate-700 to-gray-800 text-white rounded-2xl p-8 mb-8">
    //         <div className="grid md:grid-cols-2 gap-8 items-center">
    //             <div>
    //                 <div className="flex items-center gap-2 mb-4">
    //                     <Star className="text-yellow-400" size={20} />
    //                     <span className="text-sm font-medium text-slate-300">
    //                         Faculty Spotlight
    //                     </span>
    //                 </div>
    //                 <h3 className="text-2xl font-bold mb-2">
    //                     {facultySpotlight.name}
    //                 </h3>
    //                 <p className="text-slate-300 mb-1">
    //                     {facultySpotlight.position}
    //                 </p>
    //                 <p className="text-slate-400 text-sm mb-4">
    //                     {facultySpotlight.specialization}
    //                 </p>
    //                 <p className="text-slate-200 mb-6">
    //                     {facultySpotlight.bio}
    //                 </p>
    //                 <div className="space-y-2">
    //                     {facultySpotlight.achievements.map(
    //                         (achievement, index) => (
    //                             <div
    //                                 key={index}
    //                                 className="flex items-center gap-2 text-sm"
    //                             >
    //                                 <Award
    //                                     className="text-yellow-400"
    //                                     size={14}
    //                                 />
    //                                 <span className="text-slate-300">
    //                                     {achievement}
    //                                 </span>
    //                             </div>
    //                         )
    //                     )}
    //                 </div>
    //                 <Link
    //                     to="/people"
    //                     className="inline-block mt-4 bg-white text-slate-800 px-6 py-2 rounded-lg hover:bg-slate-100 transition-colors"
    //                 >
    //                     View Full Profile
    //                 </Link>
    //             </div>
    //             <div className="relative">
    //                 <img
    //                     src={facultySpotlight.image}
    //                     alt={facultySpotlight.name}
    //                     className="w-full h-80 object-cover rounded-lg shadow-lg"
    //                 />
    //                 <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg"></div>
    //             </div>
    //         </div>
    //     </div>
    // );

    const StudentResourceCard = ({ resource }) => (
        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 cursor-pointer">
            <div className="text-center">
                <div className="text-4xl mb-3">{resource.icon}</div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">
                    {resource.title}
                </h3>
                <p className="text-slate-600 text-sm mb-4">
                    {resource.description}
                </p>
                <Link
                    to={resource.link}
                    className="inline-block bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors text-sm"
                >
                    Access Now
                </Link>
            </div>
        </div>
    );

    // const NewsletterSection = () => (
    //     <div className="bg-gradient-to-r from-slate-800 to-gray-800 text-white py-16">
    //         <div className="max-w-4xl mx-auto px-4 text-center">
    //             <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
    //             <p className="text-slate-200 mb-8">
    //                 Subscribe to our newsletter for the latest news, events, and
    //                 research updates
    //             </p>
    //             <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
    //                 <input
    //                     type="email"
    //                     placeholder="Enter your email address"
    //                     className="flex-1 px-4 py-3 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500"
    //                 />
    //                 <button className="bg-slate-600 hover:bg-slate-700 px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2">
    //                     <Mail size={16} />
    //                     Subscribe
    //                 </button>
    //             </div>
    //         </div>
    //     </div>
    // );

    const EventsSection = () => {
        const [events, setEvents] = useState([]);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState(null);
        const [hoveredEvent, setHoveredEvent] = useState(null);

        const fetchEvents = useCallback(async () => {
            setLoading(true);
            try {
                const response = await axios.get(
                    `${BACKEND_URL}/admin/events/get/all`
                );

                // Sort events by date (newest first)
                const sortedEvents = response.data.sort((a, b) => {
                    return new Date(b.date) - new Date(a.date);
                });

                // Take only the latest events
                const latestEvents = sortedEvents.slice(0, 3);

                setEvents(latestEvents);
                setError(null);
            } catch (error) {
                console.error("Error fetching events:", error);
                setError("Failed to load events. Please try again later.");

                // Fallback to static data if API call fails
                setEvents(recentEvents);
            } finally {
                setLoading(false);
            }
        }, []);

        useEffect(() => {
            fetchEvents();
        }, [fetchEvents]);

        // Format date for display
        const formatDate = (dateString) => {
            if (!dateString) return "Unknown date";

            const options = {
                year: "numeric",
                month: "short",
                day: "numeric",
            };

            try {
                return new Date(dateString).toLocaleDateString(
                    "en-US",
                    options
                );
            } catch {
                return dateString;
            }
        };

        if (loading) {
            return (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
                </div>
            );
        }

        if (error && events.length === 0) {
            return (
                <div className="bg-red-50 text-red-700 p-6 rounded-lg text-center max-w-2xl mx-auto">
                    <p className="font-medium">{error}</p>
                    <button
                        onClick={fetchEvents}
                        className="mt-4 px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700"
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        if (events.length === 0) {
            return (
                <div className="bg-slate-50 p-12 rounded-lg text-center max-w-2xl mx-auto">
                    <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-700 mb-2">
                        No Events Available
                    </h3>
                    <p className="text-slate-600">
                        Check back later for upcoming events and activities.
                    </p>
                </div>
            );
        }

        return (
            <>
                <div className="grid md:grid-cols-3 gap-8">
                    {events.map((event) => (
                        <div
                            key={event.id}
                            className={`bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 transform ${
                                hoveredEvent === event.id
                                    ? "scale-[1.02]"
                                    : "scale-100"
                            }`}
                            onMouseEnter={() => setHoveredEvent(event.id)}
                            onMouseLeave={() => setHoveredEvent(null)}
                        >
                            {/* Date banner - Beautified */}
                            <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white px-5 py-4 rounded-t-md overflow-hidden relative">
                                {/* Decorative element */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>

                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 relative z-10">
                                    {/* Start date */}
                                    <div className="flex items-center">
                                        <div className="bg-amber-500/20 p-2 rounded-full mr-3">
                                            <Calendar className="h-5 w-5 text-amber-500" />
                                        </div>
                                        <div>
                                            <span className="text-amber-400 text-xs font-semibold uppercase tracking-wider">
                                                Starts
                                            </span>
                                            <div className="text-white font-medium">
                                                {new Date(
                                                    event.start_date
                                                ).toLocaleString(undefined, {
                                                    dateStyle: "medium",
                                                    timeStyle: "short",
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Visual separator for desktop */}
                                    <div className="hidden sm:block w-px h-10 bg-gray-600 mx-2"></div>

                                    {/* End date */}
                                    <div className="flex items-center">
                                        <div className="bg-red-500/20 p-2 rounded-full mr-3">
                                            <Calendar className="h-5 w-5 text-red-400" />
                                        </div>
                                        <div>
                                            <span className="text-red-400 text-xs font-semibold uppercase tracking-wider">
                                                Ends
                                            </span>
                                            <div className="text-white font-medium">
                                                {new Date(
                                                    event.end_date
                                                ).toLocaleString(undefined, {
                                                    dateStyle: "medium",
                                                    timeStyle: "short",
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Event content */}
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-slate-800 mb-3 line-clamp-2">
                                    {event.title}
                                </h3>

                                <div className="flex items-start gap-2 mb-4">
                                    <div className="flex-shrink-0 text-slate-400 mt-0.5">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                            />
                                        </svg>
                                    </div>
                                    <p className="text-slate-600 flex-1">
                                        {event.location || "CSE Department"}
                                    </p>
                                </div>

                                {event.description && (
                                    <p className="text-slate-600 mb-4 line-clamp-3">
                                        {event.description}
                                    </p>
                                )}

                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                                    <div className="flex items-center text-slate-500">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 mr-1"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                                            />
                                        </svg>
                                        <span className="text-sm">
                                            {event.attendees || "Open to all"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </>
        );
    };

    // Manual navigation for gallery images
    const prevGalleryImage = () => {
        if (galleryImages.length === 0) return;
        setCurrentGalleryImage(
            (prev) => (prev - 1 + galleryImages.length) % galleryImages.length
        );
    };

    const nextGalleryImage = () => {
        if (galleryImages.length === 0) return;
        setCurrentGalleryImage((prev) => (prev + 1) % galleryImages.length);
    };

    // Auto-slide functionality for gallery (can be kept or removed)
    useEffect(() => {
        if (galleryImages.length === 0) return;

        const timer = setInterval(() => {
            setCurrentGalleryImage((prev) => (prev + 1) % galleryImages.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [galleryImages.length]);

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            {/* Enhanced Hero section */}
            <section className="bg-gradient-to-r from-slate-700 via-gray-800 to-slate-700 text-white py-20 relative overflow-hidden">
                <div className="absolute inset-0 bg-black opacity-20"></div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
                            Department of Computer Science & Engineering
                        </h1>
                        <h2 className="text-2xl md:text-3xl mb-8 animate-fade-in-delay">
                            University of Dhaka
                        </h2>
                        <p className="text-xl max-w-4xl mx-auto text-slate-200 mb-8 animate-fade-in-delay-2">
                            Pioneering excellence in computer science education
                            and research since 1992. Shaping the future of
                            technology through innovation and discovery.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                to="/chairman"
                                className="bg-amber-500 hover:bg-amber-600 text-slate-800 px-8 py-3 rounded-lg font-medium ansition-colors"
                            >
                                Learn More
                            </Link>
                            <Link
                                to="/apply"
                                className="border-2 border-amber-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-white hover:text-slate-800 transition-colors"
                            >
                                Apply Now
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Latest News Section */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
                            Latest News & Updates
                        </h2>
                        <p className="text-slate-600 text-lg">
                            Stay informed about our latest achievements and
                            developments
                        </p>
                    </div>

                    {newsLoading ? (
                        <div className="flex justify-center items-center py-16">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
                        </div>
                    ) : newsError && newsItems.length === 0 ? (
                        <div className="bg-red-50 text-red-700 p-6 rounded-lg text-center max-w-2xl mx-auto">
                            <p className="font-medium">{newsError}</p>
                            <button
                                onClick={fetchNotices}
                                className="mt-4 px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : newsItems.length === 0 ? (
                        <div className="bg-slate-50 p-12 rounded-lg text-center max-w-2xl mx-auto">
                            <h3 className="text-xl font-bold text-slate-700 mb-2">
                                No News Available
                            </h3>
                            <p className="text-slate-600">
                                Check back later for updates and announcements.
                            </p>
                        </div>
                    ) : (
                        <div className="relative">
                            <div className="overflow-hidden rounded-2xl">
                                <div
                                    className="flex transition-transform duration-500 ease-in-out"
                                    style={{
                                        transform: `translateX(-${
                                            currentSlide * 100
                                        }%)`,
                                    }}
                                >
                                    {newsItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className="w-full flex-shrink-0"
                                        >
                                            <div className="bg-gradient-to-r from-slate-800 to-gray-800 text-white p-8 md:p-12 rounded-2xl mx-2">
                                                <div className="grid md:grid-cols-2 gap-8 items-center">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-4">
                                                            <span className="px-3 py-1 bg-slate-600 rounded-full text-sm font-medium">
                                                                {item.category}
                                                            </span>
                                                            <span className="text-slate-300 text-sm flex items-center gap-1">
                                                                <Calendar
                                                                    size={14}
                                                                />
                                                                {formatDate(
                                                                    item.date
                                                                )}
                                                            </span>
                                                        </div>
                                                        <h3 className="text-2xl md:text-3xl font-bold mb-4">
                                                            {item.title}
                                                        </h3>
                                                        <p className="text-slate-200 text-lg mb-6">
                                                            {item.excerpt}
                                                        </p>
                                                        <Link
                                                            to="/notice-board"
                                                            className="bg-white text-slate-800 px-6 py-3 rounded-lg font-medium hover:bg-slate-100 transition-colors inline-block"
                                                        >
                                                            Read More
                                                        </Link>
                                                    </div>

                                                    {/* Attachments section */}
                                                    <div className="bg-slate-700/50 p-6 rounded-lg shadow-lg">
                                                        {item.attachments &&
                                                        item.attachments
                                                            .length > 0 ? (
                                                            <>
                                                                <h4 className="text-lg font-medium text-white mb-3 border-b border-slate-600 pb-2 flex items-center">
                                                                    <FileText className="h-4 w-4 mr-2" />
                                                                    Attachments
                                                                </h4>
                                                                <div className="grid grid-cols-1 gap-3 max-h-52 overflow-y-auto pr-2">
                                                                    {item.attachments.map(
                                                                        (
                                                                            attachment,
                                                                            idx
                                                                        ) => (
                                                                            <a
                                                                                key={
                                                                                    idx
                                                                                }
                                                                                href={
                                                                                    attachment.url
                                                                                }
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="flex items-center p-3 bg-slate-600/50 hover:bg-slate-600 rounded-lg transition-colors"
                                                                            >
                                                                                <FileText className="h-5 w-5 text-slate-300 mr-2" />
                                                                                <span className="text-sm text-slate-200 flex-1 truncate">
                                                                                    {attachment.name ||
                                                                                        `Attachment ${
                                                                                            idx +
                                                                                            1
                                                                                        }`}
                                                                                </span>
                                                                                <ExternalLink className="h-4 w-4 text-slate-400" />
                                                                            </a>
                                                                        )
                                                                    )}
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="text-center py-4">
                                                                <FileText className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                                                                <p className="italic text-slate-400 text-sm">
                                                                    No
                                                                    attachments
                                                                    available
                                                                    for this
                                                                    notice.
                                                                </p>
                                                                <p className="text-slate-400 text-xs mt-2">
                                                                    Click "Read
                                                                    More" to
                                                                    view the
                                                                    complete
                                                                    notice
                                                                    details.
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {newsItems.length > 1 && (
                                <>
                                    <button
                                        onClick={prevSlide}
                                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white p-3 rounded-full shadow-lg hover:bg-slate-100 transition-colors"
                                    >
                                        <ChevronLeft
                                            size={24}
                                            className="text-slate-600"
                                        />
                                    </button>
                                    <button
                                        onClick={nextSlide}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white p-3 rounded-full shadow-lg hover:bg-slate-100 transition-colors"
                                    >
                                        <ChevronRight
                                            size={24}
                                            className="text-slate-600"
                                        />
                                    </button>

                                    <div className="flex justify-center mt-6 space-x-2">
                                        {newsItems.map((_, index) => (
                                            <button
                                                key={index}
                                                onClick={() =>
                                                    setCurrentSlide(index)
                                                }
                                                className={`w-3 h-3 rounded-full transition-colors ${
                                                    index === currentSlide
                                                        ? "bg-slate-600"
                                                        : "bg-slate-300"
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* Faculty Spotlight */}
            <section className="py-16 bg-slate-100">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
                            Faculty Spotlight
                        </h2>
                        <p className="text-slate-600 text-lg">
                            Meet our distinguished faculty members making
                            groundbreaking contributions
                        </p>
                    </div>
                    {/* <FacultySpotlight /> */}
                    <div className="text-center">
                        <Link
                            to="/people"
                            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
                        >
                            <span>View All Faculty</span>
                            <ExternalLink size={16} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Slideshow Section (replaced ImageSlider with manual slider) */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    {/* Gallery Carousel - keeping only this implementation */}
                    <div>
                        <section className="py-6 bg-white">
                            <h2 className="text-center text-3xl font-bold text-slate-800 mb-6">
                                Gallery
                            </h2>

                            {/* Manual Image Carousel */}
                            <div className="relative">
                                <div className="overflow-hidden rounded-2xl shadow-xl">
                                    <div
                                        className="flex transition-transform duration-500 ease-in-out"
                                        style={{
                                            transform: `translateX(-${
                                                currentGalleryImage * 100
                                            }%)`,
                                            height: "480px",
                                        }}
                                    >
                                        {galleryImages.map((image, idx) => (
                                            <div
                                                key={idx}
                                                className="w-full flex-shrink-0"
                                            >
                                                <img
                                                    src={image}
                                                    alt={`Gallery image ${
                                                        idx + 1
                                                    }`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Navigation Buttons */}
                                <button
                                    onClick={prevGalleryImage}
                                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white transition-colors z-10"
                                >
                                    <ChevronLeft
                                        size={24}
                                        className="text-slate-700"
                                    />
                                </button>
                                <button
                                    onClick={nextGalleryImage}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white transition-colors z-10"
                                >
                                    <ChevronRight
                                        size={24}
                                        className="text-slate-700"
                                    />
                                </button>

                                {/* Indicator Dots */}
                                <div className="flex justify-center mt-6 space-x-2">
                                    {galleryImages.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() =>
                                                setCurrentGalleryImage(index)
                                            }
                                            className={`w-3 h-3 rounded-full transition-colors ${
                                                index === currentGalleryImage
                                                    ? "bg-orange-500"
                                                    : "bg-slate-300 hover:bg-slate-400"
                                            }`}
                                            aria-label={`Go to slide ${
                                                index + 1
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </section>

            {/* Video Section - Replaces Student Resources */}
            <section className="py-16 bg-slate-100">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
                            Campus Life
                        </h2>
                        <p className="text-slate-600 text-lg max-w-3xl mx-auto">
                            Experience the vibrant academic environment and
                            student activities at the Department of Computer
                            Science & Engineering
                        </p>
                    </div>

                    <div className="rounded-xl overflow-hidden shadow-xl border border-slate-200">
                        <div className="relative pb-[56.25%] h-0 bg-slate-800">
                            {" "}
                            {/* 16:9 Aspect Ratio */}
                            <video
                                className="absolute top-0 left-0 w-full h-full object-cover"
                                autoPlay
                                muted
                                loop
                                playsInline
                            >
                                <source
                                    src="/homevid.mp4"
                                    type="video/mp4"
                                />
                                Your browser does not support the video tag.
                            </video>
                            {/* Optional overlay with caption */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 text-white">
                                <h3 className="text-xl md:text-2xl font-bold">
                                    Department of CSE, University of Dhaka
                                </h3>
                                <p className="text-sm md:text-base opacity-90">
                                    Where innovation meets excellence
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            

            {/* Recent Events */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
                            Recent Events
                        </h2>
                        <p className="text-slate-600 text-lg">
                            Highlights from our academic and research activities
                        </p>
                    </div>

                    {/* Events content */}
                    <EventsSection />
                </div>
            </section>

            {/* Statistics Section */}
            <section className="py-16 bg-slate-100">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
                            Our Community
                        </h2>
                        <p className="text-slate-600 text-lg">
                            Building the future of technology together
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 justify-items-center">
                        <div className="text-center">
                            <CircularProgress
                                value={studentCount}
                                max={200}
                                label="Current Students"
                                color="stroke-blue-500"
                            />
                            <p className="mt-4 text-slate-600">
                                Undergraduate & Graduate
                            </p>
                        </div>
                        <div className="text-center">
                            <CircularProgress
                                value={teacherCount}
                                max={45}
                                label="Faculty Members"
                                color="stroke-green-500"
                            />
                            <p className="mt-4 text-slate-600">
                                Professors & Researchers
                            </p>
                        </div>
                        <div className="text-center">
                            <CircularProgress
                                value={staffCount}
                                max={10}
                                label="Support Staff"
                                color="stroke-purple-500"
                            />
                            <p className="mt-4 text-slate-600">
                                Administrative & Technical
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Newsletter Section */}
            {/* <NewsletterSection /> */}

            {/* Enhanced Content section */}
            <section className="max-w-7xl mx-auto px-4 py-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                        <div className="flex items-center mb-4">
                            <TrendingUp
                                className="text-slate-600 mr-3"
                                size={24}
                            />
                            <h2 className="text-2xl font-bold text-slate-800">
                                Quick Links
                            </h2>
                        </div>
                        <ul className="space-y-3">
                            <li>
                                <Link
                                    to="/apply"
                                    className="text-slate-600 hover:text-slate-800 transition-colors"
                                >
                                    Apply for Admission
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/admission-hub"
                                    className="text-slate-600 hover:text-slate-800 transition-colors"
                                >
                                    Course Catalog
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/people"
                                    className="text-slate-600 hover:text-slate-800 transition-colors"
                                >
                                    Faculty
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="https://cseduaa.org/"
                                    className="text-slate-600 hover:text-slate-800 transition-colors"
                                >
                                    Alumni Network
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                        <div className="flex items-center mb-4">
                            <BookOpen
                                className="text-slate-600 mr-3"
                                size={24}
                            />
                            <h2 className="text-2xl font-bold text-slate-800">
                                Academic Programs
                            </h2>
                        </div>
                        <ul className="space-y-4">
                            <li>
                                <Link
                                    to="/program/1"
                                    className="block hover:bg-slate-100 p-3 rounded-md transition"
                                >
                                    <h3 className="font-bold text-slate-800">
                                        Bachelor of Science (BS)
                                    </h3>
                                    <p className="text-gray-600">
                                        4-year undergraduate program in Computer
                                        Science.
                                    </p>
                                </Link>
                            </li>

                            <li>
                                <Link
                                    to="/program/2"
                                    className="block hover:bg-slate-100 p-3 rounded-md transition"
                                >
                                    <h3 className="font-bold text-slate-800">
                                        Master of Science (MS)
                                    </h3>
                                    <p className="text-gray-600">
                                        Advanced studies in specialized Computer
                                        Science fields.
                                    </p>
                                </Link>
                            </li>

                            <li>
                                <Link
                                    to="/program/3"
                                    className="block hover:bg-slate-100 p-3 rounded-md transition"
                                >
                                    <h3 className="font-bold text-slate-800">
                                        Doctor of Philosophy (PhD)
                                    </h3>
                                    <p className="text-gray-600">
                                        Research-focused doctoral program.
                                    </p>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                        <div className="flex items-center mb-4">
                            <Users className="text-slate-600 mr-3" size={24} />
                            <h2 className="text-2xl font-bold text-slate-800">
                                Research Areas
                            </h2>
                        </div>
                        <ul className="space-y-4">
                            <li>
                                <h3 className="font-bold">
                                    Artificial Intelligence
                                </h3>
                                <p className="text-gray-600">
                                    Machine learning, natural language
                                    processing, computer vision.
                                </p>
                            </li>
                            <li>
                                <h3 className="font-bold">Data Science</h3>
                                <p className="text-gray-600">
                                    Big data analytics, data mining, database
                                    systems.
                                </p>
                            </li>
                            <li>
                                <h3 className="font-bold">Network Security</h3>
                                <p className="text-gray-600">
                                    Cybersecurity, cryptography, secure
                                    computing.
                                </p>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Beautified Footer */}
            <footer className="bg-gradient-to-b from-slate-800 to-slate-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {/* Contact Info */}
                        <div className="bg-slate-700/30 p-6 rounded-lg">
                            <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-slate-600">
                                Contact Us
                            </h3>
                            <p className="mb-1">
                                Department of Computer Science & Engineering
                            </p>
                            <p className="mb-1">Faculty of Science</p>
                            <p className="mb-1">University of Dhaka</p>
                            <p className="mb-3">Dhaka 1000, Bangladesh</p>
                            <div className="mt-4 pt-3 border-t border-slate-600 space-y-2">
                                <p className="text-sm text-slate-300 flex items-center gap-2">
                                    <Phone
                                        size={14}
                                        className="text-slate-400"
                                    />
                                    +880-2-9661900
                                </p>
                                <p className="text-sm text-slate-300 flex items-center gap-2">
                                    <Mail
                                        size={14}
                                        className="text-slate-400"
                                    />
                                    cse@du.ac.bd
                                </p>
                            </div>
                        </div>

                        {/* Social Links */}
                        <div className="bg-slate-700/30 p-6 rounded-lg">
                            <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-slate-600">
                                Connect With Us
                            </h3>
                            <div className="flex space-x-4 mb-6">
                                <a
                                    href="https://www.facebook.com/Dept.CSE.DU/"
                                    className="bg-slate-600 hover:bg-blue-600 p-3 rounded-full transition-colors duration-300"
                                    aria-label="Facebook"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                    </svg>
                                </a>
                                <a
                                    href="https://twitter.com"
                                    className="bg-slate-600 hover:bg-blue-500 p-3 rounded-full transition-colors duration-300"
                                    aria-label="Twitter"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                                    </svg>
                                </a>
                                <a
                                    href="https://www.linkedin.com/company/csedu-students-club"
                                    className="bg-slate-600 hover:bg-blue-700 p-3 rounded-full transition-colors duration-300"
                                    aria-label="LinkedIn"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.016 18.6h-2.91v-4.575c0-1.084-.021-2.48-1.51-2.48-1.512 0-1.746 1.18-1.746 2.4V18.6H7.95V8.4h2.79v1.17h.042c.387-.735 1.332-1.512 2.742-1.512 2.94 0 3.489 1.935 3.489 4.447V18.6h.003z" />
                                        <circle cx="4.2" cy="4.2" r="2.4" />
                                        <path d="M5.4 18.6H3V8.4h2.4v10.2z" />
                                    </svg>
                                </a>
                            </div>
                        </div>

                        {/* Map Section */}
                        <div className="md:col-span-2 bg-slate-700/30 p-6 rounded-lg">
                            <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-slate-600">
                                Find Us
                            </h3>
                            <div className="w-full h-56 rounded-lg overflow-hidden border border-slate-600 shadow-xl">
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3652.191277524978!2d90.39670607596543!3d23.728738579453224!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755b8ef3976bbbd%3A0x1b3140066a1d7bb8!2sDepartment%20of%20Computer%20Science%20and%20Engineering%2C%20University%20of%20Dhaka!5e0!3m2!1sen!2sbd!4v1721041589123!5m2!1sen!2sbd"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen=""
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title="Department of Computer Science and Engineering, University of Dhaka"
                                ></iframe>
                            </div>
                            <div className="mt-4 p-3 bg-slate-600/50 rounded-lg text-sm text-slate-200">
                                <p className="font-medium">
                                    Science Complex, University of Dhaka
                                </p>
                                <p>Ramna, Dhaka 1000, Bangladesh</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 pt-6 border-t border-slate-700 text-center">
                        <p className="text-sm text-slate-400">
                            © 2025 Department of Computer Science & Engineering,
                            University of Dhaka. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>

            {/* Chatbot Component */}
            <Chatbot />
        </div>
    );
}

export default HomePage;
