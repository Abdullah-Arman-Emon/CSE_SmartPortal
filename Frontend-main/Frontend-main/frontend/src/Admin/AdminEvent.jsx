import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import AdminCreateEvent from "./AdminCreateEvent";
import AdminEventPage from "./AdminEventShow";
import { FaCalendarAlt, FaPlus, FaList } from "react-icons/fa";

export default function AdminEvent() {
    const [selected, setSelected] = useState("show");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.5,
                when: "beforeChildren",
                staggerChildren: 0.2,
            },
        },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.4 } },
    };

    return (
        <motion.div
            className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-slate-100 py-6 md:py-10"
            initial="hidden"
            animate={mounted ? "visible" : "hidden"}
            variants={containerVariants}
        >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Page Header */}
                <motion.div
                    className="mb-10 text-center"
                    variants={itemVariants}
                >
                    <div className="inline-flex items-center justify-center p-2 bg-orange-100 rounded-full mb-4">
                        <FaCalendarAlt className="text-orange-600 text-xl" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3 tracking-tight">
                        Event Management
                    </h1>
                    <p className="text-slate-600 max-w-2xl mx-auto text-sm md:text-base">
                        Create and manage events for students and faculty
                        members of the department
                    </p>
                </motion.div>

                {/* Tab Navigation */}
                <motion.div
                    variants={itemVariants}
                    className="mb-8 flex justify-center"
                >
                    <div className="bg-white rounded-xl shadow-md p-1.5 inline-flex">
                        <button
                            onClick={() => setSelected("show")}
                            className={`flex items-center px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${
                                selected === "show"
                                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-sm"
                                    : "text-slate-600 hover:bg-slate-100"
                            }`}
                        >
                            <FaList
                                className={`mr-2 ${
                                    selected === "show"
                                        ? "text-white"
                                        : "text-orange-400"
                                }`}
                            />
                            View Events
                        </button>
                        <button
                            onClick={() => setSelected("create")}
                            className={`flex items-center px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${
                                selected === "create"
                                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-sm"
                                    : "text-slate-600 hover:bg-slate-100"
                            }`}
                        >
                            <FaPlus
                                className={`mr-2 ${
                                    selected === "create"
                                        ? "text-white"
                                        : "text-orange-400"
                                }`}
                            />
                            Create Event
                        </button>
                    </div>
                </motion.div>

                {/* Mobile selector (visible only on very small screens) */}
                <motion.div
                    variants={itemVariants}
                    className="sm:hidden mb-6 px-4"
                >
                    <select
                        value={selected}
                        onChange={(e) => setSelected(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-orange-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-slate-700"
                    >
                        <option value="show">View Events</option>
                        <option value="create">Create Event</option>
                    </select>
                </motion.div>

                {/* Content Area with Animation */}
                <motion.div
                    key={selected}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden"
                    variants={itemVariants}
                >
                    <div className="p-4 md:p-6 lg:p-8">
                        {selected === "create" ? (
                            <AdminCreateEvent />
                        ) : (
                            <AdminEventPage />
                        )}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
