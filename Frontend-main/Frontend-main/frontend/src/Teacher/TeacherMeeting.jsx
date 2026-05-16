import { useEffect, useState } from "react";
import axios from "axios";
import { Calendar, Clock, ExternalLink, Users, CheckCircle, XCircle } from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const TeacherMeeting = ({ user, teacherProfile }) => {
  const [meetings, setMeetings] = useState([]);
  const [rsvps, setRsvps] = useState({}); // meeting_id -> "yes"/"no"/null

  // Fetch upcoming meetings
  const fetchMeetings = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/v1/meetings/upcoming`);
      setMeetings(res.data);
    } catch (err) {
      console.error("Error fetching meetings", err);
    }
  };

  // Submit RSVP
  const submitRSVP = async (meeting_id, response) => {
    try {
      await axios.post(`${BACKEND_URL}/v1/meetings/rsvp`, {
        user_id: user?.id,
        meeting_id,
        response,
      });
      setRsvps((prev) => ({ ...prev, [meeting_id]: response }));
      // Success notification could be replaced with a toast notification
      console.log("RSVP submitted successfully!");
    } catch (err) {
      console.error("RSVP failed:", err.response?.data?.detail || err.message);
    }
  };

  const fetchRSVPStatus = async () => {
    try {
      const res = await axios.get(
        `${BACKEND_URL}/v1/meetings/rsvp-status/${user?.id}`
      );
      const statusMap = {};
      res.data.forEach((item) => {
        statusMap[item.meeting_id] = item.response.toLowerCase();
      });
      setRsvps(statusMap);
    } catch (err) {
      console.error("Error fetching RSVP status", err);
    }
  };

  useEffect(() => {
    fetchMeetings();
    fetchRSVPStatus();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="text-blue-600" size={24} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">
              Welcome, {teacherProfile?.first_name}!
            </h1>
          </div>
          <p className="text-slate-600">Manage your upcoming meetings and RSVP responses</p>
        </div>

        {/* Meetings Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="text-green-600" size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Upcoming Meetings</h2>
          </div>

          {meetings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto text-slate-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-slate-600 mb-2">No Upcoming Meetings</h3>
              <p className="text-slate-500">Check back later for new meeting schedules.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {meetings.map((meeting) => (
                <div key={meeting.id} className="bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-all duration-300">
                  {/* Meeting Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">
                        {meeting.title}
                      </h3>
                      
                      {/* Date and Time */}
                      <div className="flex items-center gap-2 text-slate-600 mb-3">
                        <Clock size={16} />
                        <span className="text-sm">
                          {new Date(meeting.date_time).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                        <span className="text-sm font-medium">
                          {new Date(meeting.date_time).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      {/* Meeting URL */}
                      <div className="flex items-center gap-2 mb-4">
                        <ExternalLink size={16} className="text-slate-500" />
                        <a
                          href={meeting.meeting_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium underline decoration-2 underline-offset-2 hover:decoration-blue-800 transition-colors"
                        >
                          Join Meeting
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* RSVP Section */}
                  <div className="border-t border-slate-200 pt-4">
                    {rsvps[meeting.id] ? (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                        <CheckCircle className="text-green-600" size={20} />
                        <div>
                          <p className="text-sm font-medium text-green-800">
                            RSVP Submitted
                          </p>
                          <p className="text-xs text-green-600">
                            You responded: <strong className="uppercase">{rsvps[meeting.id]}</strong>
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                        <p className="text-sm font-medium text-amber-800 mb-3">
                          Please respond to this meeting invitation:
                        </p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => submitRSVP(meeting.id, "yes")}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200 shadow-sm hover:shadow-md"
                          >
                            <CheckCircle size={16} />
                            Accept
                          </button>
                          <button
                            onClick={() => submitRSVP(meeting.id, "no")}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200 shadow-sm hover:shadow-md"
                          >
                            <XCircle size={16} />
                            Decline
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherMeeting;
