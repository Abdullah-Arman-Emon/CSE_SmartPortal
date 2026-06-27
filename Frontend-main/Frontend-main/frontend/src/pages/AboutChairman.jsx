import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Calendar, Award, BookOpen, Users, GraduationCap, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const AboutChairman = () => {
  const [activeSection, setActiveSection] = useState('about');
  const [sectionContent, setSectionContent] = useState({
    about: '',
    history: '',
    mission: '',
    chairman: ''
  });

  useEffect(() => {
    // Load all text files when component mounts
    const loadTextFiles = async () => {
      try {
        const aboutResponse = await fetch('/src/assets/about.txt');
        const historyResponse = await fetch('/src/assets/history.txt');
        const missionResponse = await fetch('/src/assets/mission.txt');
        const chairmanResponse = await fetch('/src/assets/chairman.txt');
        
        const aboutText = await aboutResponse.text();
        const historyText = await historyResponse.text();
        const missionText = await missionResponse.text();
        const chairmanText = await chairmanResponse.text();
        
        setSectionContent({
          about: aboutText,
          history: historyText,
          mission: missionText,
          chairman: chairmanText
        });
      } catch (error) {
        console.error("Error loading text files:", error);
      }
    };
    
    loadTextFiles();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      {/* Hero Section - Removed circular image */}
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
            <button 
              onClick={() => setActiveSection('about')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeSection === 'about' 
                  ? 'bg-slate-800 text-white' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              About Department
            </button>
            <button 
              onClick={() => setActiveSection('history')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeSection === 'history' 
                  ? 'bg-slate-800 text-white' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Our History
            </button>
            <button 
              onClick={() => setActiveSection('mission')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeSection === 'mission' 
                  ? 'bg-slate-800 text-white' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Mission & Values
            </button>
            <button 
              onClick={() => setActiveSection('chairman')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeSection === 'chairman' 
                  ? 'bg-slate-800 text-white' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              About Chairman
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
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
              
              {/* Added Chairman image in the chairman section */}
              {activeSection === 'chairman' && (
                <div className="float-right ml-6 mb-4">
                  <img 
                    src="/src/assets/chairman.jpg" 
                    alt="Chairman" 
                    className="w-64 rounded-lg shadow-md"
                  />
                </div>
              )}
              
              <div className="prose max-w-none text-slate-600">
                {activeSection === 'about' && (
                  <div className="whitespace-pre-wrap">
                    {sectionContent.about.split('\n').map((paragraph, i) => (
                      paragraph.trim() ? <p key={i} className="text-lg leading-relaxed mb-6">{paragraph}</p> : null
                    ))}
                  </div>
                )}
                
                {activeSection === 'history' && (
                  <div className="whitespace-pre-wrap">
                    {sectionContent.history.split('\n').map((paragraph, i) => (
                      paragraph.trim() ? <p key={i} className="text-lg leading-relaxed mb-6">{paragraph}</p> : null
                    ))}
                  </div>
                )}
                
                {activeSection === 'mission' && (
                  <div className="whitespace-pre-wrap">
                    {sectionContent.mission.split('\n').map((paragraph, i) => (
                      paragraph.trim() ? <p key={i} className="text-lg leading-relaxed mb-6">{paragraph}</p> : null
                    ))}
                  </div>
                )}
                
                {activeSection === 'chairman' && (
                  <div className="whitespace-pre-wrap">
                    {sectionContent.chairman.split('\n').map((paragraph, i) => (
                      paragraph.trim() ? <p key={i} className="text-lg leading-relaxed mb-6">{paragraph}</p> : null
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Additional Information Section - Only shown for Chairman */}
            {activeSection === 'chairman' && (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                  <Award className="text-slate-600" />
                  Research & Achievements
                </h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-slate-700">Research Areas</h4>
                    <ul className="space-y-2 text-slate-600">
                      <li>• Artificial Intelligence & Machine Learning</li>
                      <li>• Data Science & Analytics</li>
                      <li>• Software Engineering</li>
                      <li>• Cybersecurity</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold text-slate-700">Key Achievements</h4>
                    <ul className="space-y-2 text-slate-600">
                      <li>• 50+ Research Publications</li>
                      <li>• 15+ Years Department Leadership</li>
                      <li>• Multiple Research Awards</li>
                      <li>• Industry Collaboration Expert</li>
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
                <div className="flex items-center gap-3 text-slate-600">
                  <Mail className="text-slate-500" size={20} />
                  <span>chairman@cse.du.ac.bd</span>
                </div>
                
                <div className="flex items-center gap-3 text-slate-600">
                  <Phone className="text-slate-500" size={20} />
                  <span>+880-2-9670734</span>
                </div>
                
                <div className="flex items-center gap-3 text-slate-600">
                  <MapPin className="text-slate-500" size={20} />
                  <span>Department of CSE, University of Dhaka</span>
                </div>
                
                <div className="flex items-center gap-3 text-slate-600">
                  <Calendar className="text-slate-500" size={20} />
                  <span>Sun-Thu, 9:00 AM - 5:00 PM</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Department Stats</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="text-slate-500" size={16} />
                    <span className="text-slate-600">Faculty Members</span>
                  </div>
                  <span className="font-bold text-slate-800">25+</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="text-slate-500" size={16} />
                    <span className="text-slate-600">Students</span>
                  </div>
                  <span className="font-bold text-slate-800">800+</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="text-slate-500" size={16} />
                    <span className="text-slate-600">Research Projects</span>
                  </div>
                  <span className="font-bold text-slate-800">30+</span>
                </div>
              </div>
            </div>

            {/* Office Hours */}
            <div className="bg-slate-100 rounded-xl p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Office Hours</h3>
              
              <div className="space-y-3 text-slate-600">
                <div className="flex justify-between">
                  <span>Monday - Wednesday</span>
                  <span className="font-medium">10:00 AM - 12:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Thursday - Friday</span>
                  <span className="font-medium">2:00 PM - 4:00 PM</span>
                </div>
                <div className="text-sm text-slate-500 mt-4">
                  * Appointments can be scheduled via email
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vision Section */}
      <div className="bg-slate-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Connect With Us</h2>
          <p className="text-xl text-slate-200 max-w-4xl mx-auto leading-relaxed">
            We welcome intelligent and creative minds willing to take the challenges of 21st century workplaces 
            and have strong enthusiasm to work in building a smart Bangladesh.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutChairman;
