import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, FileText, User, Calendar, Award, ExternalLink, Download, AlertTriangle } from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function SubmissionList() {
  const { assignmentId } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [assignment, setAssignment] = useState({});
  const [loading, setLoading] = useState(true);
  const [marksMap, setMarksMap] = useState({});
  const [courseId, setCourseId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        // First, get the assignment details to find the course_id
        const assignmentRes = await axios.get(
          `${BACKEND_URL}/v1/teacher/courses/assignments/get/${assignmentId}`
        );

        if (assignmentRes.data) {
          setAssignment(assignmentRes.data);
          setCourseId(assignmentRes.data.course_id);
        }

        // Then fetch the submissions
        const submissionsRes = await axios.get(
          `${BACKEND_URL}/v1/teacher/courses/submissions/by-assignment/${assignmentId}`
        );
        setSubmissions(submissionsRes.data);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Failed to load data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (assignmentId) {
      fetchSubmissions();
    }
  }, [assignmentId]);

  const handleMark = async (submissionId) => {
    const marks = marksMap[submissionId];

    if (marks === undefined || marks === "") {
      alert("Please enter marks");
      return;
    }

    // Validate marks against max_marks
    if (assignment.max_marks && parseInt(marks) > assignment.max_marks) {
      alert(`Marks cannot exceed maximum marks (${assignment.max_marks})`);
      return;
    }

    try {
      await axios.post(
        `${BACKEND_URL}/v1/teacher/courses/submissions/mark`,
        null,
        {
          params: { submission_id: submissionId, marks: marks },
        }
      );

      alert("Marked successfully!");

      // Update the submission in the local state
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submissionId ? { ...s, marks: parseInt(marks), checked: true } : s
        )
      );

      // Clear the marks input
      setMarksMap((prev) => ({ ...prev, [submissionId]: "" }));
    } catch (err) {
      console.error("Failed to mark submission", err);
      alert("Failed to mark submission");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper function to determine file type icon
  const getFileIcon = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    
    if (['pdf'].includes(extension)) {
      return <FileText size={16} className="text-red-500" />;
    } else if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(extension)) {
      return <img src="/image-icon.svg" alt="Image" className="w-4 h-4" />;
    } else if (['doc', 'docx'].includes(extension)) {
      return <FileText size={16} className="text-blue-500" />;
    } else if (['xls', 'xlsx'].includes(extension)) {
      return <FileText size={16} className="text-green-500" />;
    } else if (['ppt', 'pptx'].includes(extension)) {
      return <FileText size={16} className="text-orange-500" />;
    } else if (['zip', 'rar', '7z'].includes(extension)) {
      return <Download size={16} className="text-purple-500" />;
    } else {
      return <FileText size={16} className="text-gray-500" />;
    }
  };
  
  // Extract filename from URL
  const getFilenameFromUrl = (url) => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.split('/').pop();
      // Decode to handle URL encoded characters
      return decodeURIComponent(filename);
    } catch (e) {
      // If URL parsing fails, just return the last part of the path
      const parts = url.split('/');
      return parts[parts.length - 1];
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading submissions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
          <div className="flex justify-center mb-4">
            <AlertTriangle size={48} className="text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            to={`/teacher/classroom/${courseId || ''}`}
            className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to Classroom</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              to={`/teacher/classroom/${courseId || ''}`}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="text-sm font-medium">Back to Classroom</span>
            </Link>
            <div className="h-6 border-l border-gray-300"></div>
            <h1 className="text-2xl font-bold text-gray-800">Assignment Submissions</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Assignment Info */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Assignment Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-orange-50 rounded-lg p-4">
              <h3 className="font-medium text-orange-800 mb-2 flex items-center">
                <FileText size={16} className="mr-2" />
                Assignment Information
              </h3>
              <div className="space-y-2 text-sm text-gray-700">
                <p><span className="font-medium">Title:</span> {assignment.title || 'N/A'}</p>
                <p><span className="font-medium">Type:</span> {assignment.type || 'N/A'}</p>
                {assignment.due_date && (
                  <p><span className="font-medium">Due Date:</span> {formatDate(assignment.due_date)}</p>
                )}
                <p><span className="font-medium">Max Marks:</span> {assignment.max_marks || 'N/A'}</p>
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-2 flex items-center">
                <User size={16} className="mr-2" />
                Submission Statistics
              </h3>
              <div className="space-y-2 text-sm text-gray-700">
                <p><span className="font-medium">Total Submissions:</span> {submissions.length}</p>
                <p>
                  <span className="font-medium">Checked:</span> {submissions.filter(s => s.checked).length} / {submissions.length}
                </p>
                {submissions.length > 0 && (
                  <p>
                    <span className="font-medium">Completion Rate:</span> 
                    {Math.round((submissions.filter(s => s.checked).length / submissions.length) * 100)}%
                  </p>
                )}
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-medium text-green-800 mb-2 flex items-center">
                <Award size={16} className="mr-2" />
                Grading Summary
              </h3>
              <div className="space-y-2 text-sm text-gray-700">
                {submissions.filter(s => s.checked).length > 0 ? (
                  <>
                    <p>
                      <span className="font-medium">Average Score:</span> 
                      {(submissions.filter(s => s.checked).reduce((acc, s) => acc + s.marks, 0) / 
                        submissions.filter(s => s.checked).length).toFixed(1)} 
                      {assignment.max_marks ? ` / ${assignment.max_marks}` : ''}
                    </p>
                    <p>
                      <span className="font-medium">Highest Score:</span> 
                      {Math.max(...submissions.filter(s => s.checked).map(s => s.marks))}
                      {assignment.max_marks ? ` / ${assignment.max_marks}` : ''}
                    </p>
                    <p>
                      <span className="font-medium">Lowest Score:</span> 
                      {Math.min(...submissions.filter(s => s.checked).map(s => s.marks))}
                      {assignment.max_marks ? ` / ${assignment.max_marks}` : ''}
                    </p>
                  </>
                ) : (
                  <p className="text-gray-500 italic">No grades submitted yet</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Submissions List or Resource Files List based on assignment type */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">
              {assignment.type === "Resource" ? "Resource Files" : "Submissions"}
            </h2>
          </div>

          {assignment.type === "Resource" ? (
            // Resource Files Management UI
            <div className="p-6">
              <div className="bg-blue-50 rounded-lg p-5 border border-blue-200 mb-6">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 p-2 rounded-full text-blue-700 mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="font-medium text-blue-800">
                    This is a resource assignment. Students can access these files but don't need to submit anything.
                  </span>
                </div>
                
                {/* Display Resource Files */}
                <h3 className="text-sm font-medium text-blue-700 mb-3 flex items-center">
                  <FileText size={16} className="mr-2" />
                  Resource Files:
                </h3>
                
                {assignment.file_links && Object.keys(assignment.file_links).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {Object.entries(assignment.file_links).map(([fileName, url], index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 bg-white hover:bg-blue-50 rounded-md text-sm text-gray-700 hover:text-blue-600 transition-colors border border-blue-200"
                      >
                        {getFileIcon(fileName)}
                        <span className="truncate">{fileName}</span>
                        <ExternalLink size={14} className="ml-auto flex-shrink-0 text-gray-400" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-4 bg-white rounded-lg border border-dashed border-blue-300">
                    <p className="text-gray-500">No resource files have been uploaded yet.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Homework Submissions UI (existing code)
            submissions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-4xl mb-4">📝</div>
                <p className="text-gray-600">No submissions found.</p>
                <p className="text-sm text-gray-500">Students haven't submitted yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={submission.profile_image || "https://via.placeholder.com/48"}
                          alt="Profile"
                          className="w-12 h-12 rounded-full object-cover border border-gray-200"
                        />
                        <div>
                          <p className="font-bold text-gray-800">
                            {submission.first_name} {submission.last_name}
                          </p>
                          <p className="text-sm text-gray-600">Batch: {submission.batch}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                            <Calendar size={14} />
                            <span>Submitted: {formatDate(submission.submitted_at)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:items-end gap-3">
                        {/* Status Badge */}
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center ${
                            submission.checked
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {submission.checked ? (
                            <>
                              <Award size={14} className="mr-1" />
                              Graded: {submission.marks} / {assignment.max_marks || 'N/A'}
                            </>
                          ) : (
                            <>
                              <AlertTriangle size={14} className="mr-1" />
                              Pending Review
                            </>
                          )}
                        </span>

                        {/* Marks Input */}
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max={assignment.max_marks || 100}
                              placeholder="Marks"
                              value={marksMap[submission.id] ?? submission.marks ?? ""}
                              onChange={(e) => {
                                const value = parseInt(e.target.value);
                                // Don't allow marks greater than max_marks
                                if (!isNaN(value) && (!assignment.max_marks || value <= assignment.max_marks)) {
                                  setMarksMap({ ...marksMap, [submission.id]: e.target.value });
                                } else if (e.target.value === "") {
                                  setMarksMap({ ...marksMap, [submission.id]: "" });
                                }
                              }}
                              className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                            {assignment.max_marks && (
                              <span className="absolute right-2 -bottom-5 text-xs text-gray-500">
                                / {assignment.max_marks}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleMark(submission.id)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                              submission.checked
                                ? "bg-green-500 hover:bg-green-600 text-white"
                                : "bg-orange-500 hover:bg-orange-600 text-white"
                            }`}
                          >
                            {submission.checked ? "Update" : "Mark"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Submission Files Section */}
                    {submission.file_links && (
                      <div className="mt-4 border-t border-gray-100 pt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <FileText size={16} className="mr-1.5 text-orange-500" />
                          Submitted Files
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {Array.isArray(submission.file_links) ? (
                            // If file_links is an array of URLs
                            submission.file_links.map((url, index) => (
                              <a
                                key={index}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-2 bg-gray-50 hover:bg-gray-100 rounded-md text-sm text-gray-700 hover:text-orange-600 transition-colors border border-gray-200"
                              >
                                {getFileIcon(getFilenameFromUrl(url))}
                                <span className="truncate">{getFilenameFromUrl(url)}</span>
                                <ExternalLink size={14} className="ml-auto flex-shrink-0 text-gray-400" />
                              </a>
                            ))
                          ) : typeof submission.file_links === "object" ? (
                            // If file_links is an object with filename and URL pairs
                            Object.entries(submission.file_links).map(([filename, url], index) => (
                              <a
                                key={index}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-2 bg-gray-50 hover:bg-gray-100 rounded-md text-sm text-gray-700 hover:text-orange-600 transition-colors border border-gray-200"
                              >
                                {getFileIcon(filename)}
                                <span className="truncate">{filename}</span>
                                <ExternalLink size={14} className="ml-auto flex-shrink-0 text-gray-400" />
                              </a>
                            ))
                          ) : submission.file_links.url ? (
                            // If file_links has a single url property
                            <a
                              href={submission.file_links.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-2 bg-gray-50 hover:bg-gray-100 rounded-md text-sm text-gray-700 hover:text-orange-600 transition-colors border border-gray-200"
                            >
                              <FileText size={16} className="text-orange-500" />
                              <span className="truncate">View Submission</span>
                              <ExternalLink size={14} className="ml-auto flex-shrink-0 text-gray-400" />
                            </a>
                          ) : (
                            // Fallback for any other format
                            <div className="text-sm text-gray-500 italic">
                              No viewable files found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
