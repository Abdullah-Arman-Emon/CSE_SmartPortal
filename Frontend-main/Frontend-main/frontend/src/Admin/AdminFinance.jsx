import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  Users,
  Save,
  X,
  AlertCircle
} from 'lucide-react';
import AdminPaymentVerification from './AdminPaymentVerification';
import { financeApi } from '../api';

import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function AdminFinance() {
  const [financeEvents, setFinanceEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [activeTab, setActiveTab] = useState('events'); // 'events' or 'payments'
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    batch: '',
    deadline: ''
  });

  // Filter states
  const [filterBatch, setFilterBatch] = useState('');
  const [filterStudentId, setFilterStudentId] = useState('');
  const [filterDeadline, setFilterDeadline] = useState('');
  const [filteredEvents, setFilteredEvents] = useState([]);

  // Get current user
  const { user } = useContext(AuthContext);
  const isAdmin = user.role === 'admin';

  useEffect(() => {
    if (!isAdmin) {
      setError('Access denied. Admin privileges required.');
      return;
    }
    fetchFinanceEvents();
  }, [isAdmin]);

  useEffect(() => {
    // Filter logic for events
    let events = [...financeEvents];
    if (filterBatch) {
      events = events.filter(e => e.batch && e.batch.toString().toLowerCase().includes(filterBatch.toLowerCase()));
    }
    if (filterDeadline) {
      events = events.filter(e => e.deadline && e.deadline.startsWith(filterDeadline));
    }
    setFilteredEvents(events);
  }, [financeEvents, filterBatch, filterDeadline]);

  const fetchFinanceEvents = async () => {
    try {
      setLoading(true);
      const response = await axios.get(financeApi.listEvents());
      setFinanceEvents(response.data);
    } catch (err) {
      setError('Failed to fetch finance events');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      amount: '',
      batch: '',
      deadline: ''
    });
    setEditingEvent(null);
  };

  const openModal = (event = null) => {
    if (event) {
      setEditingEvent(event);
      setFormData({
        title: event.title,
        amount: event.amount.toString(),
        batch: event.batch,
        deadline: new Date(event.deadline).toISOString().slice(0, 16)
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        title: formData.title,
        amount: parseInt(formData.amount),
        batch: formData.batch,
        deadline: new Date(formData.deadline).toISOString()
      };

      if (editingEvent) {
        // Update existing event (you'll need to add this endpoint)
        await axios.put(financeApi.updateEvent(editingEvent.id), payload);
      } else {
        // Create new event
        await axios.post(financeApi.createEvent(), payload);
      }

      closeModal();
      fetchFinanceEvents();
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save finance event');
    }
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this finance event?')) {
      return;
    }

    try {
      await axios.delete(financeApi.deleteEvent(eventId));
      fetchFinanceEvents();
      setError('');
    } catch (err) {
      setError('Failed to delete finance event');
      console.log(err)
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Admin privileges required to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Finance Management</h1>
            <p className="text-gray-600">Manage finance events and verify payments</p>
          </div>
          {activeTab === 'events' && (
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Add Finance Event
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6 py-4">
              <button
                onClick={() => setActiveTab('events')}
                className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'events'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                Finance Events
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'payments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                Payment Verification
              </button>
            </nav>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Content */}
        {activeTab === 'events' ? (
          // Finance Events Table
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Finance Events</h2>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading finance events...</p>
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No finance events found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold">Title</th>
                        <th className="text-left py-3 px-4 font-semibold">Amount</th>
                        <th className="text-left py-3 px-4 font-semibold">Batch</th>
                        <th className="text-left py-3 px-4 font-semibold">Deadline</th>
                        <th className="text-left py-3 px-4 font-semibold">Created</th>
                        <th className="text-left py-3 px-4 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEvents.map((event) => (
                        <tr key={event.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">{event.title}</td>
                          <td className="py-3 px-4">৳{event.amount.toLocaleString()}</td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {event.batch}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {new Date(event.deadline).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            {new Date(event.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => openModal(event)}
                                className="p-1 text-blue-600 hover:text-blue-800"
                                title="Edit"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(event.id)}
                                className="p-1 text-red-600 hover:text-red-800"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Payment Verification Component
          <AdminPaymentVerification />
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 bg-opacity-50 backdrop-blur-lg flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingEvent ? 'Edit Finance Event' : 'Add Finance Event'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (BDT)
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch
                </label>
                <input
                  type="text"
                  name="batch"
                  value={formData.batch}
                  onChange={handleInputChange}
                  placeholder="e.g., 27, CSE-45"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deadline
                </label>
                <input
                  type="datetime-local"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingEvent ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}