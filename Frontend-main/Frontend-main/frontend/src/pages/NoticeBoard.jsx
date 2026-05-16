import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Bell, User, ChevronRight, ExternalLink, FileText, Pin } from 'lucide-react';

// Components
import Navbar from '../components/Navbar';

import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const NoticeBoard = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNotice, setSelectedNotice] = useState(null);
  
  // Get user information if logged in
  const { user } = useContext(AuthContext);
  const isLoggedIn = user?.isAuthenticated || false;
  
  // Fetch notices when component mounts

  
  // Fetch all upcoming notices using the API
  const fetchNotices = useCallback(async () => {
    setLoading(true);
    try {
      // Notices are sent to all batches, so no batch filtering needed
      const endpoint = `${BACKEND_URL}/student/notice/all`;
      
      const response = await axios.get(endpoint);
      
      // Sort notices by date and time (newest first)
      const sortedNotices = response.data.sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
      });
      
      setNotices(sortedNotices);
      
      // Set the first notice as selected if available
      if (sortedNotices.length > 0) {
        setSelectedNotice(sortedNotices[0]);
      }
    } catch (error) {
      console.error('Error fetching notices:', error);
      setError('Failed to load notices. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);
  
  // Fetch a specific notice by ID
  const fetchNoticeById = async (noticeId) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/student/notice/${noticeId}`);
      setSelectedNotice(response.data);
    } catch (error) {
      console.error(`Error fetching notice ${noticeId}:`, error);
    }
  };
  
  // Handle selecting a notice from the list
  const handleNoticeClick = (notice) => {
    // Fetch full notice details if we need to
    if (notice.id !== selectedNotice?.id) {
      fetchNoticeById(notice.id);
    }
    
    // Scroll to the top on mobile
    if (window.innerWidth < 768) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', options);
    } catch {
      return dateString;
    }
  };
  
  return (
    <>
      <Navbar />
      
      <div className="bg-gradient-to-b from-slate-50 to-slate-100 min-h-screen py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-start mb-10">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 relative inline-block">
                Notice Board
              </h1>
              
            </div>
          </div>
          
          {/* Loading, Error and Empty states */}
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-orange-500 absolute top-0 left-0"></div>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-6 rounded-xl shadow-sm border border-red-100 text-center">
              <div className="flex items-center justify-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold">Error</span>
              </div>
              {error}
            </div>
          ) : notices.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-slate-100 transition-all hover:shadow-xl">
              <div className="bg-orange-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Bell className="h-8 w-8 text-orange-500" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800 mb-3">No Notices Available</h2>
              <p className="text-slate-600 max-w-md mx-auto">
                There are currently no notices to display.
                {!isLoggedIn && (
                  <span className="block mt-3">
                    <Link to="/login" className="text-orange-500 hover:text-orange-600 font-medium hover:underline inline-flex items-center">
                      Log in <ChevronRight className="h-4 w-4 ml-1" />
                    </Link> to access your student dashboard.
                  </span>
                )}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Notices List - Left Column */}
              <div className="md:col-span-1">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-100 transition-all hover:shadow-xl">
                  <div className="p-4 bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                    <h2 className="font-semibold flex items-center text-lg">
                      <Bell className="mr-2 h-5 w-5 text-orange-300" />
                      All Notices ({notices.length})
                    </h2>
                  </div>
                  
                  <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                    {notices.map((notice) => (
                      <div 
                        key={notice.id}
                        className={`p-5 cursor-pointer transition-all duration-200 hover:bg-orange-50 group
                          ${selectedNotice?.id === notice.id 
                            ? 'bg-gradient-to-r from-orange-50 to-white border-l-4 border-orange-500 shadow-sm' 
                            : 'hover:translate-x-1'
                          }`}
                        onClick={() => handleNoticeClick(notice)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className={`font-medium text-slate-800 line-clamp-2 group-hover:text-orange-700 transition-colors
                              ${selectedNotice?.id === notice.id ? 'text-orange-700' : ''}`}>
                              {notice.title}
                            </h3>
                            
                            <div className="mt-2 flex items-center text-xs text-slate-500">
                              <div className="flex items-center mr-3">
                                <Calendar className="h-3 w-3 mr-1 text-orange-400" />
                                <span>{formatDate(notice.date).split(',')[0]}</span>
                              </div>
                              
                              {notice.batch && (
                                <div className="flex items-center">
                                  <User className="h-3 w-3 mr-1 text-orange-400" />
                                  <span>Batch {notice.batch}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <ChevronRight className={`h-4 w-4 transition-all group-hover:translate-x-1 ${
                            selectedNotice?.id === notice.id 
                              ? 'text-orange-500' 
                              : 'text-slate-300 group-hover:text-orange-400'
                          }`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Notice Detail - Right Column */}
              <div className="md:col-span-2">
                {selectedNotice ? (
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-100 transition-all hover:shadow-xl">
                    {/* Notice Header */}
                    <div className="p-7 border-b border-slate-100 bg-gradient-to-br from-white to-slate-50">
                      <div className="flex items-start justify-between">
                        <h2 className="text-2xl font-bold text-slate-800">{selectedNotice.title}</h2>
                        
                        {selectedNotice.batch && (
                          <span className="px-4 py-1.5 bg-orange-100 text-orange-800 text-sm font-medium rounded-full flex items-center">
                            <User className="h-3.5 w-3.5 mr-1.5" />
                            Batch {selectedNotice.batch}
                          </span>
                        )}
                      </div>
                      
                      {selectedNotice.sub_title && (
                        <p className="text-slate-600 mt-2">{selectedNotice.sub_title}</p>
                      )}
                      
                      <div className="flex flex-wrap gap-5 mt-5">
                        <div className="flex items-center text-sm text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg">
                          <Calendar className="h-4 w-4 mr-2 text-orange-400" />
                          <span>{formatDate(selectedNotice.date)}</span>
                        </div>
                        
                        <div className="flex items-center text-sm text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg">
                          <User className="h-4 w-4 mr-2 text-orange-400" />
                          <span>From: {selectedNotice.notice_from}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Notice Content */}
                    <div className="p-7">
                      <div className="prose max-w-none">
                        {/* Format the content with paragraphs */}
                        {selectedNotice.content.split('\n').map((paragraph, idx) => (
                          <p key={idx} className="mb-4 text-slate-700 leading-relaxed">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                      
                      {/* Attachments (if available) */}
                      {selectedNotice.attachments && selectedNotice.attachments.length > 0 && (
                        <div className="mt-8 pt-6 border-t border-slate-100">
                          <h3 className="font-semibold text-slate-800 mb-3 flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-orange-500" />
                            Attachments
                          </h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {selectedNotice.attachments.map((attachment, idx) => (
                              <a 
                                key={idx}
                                href={attachment.url} 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center p-3 bg-slate-50 hover:bg-orange-50 rounded-lg transition-colors border border-slate-100 hover:border-orange-100 group"
                              >
                                <div className="bg-white p-2 rounded-md shadow-sm mr-3 group-hover:bg-orange-100 transition-colors">
                                  <FileText className="h-5 w-5 text-orange-500" />
                                </div>
                                <span className="text-sm text-slate-700 flex-1 truncate group-hover:text-orange-700 transition-colors">
                                  {attachment.name || `Attachment ${idx + 1}`}
                                </span>
                                <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-orange-500 transition-colors" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-slate-100 h-full flex flex-col items-center justify-center transition-all hover:shadow-xl">
                    <div className="bg-orange-50 rounded-full w-20 h-20 flex items-center justify-center mb-6">
                      <Bell className="h-8 w-8 text-orange-500" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-800 mb-3">Select a Notice</h2>
                    <p className="text-slate-600 max-w-md">
                      Choose a notice from the list to view its details
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Important Information Card */}
          <div className="mt-10 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 p-6 rounded-xl shadow-sm">
            <div className="flex items-start">
              <div className="bg-white p-2 rounded-full shadow-sm mr-4 flex-shrink-0">
                <Pin className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold text-orange-800 mb-2">Important Information</h3>
                <p className="text-orange-700 text-sm">
                  All official notices are also sent via email. Make sure your email address is up to date in your profile settings.
                  {isLoggedIn ? (
                    <Link to="/settingspage" className="inline-flex items-center text-orange-600 hover:text-orange-700 font-medium hover:underline ml-1">
                      Update your profile <ChevronRight className="h-3 w-3 ml-0.5" />
                    </Link>
                  ) : (
                    <Link to="/login" className="inline-flex items-center text-orange-600 hover:text-orange-700 font-medium hover:underline ml-1">
                      Log in to update your profile <ChevronRight className="h-3 w-3 ml-0.5" />
                    </Link>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NoticeBoard;