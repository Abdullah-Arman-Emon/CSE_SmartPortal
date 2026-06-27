import React, { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

function AdmissionHub() {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const programsPerPage = 6;

    // Updated program data with more programs and relevant descriptions
    const programs = [
        {
            id: 1,
            title: "Bachelor of Science in Computer Science",
            level: "Bachelor",
            description:
                "A comprehensive program covering software development, algorithms, data structures, and fundamental computing principles for future tech innovators.",
            image: "/images/computer-science-bs.jpg",
            imageUrl:
                "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
        },
        {
            id: 2,
            title: "Masters of Science in Computer Science and Engineering",
            level: "Masters",
            description:
                "An advanced program focusing on cutting-edge research areas including distributed systems, machine learning, and high-performance computing for specialized tech careers.",
            image: "/images/computer-science-ms.jpg",
            imageUrl:
                "https://images.unsplash.com/photo-1610563166150-b34df4f3bcd6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1476&q=80",
        },
        {
            id: 3,
            title: "Professional Masters in Cybersecurity",
            level: "Masters",
            description:
                "Develop expertise in network security, ethical hacking, cryptography, and security governance to protect organizations from evolving cyber threats.",
            image: "/images/cybersecurity-ms.jpg",
            imageUrl:
                "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1374&q=80",
        },
        {
            id: 4,
            title: "PhD in Computer Science and Engineering",
            level: "Doctorate",
            description:
                "A research-intensive program for scholars pursuing groundbreaking innovations in areas such as artificial intelligence, quantum computing, and computational theory.",
            image: "/images/computer-science-phd.jpg",
            imageUrl:
                "https://images.unsplash.com/photo-1620825937374-87fc7d6bddc2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1451&q=80",
        },
        {
            id: 5,
            title: "Bachelor of Science in Data Science",
            level: "Bachelor",
            description:
                "Prepare for the data-driven world with courses in statistical analysis, machine learning, data visualization, and big data processing technologies.",
            image: "/images/data-science-bs.jpg",
            imageUrl:
                "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
        },
        {
            id: 6,
            title: "Master of Science in Artificial Intelligence",
            level: "Masters",
            description:
                "Explore the frontier of AI with specialized training in deep learning, natural language processing, computer vision, and robotics applications.",
            image: "/images/ai-ms.jpg",
            imageUrl:
                "https://images.unsplash.com/photo-1677442135132-198ca30c7285?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1632&q=80",
        },
        {
            id: 7,
            title: "Bachelor of Engineering in Robotics",
            level: "Bachelor",
            description:
                "Blend mechanical engineering, electronics, and computer science to design and build the next generation of autonomous systems and intelligent machines.",
            image: "/images/robotics-be.jpg",
            imageUrl:
                "https://images.unsplash.com/photo-1561557944-6c7202a042b0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1374&q=80",
        },
        {
            id: 8,
            title: "Doctor of Philosophy in Biotechnology",
            level: "Doctorate",
            description:
                "Conduct pioneering research at the intersection of biology and technology, developing innovations in genomics, pharmaceuticals, and medical devices.",
            image: "/images/biotechnology-phd.jpg",
            imageUrl:
                "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
        },
        {
            id: 9,
            title: "Masters in Information Technology Management",
            level: "Masters",
            description:
                "Bridge the gap between technology and business with specialized training in IT strategy, project management, and digital transformation leadership.",
            image: "/images/it-management-ms.jpg",
            imageUrl:
                "https://images.unsplash.com/photo-1531538606174-0f90ff5dce83?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1374&q=80",
        },
        {
            id: 10,
            title: "Bachelor of Arts in Digital Media",
            level: "Bachelor",
            description:
                "Combine creative arts with digital technology to develop skills in multimedia production, web design, animation, and interactive storytelling.",
            image: "/images/digital-media-ba.jpg",
            imageUrl:
                "https://images.unsplash.com/photo-1626785774573-4b799315345d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1471&q=80",
        },
        {
            id: 11,
            title: "Doctor of Science in Quantum Computing",
            level: "Doctorate",
            description:
                "Push the boundaries of computing with advanced research in quantum algorithms, quantum error correction, and applications in cryptography and optimization.",
            image: "/images/quantum-computing-phd.jpg",
            imageUrl:
                "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
        },
        {
            id: 12,
            title: "Master of Engineering in Blockchain Technology",
            level: "Masters",
            description:
                "Develop expertise in distributed ledger technologies, smart contracts, cryptocurrency systems, and secure applications for various industries.",
            image: "/images/blockchain-me.jpg",
            imageUrl:
                "https://images.unsplash.com/photo-1639762681057-408e52192e55?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1432&q=80",
        },
    ];

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
