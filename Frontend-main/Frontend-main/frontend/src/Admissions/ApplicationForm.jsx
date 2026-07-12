import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import PageHero from "../components/public/PageHero";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function ApplicationForm() {
    const navigate = useNavigate();
    const reduce = useReducedMotion();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    // Combined form state for all steps
    const [formData, setFormData] = useState({
        // Step 1: Personal Information
        firstName: "",
        lastName: "",
        email: "",
        dateOfBirth: "",
        program: "",

        // Step 2: Academic Information
        highestQualification: "",
        institutionName: "",
        fieldOfStudy: "",
        graduationDate: "",
        gradeGPA: "",

        // Step 3: Documents Submission
        transcript: null,
        recommendationLetter: null,
        personalStatement: "",
        resume: null,

        // Step 4: Review & Submit
        termsAccepted: false,
        privacyAccepted: false,
    });

    // Load saved data if available
    useEffect(() => {
        const savedData = localStorage.getItem("applicationFormData");
        if (savedData) {
            setFormData(JSON.parse(savedData));
        }
    }, []);

    // Handle input change
    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        setFormData((prevState) => ({
            ...prevState,
            [name]:
                type === "checkbox"
                    ? checked
                    : type === "file"
                    ? files[0]
                    : value,
        }));
    };

    // Save form data to localStorage
    const saveFormData = () => {
        localStorage.setItem("applicationFormData", JSON.stringify(formData));
    };

    // Handle next step
    const handleNext = () => {
        saveFormData();
        setCurrentStep((prev) => Math.min(prev + 1, 4));
    };

    // Handle previous step
    const handlePrevious = () => {
        saveFormData();
        setCurrentStep((prev) => Math.max(prev - 1, 1));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        setIsSubmitting(true);
        setSubmitError("");

        try {
            // Upload files first if they exist
            let transcriptUrl = null;
            let recommendationLetterUrl = null;
            let resumeUrl = null;

            if (formData.transcript) {
                const transcriptFormData = new FormData();
                transcriptFormData.append("file", formData.transcript);
                const transcriptResponse = await axios.post(
                    `${BACKEND_URL}/utility/upload`,
                    transcriptFormData
                );
                transcriptUrl = transcriptResponse.data.url;
            }

            if (formData.recommendationLetter) {
                const recFormData = new FormData();
                recFormData.append("file", formData.recommendationLetter);
                const recResponse = await axios.post(
                    `${BACKEND_URL}/utility/upload`,
                    recFormData
                );
                recommendationLetterUrl = recResponse.data.url;
            }

            if (formData.resume) {
                const resumeFormData = new FormData();
                resumeFormData.append("file", formData.resume);
                const resumeResponse = await axios.post(
                    `${BACKEND_URL}/utility/upload`,
                    resumeFormData
                );
                resumeUrl = resumeResponse.data.url;
            }

            // Prepare application data for backend
            const applicationData = {
                first_name: formData.firstName,
                last_name: formData.lastName,
                email: formData.email,
                date_of_birth: new Date(formData.dateOfBirth).toISOString(),
                program: formData.program,
                profile_image: null, // Optional profile image

                highest_qualification: formData.highestQualification,
                institution_name: formData.institutionName,
                field_of_study: formData.fieldOfStudy,
                graduation_date: new Date(
                    formData.graduationDate
                ).toISOString(),
                grade_gpa: formData.gradeGPA,

                required_doc: null, // Additional required document if needed
                transcript: transcriptUrl,
                recommendation_letter: recommendationLetterUrl,
                personal_essay: formData.personalStatement,
            };

            // Send application data to backend
            const response = await axios.post(
                `${BACKEND_URL}/guest/admission/create`,
                applicationData
            );

            console.log("Application submitted successfully:", response.data);

            // Clear localStorage after successful submission
            localStorage.removeItem("applicationFormData");

            // Navigate to success page
            navigate("/application-submitted");
        } catch (error) {
            console.error("Submission failed:", error);
            setSubmitError(
                error.response?.data?.detail ||
                    "Failed to submit application. Please try again."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    // Educational qualifications options
    const qualificationOptions = [
        "High School Diploma",
        "Associate's Degree",
        "Bachelor's Degree",
        "Master's Degree",
        "Doctorate",
        "Professional Certification",
    ];

    // Program options
    const programOptions = [
        { value: "1", label: "Bachelor of Science in Computer Science" },
        {
            value: "2",
            label: "Masters of Science in Computer Science and Engineering",
        },
        { value: "3", label: "Doctor of Philosophy in Physics" },
        { value: "4", label: "Bachelor of Arts in History" },
        { value: "5", label: "Master of Science in Biology" },
        { value: "6", label: "Doctor of Education in Leadership" },
    ];

    // Render step content
    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6">
                        {/* <Navbar /> */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    First Name
                                </label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Last Name
                                </label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Date of Birth
                                </label>
                                <input
                                    type="date"
                                    name="dateOfBirth"
                                    value={formData.dateOfBirth}
                                    onChange={handleChange}
                                    required
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Program
                            </label>
                            <select
                                name="program"
                                value={formData.program}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                            >
                                <option value="">Select a program</option>
                                {programOptions.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6">
                        <div className="mb-6 flex justify-center">
                            <div className="w-48 h-48 bg-orange-50 rounded-full flex items-center justify-center">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-24 w-24 text-orange-900"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path d="M12 14l9-5-9-5-9 5 9 5z" />
                                    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
                                    />
                                </svg>
                            </div>
                        </div>

                        <h2 className="text-xl font-bold text-gray-800 mb-2">
                            Academic History
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Please provide details of your previous academic
                            qualifications.
                        </p>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Highest Qualification
                                </label>
                                <select
                                    name="highestQualification"
                                    value={formData.highestQualification}
                                    onChange={handleChange}
                                    required
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                                >
                                    <option value="">Select</option>
                                    {qualificationOptions.map(
                                        (option, index) => (
                                            <option key={index} value={option}>
                                                {option}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Institution Name
                                    </label>
                                    <input
                                        type="text"
                                        name="institutionName"
                                        value={formData.institutionName}
                                        onChange={handleChange}
                                        required
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Field of Study
                                    </label>
                                    <input
                                        type="text"
                                        name="fieldOfStudy"
                                        value={formData.fieldOfStudy}
                                        onChange={handleChange}
                                        required
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Graduation Date
                                    </label>
                                    <input
                                        type="date"
                                        name="graduationDate"
                                        value={formData.graduationDate}
                                        onChange={handleChange}
                                        required
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Grade/GPA
                                    </label>
                                    <input
                                        type="text"
                                        name="gradeGPA"
                                        value={formData.gradeGPA}
                                        onChange={handleChange}
                                        required
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                                        placeholder="e.g., 3.8/4.0 or A-"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-6">
                        <div className="mb-6 flex justify-center">
                            <div className="w-48 h-48 bg-blue-50 rounded-full flex items-center justify-center">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-24 w-24 text-blue-900"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                            </div>
                        </div>

                        <h2 className="text-xl font-bold text-gray-800 mb-2">
                            Document Submission
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Please upload the required documents for your
                            application.
                        </p>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Academic Transcript
                                </label>
                                <input
                                    type="file"
                                    name="transcript"
                                    onChange={handleChange}
                                    accept=".pdf,.doc,.docx"
                                    required
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                                />
                                <p className="mt-1 text-sm text-gray-500">
                                    PDF, DOC, or DOCX files only (max 5MB)
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Recommendation Letter
                                </label>
                                <input
                                    type="file"
                                    name="recommendationLetter"
                                    onChange={handleChange}
                                    accept=".pdf,.doc,.docx"
                                    required
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                                />
                                <p className="mt-1 text-sm text-gray-500">
                                    PDF, DOC, or DOCX files only (max 5MB)
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Resume/CV
                                </label>
                                <input
                                    type="file"
                                    name="resume"
                                    onChange={handleChange}
                                    accept=".pdf,.doc,.docx"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                                />
                                <p className="mt-1 text-sm text-gray-500">
                                    PDF, DOC, or DOCX files only (max 5MB)
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Personal Statement
                                </label>
                                <textarea
                                    name="personalStatement"
                                    value={formData.personalStatement}
                                    onChange={handleChange}
                                    rows={6}
                                    required
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                                    placeholder="Please write a personal statement explaining your motivation for applying to this program..."
                                />
                                <p className="mt-1 text-sm text-gray-500">
                                    Maximum 1000 words
                                </p>
                            </div>
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="space-y-6">
                        <div className="mb-6 flex justify-center">
                            <div className="w-48 h-48 bg-green-50 rounded-full flex items-center justify-center">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-24 w-24 text-green-900"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                        </div>

                        <h2 className="text-xl font-bold text-gray-800 mb-2">
                            Review & Submit
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Please review your application details before
                            submitting.
                        </p>

                        <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800">
                                Personal Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-medium text-gray-700">
                                        Name:
                                    </span>
                                    <p className="text-gray-600">
                                        {formData.firstName} {formData.lastName}
                                    </p>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700">
                                        Email:
                                    </span>
                                    <p className="text-gray-600">
                                        {formData.email}
                                    </p>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700">
                                        Date of Birth:
                                    </span>
                                    <p className="text-gray-600">
                                        {formData.dateOfBirth}
                                    </p>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700">
                                        Program:
                                    </span>
                                    <p className="text-gray-600">
                                        {programOptions.find(
                                            (p) => p.value === formData.program
                                        )?.label || "Not selected"}
                                    </p>
                                </div>
                            </div>

                            <h3 className="text-lg font-semibold text-gray-800 mt-6">
                                Academic Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-medium text-gray-700">
                                        Highest Qualification:
                                    </span>
                                    <p className="text-gray-600">
                                        {formData.highestQualification}
                                    </p>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700">
                                        Institution:
                                    </span>
                                    <p className="text-gray-600">
                                        {formData.institutionName}
                                    </p>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700">
                                        Field of Study:
                                    </span>
                                    <p className="text-gray-600">
                                        {formData.fieldOfStudy}
                                    </p>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700">
                                        Grade/GPA:
                                    </span>
                                    <p className="text-gray-600">
                                        {formData.gradeGPA}
                                    </p>
                                </div>
                            </div>

                            <h3 className="text-lg font-semibold text-gray-800 mt-6">
                                Documents
                            </h3>
                            <div className="text-sm">
                                <div className="flex items-center space-x-2">
                                    <span className="font-medium text-gray-700">
                                        Transcript:
                                    </span>
                                    <span
                                        className={
                                            formData.transcript
                                                ? "text-green-600"
                                                : "text-red-600"
                                        }
                                    >
                                        {formData.transcript
                                            ? "✓ Uploaded"
                                            : "✗ Not uploaded"}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="font-medium text-gray-700">
                                        Recommendation Letter:
                                    </span>
                                    <span
                                        className={
                                            formData.recommendationLetter
                                                ? "text-green-600"
                                                : "text-red-600"
                                        }
                                    >
                                        {formData.recommendationLetter
                                            ? "✓ Uploaded"
                                            : "✗ Not uploaded"}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="font-medium text-gray-700">
                                        Resume:
                                    </span>
                                    <span
                                        className={
                                            formData.resume
                                                ? "text-green-600"
                                                : "text-gray-600"
                                        }
                                    >
                                        {formData.resume
                                            ? "✓ Uploaded"
                                            : "Optional"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start">
                                <input
                                    type="checkbox"
                                    name="termsAccepted"
                                    checked={formData.termsAccepted}
                                    onChange={handleChange}
                                    required
                                    className="mt-1 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                />
                                <label className="ml-2 text-sm text-gray-700">
                                    I agree to the{" "}
                                    <a
                                        href="https://drive.google.com/file/d/18dplzMW7aOFv_pIXtkqrm_Y0Qf422-G8/view?usp=drive_link"
                                        className="text-orange-600 hover:text-orange-500"
                                    >
                                        Terms and Conditions
                                    </a>
                                </label>
                            </div>
                            <div className="flex items-start">
                                <input
                                    type="checkbox"
                                    name="privacyAccepted"
                                    checked={formData.privacyAccepted}
                                    onChange={handleChange}
                                    required
                                    className="mt-1 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                />
                                <label className="ml-2 text-sm text-gray-700">
                                    I agree to the{" "}
                                    <a
                                        href="https://drive.google.com/file/d/1i_X2oL76iG9E-nDElxD-hnXsBkYkh3IT/view?usp=drive_link"
                                        className="text-orange-600 hover:text-orange-500"
                                    >
                                        Privacy Policy
                                    </a>
                                </label>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    // Get step titles
    const getStepTitle = () => {
        switch (currentStep) {
            case 1:
                return "Personal Information";
            case 2:
                return "Academic Information";
            case 3:
                return "Documents Submission";
            case 4:
                return "Review & Submit";
            default:
                return "";
        }
    };

    const STEP_LABELS = [
        "Personal Information",
        "Academic Information",
        "Documents",
        "Review & Submit",
    ];

    return (
        <div className="min-h-screen bg-slate-50">
            <PageHero
                eyebrow="Admissions"
                title="New Application"
                sub="Your progress is saved automatically — you can leave and pick up where you stopped."
                crumbs={[{ label: "Admission Hub", href: "/admission-hub" }, { label: "Apply" }]}
            />

            <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
                {/* Animated stepper */}
                <ol className="mb-10 flex items-center">
                    {STEP_LABELS.map((label, i) => {
                        const step = i + 1;
                        const done = currentStep > step;
                        const active = currentStep === step;
                        return (
                            <li key={label} className={`flex items-center ${i > 0 ? "flex-1" : ""}`}>
                                {i > 0 && (
                                    <div className="relative mx-2 h-0.5 flex-1 rounded bg-slate-200 sm:mx-3">
                                        <motion.div
                                            className="absolute inset-y-0 left-0 rounded bg-gradient-to-r from-brand-500 to-accent-500"
                                            initial={false}
                                            animate={{ width: currentStep > i ? "100%" : "0%" }}
                                            transition={{ duration: reduce ? 0 : 0.4, ease: "easeOut" }}
                                        />
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(step)}
                                    className="group flex flex-col items-center gap-1.5"
                                    aria-current={active ? "step" : undefined}
                                >
                                    <motion.span
                                        initial={false}
                                        animate={{ scale: active && !reduce ? 1.1 : 1 }}
                                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                                            done
                                                ? "bg-gradient-to-br from-brand-500 to-accent-500 text-white"
                                                : active
                                                ? "bg-slate-900 text-white ring-4 ring-slate-900/10"
                                                : "border border-slate-300 bg-white text-slate-400 group-hover:border-slate-400"
                                        }`}
                                    >
                                        {done ? <Check className="h-4 w-4" /> : step}
                                    </motion.span>
                                    <span
                                        className={`hidden whitespace-nowrap text-[11px] font-medium sm:block ${
                                            active ? "text-slate-900" : "text-slate-400"
                                        }`}
                                    >
                                        {label}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ol>

                {/* Form card with step transitions */}
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
                    <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
                        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-600">
                            Step {currentStep} of 4
                        </p>
                        <h2 className="font-display mt-1 text-xl font-bold text-slate-900">
                            {getStepTitle()}
                        </h2>
                    </div>

                    <form
                        onSubmit={
                            currentStep === 4
                                ? handleSubmit
                                : (e) => {
                                      e.preventDefault();
                                      handleNext();
                                  }
                        }
                        className="p-6 sm:p-8"
                    >
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                                key={currentStep}
                                initial={reduce ? false : { opacity: 0, x: 24 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={reduce ? undefined : { opacity: 0, x: -24 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                            >
                                {renderStepContent()}
                            </motion.div>
                        </AnimatePresence>

                        {/* Navigation Buttons */}
                        <div className="mt-8 flex flex-col justify-between gap-4 border-t border-slate-100 pt-6 sm:flex-row">
                            <button
                                type="button"
                                onClick={handlePrevious}
                                disabled={currentStep === 1}
                                className={`inline-flex items-center justify-center rounded-full px-6 py-3 text-base font-medium ${
                                    currentStep === 1
                                        ? "cursor-not-allowed bg-slate-100 text-slate-400"
                                        : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                                }`}
                            >
                                Previous
                            </button>

                            {currentStep === 4 ? (
                                <div className="flex flex-col items-center space-y-2 sm:items-end">
                                    {submitError && (
                                        <motion.div
                                            initial={reduce ? false : { x: 0 }}
                                            animate={reduce ? undefined : { x: [0, -6, 6, -4, 4, 0] }}
                                            transition={{ duration: 0.4 }}
                                            className="w-full rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600"
                                        >
                                            {submitError}
                                        </motion.div>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={
                                            !formData.termsAccepted ||
                                            !formData.privacyAccepted ||
                                            isSubmitting
                                        }
                                        className={`inline-flex w-full items-center justify-center rounded-full px-7 py-3 text-base font-semibold shadow-lg sm:w-auto ${
                                            !formData.termsAccepted ||
                                            !formData.privacyAccepted ||
                                            isSubmitting
                                                ? "cursor-not-allowed bg-slate-200 text-slate-400 shadow-none"
                                                : "bg-amber-500 text-slate-900 shadow-amber-500/25 hover:bg-amber-400"
                                        }`}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <svg
                                                    className="-ml-1 mr-3 h-5 w-5 animate-spin"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <circle
                                                        className="opacity-25"
                                                        cx="12"
                                                        cy="12"
                                                        r="10"
                                                        stroke="currentColor"
                                                        strokeWidth="4"
                                                    ></circle>
                                                    <path
                                                        className="opacity-75"
                                                        fill="currentColor"
                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                    ></path>
                                                </svg>
                                                Submitting...
                                            </>
                                        ) : (
                                            "Submit Application"
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="submit"
                                    className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-7 py-3 text-base font-semibold text-white hover:bg-slate-800 sm:w-auto"
                                >
                                    Next
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default ApplicationForm;
