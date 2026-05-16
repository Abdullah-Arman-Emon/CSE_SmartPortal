import React from 'react';
import { Calendar, Clock, MapPin, User, AlertCircle } from 'lucide-react';
import RSVPToggle from './RSVPToggle';

const MeetingCard = ({ meeting, rsvpStatus, onRSVP }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${
      meeting.isUrgent ? 'border-red-500' : 'border-slate-300'
    }`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-bold text-slate-800">{meeting.title}</h3>
            {meeting.isUrgent && (
              <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                <AlertCircle size={12} />
                Urgent
              </div>
            )}
          </div>
          <p className="text-slate-600 mb-4">{meeting.description}</p>
        </div>
        <RSVPToggle
          meetingId={meeting.id}
          currentStatus={rsvpStatus}
          onStatusChange={onRSVP}
        />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="flex items-center gap-2 text-slate-600">
          <Calendar size={16} className="text-slate-500" />
          <span className="text-sm">{formatDate(meeting.date)}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <Clock size={16} className="text-slate-500" />
          <span className="text-sm">{meeting.time} ({meeting.duration})</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <MapPin size={16} className="text-slate-500" />
          <span className="text-sm">{meeting.location}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <User size={16} className="text-slate-500" />
          <span className="text-sm">{meeting.organizer}</span>
        </div>
      </div>

      <div className="bg-slate-50 rounded-lg p-4">
        <h4 className="font-semibold text-slate-700 mb-2">Agenda:</h4>
        <ul className="grid md:grid-cols-2 gap-1">
          {meeting.agenda.map((item, index) => (
            <li key={index} className="text-slate-600 text-sm flex items-start gap-2">
              <span className="text-slate-400 mt-1">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">
          {meeting.type}
        </span>
        {rsvpStatus && (
          <span className="text-sm text-slate-600">
            Your RSVP: <span className="font-medium capitalize">{rsvpStatus}</span>
          </span>
        )}
      </div>
    </div>
  );
};

export default MeetingCard;
