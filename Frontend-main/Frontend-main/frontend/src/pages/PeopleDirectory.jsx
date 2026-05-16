import React, { useState} from 'react';
import { Search, Filter, Mail, Phone, MapPin, Calendar, FileText, ExternalLink, X, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import peopleData from '../data/people.json';

const PeopleDirectory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    role: [],
    expertise: []
  });
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Data imported from JSON file
  const people = peopleData;

  const roles = ["Professor", "Associate Professor", "Assistant Professor", "Lecturer"];
  const expertiseAreas = ["AI", "Machine Learning", "Data Science", "Analytics", "Cybersecurity", "Network Security", "Software Engineering"];

  const filteredPeople = people.filter(person => {
    const matchesSearch = person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         person.expertise.some(exp => exp.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = selectedFilters.role.length === 0 || selectedFilters.role.includes(person.role);
    const matchesExpertise = selectedFilters.expertise.length === 0 || 
                           selectedFilters.expertise.some(exp => person.expertise.includes(exp));

    return matchesSearch && matchesRole && matchesExpertise;
  });

  const addFilter = (type, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [type]: [...prev[type], value]
    }));
  };

  const removeFilter = (type, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [type]: prev[type].filter(item => item !== value)
    }));
  };

  const openProfileModal = (person) => {
    setSelectedPerson(person);
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-gray-800 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">People Directory</h1>
          <p className="text-xl text-slate-200">Meet our distinguished faculty and researchers</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search by name or expertise (e.g., Natural Language Processing)..."
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter Sections */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Role Filters */}
            <div>
              <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Filter size={16} />
                Filter by Role
              </h3>
              <div className="flex flex-wrap gap-2">
                {roles.map(role => (
                  <button
                    key={role}
                    onClick={() => addFilter('role', role)}
                    disabled={selectedFilters.role.includes(role)}
                    className="px-3 py-1 text-sm border border-slate-300 rounded-full hover:bg-slate-100 disabled:bg-slate-200 disabled:cursor-not-allowed"
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Expertise Filters */}
            <div>
              <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Filter size={16} />
                Filter by Expertise
              </h3>
              <div className="flex flex-wrap gap-2">
                {expertiseAreas.map(expertise => (
                  <button
                    key={expertise}
                    onClick={() => addFilter('expertise', expertise)}
                    disabled={selectedFilters.expertise.includes(expertise)}
                    className="px-3 py-1 text-sm border border-slate-300 rounded-full hover:bg-slate-100 disabled:bg-slate-200 disabled:cursor-not-allowed"
                  >
                    {expertise}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {(selectedFilters.role.length > 0 || selectedFilters.expertise.length > 0) && (
            <div className="border-t pt-4">
              <h4 className="font-medium text-slate-700 mb-2">Active Filters:</h4>
              <div className="flex flex-wrap gap-2">
                {selectedFilters.role.map(role => (
                  <span key={role} className="inline-flex items-center gap-1 px-3 py-1 bg-slate-600 text-white rounded-full text-sm">
                    {role}
                    <X size={14} className="cursor-pointer" onClick={() => removeFilter('role', role)} />
                  </span>
                ))}
                {selectedFilters.expertise.map(expertise => (
                  <span key={expertise} className="inline-flex items-center gap-1 px-3 py-1 bg-slate-600 text-white rounded-full text-sm">
                    {expertise}
                    <X size={14} className="cursor-pointer" onClick={() => removeFilter('expertise', expertise)} />
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPeople.map(person => (
            <div key={person.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <img 
                    src={person.image} 
                    alt={person.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-bold text-slate-800">{person.name}</h3>
                    <p className="text-slate-600">{person.role}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-slate-600 mb-2">Expertise:</p>
                  <div className="flex flex-wrap gap-1">
                    {person.expertise.map(exp => (
                      <span key={exp} className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                        {exp}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 text-sm text-slate-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Mail size={14} />
                    <span>{person.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} />
                    <span>{person.office}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openProfileModal(person)}
                    className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                  >
                    View Profile
                  </button>
                  <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                    <Mail size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPeople.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-600 text-lg">No people found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Profile Modal */}
      {showModal && selectedPerson && (
        <div className="fixed inset-0 bg-black/20 bg-opacity-50 backdrop-blur-lg flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <img 
                    src={selectedPerson.image} 
                    alt={selectedPerson.name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">{selectedPerson.name}</h2>
                    <p className="text-slate-600">{selectedPerson.role}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Biography</h3>
                    <p className="text-slate-600">{selectedPerson.bio}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <FileText size={20} />
                      Publications
                    </h3>
                    <div className="space-y-3">
                      {selectedPerson.publications.map((pub, index) => (
                        <div key={index} className="border-l-4 border-slate-300 pl-4">
                          <h4 className="font-medium text-slate-800">{pub.title}</h4>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <span>{pub.year}</span>
                            <a href={pub.link} className="flex items-center gap-1 text-slate-600 hover:text-slate-800">
                              <ExternalLink size={14} />
                              PDF
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="bg-slate-50 rounded-lg p-4 mb-4">
                    <h3 className="font-semibold text-slate-800 mb-4">Contact Information</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-slate-500" />
                        <span>{selectedPerson.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-slate-500" />
                        <span>{selectedPerson.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-slate-500" />
                        <span>{selectedPerson.office}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-slate-500" />
                        <span>{selectedPerson.officeHours}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4">
                    <h3 className="font-semibold text-slate-800 mb-3">Areas of Expertise</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedPerson.expertise.map(exp => (
                        <span key={exp} className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-sm">
                          {exp}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button className="w-full mt-4 bg-slate-600 hover:bg-slate-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                    <Mail size={16} />
                    Send Email
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeopleDirectory;
