import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Compass,
  FileText,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  UserCircle2,
} from 'lucide-react';
import Navbar from '../components/Navbar';

const steps = [
  {
    title: '1. Create your account',
    description:
      'Use the login or sign-up option to access your personalized dashboard. New students and applicants can start from the admission pages.',
    icon: UserCircle2,
  },
  {
    title: '2. Choose your role',
    description:
      'The portal is designed for students, teachers, admins, and guests. Pick the section that matches your purpose to see the right tools.',
    icon: GraduationCap,
  },
  {
    title: '3. Explore the essentials',
    description:
      'Visit the notice board, admissions hub, and departmental pages to understand campus updates, events, and important announcements.',
    icon: Compass,
  },
  {
    title: '4. Stay organized',
    description:
      'Check your routine, assignments, results, and finance details from your dashboard so you never miss important academic updates.',
    icon: BookOpen,
  },
];

const quickLinks = [
  { label: 'Sign in', path: '/login' },
  { label: 'Create account', path: '/signup' },
  { label: 'Admission hub', path: '/admission-hub' },
  { label: 'Notice board', path: '/notice-board' },
];

function BeginnerGuide() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Navbar />
      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-8 text-white shadow-xl sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm backdrop-blur">
                <Sparkles size={16} />
                First-time visitor guide
              </div>
              <h1 className="text-3xl font-semibold sm:text-4xl">
                Welcome to CSE SmartPortal
              </h1>
              <p className="mt-4 text-lg text-slate-200">
                This guide will help you understand where to start, what to explore, and how to make the most of your experience on the website.
              </p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
              <div className="flex items-center gap-2 text-sm text-slate-200">
                <ShieldCheck size={18} />
                Safe, simple, and role-based access
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-semibold text-slate-900">
              Start here in 4 simple steps
            </h2>
            <div className="mt-6 space-y-4">
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{step.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-slate-900">
                <FileText size={20} />
                <h2 className="text-xl font-semibold">Quick links</h2>
              </div>
              <div className="mt-4 flex flex-col gap-3">
                {quickLinks.map((link) => (
                  <Link
                    key={link.label}
                    to={link.path}
                    className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                  >
                    <span>{link.label}</span>
                    <ArrowRight size={16} />
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-emerald-900">Need help?</h2>
              <p className="mt-2 text-sm leading-6 text-emerald-800">
                If you are unsure where to go, start with the admission hub or login page, then continue to your dashboard after sign-in.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default BeginnerGuide;
