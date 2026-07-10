import React, { useState } from 'react';
import { Check, X, Clock } from 'lucide-react';

const RSVPToggle = ({ meetingId, currentStatus, onStatusChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const options = [
    { value: 'yes', label: 'Yes', icon: Check, color: 'bg-green-500 hover:bg-green-600' },
    { value: 'no', label: 'No', icon: X, color: 'bg-red-500 hover:bg-red-600' },
    { value: 'maybe', label: 'Maybe', icon: Clock, color: 'bg-yellow-500 hover:bg-yellow-600' }
  ];

  const handleSelect = (status) => {
    onStatusChange(meetingId, status);
    setIsOpen(false);
  };

  const getStatusDisplay = () => {
    if (!currentStatus) {
      return { label: 'RSVP', icon: null, color: 'bg-slate-600 hover:bg-slate-700' };
    }
    const option = options.find(opt => opt.value === currentStatus);
    return option || { label: 'RSVP', icon: null, color: 'bg-slate-600 hover:bg-slate-700' };
  };

  const statusDisplay = getStatusDisplay();
  const StatusIcon = statusDisplay.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${statusDisplay.color} text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 min-w-[100px] justify-center`}
      >
        {StatusIcon && <StatusIcon size={16} />}
        {statusDisplay.label}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-20 min-w-[120px]">
            {options.map(option => {
              const OptionIcon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2 ${
                    currentStatus === option.value ? 'bg-slate-100' : ''
                  }`}
                >
                  <OptionIcon size={16} className={`${
                    option.value === 'yes' ? 'text-green-500' :
                    option.value === 'no' ? 'text-red-500' :
                    'text-yellow-500'
                  }`} />
                  <span className="text-slate-700">{option.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default RSVPToggle;
