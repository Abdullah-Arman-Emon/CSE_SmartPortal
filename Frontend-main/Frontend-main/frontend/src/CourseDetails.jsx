import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

// Sample course data
const coursesData = {
  101: {
    id: 101,
    code: "CSE 101",
    title: "Introduction to Computer Science",
    semester: "Fall 2025",
    instructor: "Dr. David Miller",
    description: "An introduction to computer science and programming concepts.",
    credits: 3,
    prerequisites: "None",
    materials: [
      { title: "Introduction to Algorithms", author: "Thomas H. Cormen", type: "Textbook" },
      { title: "Course Slides", author: "Dr. David Miller", type: "Slides" },
      { title: "Programming Exercises", author: "Teaching Staff", type: "Practice" }
    ],
    assignments: [
      { title: "Assignment 1: Basic Programming", dueDate: "September 15, 2025", weight: "10%" },
      { title: "Assignment 2: Data Types", dueDate: "October 10, 2025", weight: "10%" },
      { title: "Midterm Exam", dueDate: "October 20, 2025", weight: "30%" },
      { title: "Assignment 3: Algorithms", dueDate: "November 15, 2025", weight: "15%" },
      { title: "Final Project", dueDate: "December 5, 2025", weight: "15%" },
      { title: "Final Exam", dueDate: "December 15, 2025", weight: "20%" }
    ],
    schedule: {
      lectures: "Monday, Wednesday 10:00 AM - 11:30 AM",
      lab: "Friday 2:00 PM - 4:00 PM",
      officeHours: "Tuesday 1:00 PM - 3:00 PM"
    }
  },
  301: {
    id: 301,
    code: "CSE 301",
    title: "Computer Networking",
    semester: "Fall 2025",
    instructor: "Prof. Sarah Johnson",
    description: "Principles and practices of computer network systems.",
    credits: 3,
    prerequisites: "CSE 101, CSE 201",
    materials: [
      { title: "Computer Networking: A Top-Down Approach", author: "James Kurose & Keith Ross", type: "Textbook" },
      { title: "Networking Lab Manual", author: "Prof. Sarah Johnson", type: "Lab Guide" },
      { title: "Network Simulation Tools", author: "Various", type: "Software" }
    ],
    assignments: [
      { title: "Assignment 1: Network Protocols", dueDate: "September 10, 2025", weight: "10%" },
      { title: "Lab Project 1: Network Configuration", dueDate: "September 25, 2025", weight: "15%" },
      { title: "Midterm Exam", dueDate: "October 15, 2025", weight: "25%" },
      { title: "Assignment 2: Routing Algorithms", dueDate: "November 5, 2025", weight: "10%" },
      { title: "Lab Project 2: Network Security", dueDate: "November 20, 2025", weight: "15%" },
      { title: "Final Exam", dueDate: "December 10, 2025", weight: "25%" }
    ],
    schedule: {
      lectures: "Tuesday, Thursday 11:00 AM - 12:30 PM",
      lab: "Wednesday 3:00 PM - 5:00 PM",
      officeHours: "Monday 2:00 PM - 4:00 PM"
    }
  },
  201: {
    id: 201,
    code: "CSE 201",
    title: "Data Structures",
    semester: "Spring 2026",
    instructor: "Dr. Michael Chen",
    description: "Implementation and analysis of fundamental data structures.",
    credits: 3,
    prerequisites: "CSE 101",
    materials: [
      { title: "Data Structures and Algorithms in Java", author: "Robert Lafore", type: "Textbook" },
      { title: "Algorithm Visualization Tool", author: "University CS Dept", type: "Software" },
      { title: "Practice Problem Sets", author: "Dr. Michael Chen", type: "Practice" }
    ],
    assignments: [
      { title: "Assignment 1: Array Implementation", dueDate: "February 1, 2026", weight: "10%" },
      { title: "Programming Project 1: Linked Lists", dueDate: "February 20, 2026", weight: "15%" },
      { title: "Midterm Exam", dueDate: "March 5, 2026", weight: "25%" },
      { title: "Programming Project 2: Trees and Graphs", dueDate: "April 10, 2026", weight: "20%" },
      { title: "Final Exam", dueDate: "May 1, 2026", weight: "30%" }
    ],
    schedule: {
      lectures: "Monday, Wednesday 1:00 PM - 2:30 PM",
      lab: "Thursday 10:00 AM - 12:00 PM",
      officeHours: "Tuesday, Friday 10:00 AM - 11:30 AM"
    }
  },
  // Just adding a couple more courses as examples
  302: {
    id: 302,
    code: "CSE 302",
    title: "Operating Systems",
    semester: "Fall 2026",
    instructor: "Dr. Lisa Wong",
    description: "Process management, memory management, and file systems.",
    credits: 4,
    prerequisites: "CSE 201, CSE 202",
    materials: [
      { title: "Operating System Concepts", author: "Silberschatz, Galvin, Gagne", type: "Textbook" },
      { title: "Linux Programming Guide", author: "Various", type: "Reference" },
      { title: "OS Lab Exercises", author: "Dr. Lisa Wong", type: "Lab Guide" }
    ],
    assignments: [
      { title: "Assignment 1: Process Management", dueDate: "September 15, 2026", weight: "10%" },
      { title: "Lab Project 1: Shell Programming", dueDate: "October 1, 2026", weight: "15%" },
      { title: "Midterm Exam", dueDate: "October 20, 2026", weight: "25%" },
      { title: "Lab Project 2: Memory Allocator", dueDate: "November 15, 2026", weight: "15%" },
      { title: "Final Project: Mini OS", dueDate: "December 1, 2026", weight: "15%" },
      { title: "Final Exam", dueDate: "December 15, 2026", weight: "20%" }
    ],
    schedule: {
      lectures: "Monday, Wednesday 3:00 PM - 4:30 PM",
      lab: "Friday 1:00 PM - 4:00 PM",
      officeHours: "Tuesday 2:00 PM - 4:00 PM"
    }
  },
  401: {
    id: 401,
    code: "CSE 401",
    title: "Artificial Intelligence",
    semester: "Spring 2027",
    instructor: "Dr. Robert Garcia",
    description: "Problem-solving methods in artificial intelligence.",
    credits: 3,
    prerequisites: "CSE 201, MATH 301",
    materials: [
      { title: "Artificial Intelligence: A Modern Approach", author: "Russell & Norvig", type: "Textbook" },
      { title: "Python for AI", author: "Teaching Staff", type: "Tutorial" },
      { title: "AI Research Papers", author: "Various", type: "Readings" }
    ],
    assignments: [
      { title: "Assignment 1: Search Algorithms", dueDate: "February 10, 2027", weight: "10%" },
      { title: "Project 1: Game Playing", dueDate: "March 1, 2027", weight: "15%" },
      { title: "Midterm Exam", dueDate: "March 15, 2027", weight: "25%" },
      { title: "Project 2: Machine Learning Application", dueDate: "April 20, 2027", weight: "20%" },
      { title: "Final Exam", dueDate: "May 10, 2027", weight: "30%" }
    ],
    schedule: {
      lectures: "Tuesday, Thursday 1:00 PM - 2:30 PM",
      lab: "Wednesday 2:00 PM - 4:00 PM",
      officeHours: "Monday 10:00 AM - 12:00 PM"
    }
  }
  // Could add more course details for other courses
};

