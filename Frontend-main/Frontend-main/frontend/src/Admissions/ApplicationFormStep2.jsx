import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function ApplicationFormStep2() {
  const navigate = useNavigate();
  
  // Form state for step 2
  const [formData, setFormData] = useState({
    highestQualification: '',
    institutionName: '',
    fieldOfStudy: '',
    graduationDate: '',
    gradeGPA: ''
  });

  // Load previous step data if it exists
  useEffect(() => {
    const step1Data = localStorage.getItem('applicationFormStep1');
    if (!step1Data) {
      // If step 1 data doesn't exist, redirect back to step 1
      navigate('/apply');
    }
  }, [navigate]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    // Save the data to localStorage
    localStorage.setItem('applicationFormStep2', JSON.stringify(formData));
    // Navigate to step 3
    navigate('/apply/step3');
  };

  // Handle back button
  const handleBack = () => {
    // Save current progress before going back
    localStorage.setItem('applicationFormStep2', JSON.stringify(formData));
    navigate('/apply');
  };

  // Educational qualifications options
  const qualificationOptions = [
    "High School Diploma",
    "Associate's Degree",
    "Bachelor's Degree",
    "Master's Degree",
    "Doctorate",
    "Professional Certification"
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-64 bg-white shadow-md p-6">
        <Link to="/" className="text-lg font-bold text-gray-900 mb-6 block">CSEDU</Link>
        <nav className="mt-6">
          <ul className="space-y-2">
            <li>
              <Link to="/dashboard" className="flex items-center text-gray-600 py-2 hover:text-blue-600">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                </svg>
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/admission-hub" className="flex items-center text-gray-600 py-2 hover:text-blue-600">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
                Admissions
              </Link>
            </li>
            <li>
              <Link to="/students" className="flex items-center text-gray-600 py-2 hover:text-blue-600">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
                Students
              </Link>
            </li>
            <li>
              <Link to="/courses" className="flex items-center text-gray-600 py-2 hover:text-blue-600">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
                Courses
              </Link>
            </li>
            <li>
              <Link to="/settings" className="flex items-center text-gray-600 py-2 hover:text-blue-600">
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

      {/* Main Content */}
      <div className="flex-1 px-8 py-6">
        <div className="flex text-sm text-gray-500 mb-4">
          <Link to="/" className="hover:text-gray-700">Admissions</Link>
          <span className="mx-2">/</span>
          <span>New Application</span>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-800 mb-6">New Application</h1>
        
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="relative">
            <div className="overflow-hidden h-2 mb-2 text-xs flex rounded bg-gray-200">
              <div style={{ width: "50%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-orange-500"></div>
            </div>
            <div className="flex text-xs text-gray-600 mt-1">
              <span className="flex-1 text-center">Step 1 of 4</span>
              <span className="flex-1 text-center font-semibold text-orange-500">Step 2 of 4</span>
              <span className="flex-1 text-center">Step 3 of 4</span>
              <span className="flex-1 text-center">Step 4 of 4</span>
            </div>
          </div>
        </div>
        
        {/* Navigation tabs for steps */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <Link
              to="/apply"
              className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm"
            >
              Personal Information
            </Link>
            <span
              className="border-orange-500 text-orange-600 whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm"
            >
              Academic Information
            </span>
            <span
              className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm"
            >
              Program Selection
            </span>
            <span
              className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm"
            >
              Review & Submit
            </span>
          </nav>
        </div>
        
        {/* Form Content */}
        <div className="flex">
          {/* Form Area */}
          <div className="flex-1 mr-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              {/* Academic graphic */}
              <div className="mb-6 flex justify-center">
                <div className="w-48 h-48 bg-orange-50 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-orange-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                  </svg>
                </div>
              </div>

              <h2 className="text-xl font-bold text-gray-800 mb-2">Academic History</h2>
              <p className="text-gray-600 mb-6">Please provide details of your previous academic qualifications.</p>
              
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <div>
                    <label htmlFor="highestQualification" className="block text-sm font-medium text-gray-700">Highest Qualification</label>
                    <div className="relative mt-1">
                      <select
                        id="highestQualification"
                        name="highestQualification"
                        value={formData.highestQualification}
                        onChange={handleChange}
                        className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm appearance-none"
                        required
                      >
                        <option value="">Select</option>
                        {qualificationOptions.map((option, index) => (
                          <option key={index} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="institutionName" className="block text-sm font-medium text-gray-700">Institution Name</label>
                    <input 
                      type="text" 
                      id="institutionName"
                      name="institutionName"
                      value={formData.institutionName}
                      onChange={handleChange}
                      placeholder="Enter institutionname"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="fieldOfStudy" className="block text-sm font-medium text-gray-700">Field of Study</label>
                    <input 
                      type="text" 
                      id="fieldOfStudy"
                      name="fieldOfStudy"
                      value={formData.fieldOfStudy}
                      onChange={handleChange}
                      placeholder="Enter fieldofstudy"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="graduationDate" className="block text-sm font-medium text-gray-700">Graduation Date</label>
                    <input 
                      type="text" 
                      id="graduationDate"
                      name="graduationDate"
                      value={formData.graduationDate}
                      onChange={handleChange}
                      placeholder="MM/YYYY"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="gradeGPA" className="block text-sm font-medium text-gray-700">Grade/GPA</label>
                    <input 
                      type="text" 
                      id="gradeGPA"
                      name="gradeGPA"
                      value={formData.gradeGPA}
                      onChange={handleChange}
                      placeholder="Enter grade/GPA"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="mt-8 flex justify-end space-x-3">
                  <button 
                    type="button" 
                    onClick={handleBack}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Back
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    Next
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          {/* Sidebar - Key Deadlines */}
          <div className="w-64">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Key Deadlines</h2>
              <ul className="space-y-6">
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">July 15, 2024</p>
                    <p className="text-xs text-red-600">Application Deadline</p>
                  </div>
                  <div className="ml-auto">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      Open
                    </span>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">July 22, 2024</p>
                    <p className="text-xs text-gray-600">Document Submission</p>
                  </div>
                  <div className="ml-auto">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      Open
                    </span>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">August 1-15, 2024</p>
                    <p className="text-xs text-gray-600">Interview Period</p>
                  </div>
                  <div className="ml-auto">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      Open
                    </span>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">August 30, 2024</p>
                    <p className="text-xs text-gray-600">Admission Decision</p>
                  </div>
                  <div className="ml-auto">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      Open
                    </span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApplicationFormStep2;
