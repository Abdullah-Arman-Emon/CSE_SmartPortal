import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const Navbar = () => {
  // Check if user is logged in
  const { user, setUser ,setToken} = useContext(AuthContext);
  const isLoggedIn = user?.isAuthenticated || false;

  // Add state for mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const handleDashboardRedirect = () => {
    if (user.role === 'student') {
      window.location.href = '/student-dashboard';
    } else if (user.role === 'teacher') {
      window.location.href = '/teacher-dashboard';
    } else if (user.role === 'admin') {
      window.location.href = '/admin-dashboard';
    }
  };

  const handleLogout = () => {
    // console.log("Before logout:", localStorage.getItem("token"));
    // Clear token from storage
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");

    // console.log("After logout:", localStorage.getItem("token"));

    // Reset context
    setToken(null);
    setUser(null);

    // Redirect
    // window.location.href = "/";
  };

  return (
    <nav className="bg-slate-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between">
          <div className="flex space-x-7">
            <div>
              <Link to="/" className="flex items-center py-4">
                <span className="font-semibold text-lg">CSEDU - Dhaka University</span>
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-1">
              <Link to="/people" className="py-4 px-2 hover:text-slate-300 transition duration-300">People Directory</Link>
              <Link to="/chairman" className="py-4 px-2 hover:text-slate-300 transition duration-300">About</Link>
              <Link to="/admission-hub" className="py-4 px-2 hover:text-slate-300 transition duration-300">Admission Hub</Link>
              <Link to="/apply" className="py-4 px-2 hover:text-slate-300 transition duration-300">Apply Now</Link>
              <Link to="/notice-board" className="py-4 px-2 hover:text-slate-300 transition duration-300">Notice Board</Link>
              <Link to="/meetings" className="py-4 px-2 hover:text-slate-300 transition duration-300">Departmental Meetings</Link>
            </div>
          </div>
          
          {/* Desktop auth buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {isLoggedIn ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm">{user.fullname}</span>
                <button 
                  onClick={handleDashboardRedirect}
                  className="py-2 px-3 bg-slate-600 hover:bg-slate-700 text-white rounded transition duration-300"
                >
                  Dashboard
                </button>
                <button 
                  onClick={handleLogout}
                  className="py-2 px-3 bg-red-600 hover:bg-red-500 text-white rounded transition duration-300"
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="py-2 px-3 bg-slate-600 hover:bg-slate-700 text-white rounded transition duration-300">Login</Link>
                <Link to="/signup" className="py-2 px-3 bg-gray-600 hover:bg-gray-700 text-white rounded transition duration-300">Sign Up</Link>
              </>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              type="button" 
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {!isMobileMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu, show/hide based on menu state */}
      <div 
        className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden`} 
        id="mobile-menu"
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-slate-700">
          <Link 
            to="/people" 
            className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-slate-700"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            People Directory
          </Link>
          <Link 
            to="/chairman" 
            className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-slate-700"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            About Chairman
          </Link>
          <Link 
            to="/admission-hub" 
            className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-slate-700"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Admission Hub
          </Link>
          <Link 
            to="/apply" 
            className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-slate-700"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Apply Now
          </Link>
          <Link 
            to="/notice-board" 
            className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-slate-700 flex items-center justify-between"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Notices
          </Link>
          <Link 
            to="/meetings" 
            className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-slate-700"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Departmental Meetings
          </Link>
        </div>
        
        {/* Mobile auth section */}
        <div className="pt-4 pb-3 border-t border-slate-700">
          {isLoggedIn ? (
            <div className="flex flex-col px-5 space-y-3">
              <div className="flex items-center px-2">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-slate-600 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">{user.fullname?.charAt(0) || 'U'}</span>
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-white">{user.fullname}</div>
                  <div className="text-sm font-medium text-slate-400">{user.email}</div>
                </div>
              </div>
              <button 
                onClick={() => {
                  handleDashboardRedirect();
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white bg-slate-600 hover:bg-slate-700"
              >
                Dashboard
              </button>
              <button 
                onClick={handleLogout}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex flex-col px-5 space-y-3">
              <Link 
                to="/login" 
                className="block w-full text-center px-3 py-2 rounded-md text-base font-medium text-white bg-slate-600 hover:bg-slate-700"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link 
                to="/signup" 
                className="block w-full text-center px-3 py-2 rounded-md text-base font-medium text-white bg-gray-600 hover:bg-gray-700"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
