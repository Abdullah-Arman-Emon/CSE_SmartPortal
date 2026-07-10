import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function ApplicationFormStep4() {
  const navigate = useNavigate();
  
  const [step1Data, setStep1Data] = useState({});
  const [step2Data, setStep2Data] = useState({});
  const [step3Data, setStep3Data] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState(null);

  // Load all previous step data
  useEffect(() => {
    try {
      // Get data from localStorage
      const step1 = JSON.parse(localStorage.getItem('applicationFormStep1') || '{}');
      const step2 = JSON.parse(localStorage.getItem('applicationFormStep2') || '{}');
      const step3 = JSON.parse(localStorage.getItem('applicationFormStep3') || '{}');
      
      // Update state with data
      setStep1Data(step1);
      setStep2Data(step2);
      setStep3Data(step3);
      
      // Check if all required steps are completed
      if (!step1.firstName || !step1.lastName || !step1.email || !step1.program) {
        setValidationError("Personal information is incomplete. Please go back and complete step 1.");
        setTimeout(() => navigate('/apply'), 2000);
        return;
      }
      
      if (!step2.institutionName || !step2.fieldOfStudy) {
        setValidationError("Academic information is incomplete. Please go back and complete step 2.");
        setTimeout(() => navigate('/apply/step2'), 2000);
        return;
      }
      
      // Check if all documents are uploaded in step 3
      if (!step3 || !Object.values(step3).every(status => status === true)) {
        setValidationError("Document uploads are incomplete. Please go back and complete step 3.");
        setTimeout(() => navigate('/apply/step3'), 2000);
        return;
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading application data:", error);
      setValidationError("There was an error loading your application data. Please start over.");
      setTimeout(() => navigate('/apply'), 2000);
    }
  }, [navigate]);

  // Handle back button
  const handleBack = () => {
    navigate('/apply/step3');
  };

  // Handle form submission
  const handleSubmit = () => {
    setIsSubmitting(true);
    
    // Simulate API call to submit application
    setTimeout(() => {
      try {
        // Clear application data from localStorage
        localStorage.removeItem('applicationFormStep1');
        localStorage.removeItem('applicationFormStep2');
        localStorage.removeItem('applicationFormStep3');
        
        // Redirect to confirmation page
        navigate('/application-submitted');
      } catch (error) {
        console.error("Error submitting application:", error);
        setIsSubmitting(false);
        alert("There was an error submitting your application. Please try again.");
      }
    }, 2000);
  };

  // Get program title
  const getProgramTitle = (programId) => {
    const programs = {
      1: "Bachelor of Science in Computer Science",
      2: "Masters of Science in Computer Science and Engineering",
      3: "Doctor of Philosophy in Physics",
      4: "Bachelor of Arts in History",
      5: "Master of Science in Biology",
      6: "Doctor of Education in Leadership"
    };
    
    return programs[programId] || "Unknown Program";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mb-4"></div>
        {validationError && (
          <div className="text-red-600 text-center max-w-md">
            {validationError}
          </div>
        )}
      </div>
    );
  }

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
              <Link to="/admissions" className="flex items-center text-gray-600 py-2 hover:text-blue-600">
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
          <Link to="/" className="hover:text-gray-700">Admissions Wizard</Link>
          <span className="mx-2">/</span>
          <span>Review and Submit</span>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Step 4 of 4: Review and Submit</h1>
        
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="relative">
            <div className="overflow-hidden h-2 mb-2 text-xs flex rounded bg-gray-200">
              <div style={{ width: "100%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-orange-500"></div>
            </div>
            <div className="flex text-xs text-gray-600 mt-1">
              <span className="flex-1 text-center">Step 1 of 4</span>
              <span className="flex-1 text-center">Step 2 of 4</span>
              <span className="flex-1 text-center">Step 3 of 4</span>
              <span className="flex-1 text-center font-semibold text-orange-500">Step 4 of 4</span>
            </div>
          </div>
        </div>
        
        {/* Form Content */}
        <div className="flex">
          {/* Form Area */}
          <div className="flex-1 mr-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-6">
                <div className="mr-6">
                  <img 
                    src="/images/review-illustration.png" 
                    alt="Person reviewing application" 
                    className="w-48 h-auto"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/200x250?text=Review+Application";
                    }}
                  />
                </div>
                
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">Review Your Application</h2>
                  <p className="text-gray-600">
                    Please review all the information you've provided. Once you're satisfied, click 'Submit' to finalize your application.
                  </p>
                </div>
              </div>
              
              {/* Application Summary */}
              <div className="space-y-6">
                {/* Personal Information */}
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold mb-3">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Full Name</p>
                      <p className="font-medium">{step1Data.firstName} {step1Data.lastName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{step1Data.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date of Birth</p>
                      <p className="font-medium">{step1Data.dateOfBirth}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Program</p>
                      <p className="font-medium">{getProgramTitle(step1Data.program)}</p>
                    </div>
                  </div>
                </div>
                
                {/* Academic Information */}
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold mb-3">Academic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Highest Qualification</p>
                      <p className="font-medium">{step2Data.highestQualification}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Institution Name</p>
                      <p className="font-medium">{step2Data.institutionName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Field of Study</p>
                      <p className="font-medium">{step2Data.fieldOfStudy}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Graduation Date</p>
                      <p className="font-medium">{step2Data.graduationDate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Grade/GPA</p>
                      <p className="font-medium">{step2Data.gradeGPA}</p>
                    </div>
                  </div>
                </div>
                
                {/* Documents */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Uploaded Documents</h3>
                  <ul className="space-y-2">
                    {Object.entries(step3Data).map(([docType, isUploaded]) => (
                      <li key={docType} className="flex items-center">
                        <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span>{docType === 'requiredDocs' ? 'Required Documents' : 
                               docType === 'transcripts' ? 'Transcripts' :
                               docType === 'recommendationLetters' ? 'Letters of Recommendation' :
                               docType === 'personalEssay' ? 'Personal Essay' : docType}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {/* Navigation Buttons */}
              <div className="flex mt-8">
                <button 
                  onClick={handleBack}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  disabled={isSubmitting}
                >
                  Back
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="ml-auto px-6 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </span>
                  ) : "Submit Application"}
                </button>
              </div>
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

export default ApplicationFormStep4;
