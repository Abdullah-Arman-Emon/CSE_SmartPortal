import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import syllabusData from "../assets/CourseSyllabus.json";

function CourseSyllabus() {
    const { courseId } = useParams();
    const [syllabus, setSyllabus] = useState(null);
    const [loading, setLoading] = useState(true);
    // console.log(courseId);

    useEffect(() => {
        if (courseId && syllabusData[courseId]) {
            setSyllabus(syllabusData[courseId]);
        }
        setLoading(false);
    }, [courseId]);

    if (loading) {
        return <div className="text-center py-10">Loading...</div>;
    }

    if (!syllabus) {
        return (
            <div className="text-center py-10">
                <h2 className="text-2xl text-gray-700">Syllabus not found</h2>
                <p className="mt-4">
                    The requested course syllabus could not be found.
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Gradient top bar */}
            <div className="bg-gradient-to-r from-slate-700 via-gray-800 to-slate-700 text-white py-8 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold">
                                {syllabus.title}
                            </h1>
                            <p className="text-gray-300 mt-2">
                                {syllabus.code} • {syllabus.semester}
                            </p>
                        </div>
                    </div>
                    <div className="mt-4">
                        <p className="text-white">
                            <span className="font-medium">Instructor:</span>{" "}
                            {syllabus.instructor}
                        </p>
                    </div>
                </div>
            </div>

            {/* White background content area */}
            <div className="flex-grow bg-white py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                            Course Schedule
                        </h2>
                        <div className="bg-white rounded-lg border border-gray-200">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Week
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Topic
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Description
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {syllabus.weeks.map((week) => (
                                            <tr
                                                key={week.number}
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {week.number}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {week.date}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {week.topic}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {week.description}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Responsive card view for smaller screens */}
                    <div className="grid grid-cols-1 gap-4 md:hidden">
                        {syllabus.weeks.map((week) => (
                            <div
                                key={week.number}
                                className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
                            >
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-medium text-slate-700">
                                        Week {week.number}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        {week.date}
                                    </span>
                                </div>
                                <h3 className="font-medium text-gray-900">
                                    {week.topic}
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {week.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CourseSyllabus;
