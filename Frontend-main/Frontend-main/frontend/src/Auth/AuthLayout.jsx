import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ShieldCheck, BookOpen, Users } from 'lucide-react';

// Shared two-column branded shell for Login / SignUp.
const AuthLayout = ({ children, subtitle }) => (
  <div className="min-h-screen flex bg-slate-950">
    {/* Brand panel */}
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 text-white">
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="relative z-10 flex flex-col justify-between p-14">
        <Link to="/" className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
            <GraduationCap size={26} />
          </div>
          <div>
            <p className="font-bold text-lg leading-tight">CSE SmartPortal</p>
            <p className="text-xs text-slate-300">University of Dhaka</p>
          </div>
        </Link>

        <div>
          <h2 className="text-4xl font-bold leading-tight">
            Department of Computer<br />Science &amp; Engineering
          </h2>
          <p className="mt-4 text-slate-300 max-w-md">
            A unified portal for courses, notices, exams, finance, admissions and
            departmental life — all in one place.
          </p>
          <ul className="mt-8 space-y-3 text-slate-200">
            <li className="flex items-center gap-3"><BookOpen size={18} className="text-amber-400" /> Courses, assignments &amp; resources</li>
            <li className="flex items-center gap-3"><Users size={18} className="text-amber-400" /> Role-based access for all members</li>
            <li className="flex items-center gap-3"><ShieldCheck size={18} className="text-amber-400" /> Secure, token-based authentication</li>
          </ul>
        </div>

        <p className="text-xs text-slate-400">© {new Date().getFullYear()} CSEDU · Team LogicLoop</p>
      </div>
    </div>

    {/* Form panel */}
    <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-slate-950">
      <div className="w-full max-w-md">
        {/* Mobile brand */}
        <Link to="/" className="lg:hidden flex items-center justify-center gap-2 mb-8 text-white">
          <GraduationCap size={24} className="text-amber-400" />
          <span className="font-bold">CSE SmartPortal</span>
        </Link>
        {subtitle}
        {children}
      </div>
    </div>
  </div>
);

export default AuthLayout;
