import React from 'react';
import { Inbox } from 'lucide-react';

// Friendly empty-state block for lists with no data.
const EmptyState = ({ icon: Icon = Inbox, title = 'Nothing here yet', message = '', action = null }) => (
  <div className="max-w-xl mx-auto text-center bg-white rounded-xl shadow-sm border border-slate-100 p-12">
    <Icon className="mx-auto text-slate-300 mb-4" size={56} />
    <h3 className="text-xl font-semibold text-slate-700 mb-1">{title}</h3>
    {message && <p className="text-slate-500">{message}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export default EmptyState;
