import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';

const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
    <div className="text-center max-w-md">
      <p className="text-7xl font-black text-slate-800">404</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-700">Page not found</h1>
      <p className="mt-2 text-slate-500">
        The page you are looking for doesn’t exist or has been moved.
      </p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
        >
          <Home size={16} /> Home
        </Link>
        <Link
          to="/admission-hub"
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <Compass size={16} /> Admission Hub
        </Link>
      </div>
    </div>
  </div>
);

export default NotFound;
