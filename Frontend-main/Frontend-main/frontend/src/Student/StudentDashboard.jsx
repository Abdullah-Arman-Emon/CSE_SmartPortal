import { useState } from "react";

import React from "react";

import Dashboard from "./DashBoard";
import SettingsPage from "./Settings";
import Enroll from "./Enroll";
import MyCourses from "./MyCourses";
import StudentCGPA from "./StudentCGPA";
import Finance from "./Finance";
import ResourceHub from "./ResourceHub";
import StudentNotice from "./StudentNotice";
import ResourceHubTest from "./ResourceHubTest"
import StudentEventShow from "./StudentEventShow";



const StudentDashboard = () => {
  const [activePage, setActivePage] = useState("Dashboard");

  const renderPage = () => {
    switch (activePage) {
      case "Dashboard":
        return <Dashboard />;
      case "Enroll in a new course":
        return <Enroll />
      case "My courses":
        return <MyCourses />;
      case "Finance":
        return <Finance />;
      case "CGPA Calculator":
        return <StudentCGPA />;
      case "Resource Hub":
        return <ResourceHub />;
      case "Notice Board":
        return <StudentNotice />;
      case "events":
        return <StudentEventShow />;
      case "settings":
        return <SettingsPage />
      default:
        return <h1 className="text-xl">404 Not Found</h1>;
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-48 bg-slate-800 text-white p-4 space-y-4">
        <button
          className="w-full text-left hover:bg-slate-700 p-2 rounded"
          onClick={() => setActivePage("Dashboard")}
        >
          Dashboard
        </button>
        <button
          className="w-full text-left hover:bg-slate-700 p-2 rounded"
          onClick={() => setActivePage("Enroll in a new course")}
        >
          Enroll in a new course
        </button>
        <button
          className="w-full text-left hover:bg-slate-700 p-2 rounded"
          onClick={() => setActivePage("My courses")}
        >
          My courses
        </button>
        <button
          className="w-full text-left hover:bg-slate-700 p-2 rounded"
          onClick={() => setActivePage("Finance")}
        >
          Finance
        </button>
        <button
          className="w-full text-left hover:bg-slate-700 p-2 rounded"
          onClick={() => setActivePage("CGPA Calculator")}
        >
          CGPA Calculator
        </button>
        <button
          className="w-full text-left hover:bg-slate-700 p-2 rounded"
          onClick={() => setActivePage("Resource Hub")}
        >
          Resource Hub
        </button>
        <button
          className="w-full text-left hover:bg-slate-700 p-2 rounded"
          onClick={() => setActivePage("Notice Board")}
        >
          Notice Board
        </button>
        <button
          className="w-full text-left hover:bg-slate-700 p-2 rounded"
          onClick={() => setActivePage("events")}
        >
          Events
        </button>
        <button
          className="w-full text-left hover:bg-slate-700 p-2 rounded"
          onClick={() => setActivePage("settings")}
        >
          Settings
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 bg-gray-100">{renderPage()}</div>
    </div>
  );
};

export default StudentDashboard;
