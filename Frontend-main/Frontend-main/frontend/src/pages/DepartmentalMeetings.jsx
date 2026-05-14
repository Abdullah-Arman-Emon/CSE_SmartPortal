import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Users, FileText, Download, ArrowLeft, Filter, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import MeetingCard from '../components/MeetingCard';
import RSVPToggle from '../components/RSVPToggle';

const DepartmentalMeetings = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [rsvpStatuses, setRsvpStatuses] = useState({});

  // Mock data for upcoming meetings
  const upcomingMeetings = [
    {
      id: 1,
      title: "Faculty Board Meeting",
      description: "Monthly faculty board meeting to discuss curriculum updates and student affairs.",
      date: "2024-02-15",
      time: "10:00 AM",
      duration: "2 hours",
      location: "Conference Room A, CSE Building",
      organizer: "Dr. John Smith",
      type: "Faculty Board",
      agenda: ["Curriculum Review", "Student Performance", "Budget Discussion", "New Hiring"],
      isUrgent: false
    },
    {
      id: 2,
      title: "Research Committee Meeting",
      description: "Quarterly research committee meeting to review ongoing projects and funding proposals.",
      date: "2024-02-20",
      time: "2:00 PM",
      duration: "1.5 hours",
      location: "Room 301, CSE Building",
      organizer: "Dr. Sarah Johnson",
      type: "Research Committee",
      agenda: ["Project Updates", "Grant Applications", "Publication Reviews"],
      isUrgent: true
    },
    {
      id: 3,
      title: "Academic Planning Session",
      description: "Strategic planning for the upcoming semester and course scheduling.",
      date: "2024-02-25",
      time: "9:00 AM",
      duration: "3 hours",
      location: "Main Auditorium",
      organizer: "Dr. Michael Chen",
      type: "Academic Planning",
      agenda: ["Course Scheduling", "Faculty Assignments", "Infrastructure Needs"],
      isUrgent: false
    }
  ];

  // Mock data for archived meeting minutes
  const archivedMinutes = [
    {
      id: 1,
      title: "January Faculty Board Meeting",
      date: "2024-01-15",
      type: "Faculty Board",
      attendees: 15,
      pdfLink: "/minutes/jan-2024-faculty-board.pdf",
      keyDecisions: ["Approved new CS curriculum", "Budget allocation for labs", "Hiring 3 new faculty"]
    },
    {
      id: 2,
      title: "December Research Committee Meeting",
      date: "2023-12-20",
      type: "Research Committee",
      attendees: 8,
      pdfLink: "/minutes/dec-2023-research-committee.pdf",
      keyDecisions: ["Approved 5 research proposals", "Increased research budget", "New lab equipment"]
    },
    {
      id: 3,
      title: "November Academic Planning Session",
      date: "2023-11-25",
      type: "Academic Planning",
      attendees: 12,
      pdfLink: "/minutes/nov-2023-academic-planning.pdf",
      keyDecisions: ["Spring semester schedule", "New course offerings", "Exchange programs"]
    }
  ];

  const handleRSVP = (meetingId, status) => {
    setRsvpStatuses(prev => ({
      ...prev,
      [meetingId]: status
    }));
  };

  const filteredMeetings = upcomingMeetings.filter(meeting => {
    const matchesSearch = meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         meeting.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || meeting.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const filteredMinutes = archivedMinutes.filter(minute => {
    const matchesSearch = minute.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || minute.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const meetingTypes = ['all', 'Faculty Board', 'Research Committee', 'Academic Planning'];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-gray-800 text-white py-12">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-200 hover:text-white mb-6">
            <ArrowLeft size={20} />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-4">Departmental Meetings</h1>
          <p className="text-xl text-slate-200">Stay updated with faculty meetings and access archived minutes</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex space-x-1 bg-slate-200 p-1 rounded-lg mb-8 max-w-md">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
              activeTab === 'upcoming'
                ? 'bg-slate-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-300'
            }`}
          >
            Upcoming Meetings
          </button>
          <button
            onClick={() => setActiveTab('archive')}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
              activeTab === 'archive'
                ? 'bg-slate-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-300'
            }`}
          >
            Minutes Archive
          </button>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search meetings or minutes..."
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-slate-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                {meetingTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All Types' : type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'upcoming' ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Upcoming Meetings</h2>
            {filteredMeetings.length > 0 ? (
              filteredMeetings.map(meeting => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  rsvpStatus={rsvpStatuses[meeting.id]}
                  onRSVP={handleRSVP}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <Calendar size={48} className="mx-auto text-slate-400 mb-4" />
                <p className="text-slate-600 text-lg">No upcoming meetings found.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Meeting Minutes Archive</h2>
            {filteredMinutes.length > 0 ? (
              <div className="grid gap-6">
                {filteredMinutes.map(minute => (
                  <div key={minute.id} className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">{minute.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <span className="flex items-center gap-1">
                            <Calendar size={16} />
                            {new Date(minute.date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={16} />
                            {minute.attendees} attendees
                          </span>
                          <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                            {minute.type}
                          </span>
                        </div>
                      </div>
                      <a
                        href={minute.pdfLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                      >
                        <Download size={16} />
                        Download PDF
                      </a>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-slate-700 mb-2">Key Decisions:</h4>
                      <ul className="space-y-1">
                        {minute.keyDecisions.map((decision, index) => (
                          <li key={index} className="text-slate-600 flex items-start gap-2">
                            <span className="text-slate-400 mt-2">•</span>
                            <span>{decision}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText size={48} className="mx-auto text-slate-400 mb-4" />
                <p className="text-slate-600 text-lg">No archived minutes found.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentalMeetings;
