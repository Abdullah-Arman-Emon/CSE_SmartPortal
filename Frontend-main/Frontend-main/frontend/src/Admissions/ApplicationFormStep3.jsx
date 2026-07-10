import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function ApplicationFormStep3() {
  const navigate = useNavigate();
  
  // Form state for step 3
  const [formData, setFormData] = useState({
    requiredDocs: null,
    transcripts: null,
    recommendationLetters: null,
    personalEssay: null
  });

  const [uploadStatus, setUploadStatus] = useState({
    requiredDocs: false,
    transcripts: false,
    recommendationLetters: false,
    personalEssay: false
  });

  // Load previous step data and any saved upload status
  useEffect(() => {
    // Check for step 2 completion
    const step2Data = localStorage.getItem('applicationFormStep2');
    if (!step2Data) {
      // If step 2 data doesn't exist, redirect back to step 2
      navigate('/apply/step2');
      return;
    }

    // Load any previously saved upload status
    const savedUploadStatus = localStorage.getItem('applicationFormStep3');
    if (savedUploadStatus) {
      try {
        const parsedStatus = JSON.parse(savedUploadStatus);
        setUploadStatus(parsedStatus);
      } catch (error) {
        console.error("Error parsing saved upload status:", error);
      }
    }
  }, [navigate]);

  // Handle file uploads
  const handleFileChange = (e, documentType) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prevState => ({
        ...prevState,
        [documentType]: file
      }));
      
      // Simulate upload
      setTimeout(() => {
        setUploadStatus(prevStatus => {
          const newStatus = {
            ...prevStatus,
            [documentType]: true
          };
          // Save to localStorage whenever upload status changes
          localStorage.setItem('applicationFormStep3', JSON.stringify(newStatus));
          return newStatus;
        });
      }, 1000);
    }
  };

  // Check if all required uploads are done
  const isFormComplete = () => {
    return Object.values(uploadStatus).every(status => status === true);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    
    // Validate if all uploads are complete
    if (!isFormComplete()) {
      alert("Please upload all required documents before proceeding.");
      return;
    }
    
    // Save upload status to localStorage
    localStorage.setItem('applicationFormStep3', JSON.stringify(uploadStatus));
    
    // Navigate to step 4
    navigate('/apply/step4');
  };

  // Handle back button
  const handleBack = () => {
    // Save current progress before going back
    localStorage.setItem('applicationFormStep3', JSON.stringify(uploadStatus));
    navigate('/apply/step2');
  };

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
              <div style={{ width: "75%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-orange-500"></div>
            </div>
            <div className="flex text-xs text-gray-600 mt-1">
              <span className="flex-1 text-center">Step 1 of 4</span>
              <span className="flex-1 text-center">Step 2 of 4</span>
              <span className="flex-1 text-center font-semibold text-orange-500">Step 3 of 4</span>
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
            <Link
              to="/apply/step2"
              className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm"
            >
              Academic Information
            </Link>
            <span
              className="border-orange-500 text-orange-600 whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm"
            >
              Documents Submission
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
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Required Documents */}
              <div className="flex bg-white rounded-lg shadow-md p-6">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Required Documents</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Please upload the following documents to complete your application. Ensure all documents are clear and legible.
                  </p>
                  <label className="inline-block px-4 py-2 bg-orange-50 text-orange-700 rounded-md cursor-pointer hover:bg-orange-100">
                    Upload
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={(e) => handleFileChange(e, 'requiredDocs')} 
                    />
                  </label>
                  {uploadStatus.requiredDocs && (
                    <span className="ml-3 text-green-600 text-sm">✓ Uploaded successfully</span>
                  )}
                </div>
                <div className="ml-4 flex-shrink-0">
                  <div className="h-24 w-32 bg-orange-50 rounded-lg flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-orange-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Transcripts */}
              <div className="flex bg-white rounded-lg shadow-md p-6">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Transcripts</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Official transcripts from all previous educational institutions.
                  </p>
                  <label className="inline-block px-4 py-2 bg-orange-50 text-orange-700 rounded-md cursor-pointer hover:bg-orange-100">
                    Upload
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={(e) => handleFileChange(e, 'transcripts')} 
                    />
                  </label>
                  {uploadStatus.transcripts && (
                    <span className="ml-3 text-green-600 text-sm">✓ Uploaded successfully</span>
                  )}
                </div>
                <div className="ml-4 flex-shrink-0">
                  <div className="h-24 w-32 bg-orange-50 rounded-lg flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-orange-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Letters of Recommendation */}
              <div className="flex bg-white rounded-lg shadow-md p-6">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Letters of Recommendation</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Two letters of recommendation from academic or professional references.
                  </p>
                  <label className="inline-block px-4 py-2 bg-orange-50 text-orange-700 rounded-md cursor-pointer hover:bg-orange-100">
                    Upload
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={(e) => handleFileChange(e, 'recommendationLetters')} 
                    />
                  </label>
                  {uploadStatus.recommendationLetters && (
                    <span className="ml-3 text-green-600 text-sm">✓ Uploaded successfully</span>
                  )}
                </div>
                <div className="ml-4 flex-shrink-0">
                  <div className="h-24 w-32 bg-orange-50 rounded-lg flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-orange-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Personal Essay */}
              <div className="flex bg-white rounded-lg shadow-md p-6">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Personal Essay</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    A personal essay outlining your academic and career goals.
                  </p>
                  <label className="inline-block px-4 py-2 bg-orange-50 text-orange-700 rounded-md cursor-pointer hover:bg-orange-100">
                    Upload
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={(e) => handleFileChange(e, 'personalEssay')} 
                    />
                  </label>
                  {uploadStatus.personalEssay && (
                    <span className="ml-3 text-green-600 text-sm">✓ Uploaded successfully</span>
                  )}
                </div>
                <div className="ml-4 flex-shrink-0">
                  <div className="h-24 w-32 bg-orange-50 rounded-lg flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-orange-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4">
                <button 
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Back
                </button>
                <button 
                  type="submit"
                  className={`px-6 py-2 ${isFormComplete() ? 'bg-orange-500 hover:bg-orange-600' : 'bg-orange-300 cursor-not-allowed'} text-white rounded-md`}
                  disabled={!isFormComplete()}
                >
                  Next
                </button>
              </div>
            </form>
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
                    <p className="text-sm font-medium text-gray-900">August 1, 2024</p>
                    <p className="text-xs text-gray-600">Interview Scheduling</p>
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
                    <p className="text-sm font-medium text-gray-900">August 15, 2024</p>
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

export default ApplicationFormStep3;
