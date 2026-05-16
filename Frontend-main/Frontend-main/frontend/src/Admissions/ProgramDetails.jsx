import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import programsData from "../assets/ProgramDetails.json";

function ProgramDetails() {
    const { id } = useParams();
    const [program, setProgram] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");

    useEffect(() => {
        // Simulate API call with dynamic data loading
        const fetchProgram = async () => {
            setLoading(true);
            try {
                // Find the program with the matching ID from JSON data
                const foundProgram = programsData.find(
                    (p) => p.id === parseInt(id)
                );

                // Simulate network delay
                await new Promise((resolve) => setTimeout(resolve, 500));

                setProgram(foundProgram);
            } catch (error) {
                console.error("Error loading program data:", error);
                setProgram(null);
            } finally {
                setLoading(false);
            }
        };

        fetchProgram();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-100 to-gray-200 flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-700"></div>
            </div>
        );
    }

    if (!program) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-100 to-gray-200 flex flex-col justify-center items-center">
                <h1 className="text-2xl font-bold text-red-600">
                    Program Not Found
                </h1>
                <p className="mt-4">
                    The program you're looking for does not exist.
                </p>
                <Link
                    to="/admission-hub"
                    className="mt-6 px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-800"
                >
                    Return to Programs
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-gray-200">
            {/* Header with breadcrumb */}
            <div className="bg-gradient-to-r from-slate-700 via-gray-800 to-slate-700 text-white relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                    <div className="absolute top-2 sm:top-4 left-2 sm:left-4">
                        <Link
                            to="/admission-hub"
                            className="inline-flex items-center px-2 sm:px-4 py-1 sm:py-2 border border-gray-600 text-xs sm:text-sm font-medium rounded-md shadow-md text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-200"
                        >
                            <svg
                                className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                ></path>
                            </svg>
                            <span className="hidden sm:inline">
                                Return
                            </span>
                            <span className="sm:hidden">Return</span>
                        </Link>
                    </div>

                    <div className="pt-10 sm:pt-12 pb-4 sm:pb-6">
                        <div className="flex items-center text-xs sm:text-sm mb-2">
                            <Link to="/" className="hover:text-gray-300">
                                Home
                            </Link>
                            <span className="mx-1 sm:mx-2">›</span>
                            <Link
                                to="/admission-hub"
                                className="hover:text-gray-300"
                            >
                                Programs
                            </Link>
                            <span className="mx-1 sm:mx-2">›</span>
                            <span className="truncate">{program?.title}</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight">
                            {program?.title}
                        </h1>
                        <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
                            <span
                                className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-gray-700 text-white sm:mr-3 w-fit`}
                            >
                                {program?.level}
                            </span>
                            <span className="text-gray-300 text-sm sm:text-base">
                                {program?.credits} Credits • {program?.duration}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                    {/* Left column - Main content */}
                    <div className="lg:w-2/3">
                        <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-6 sm:mb-8">
                            {/* Program header with image */}
                            <div className="h-48 sm:h-56 lg:h-64 relative overflow-hidden">
                                <img
                                    src={program?.imageUrl}
                                    alt={program?.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                                    <div className="p-4 sm:p-6 text-white">
                                        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2 leading-tight">
                                            {program?.title}
                                        </h2>
                                        <p className="text-sm sm:text-lg lg:text-xl">
                                            {program?.departmentInfo?.name}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Tabs navigation */}
                            <div className="border-b border-gray-200">
                                <nav className="flex -mb-px overflow-x-auto">
                                    {[
                                        "overview",
                                        "faculty",
                                        "admission",
                                        "career",
                                    ].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`py-3 sm:py-4 px-3 sm:px-6 font-medium text-xs sm:text-sm border-b-2 whitespace-nowrap ${
                                                activeTab === tab
                                                    ? "border-slate-700 text-slate-700"
                                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                            }`}
                                        >
                                            {tab.charAt(0).toUpperCase() +
                                                tab.slice(1)}
                                        </button>
                                    ))}
                                </nav>
                            </div>

                            {/* Tab content */}
                            <div className="p-4 sm:p-6">
                                {/* Overview Tab */}
                                {activeTab === "overview" && (
                                    <div>
                                        <h3 className="text-xl sm:text-2xl font-bold text-slate-700 mb-3 sm:mb-4">
                                            Program Overview
                                        </h3>
                                        <p className="text-gray-700 mb-4 sm:mb-6 text-sm sm:text-base">
                                            {program?.description}
                                        </p>

                                        <div className="mb-6 sm:mb-8">
                                            <Link
                                                to={`/program/${program?.id}/courses`}
                                                className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 border border-transparent text-sm sm:text-base font-medium rounded-md shadow-sm text-white bg-slate-700 hover:bg-slate-800 w-full sm:w-auto justify-center sm:justify-start"
                                            >
                                                <svg
                                                    className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                                    ></path>
                                                </svg>
                                                View All Courses
                                            </Link>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                                            <div className="bg-slate-50 p-3 sm:p-4 rounded-lg">
                                                <h4 className="font-semibold text-slate-700 mb-1 sm:mb-2 text-sm sm:text-base">
                                                    Program Duration
                                                </h4>
                                                <p className="text-sm sm:text-base">
                                                    {program?.duration}
                                                </p>
                                            </div>
                                            <div className="bg-slate-50 p-3 sm:p-4 rounded-lg">
                                                <h4 className="font-semibold text-slate-700 mb-1 sm:mb-2 text-sm sm:text-base">
                                                    Total Credits
                                                </h4>
                                                <p className="text-sm sm:text-base">
                                                    {program?.credits} credits
                                                </p>
                                            </div>
                                            <div className="bg-slate-50 p-3 sm:p-4 rounded-lg">
                                                <h4 className="font-semibold text-slate-700 mb-1 sm:mb-2 text-sm sm:text-base">
                                                    Current Enrollment
                                                </h4>
                                                <p className="text-sm sm:text-base">
                                                    {program?.studentsEnrolled}{" "}
                                                    students
                                                </p>
                                            </div>
                                            <div className="bg-slate-50 p-3 sm:p-4 rounded-lg">
                                                <h4 className="font-semibold text-slate-700 mb-1 sm:mb-2 text-sm sm:text-base">
                                                    Application Deadline
                                                </h4>
                                                <p className="text-sm sm:text-base">
                                                    {
                                                        program?.applicationDeadline
                                                    }
                                                </p>
                                            </div>
                                        </div>

                                        <h3 className="text-xl sm:text-2xl font-bold text-slate-700 mb-3 sm:mb-4">
                                            Department Information
                                        </h3>
                                        <div className="bg-slate-50 p-4 sm:p-6 rounded-lg mb-4 sm:mb-6">
                                            <div className="flex flex-col lg:flex-row lg:justify-between mb-4">
                                                <div className="mb-4 lg:mb-0">
                                                    <h4 className="font-bold text-base sm:text-lg">
                                                        {
                                                            program
                                                                ?.departmentInfo
                                                                ?.name
                                                        }
                                                    </h4>
                                                    <p className="text-gray-600 text-sm sm:text-base">
                                                        Established:{" "}
                                                        {
                                                            program
                                                                ?.departmentInfo
                                                                ?.establishedYear
                                                        }
                                                    </p>
                                                    <p className="text-gray-600 text-sm sm:text-base">
                                                        Chairperson:{" "}
                                                        {
                                                            program
                                                                ?.departmentInfo
                                                                ?.chairperson
                                                        }
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600 text-sm sm:text-base break-all">
                                                        {
                                                            program
                                                                ?.departmentInfo
                                                                ?.website
                                                        }
                                                    </p>
                                                    <p className="text-gray-600 text-sm sm:text-base">
                                                        {
                                                            program
                                                                ?.departmentInfo
                                                                ?.email
                                                        }
                                                    </p>
                                                    <p className="text-gray-600 text-sm sm:text-base">
                                                        {
                                                            program
                                                                ?.departmentInfo
                                                                ?.phone
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="border-t border-gray-200 pt-4 mt-4">
                                                <h5 className="font-semibold mb-2 text-sm sm:text-base">
                                                    Department Achievements
                                                </h5>
                                                <ul className="list-disc pl-5 space-y-1">
                                                    {program?.departmentInfo?.achievements?.map(
                                                        (
                                                            achievement,
                                                            index
                                                        ) => (
                                                            <li
                                                                key={index}
                                                                className="text-gray-700 text-sm sm:text-base"
                                                            >
                                                                {achievement}
                                                            </li>
                                                        )
                                                    )}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Faculty Tab */}
                                {activeTab === "faculty" && (
                                    <div>
                                        <h3 className="text-xl sm:text-2xl font-bold text-slate-700 mb-3 sm:mb-4">
                                            Program Faculty
                                        </h3>
                                        <p className="text-gray-700 mb-4 sm:mb-6 text-sm sm:text-base">
                                            Our distinguished faculty members
                                            bring extensive industry and
                                            research experience to provide
                                            students with cutting-edge knowledge
                                            and skills.
                                        </p>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                                            {program?.faculty?.map(
                                                (faculty, index) => (
                                                    <div
                                                        key={index}
                                                        className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
                                                    >
                                                        <div className="flex items-center p-3 sm:p-4">
                                                            <div className="flex-shrink-0 h-16 w-16 sm:h-20 sm:w-20 rounded-full overflow-hidden">
                                                                <img
                                                                    src={
                                                                        faculty.imageUrl
                                                                    }
                                                                    alt={
                                                                        faculty.name
                                                                    }
                                                                    className="h-full w-full object-cover"
                                                                />
                                                            </div>
                                                            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                                                                <h4 className="font-bold text-base sm:text-lg text-slate-700 truncate">
                                                                    {
                                                                        faculty.name
                                                                    }
                                                                </h4>
                                                                <p className="text-gray-700 text-sm sm:text-base">
                                                                    {
                                                                        faculty.position
                                                                    }
                                                                </p>
                                                                <p className="text-gray-600 text-xs sm:text-sm">
                                                                    Expertise:{" "}
                                                                    {
                                                                        faculty.expertise
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Admission Tab */}
                                {activeTab === "admission" && (
                                    <div>
                                        <h3 className="text-xl sm:text-2xl font-bold text-slate-700 mb-3 sm:mb-4">
                                            Admission Requirements
                                        </h3>
                                        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
                                            <p className="text-gray-700 mb-4 text-sm sm:text-base">
                                                {program?.admissionRequirements}
                                            </p>

                                            <h4 className="font-bold text-base sm:text-lg text-slate-700 mt-4 sm:mt-6 mb-2 sm:mb-3">
                                                Application Process
                                            </h4>
                                            <ol className="list-decimal pl-4 sm:pl-5 space-y-1 sm:space-y-2 text-sm sm:text-base">
                                                <li>
                                                    Complete the online
                                                    application form
                                                </li>
                                                <li>
                                                    Submit official transcripts
                                                    from all previous
                                                    educational institutions
                                                </li>
                                                <li>
                                                    Provide standardized test
                                                    scores (as required)
                                                </li>
                                                <li>
                                                    Submit letters of
                                                    recommendation
                                                </li>
                                                <li>Pay the application fee</li>
                                                <li>
                                                    Complete an interview (if
                                                    invited)
                                                </li>
                                            </ol>

                                            <h4 className="font-bold text-base sm:text-lg text-slate-700 mt-4 sm:mt-6 mb-2 sm:mb-3">
                                                Important Dates
                                            </h4>
                                            <div className="bg-slate-50 rounded-lg p-3 sm:p-4">
                                                <div className="flex flex-col sm:flex-row sm:justify-between border-b border-gray-200 pb-2 mb-2">
                                                    <span className="font-medium text-sm sm:text-base">
                                                        Application Deadline:
                                                    </span>
                                                    <span className="text-sm sm:text-base">
                                                        {
                                                            program?.applicationDeadline
                                                        }
                                                    </span>
                                                </div>
                                                <div className="flex flex-col sm:flex-row sm:justify-between border-b border-gray-200 pb-2 mb-2">
                                                    <span className="font-medium text-sm sm:text-base">
                                                        Document Submission:
                                                    </span>
                                                    <span className="text-sm sm:text-base">
                                                        June 1, 2023
                                                    </span>
                                                </div>
                                                <div className="flex flex-col sm:flex-row sm:justify-between">
                                                    <span className="font-medium text-sm sm:text-base">
                                                        Program Start Date:
                                                    </span>
                                                    <span className="text-sm sm:text-base">
                                                        September 1, 2023
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-700 text-white rounded-lg p-4 sm:p-6">
                                            <h4 className="font-bold text-lg sm:text-xl mb-2 sm:mb-3">
                                                Ready to Apply?
                                            </h4>
                                            <p className="mb-3 sm:mb-4 text-sm sm:text-base">
                                                Start your application process
                                                today and take the first step
                                                toward your future career.
                                            </p>
                                            <Link
                                                to={"/apply"}
                                                className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 border border-transparent text-sm sm:text-base font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 w-full sm:w-auto justify-center"
                                            >
                                                Apply Now
                                            </Link>
                                        </div>
                                    </div>
                                )}

                                {/* Career Tab */}
                                {activeTab === "career" && (
                                    <div>
                                        <h3 className="text-xl sm:text-2xl font-bold text-slate-700 mb-3 sm:mb-4">
                                            Career Opportunities
                                        </h3>
                                        <p className="text-gray-700 mb-4 sm:mb-6 text-sm sm:text-base">
                                            {program?.careerProspects}
                                        </p>

                                        <h4 className="font-bold text-base sm:text-lg text-slate-700 mb-2 sm:mb-3">
                                            Common Career Paths
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                                            <div className="bg-slate-50 p-3 sm:p-4 rounded-lg">
                                                <h5 className="font-semibold mb-1 text-sm sm:text-base">
                                                    Software Engineer
                                                </h5>
                                                <p className="text-gray-600 text-xs sm:text-sm">
                                                    Design, develop, and
                                                    maintain software
                                                    applications
                                                </p>
                                            </div>
                                            <div className="bg-slate-50 p-3 sm:p-4 rounded-lg">
                                                <h5 className="font-semibold mb-1 text-sm sm:text-base">
                                                    Data Scientist
                                                </h5>
                                                <p className="text-gray-600 text-xs sm:text-sm">
                                                    Analyze and interpret
                                                    complex data to inform
                                                    business decisions
                                                </p>
                                            </div>
                                            <div className="bg-slate-50 p-3 sm:p-4 rounded-lg">
                                                <h5 className="font-semibold mb-1 text-sm sm:text-base">
                                                    Systems Analyst
                                                </h5>
                                                <p className="text-gray-600 text-xs sm:text-sm">
                                                    Evaluate and improve
                                                    organizational computer
                                                    systems
                                                </p>
                                            </div>
                                            <div className="bg-slate-50 p-3 sm:p-4 rounded-lg">
                                                <h5 className="font-semibold mb-1 text-sm sm:text-base">
                                                    Database Administrator
                                                </h5>
                                                <p className="text-gray-600 text-xs sm:text-sm">
                                                    Design and maintain database
                                                    systems for organizations
                                                </p>
                                            </div>
                                        </div>

                                        <h4 className="font-bold text-base sm:text-lg text-slate-700 mb-2 sm:mb-3">
                                            Industry Partners
                                        </h4>
                                        <p className="text-gray-700 mb-3 sm:mb-4 text-sm sm:text-base">
                                            Our program has strong connections
                                            with industry leaders who regularly
                                            recruit our graduates:
                                        </p>
                                        <div className="flex flex-wrap gap-2 sm:gap-4 mb-4 sm:mb-6">
                                            <span className="px-3 sm:px-4 py-1 sm:py-2 bg-gray-100 rounded-full text-gray-700 text-xs sm:text-sm">
                                                Microsoft
                                            </span>
                                            <span className="px-3 sm:px-4 py-1 sm:py-2 bg-gray-100 rounded-full text-gray-700 text-xs sm:text-sm">
                                                Google
                                            </span>
                                            <span className="px-3 sm:px-4 py-1 sm:py-2 bg-gray-100 rounded-full text-gray-700 text-xs sm:text-sm">
                                                Amazon
                                            </span>
                                            <span className="px-3 sm:px-4 py-1 sm:py-2 bg-gray-100 rounded-full text-gray-700 text-xs sm:text-sm">
                                                IBM
                                            </span>
                                            <span className="px-3 sm:px-4 py-1 sm:py-2 bg-gray-100 rounded-full text-gray-700 text-xs sm:text-sm">
                                                Oracle
                                            </span>
                                            <span className="px-3 sm:px-4 py-1 sm:py-2 bg-gray-100 rounded-full text-gray-700 text-xs sm:text-sm">
                                                Cisco
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right column - Sidebar */}
                    <div className="lg:w-1/3">
                        {/* Related Programs */}
                        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                            <div className="bg-slate-700 text-white p-3 sm:p-4">
                                <h3 className="text-lg sm:text-xl font-bold">
                                    Related Programs
                                </h3>
                            </div>
                            <div className="p-3 sm:p-4">
                                {programsData
                                    .filter(
                                        (p) =>
                                            p.id !== program?.id &&
                                            p.level === program?.level
                                    )
                                    .slice(0, 3).length > 0 ? (
                                    programsData
                                        .filter(
                                            (p) =>
                                                p.id !== program?.id &&
                                                p.level === program?.level
                                        )
                                        .slice(0, 3)
                                        .map((relatedProgram) => (
                                            <div
                                                key={relatedProgram.id}
                                                className="mb-4 last:mb-0"
                                            >
                                                <Link
                                                    to={`/program/${relatedProgram.id}`}
                                                    className="block p-3 hover:bg-slate-50 rounded-lg transition-colors duration-200"
                                                >
                                                    <h4 className="font-medium text-slate-700 mb-1">
                                                        {relatedProgram.title}
                                                    </h4>
                                                    <p className="text-gray-600 text-sm line-clamp-2">
                                                        {relatedProgram.description.substring(
                                                            0,
                                                            100
                                                        )}
                                                        ...
                                                    </p>
                                                </Link>
                                            </div>
                                        ))
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="text-gray-400 mb-2">
                                            <svg
                                                className="mx-auto h-12 w-12"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                                ></path>
                                            </svg>
                                        </div>
                                        <h4 className="text-lg font-medium text-gray-900 mb-1">
                                            No Related Programs
                                        </h4>
                                        <p className="text-gray-500 text-sm">
                                            There are currently no other
                                            programs at this level.
                                        </p>
                                        <Link
                                            to="/admission-hub"
                                            className="inline-block mt-3 text-slate-700 hover:text-slate-900 font-medium text-sm"
                                        >
                                            Browse All Programs →
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer call to action */}
            <div className="bg-gradient-to-r from-slate-700 via-gray-800 to-slate-700 text-white py-8 sm:py-12 mt-8 sm:mt-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
                        Ready to Start Your Academic Journey?
                    </h2>
                    <p className="text-base sm:text-xl mb-6 sm:mb-8 max-w-3xl mx-auto">
                        Join our community of scholars and innovators at the
                        {program?.departmentInfo?.name}.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                        <Link
                            to={"/apply"}
                            className="px-4 sm:px-6 py-2 sm:py-3 bg-white text-slate-700 font-bold rounded-lg hover:bg-gray-100 transition duration-300 text-sm sm:text-base"
                        >
                            Apply Now
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProgramDetails;
