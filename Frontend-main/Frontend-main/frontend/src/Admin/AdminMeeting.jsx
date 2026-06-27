import { useState, useEffect } from 'react'
import axios from 'axios'
import { Calendar, Clock, Users, Plus, X, Trash2, ExternalLink, UserCheck } from 'lucide-react'

import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

function AdminMeeting() {
  const [meetings, setMeetings] = useState([])
  const [acceptedTeachers, setAcceptedTeachers] = useState({})
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date_time: '',
    meeting_url: '',
    created_by: null
  })

  const { user } = useContext(AuthContext);

  useEffect(() => {
    const loadData = async () => {
      await fetchUpcomingMeetings()
      if (user && user?.id) {
        setFormData(prev => ({ ...prev, created_by: user.id }))
      }
    }
    loadData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUpcomingMeetings = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${BACKEND_URL}/v1/meetings/upcoming`)
      setMeetings(response.data)
      
      // Fetch accepted teachers for each meeting
      for (const meeting of response.data) {
        fetchAcceptedTeachers(meeting.id)
      }
    } catch (err) {
      setError('Failed to fetch meetings')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchAcceptedTeachers = async (meetingId) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/v1/meetings/${meetingId}/accepted`)
      setAcceptedTeachers(prev => ({
        ...prev,
        [meetingId]: response.data
      }))
    } catch (err) {
      console.error('Failed to fetch accepted teachers:', err)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCreateMeeting = async (e) => {
    e.preventDefault()
    try {
      setError('')
      setSuccess('')
      
      await axios.post(`${BACKEND_URL}/v1/meetings/create`, formData)
      
      setSuccess('Meeting created successfully!')
      setShowCreateForm(false)
      setFormData({
        title: '',
        description: '',
        date_time: '',
        meeting_url: '',
        created_by: formData.created_by
      })
      
      // Refresh meetings list
      fetchUpcomingMeetings()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create meeting')
    }
  }

  const handleDeleteMeeting = async (meetingId) => {
    if (!window.confirm('Are you sure you want to delete this meeting?')) {
      return
    }

    try {
      await axios.delete(`${BACKEND_URL}/v1/meetings/delete/${meetingId}?user_id=${user?.id}`)
      
      setSuccess('Meeting deleted successfully!')
      fetchUpcomingMeetings()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete meeting')
    }
  }

  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meeting Management</h1>
          <p className="text-gray-600 mt-1">Create and manage departmental meetings</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Create Meeting
        </button>
      </div>

      {/* Success/Error Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Create Meeting Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/20 bg-opacity-50 backdrop-blur-lg flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create New Meeting</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  name="date_time"
                  value={formData.date_time}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting URL
                </label>
                <input
                  type="url"
                  name="meeting_url"
                  value={formData.meeting_url}
                  onChange={handleInputChange}
                  placeholder="https://meet.google.com/..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Meeting
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Meetings List */}
      <div className="grid gap-4">
        {meetings.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No upcoming meetings scheduled</p>
          </div>
        ) : (
          meetings.map((meeting) => {
            const { date, time } = formatDateTime(meeting.date_time)
            const teachers = acceptedTeachers[meeting.id] || []
            
            return (
              <div key={meeting.id} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {meeting.title}
                    </h3>
                    <p className="text-gray-600 mb-3">
                      {meeting.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar size={16} />
                        {date}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={16} />
                        {time}
                      </div>
                      <div className="flex items-center gap-1">
                        <UserCheck size={16} />
                        {teachers.length} teacher{teachers.length !== 1 ? 's' : ''} accepted
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <a
                      href={meeting.meeting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <ExternalLink size={16} />
                      Join Meeting
                    </a>
                    <button
                      onClick={() => handleDeleteMeeting(meeting.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Accepted Teachers */}
                {teachers.length > 0 && (
                  <div className="border-t border-gray-100 pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Teachers who will attend:
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {teachers.map((teacher) => (
                        <div key={teacher.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                          {teacher.profile_image ? (
                            <img
                              src={teacher.profile_image}
                              alt={`${teacher.first_name} ${teacher.last_name}`}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                              <Users size={16} className="text-gray-600" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {teacher.first_name} {teacher.last_name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {teacher.department} • {teacher.work}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default AdminMeeting