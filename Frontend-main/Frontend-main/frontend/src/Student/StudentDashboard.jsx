import { useState } from "react";
import React from "react";
import {
  Home, PlusCircle, BookOpen, DollarSign, FileText, Calculator,
  MessageSquare, FolderOpen, Bell, CalendarDays, Settings as SettingsIcon,
  Menu, X, GraduationCap,
} from "lucide-react";
import BottomNav from "../components/ui/BottomNav";

import Dashboard from "./DashBoard";
import SettingsPage from "./Settings";
import Enroll from "./Enroll";
import MyCourses from "./MyCourses";
import StudentCGPA from "./StudentCGPA";
import StudentResults from "./StudentResults";
import Messenger from "../components/Messenger";
import Finance from "./Finance";
import ResourceHub from "./ResourceHub";
import StudentNotice from "./StudentNotice";
import StudentEventShow from "./StudentEventShow";

// (id, label, icon) — id matches the render switch below
const NAV = [
  ["Dashboard", "Dashboard", Home],
  ["Enroll in a new course", "Enroll", PlusCircle],
  ["My courses", "My Courses", BookOpen],
  ["Finance", "Finance", DollarSign],
  ["Results", "Results", FileText],
  ["CGPA Calculator", "CGPA Calculator", Calculator],
  ["Messages", "Messages", MessageSquare],
  ["Resource Hub", "Resource Hub", FolderOpen],
  ["Notice Board", "Notice Board", Bell],
  ["events", "Events", CalendarDays],
  ["settings", "Settings", SettingsIcon],
];

const StudentDashboard = () => {
  const [activePage, setActivePage] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderPage = () => {
    switch (activePage) {
      case "Dashboard": return <Dashboard />;
      case "Enroll in a new course": return <Enroll />;
      case "My courses": return <MyCourses />;
      case "Finance": return <Finance />;
      case "Results": return <StudentResults />;
      case "CGPA Calculator": return <StudentCGPA />;
      case "Messages": return <Messenger />;
      case "Resource Hub": return <ResourceHub />;
      case "Notice Board": return <StudentNotice />;
      case "events": return <StudentEventShow />;
      case "settings": return <SettingsPage />;
      default: return <h1 className="text-xl">404 Not Found</h1>;
    }
  };

  const go = (id) => {
    setActivePage(id);
    setSidebarOpen(false);
  };

  const activeLabel = NAV.find((n) => n[0] === activePage)?.[1] || "Dashboard";

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-gray-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — slide-in drawer on mobile, static on desktop */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-800 text-white flex flex-col shrink-0
          transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
          transition-transform duration-300 ease-in-out`}
      >
        <div className="flex items-center justify-between px-4 h-16 border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-2 font-semibold">
            <GraduationCap size={20} className="text-orange-400" />
            <span>Student Panel</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-white"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {NAV.map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => go(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${
                activePage === id
                  ? "bg-orange-500 text-white font-medium"
                  : "text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <Icon size={18} className="shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 h-14 px-4 bg-white border-b border-gray-200 shrink-0 sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg text-slate-700 hover:bg-slate-100"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <span className="font-semibold text-gray-900 truncate">{activeLabel}</span>
        </header>

        {/* pb-20 on mobile keeps content clear of the fixed bottom nav */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 md:pb-6">{renderPage()}</main>
      </div>

      {/* Android-style bottom nav (mobile only) */}
      <BottomNav
        onMore={() => setSidebarOpen(true)}
        moreActive={sidebarOpen}
        items={[
          { key: "Dashboard", label: "Home", Icon: Home, active: activePage === "Dashboard", onClick: () => go("Dashboard") },
          { key: "My courses", label: "Courses", Icon: BookOpen, active: activePage === "My courses", onClick: () => go("My courses") },
          { key: "Results", label: "Results", Icon: FileText, active: activePage === "Results", onClick: () => go("Results") },
          { key: "Messages", label: "Messages", Icon: MessageSquare, active: activePage === "Messages", onClick: () => go("Messages") },
        ]}
      />
    </div>
  );
};

export default StudentDashboard;
