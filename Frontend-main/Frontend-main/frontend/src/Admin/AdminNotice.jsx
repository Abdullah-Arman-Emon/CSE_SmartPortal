import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  Bell,
  Calendar,
  Users,
  User,
  Building,
  GraduationCap,
  UserCheck,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  X,
  AlertCircle,
  CheckCircle,
  Loader,
  FileText,
  Paperclip,
  Clock
} from 'lucide-react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

function AdminNotice() {
  const [notices, setNotices] = useState([])
  const [filteredNotices, setFilteredNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedNotice, setSelectedNotice] = useState(null)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [batchFilter, setBatchFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  
  // Form state for create
  const [formData, setFormData] = useState({
    title: '',
    sub_title: '',
    content: '',
    batch: '',
    date: '',
    notice_from: 'Admin',
    attachments: []
  })

  // Notice source options
  const noticeSourceOptions = [
    { value: 'Chairman', label: 'Chairman', icon: UserCheck },
    { value: 'Admin', label: 'Admin', icon: User },
    { value: 'Student-Club', label: 'Student Club', icon: Users },
    { value: 'Department', label: 'Department', icon: Building },
    { value: 'Central', label: 'Central', icon: GraduationCap }
  ]

  // Batch options (assuming batches 1-32)
  const batchOptions = Array.from({ length: 31 }, (_, i) => 1 + i)

  // Fetch all notices
  const fetchNotices = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${BACKEND_URL}/admin/notices/all`)
      
      // Sort notices by date and time (newest first)
      const sortedNotices = response.data.sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
      });
      
      setNotices(sortedNotices)
      setFilteredNotices(sortedNotices)
      setError('')
    } catch (err) {
      setError('Failed to fetch notices')
      console.error('Error fetching notices:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotices()
  }, [])

  // Filter notices based on search term, batch, and source
  useEffect(() => {
    let filtered = notices

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(notice =>
        notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notice.sub_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notice.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Batch filter
    if (batchFilter) {
      const batch = parseInt(batchFilter)
      filtered = filtered.filter(notice => 
        notice.batch === batch || notice.batch === null
      )
    }

    // Source filter
    if (sourceFilter) {
      filtered = filtered.filter(notice =>
        notice.notice_from === sourceFilter
      )
    }

    setFilteredNotices(filtered)
  }, [notices, searchTerm, batchFilter, sourceFilter])

  // Get source icon
  const getSourceIcon = (source) => {
    const option = noticeSourceOptions.find(opt => opt.value === source)
    return option ? option.icon : Bell
  }

  // Get source color
  const getSourceColor = (source) => {
    switch (source) {
      case 'Chairman': return 'bg-purple-100 text-purple-800'
      case 'Admin': return 'bg-blue-100 text-blue-800'
      case 'Student-Club': return 'bg-green-100 text-green-800'
      case 'Department': return 'bg-orange-100 text-orange-800'
      case 'Central': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      sub_title: '',
      content: '',
      batch: '',
      date: '',
      notice_from: 'Admin',
      attachments: []
    })
  }

  // Create notice
  const handleCreateNotice = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      
      // Prepare data with proper datetime format
      const noticeData = {
        ...formData,
        date: formData.date ? new Date(formData.date).toISOString() : null,
        batch: formData.batch ? parseInt(formData.batch) : null
      }

      await axios.post(`${BACKEND_URL}/admin/notices/create`, noticeData)
      setSuccess('Notice created successfully!')
      setShowCreateModal(false)
      resetForm()
      fetchNotices()
    } catch (err) {
      setError('Failed to create notice')
      console.error('Error creating notice:', err)
    } finally {
      setLoading(false)
    }
  }

  // Delete notice
  const handleDeleteNotice = async (noticeId) => {
    if (window.confirm('Are you sure you want to delete this notice?')) {
      try {
        setLoading(true)
        await axios.delete(`${BACKEND_URL}/admin/notices/delete/${noticeId}`)
        setSuccess('Notice deleted successfully!')
        fetchNotices()
      } catch (err) {
        setError('Failed to delete notice')
        console.error('Error deleting notice:', err)
      } finally {
        setLoading(false)
      }
    }
  }

  // Open view modal
  const openViewModal = (notice) => {
    setSelectedNotice(notice)
    setShowViewModal(true)
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleString()
  }

  // Check if notice is urgent (within 24 hours)
  const isUrgent = (notice) => {
    const now = new Date()
    const noticeDate = new Date(notice.date)
    const diffHours = (noticeDate - now) / (1000 * 60 * 60)
    return diffHours <= 24 && diffHours > 0
  }

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('')
        setError('')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [success, error])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notice Management</h1>
          <p className="text-gray-600 mt-1">Manage university notices and announcements</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Create Notice
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle size={20} />
          {success}
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search notices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Batch Filter */}
          <select
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Batches</option>
            <option value="">General (All Batches)</option>
            {batchOptions.map(batch => (
              <option key={batch} value={batch}>Batch {batch}</option>
            ))}
          </select>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Sources</option>
            {noticeSourceOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchTerm('')
              setBatchFilter('')
              setSourceFilter('')
            }}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Notices List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader className="animate-spin text-blue-600" size={32} />
          </div>
        ) : filteredNotices.length === 0 ? (
          <div className="text-center py-12">
            <Bell size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Notices Found</h3>
            <p className="text-gray-600 mb-4">
              {notices.length === 0 
                ? "Get started by creating your first notice." 
                : "Try adjusting your filters to see more notices."}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Create Notice
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredNotices.map((notice) => {
              const SourceIcon = getSourceIcon(notice.notice_from)
              const urgent = isUrgent(notice)
              
              return (
                <div key={notice.id} className={`p-6 hover:bg-gray-50 transition-colors ${urgent ? 'border-l-4 border-red-500' : ''}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{notice.title}</h3>
                        {urgent && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                            Urgent
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSourceColor(notice.notice_from)}`}>
                          {notice.notice_from}
                        </span>
                        {notice.batch && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            Batch {notice.batch}
                          </span>
                        )}
                      </div>
                      
                      {notice.sub_title && (
                        <p className="text-gray-700 font-medium mb-2">{notice.sub_title}</p>
                      )}
                      
                      <p className="text-gray-600 mb-3 line-clamp-2">{notice.content}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} />
                          <span>Date: {formatDate(notice.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <SourceIcon size={16} />
                          <span>From: {notice.notice_from}</span>
                        </div>
                      </div>

                      {/* Attachments indicator */}
                      {notice.attachments && Object.keys(notice.attachments).length > 0 && (
                        <div className="flex items-center gap-2 mt-3 text-blue-600">
                          <Paperclip size={16} />
                          <span className="text-sm">Has Attachments</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => openViewModal(notice)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteNotice(notice.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Notice"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create Notice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/20 bg-opacity-50 backdrop-blur-lg flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Create New Notice</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateNotice} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notice Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter notice title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sub Title
                  </label>
                  <input
                    type="text"
                    name="sub_title"
                    value={formData.sub_title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter sub title (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notice Content *
                  </label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter notice content"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Batch
                    </label>
                    <select
                      name="batch"
                      value={formData.batch}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Batches</option>
                      {batchOptions.map(batch => (
                        <option key={batch} value={batch}>Batch {batch}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notice From *
                    </label>
                    <select
                      name="notice_from"
                      value={formData.notice_from}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {noticeSourceOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notice Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Notice'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Notice Modal */}
      {showViewModal && selectedNotice && (
        <div className="fixed inset-0 bg-black/20 bg-opacity-50 backdrop-blur-lg flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Notice Details</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Notice Header */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-2xl font-bold text-gray-900">{selectedNotice.title}</h3>
                    {isUrgent(selectedNotice) && (
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                        Urgent
                      </span>
                    )}
                  </div>
                  
                  {selectedNotice.sub_title && (
                    <p className="text-lg text-gray-700 font-medium mb-4">{selectedNotice.sub_title}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSourceColor(selectedNotice.notice_from)}`}>
                      {selectedNotice.notice_from}
                    </span>
                    {selectedNotice.batch && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        Batch {selectedNotice.batch}
                      </span>
                    )}
                  </div>
                </div>

                {/* Notice Content */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Content</h4>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedNotice.content}</p>
                </div>

                {/* Notice Details */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar size={20} className="text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">Notice Date & Time</p>
                      <p className="text-gray-600">{formatDate(selectedNotice.date)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {React.createElement(getSourceIcon(selectedNotice.notice_from), { size: 20, className: "text-green-600" })}
                    <div>
                      <p className="font-medium text-gray-900">Notice From</p>
                      <p className="text-gray-600">{selectedNotice.notice_from}</p>
                    </div>
                  </div>

                  {selectedNotice.batch && (
                    <div className="flex items-center gap-3">
                      <Users size={20} className="text-purple-600" />
                      <div>
                        <p className="font-medium text-gray-900">Target Batch</p>
                        <p className="text-gray-600">Batch {selectedNotice.batch}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Attachments */}
                {selectedNotice.attachments && Object.keys(selectedNotice.attachments).length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Attachments</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <Paperclip size={20} className="text-blue-600" />
                        <div>
                          <p className="font-medium text-gray-900">Attachment Files</p>
                          <p className="text-gray-600">{Object.keys(selectedNotice.attachments).length} file(s) attached</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminNotice