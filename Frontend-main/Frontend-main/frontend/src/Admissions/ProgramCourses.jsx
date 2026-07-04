import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const semesterPrefix = (course) => (course.semester || "").split(" ")[0];

function ProgramCourses() {
    const { programId } = useParams();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [programTitle, setProgramTitle] = useState("");

    // Filters state (populated from the fetched data)
    const [yearFilters, setYearFilters] = useState([]);
    const [semesterFilters, setSmesterFilters] = useState([]);
    const [creditFilters, setCreditFilters] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    // Filter options derived from the admin-managed course data
    const yearOptions = [...new Set(courses.map((c) => c.year).filter((y) => y != null))].sort((a, b) => a - b);
    const semesterOptions = [...new Set(courses.map(semesterPrefix).filter(Boolean))];
    const creditOptions = [...new Set(courses.map((c) => c.credits).filter((c) => c != null))].sort((a, b) => a - b);

    const resetFilters = (courseList) => {
        setYearFilters([...new Set(courseList.map((c) => c.year).filter((y) => y != null))]);
        setSmesterFilters([...new Set(courseList.map(semesterPrefix).filter(Boolean))]);
        setCreditFilters([...new Set(courseList.map((c) => c.credits).filter((c) => c != null))]);
        setSearchTerm("");
    };

    useEffect(() => {
        // Courses + program title are admin-managed (Admin Dashboard → Website → Programs)
        const fetchCourses = async () => {
            setLoading(true);
            try {
                const [coursesRes, progRes] = await Promise.all([
                    axios.get(`${BACKEND_URL}/guest/site/programs/${programId}/courses`),
                    axios.get(`${BACKEND_URL}/guest/site/programs/${programId}`).catch(() => null),
                ]);
                setCourses(coursesRes.data);
                setProgramTitle(progRes?.data?.title || "Program");
                resetFilters(coursesRes.data);
            } catch (error) {
                console.error("Error loading courses:", error);
                setCourses([]);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, [programId]);

    // Toggle a filter in the filter list
    const toggleFilter = (filter, currentFilters, setFilters) => {
        if (currentFilters.includes(filter)) {
            setFilters(currentFilters.filter((f) => f !== filter));
        } else {
            setFilters([...currentFilters, filter]);
        }
    };

    // Apply filters to courses
    const filteredCourses = courses.filter((course) => {
        // Apply year filter
        if (!yearFilters.includes(course.year)) return false;

        // Apply semester filter (check if semester starts with any of the filter values)
        if (!semesterFilters.some((sem) => (course.semester || "").startsWith(sem)))
            return false;

        // Apply credits filter
        if (!creditFilters.includes(course.credits)) return false;

        // Apply search filter
        if (
            searchTerm &&
            !(course.title || "").toLowerCase().includes(searchTerm.toLowerCase()) &&
            !(course.code || "").toLowerCase().includes(searchTerm.toLowerCase())
        ) {
            return false;
        }

        return true;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-100 to-gray-200 flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-700"></div>
            </div>
        );
    }

    if (courses.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-100 to-gray-200 flex flex-col justify-center items-center">
                <h1 className="text-2xl font-bold text-red-600">
                    No Courses Found
                </h1>
                <p className="mt-4">
                    There are no courses available for this program.
                </p>
                <Link
                    to={`/program/${programId}`}
                    className="mt-6 px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-800"
                >
                    Return to Program Details
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-gray-200">
            {/* Header with breadcrumb */}
            <div className="bg-gradient-to-r from-slate-700 via-gray-800 to-slate-700 text-white">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center text-sm mb-2">
                        <Link to="/" className="hover:text-gray-300">
                            Home
                        </Link>
                        <span className="mx-2">›</span>
                        <Link
                            to="/admission-hub"
                            className="hover:text-gray-300"
                        >
                            Programs
                        </Link>
                        <span className="mx-2">›</span>
                        <Link
                            to={`/program/${programId}`}
                            className="hover:text-gray-300"
                        >
                            {programTitle}
                        </Link>
                        <span className="mx-2">›</span>
                        <span>Courses</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold">Courses</h1>
                            <p className="mt-2 text-gray-300">
                                All courses for {programTitle}
                            </p>
                        </div>
                        <Link
                            to={`/program/${programId}`}
                            className="inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md shadow-md text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-200"
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
                                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                ></path>
                            </svg>
                            Back to Program
                        </Link>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Search bar */}
                <div className="mb-8 max-w-lg mx-auto">
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
                            placeholder="Search courses by title or code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition duration-150 ease-in-out shadow-sm"
                        />
                    </div>
                </div>

                {/* Sidebar layout */}
                <div className="flex flex-col md:flex-row">
                    {/* Sidebar */}
                    <div className="w-full md:w-64 mb-8 md:mb-0 md:mr-8">
                        <div className="bg-white p-6 rounded-lg shadow sticky top-4">
                            <h2 className="font-bold text-lg text-slate-700 mb-4 flex items-center">
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
                                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                                    ></path>
                                </svg>
                                Filter Courses
                            </h2>

                            <div className="mb-6">
                                <h3 className="font-medium text-gray-700 mb-2 border-b pb-1">
                                    By Year
                                </h3>
                                <div className="space-y-2 mt-3">
                                    {yearOptions.map((year) => (
                                        <label
                                            key={year}
                                            className="flex items-center"
                                        >
                                            <input
                                                type="checkbox"
                                                className="form-checkbox h-4 w-4 text-slate-600 rounded"
                                                checked={yearFilters.includes(
                                                    year
                                                )}
                                                onChange={() =>
                                                    toggleFilter(
                                                        year,
                                                        yearFilters,
                                                        setYearFilters
                                                    )
                                                }
                                            />
                                            <span className="ml-2 text-sm text-gray-700">
                                                Year {year}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-6">
                                <h3 className="font-medium text-gray-700 mb-2 border-b pb-1">
                                    By Semester
                                </h3>
                                <div className="space-y-2 mt-3">
                                    {semesterOptions.map((semester) => (
                                        <label
                                            key={semester}
                                            className="flex items-center"
                                        >
                                            <input
                                                type="checkbox"
                                                className="form-checkbox h-4 w-4 text-slate-600 rounded"
                                                checked={semesterFilters.includes(
                                                    semester
                                                )}
                                                onChange={() =>
                                                    toggleFilter(
                                                        semester,
                                                        semesterFilters,
                                                        setSmesterFilters
                                                    )
                                                }
                                            />
                                            <span className="ml-2 text-sm text-gray-700">
                                                {semester}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-4">
                                <h3 className="font-medium text-gray-700 mb-2 border-b pb-1">
                                    By Credits
                                </h3>
                                <div className="space-y-2 mt-3">
                                    {creditOptions.map((credit) => (
                                        <label
                                            key={credit}
                                            className="flex items-center"
                                        >
                                            <input
                                                type="checkbox"
                                                className="form-checkbox h-4 w-4 text-slate-600 rounded"
                                                checked={creditFilters.includes(
                                                    credit
                                                )}
                                                onChange={() =>
                                                    toggleFilter(
                                                        credit,
                                                        creditFilters,
                                                        setCreditFilters
                                                    )
                                                }
                                            />
                                            <span className="ml-2 text-sm text-gray-700">
                                                {credit} Credits
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => resetFilters(courses)}
                                className="w-full mt-4 py-2 px-4 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                            >
                                Reset Filters
                            </button>
                        </div>
                    </div>

                    {/* Course listing */}
                    <div className="flex-1">
                        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold text-slate-700">
                                    Course Catalog
                                </h2>
                                <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-medium">
                                    {filteredCourses.length} Course
                                    {filteredCourses.length !== 1 ? "s" : ""}
                                </span>
                            </div>
                            <p className="text-gray-600 mb-2">
                                Below you'll find all courses for the{" "}
                                {programTitle} program. Use the filters to
                                narrow down your selection.
                            </p>
                        </div>

                        {/* Empty state */}
                        {filteredCourses.length === 0 && (
                            <div className="bg-white p-8 rounded-lg shadow-md text-center">
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
                                    No courses found
                                </h3>
                                <p className="mt-1 text-gray-500">
                                    Try adjusting your filters to find what
                                    you're looking for.
                                </p>
                                <button
                                    onClick={() => resetFilters(courses)}
                                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-slate-600 hover:bg-slate-700"
                                >
                                    Reset All Filters
                                </button>
                            </div>
                        )}

                        {/* Courses grid */}
                        {filteredCourses.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredCourses.map((course) => (
                                    <div
                                        key={course.id}
                                        className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
                                    >
                                        <div className="h-32 bg-gradient-to-r from-slate-700 to-slate-600 flex items-center justify-center p-4 relative">
                                            {/* Replace the placeholder with actual image */}
                                            <img
                                                src={course.imageUrl}
                                                alt={course.title}
                                                className="absolute inset-0 w-full h-full object-cover opacity-40"
                                            />
                                            <div className="absolute top-2 left-2 z-10 bg-white shadow-md rounded px-2 py-1">
                                                <span className="text-slate-700 font-medium text-xs">
                                                    {course.code}
                                                </span>
                                            </div>
                                            <div className="absolute top-2 right-2 z-10">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-800">
                                                    Year {course.year}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="px-4 py-5 sm:p-6">
                                            <h3 className="text-lg font-medium text-slate-800 mb-1">
                                                {course.title}
                                            </h3>
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-sm text-gray-500">
                                                    {course.semester}
                                                </span>
                                                <span className="text-sm font-medium text-slate-700">
                                                    {course.credits} Credits
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                                {course.description}
                                            </p>
                                            <div className="flex space-x-2">
                                                <Link
                                                    to={`/course/${course.id}/syllabus`}
                                                    className="px-3 py-1.5 bg-slate-100 text-slate-700 text-sm font-medium rounded hover:bg-slate-200 transition"
                                                >
                                                    View Syllabus
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProgramCourses;
