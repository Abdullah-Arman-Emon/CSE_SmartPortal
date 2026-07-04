import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function AdmissionHub() {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const programsPerPage = 6;

    // Programs are admin-managed (Admin Dashboard → Website → Programs)
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    useEffect(() => {
        axios.get(`${BACKEND_URL}/guest/site/programs`)
            .then((res) => {
                setPrograms(res.data);
                setLoadError(null);
            })
            .catch(() => setLoadError("Could not load programs. Please try again later."))
            .finally(() => setLoading(false));
    }, []);


    // Filter programs based on search and selected filter
    const filteredPrograms = programs.filter(
        (program) =>
            program.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
            (activeFilter === "All" || program.level === activeFilter)
    );

    // Calculate pagination
    const indexOfLastProgram = currentPage * programsPerPage;
    const indexOfFirstProgram = indexOfLastProgram - programsPerPage;
    const currentPrograms = filteredPrograms.slice(
        indexOfFirstProgram,
        indexOfLastProgram
    );
    const totalPages = Math.ceil(filteredPrograms.length / programsPerPage);

    // Handle page change
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-gray-200">
            {/* Hero header with Return Home button */}
            <Navbar />
            <div className="bg-gradient-to-r from-slate-700 via-gray-800 to-slate-700 text-white py-12 px-8 shadow-lg relative">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-4xl font-extrabold tracking-tight mb-2">
                        Academic Programs
                    </h1>
                    <p className="text-gray-300 text-xl max-w-3xl">
                        Discover your path to success with our diverse range of
                        academic programs designed to empower your future.
                    </p>
                </div>
            </div>

            {/* Main content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Action buttons and search */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-10">
                    <div className="flex flex-wrap gap-4">
                        <Link
                            to="/apply"
                            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-md text-white bg-slate-700 hover:bg-slate-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                        >
                            <svg
                                className="w-5 h-5 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                ></path>
                            </svg>
                            Apply Now
                        </Link>
                    </div>

                    {/* Search bar */}
                    <div className="w-full md:w-96">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg
                                    className="h-5 w-5 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    ></path>
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Search programs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition duration-150 ease-in-out shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {["All", "Bachelor", "Masters", "Doctorate"].map(
                        (filter) => (
                            <button
                                key={filter}
                                onClick={() => {
                                    setActiveFilter(filter);
                                    setCurrentPage(1);
                                }}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                                    activeFilter === filter
                                        ? "bg-slate-700 text-white shadow-md"
                                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                                }`}
                            >
                                {filter}
                            </button>
                        )
                    )}
                </div>

                {/* Loading / error states */}
                {loading && (
                    <div className="text-center py-12 text-gray-500">Loading programs…</div>
                )}
                {loadError && (
                    <div className="text-center py-12 text-red-600">{loadError}</div>
                )}

                {/* Program cards grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {currentPrograms.length > 0 ? (
                        currentPrograms.map((program) => (
                            <div
                                key={program.id}
                                className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100"
                            >
                                <div className="h-48 relative overflow-hidden">
                                    <img
                                        src={program.imageUrl}
                                        alt={program.title}
                                        className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                                        <h3 className="text-white text-xl font-bold p-4 drop-shadow-lg">
                                            {program.title}
                                        </h3>
                                    </div>
                                    <div className="absolute top-4 right-4">
                                        <span
                                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                                program.level === "Bachelor"
                                                    ? "bg-slate-100 text-slate-800"
                                                    : program.level ===
                                                      "Masters"
                                                    ? "bg-gray-100 text-gray-800"
                                                    : "bg-slate-100 text-slate-800"
                                            }`}
                                        >
                                            {program.level}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <p className="text-gray-600 mb-4 line-clamp-3">
                                        {program.description}
                                    </p>
                                    <div className="flex justify-between items-center">
                                        <Link
                                            to={`/program/${program.id}`}
                                            className="inline-flex items-center text-slate-700 hover:text-slate-900 font-medium"
                                        >
                                            View Details
                                            <svg
                                                className="ml-1 w-5 h-5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M9 5l7 7-7 7"
                                                ></path>
                                            </svg>
                                        </Link>
                                        <Link
                                            to={"/apply"}
                                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-slate-700 hover:bg-slate-800"
                                        >
                                            Apply
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-12 text-center">
                            <svg
                                className="mx-auto h-12 w-12 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                ></path>
                            </svg>
                            <h3 className="mt-2 text-lg font-medium text-gray-900">
                                No programs found
                            </h3>
                            <p className="mt-1 text-gray-500">
                                Try adjusting your search or filter to find what
                                you're looking for.
                            </p>
                        </div>
                    )}
                </div>

                {/* Pagination - Updated for functional pagination */}
                {filteredPrograms.length > 0 && (
                    <div className="flex justify-center mt-12">
                        <nav className="flex items-center bg-white px-2 py-1 rounded-lg shadow-sm">
                            <button
                                onClick={() =>
                                    paginate(Math.max(1, currentPage - 1))
                                }
                                disabled={currentPage === 1}
                                className={`p-2 mx-1 rounded-md ${
                                    currentPage === 1
                                        ? "text-gray-300 cursor-not-allowed"
                                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                } focus:outline-none focus:ring-2 focus:ring-slate-600`}
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M15 19l-7-7 7-7"
                                    ></path>
                                </svg>
                            </button>

                            {Array.from({ length: totalPages }).map(
                                (_, index) => (
                                    <button
                                        key={index + 1}
                                        onClick={() => paginate(index + 1)}
                                        className={`px-4 py-2 mx-1 ${
                                            currentPage === index + 1
                                                ? "bg-slate-700 text-white"
                                                : "hover:bg-gray-100 text-gray-700"
                                        } rounded-md font-medium`}
                                    >
                                        {index + 1}
                                    </button>
                                )
                            )}

                            <button
                                onClick={() =>
                                    paginate(
                                        Math.min(totalPages, currentPage + 1)
                                    )
                                }
                                disabled={currentPage === totalPages}
                                className={`p-2 mx-1 rounded-md ${
                                    currentPage === totalPages
                                        ? "text-gray-300 cursor-not-allowed"
                                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                } focus:outline-none focus:ring-2 focus:ring-slate-600`}
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M9 5l7 7-7 7"
                                    ></path>
                                </svg>
                            </button>
                        </nav>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdmissionHub;
