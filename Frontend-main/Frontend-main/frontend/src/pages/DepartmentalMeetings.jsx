import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Calendar, Clock, Video, ExternalLink, CalendarX } from 'lucide-react';
import Navbar from '../components/Navbar';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const DepartmentalMeetings = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/v1/meetings/upcoming`);
      const sorted = (res.data || []).sort(
        (a, b) => new Date(a.date_time) - new Date(b.date_time)
      );
      setMeetings(sorted);
      setError(null);
    } catch (err) {
      console.error('Error fetching meetings:', err);
      setError('Failed to load meetings. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const formatDate = (value) =>
    new Date(value).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const formatTime = (value) =>
    new Date(value).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-r from-slate-800 to-gray-800 text-white">
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-4xl lg:text-5xl font-bold mb-3">Departmental Meetings</h1>
          <p className="text-lg text-slate-200">
            Upcoming meetings scheduled by the Department of CSE, University of Dhaka.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse bg-white rounded-xl shadow p-6">
                <div className="h-5 w-2/3 bg-slate-200 rounded mb-4" />
                <div className="h-4 w-1/2 bg-slate-200 rounded mb-2" />
                <div className="h-4 w-1/3 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="max-w-xl mx-auto text-center bg-red-50 border border-red-100 rounded-xl p-8">
            <p className="text-red-600 font-medium">{error}</p>
            <button
              onClick={fetchMeetings}
              className="mt-4 px-5 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : meetings.length === 0 ? (
          <div className="max-w-xl mx-auto text-center bg-white rounded-xl shadow p-12">
            <CalendarX className="mx-auto text-slate-300 mb-4" size={56} />
            <h3 className="text-xl font-semibold text-slate-700 mb-1">No upcoming meetings</h3>
            <p className="text-slate-500">
              There are no scheduled meetings right now. Please check back later.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {meetings.map((meeting) => (
              <div
                key={meeting.id}
                className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-slate-300 hover:shadow-xl transition-shadow"
              >
                <h3 className="text-xl font-bold text-slate-800 mb-4">{meeting.title}</h3>

                <div className="space-y-2 mb-5">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar size={16} className="text-slate-500" />
                    <span className="text-sm">{formatDate(meeting.date_time)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock size={16} className="text-slate-500" />
                    <span className="text-sm">{formatTime(meeting.date_time)}</span>
                  </div>
                </div>

                {meeting.meeting_url && (
                  <a
                    href={meeting.meeting_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
                  >
                    <Video size={16} />
                    Join Meeting
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentalMeetings;
