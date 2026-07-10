import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Calendar, Award, BookOpen, Users, GraduationCap } from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const parseList = (raw, fallback = []) => {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : fallback;
  } catch {
    return fallback;
  }
};

const STAT_ICONS = [Users, GraduationCap, BookOpen];

const AboutChairman = () => {
  const [activeSection, setActiveSection] = useState('about');
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    axios.get(`${BACKEND_URL}/guest/site/content`)
      .then((res) => {
        setContent(res.data);
        setLoadError(null);
      })
      .catch(() => setLoadError('Could not load page content. Please try again later.'))
      .finally(() => setLoading(false));
  }, []);

  const sectionContent = {
    about: content.about_text || '',
    history: content.history_text || '',
    mission: content.mission_text || '',
    chairman: content.chairman_message || ''
  };

  const researchAreas = parseList(content.research_areas);
  const achievements = parseList(content.achievements);
  const deptStats = parseList(content.dept_stats);
  const officeHours = parseList(content.office_hours);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-800 to-gray-800 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-1">
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                Department of Computer Science & Engineering
              </h1>
              <p className="text-xl text-slate-200 leading-relaxed">
                University of Dhaka
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-2 py-4">
            {[
              ['about', 'About Department'],
              ['history', 'Our History'],
              ['mission', 'Mission & Values'],
              ['chairman', 'About Chairman'],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  activeSection === id
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {loading && <div className="text-center py-12 text-slate-500">Loading…</div>}
        {loadError && <div className="text-center py-12 text-red-600">{loadError}</div>}
        {!loading && !loadError && (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-3xl font-bold text-slate-800 mb-6">
                {activeSection === 'about' && 'About Our Department'}
                {activeSection === 'history' && 'Department History'}
                {activeSection === 'mission' && 'Our Mission & Values'}
                {activeSection === 'chairman' && 'Message from the Chairman'}
              </h2>

              {activeSection === 'chairman' && content.chairman_photo && (
                <div className="float-right ml-6 mb-4">
                  <img
                    src={content.chairman_photo}
                    alt="Chairman"
                    className="w-64 rounded-lg shadow-md"
                  />
                </div>
              )}

              <div className="prose max-w-none text-slate-600">
                <div className="whitespace-pre-wrap">
                  {(sectionContent[activeSection] || '').split('\n').map((paragraph, i) => (
                    paragraph.trim() ? <p key={i} className="text-lg leading-relaxed mb-6">{paragraph}</p> : null
                  ))}
                </div>
              </div>
            </div>

            {/* Research & Achievements - Only shown for Chairman */}
            {activeSection === 'chairman' && (researchAreas.length > 0 || achievements.length > 0) && (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                  <Award className="text-slate-600" />
                  Research & Achievements
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-slate-700">Research Areas</h4>
                    <ul className="space-y-2 text-slate-600">
                      {researchAreas.map((r, i) => <li key={i}>• {r}</li>)}
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-slate-700">Key Achievements</h4>
                    <ul className="space-y-2 text-slate-600">
                      {achievements.map((a, i) => <li key={i}>• {a}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Contact Information</h3>

              <div className="space-y-4">
                {content.contact_email && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <Mail className="text-slate-500" size={20} />
                    <span>{content.contact_email}</span>
                  </div>
                )}
                {content.contact_phone && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <Phone className="text-slate-500" size={20} />
                    <span>{content.contact_phone}</span>
                  </div>
                )}
                {content.contact_address && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <MapPin className="text-slate-500" size={20} />
                    <span>{content.contact_address}</span>
                  </div>
                )}
                {content.contact_hours && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <Calendar className="text-slate-500" size={20} />
                    <span>{content.contact_hours}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            {deptStats.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Department Stats</h3>

                <div className="space-y-4">
                  {deptStats.map((s, i) => {
                    const Icon = STAT_ICONS[i % STAT_ICONS.length];
                    return (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="text-slate-500" size={16} />
                          <span className="text-slate-600">{s.label}</span>
                        </div>
                        <span className="font-bold text-slate-800">{s.value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Office Hours */}
            {officeHours.length > 0 && (
              <div className="bg-slate-100 rounded-xl p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Office Hours</h3>

                <div className="space-y-3 text-slate-600">
                  {officeHours.map((o, i) => (
                    <div key={i} className="flex justify-between">
                      <span>{o.days}</span>
                      <span className="font-medium">{o.time}</span>
                    </div>
                  ))}
                  {content.office_hours_note && (
                    <div className="text-sm text-slate-500 mt-4">
                      {content.office_hours_note}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </div>

      {/* Vision Section */}
      {content.connect_text && (
        <div className="bg-slate-800 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">{content.connect_heading || 'Connect With Us'}</h2>
            <p className="text-xl text-slate-200 max-w-4xl mx-auto leading-relaxed">
              {content.connect_text}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AboutChairman;