function CourseDetails() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // In a real application, this would be an API call
    const fetchCourse = () => {
      setLoading(true);
      setTimeout(() => {
        const courseData = coursesData[courseId] || null;
        setCourse(courseData);
        setLoading(false);
      }, 300); // Simulate loading
    };

    fetchCourse();
  }, [courseId]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center">
        <h1 className="text-2xl font-bold text-red-600">Course Not Found</h1>
        <p className="mt-4">The course you're looking for does not exist.</p>
        <Link to="/admission-hub" className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Return to Programs
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Left sidebar with user info */}
      <div className="flex">
        <div className="w-64 min-h-screen bg-white border-r">
          <div className="p-4 border-b flex items-center">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
              <span className="text-gray-700 font-medium">M</span>
            </div>
            <div>
              <h2 className="font-medium">Mohbuba</h2>
            </div>
          </div>
          <nav className="p-4">
            <ul className="space-y-2">
              <li>
                <Link to="/dashboard" className="flex items-center p-2 text-gray-700 hover:bg-gray-100 rounded">
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                  </svg>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/courses" className="flex items-center p-2 bg-gray-100 text-blue-600 rounded">
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                  </svg>
                  Courses
                </Link>
              </li>
              <li>
                <Link to="/calendar" className="flex items-center p-2 text-gray-700 hover:bg-gray-100 rounded">
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  Calendar
                </Link>
              </li>
              <li>
                <Link to="/messages" className="flex items-center p-2 text-gray-700 hover:bg-gray-100 rounded">
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                  Messages
                </Link>
              </li>
              <li>
                <Link to="/settings" className="flex items-center p-2 text-gray-700 hover:bg-gray-100 rounded">
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  Settings
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Main content area */}
        <div className="flex-1 p-8">
          <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
          <p className="text-gray-600 mb-6">{course.code} - {course.semester}</p>
          
          {/* Tabs */}
          <div className="border-b mb-6">
            <div className="flex">
              <button 
                onClick={() => setActiveTab('overview')} 
                className={`px-4 py-2 border-b-2 ${activeTab === 'overview' ? 'border-red-500 text-gray-900 font-medium' : 'border-transparent text-gray-600 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Overview
              </button>
              <button 
                onClick={() => setActiveTab('syllabus')}
                className={`px-4 py-2 border-b-2 ${activeTab === 'syllabus' ? 'border-red-500 text-gray-900 font-medium' : 'border-transparent text-gray-600 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Syllabus
              </button>
              <button 
                onClick={() => setActiveTab('schedule')}
                className={`px-4 py-2 border-b-2 ${activeTab === 'schedule' ? 'border-red-500 text-gray-900 font-medium' : 'border-transparent text-gray-600 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Schedule
              </button>
              <button 
                onClick={() => setActiveTab('assignments')}
                className={`px-4 py-2 border-b-2 ${activeTab === 'assignments' ? 'border-red-500 text-gray-900 font-medium' : 'border-transparent text-gray-600 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Assignments
              </button>
              <button 
                onClick={() => setActiveTab('materials')}
                className={`px-4 py-2 border-b-2 ${activeTab === 'materials' ? 'border-red-500 text-gray-900 font-medium' : 'border-transparent text-gray-600 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Materials
              </button>
            </div>
          </div>
          
          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div>
              <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h2 className="text-xl font-bold mb-4">Course Overview</h2>
                <p className="text-gray-700 mb-4">{course.description}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-800">Instructor</h3>
                    <p className="text-gray-600">{course.instructor}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">Credits</h3>
                    <p className="text-gray-600">{course.credits}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">Prerequisites</h3>
                    <p className="text-gray-600">{course.prerequisites}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">Semester</h3>
                    <p className="text-gray-600">{course.semester}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Schedule at a Glance</h2>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-medium text-gray-800">Lectures</h3>
                    <p className="text-gray-600">{course.schedule.lectures}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">Lab Sessions</h3>
                    <p className="text-gray-600">{course.schedule.lab}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">Office Hours</h3>
                    <p className="text-gray-600">{course.schedule.officeHours}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'syllabus' && (
            <div>
              <Link to={`/course/${course.id}/syllabus`} className="block mb-4 text-blue-600 hover:underline">
                View detailed syllabus
              </Link>
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Syllabus Summary</h2>
                <p className="text-gray-700 mb-4">{course.description}</p>
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-800">Course Objectives</h3>
                  <ul className="list-disc pl-5 space-y-1 text-gray-600">
                    <li>Understand fundamental concepts of {course.title}</li>
                    <li>Develop practical skills in related technologies</li>
                    <li>Apply theoretical knowledge to solve real-world problems</li>
                    <li>Prepare for advanced study in the field</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'schedule' && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Course Schedule</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-800">Lectures</h3>
                  <p className="text-gray-600">{course.schedule.lectures}</p>
                  <p className="text-gray-500 text-sm mt-1">Building A, Room 101</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Lab Sessions</h3>
                  <p className="text-gray-600">{course.schedule.lab}</p>
                  <p className="text-gray-500 text-sm mt-1">CS Lab, Room 305</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Office Hours</h3>
                  <p className="text-gray-600">{course.schedule.officeHours}</p>
                  <p className="text-gray-500 text-sm mt-1">Faculty Building, Room 210</p>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'assignments' && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Assignments & Assessments</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {course.assignments.map((assignment, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{assignment.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{assignment.dueDate}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{assignment.weight}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {activeTab === 'materials' && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Course Materials</h2>
              <div className="space-y-4">
                {course.materials.map((material, index) => (
                  <div key={index} className="flex items-start p-3 border rounded hover:bg-gray-50">
                    <div className="flex-shrink-0 bg-blue-100 p-2 rounded">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="font-medium text-gray-800">{material.title}</h3>
                      <p className="text-gray-600">{material.author}</p>
                      <span className="inline-block mt-1 px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded">{material.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CourseDetails;
