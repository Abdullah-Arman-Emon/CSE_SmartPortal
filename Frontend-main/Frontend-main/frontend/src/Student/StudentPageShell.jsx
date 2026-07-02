import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

// Thin wrapper so panel components (ChatPanel, StudentResults, StudentCGPA)
// can live on their own routes with a consistent header + back link.
function StudentPageShell({ children }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-white shadow-sm sticky top-0 z-10 px-4 sm:px-6 py-3">
        <Link
          to="/student-dashboard"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="font-medium">Back to Dashboard</span>
        </Link>
      </div>
      <div className="max-w-6xl mx-auto p-4 sm:p-6">{children}</div>
    </div>
  );
}

export default StudentPageShell;
