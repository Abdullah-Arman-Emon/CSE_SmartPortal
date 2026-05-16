import { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  Calendar, 
  Clock, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  X,
  MapPin,
  Users,
  BookOpen,
  AlertCircle
} from 'lucide-react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

function AdminExam() {
  const [exams, setExams] = useState([])
  const [filteredExams, setFilteredExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBatch, setFilterBatch] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterRoom, setFilterRoom] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('create') // 'create', 'edit', 'view'
  const [selectedExam, setSelectedExam] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    date: '',
    duration: 180, // Default 3 hours
    batch: '',
    room: '',
    type: 'Midterm'
  })

  const examTypes = ['Midterm', 'Final']

  useEffect(() => {
    fetchExams()
  }, [])

  useEffect(() => {
    filterExams()
  }, [exams, searchTerm, filterBatch, filterType, filterRoom]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchExams = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${BACKEND_URL}/admin/exams/list`)
      setExams(response.data)
    } catch (err) {
      setError('Failed to fetch exams')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filterExams = () => {
    let filtered = exams

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(exam => 
        exam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.room?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.batch.toString().includes(searchTerm)
      )
    }

    // Filter by batch
    if (filterBatch !== 'all') {
      filtered = filtered.filter(exam => exam.batch.toString() === filterBatch)
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(exam => exam.type === filterType)
    }

    // Filter by room
    if (filterRoom !== 'all') {
      filtered = filtered.filter(exam => exam.room === filterRoom)
    }

    setFilteredExams(filtered)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'batch' || name === 'duration' ? parseInt(value) || 0 : value
    }))
  }

  const handleCreateExam = async (e) => {
    e.preventDefault()
    try {
      setError('')
      setSuccess('')
      
      // Convert date to ISO format for backend
      const examData = {
        ...formData,
        date: new Date(formData.date).toISOString()
      }
      
      await axios.post(`${BACKEND_URL}/admin/exams/create`, examData)
      
      setSuccess('Exam created successfully!')
      setShowModal(false)
      resetForm()
      fetchExams()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create exam')
    }
  }

  const handleDeleteExam = async (examId) => {
    if (!window.confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
      return
    }

    try {
      await axios.delete(`${BACKEND_URL}/admin/exams/delete/${examId}`)
      setSuccess('Exam deleted successfully!')
      fetchExams()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete exam')
    }
  }

  const openCreateModal = () => {
    setModalType('create')
    resetForm()
    setShowModal(true)
  }

  const openViewModal = (exam) => {
    setModalType('view')
    setSelectedExam(exam)
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      date: '',
      duration: 180,
      batch: '',
      room: '',
      type: 'Midterm'
    })
    setSelectedExam(null)
  }

  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString)
    return {
      date: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      full: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
  }

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins}m`
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}m`
  }

  const getUniqueBatches = () => {
    const batches = exams.map(exam => exam.batch.toString())
    return [...new Set(batches)].sort()
  }

  const getUniqueRooms = () => {
    const rooms = exams.map(exam => exam.room).filter(Boolean)
    return [...new Set(rooms)].sort()
  }

  const getExamTypeColor = (type) => {
    switch (type) {
      case 'Midterm':
        return 'bg-blue-100 text-blue-800'
      case 'Final':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const isExamSoon = (examDate) => {
    const now = new Date()
    const exam = new Date(examDate)
    const diffHours = (exam - now) / (1000 * 60 * 60)
    return diffHours <= 24 && diffHours > 0
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
          <h1 className="text-2xl font-bold text-gray-900">Exam Management</h1>
          <p className="text-gray-600 mt-1">Schedule and manage upcoming exams</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Schedule Exam
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Exams</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{exams.length}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <Calendar size={24} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Midterm Exams</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {exams.filter(exam => exam.type === 'Midterm').length}
              </p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <BookOpen size={24} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Final Exams</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {exams.filter(exam => exam.type === 'Final').length}
              </p>
            </div>
            <div className="bg-red-500 p-3 rounded-lg">
              <BookOpen size={24} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Exams Soon</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {exams.filter(exam => isExamSoon(exam.date)).length}
              </p>
            </div>
            <div className="bg-orange-500 p-3 rounded-lg">
              <AlertCircle size={24} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search exams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filterBatch}
            onChange={(e) => setFilterBatch(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Batches</option>
            {getUniqueBatches().map(batch => (
              <option key={batch} value={batch}>Batch {batch}</option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            {examTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select
            value={filterRoom}
            onChange={(e) => setFilterRoom(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Rooms</option>
            {getUniqueRooms().map(room => (
              <option key={room} value={room}>{room}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Exams List */}
      <div className="grid gap-4">
        {filteredExams.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No exams found matching your criteria</p>
            <button
              onClick={openCreateModal}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
            >
              Schedule your first exam
            </button>
          </div>
        ) : (
          filteredExams.map((exam) => {
            const { date, time } = formatDateTime(exam.date)
            const isSoon = isExamSoon(exam.date)
            
            return (
              <div key={exam.id} className={`bg-white rounded-lg border p-6 hover:shadow-md transition-shadow ${
                isSoon ? 'border-orange-300 bg-orange-50' : 'border-gray-200'
              }`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{exam.name}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getExamTypeColor(exam.type)}`}>
                        {exam.type}
                      </span>
                      {isSoon && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          <AlertCircle size={12} className="mr-1" />
                          Soon
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <div>
                          <div className="font-medium">{date}</div>
                          <div className="text-xs">{time}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-gray-400" />
                        <span>{formatDuration(exam.duration)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-gray-400" />
                        <span>Batch {exam.batch}</span>
                      </div>

                      {exam.room && (
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-gray-400" />
                          <span>{exam.room}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => openViewModal(exam)}
                      className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteExam(exam.id)}
                      className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50"
                      title="Delete Exam"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 bg-opacity-50 backdrop-blur-lg flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {modalType === 'create' && 'Schedule New Exam'}
                  {modalType === 'view' && 'Exam Details'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              {modalType === 'view' ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedExam?.name}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getExamTypeColor(selectedExam?.type)}`}>
                      {selectedExam?.type} Exam
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Calendar size={20} className="text-gray-400" />
                      <div>
                        <div className="font-medium">{formatDateTime(selectedExam?.date).full}</div>
                        <div className="text-sm text-gray-500">{formatDateTime(selectedExam?.date).time}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Clock size={20} className="text-gray-400" />
                      <span>{formatDuration(selectedExam?.duration)}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Users size={20} className="text-gray-400" />
                      <span>Batch {selectedExam?.batch}</span>
                    </div>

                    {selectedExam?.room && (
                      <div className="flex items-center gap-3">
                        <MapPin size={20} className="text-gray-400" />
                        <span>{selectedExam.room}</span>
                      </div>
                    )}
                  </div>

                  {isExamSoon(selectedExam?.date) && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-orange-800">
                        <AlertCircle size={16} />
                        <span className="text-sm font-medium">This exam is scheduled within 24 hours!</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleCreateExam} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Exam Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g., Database Systems Midterm"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duration (minutes) *
                      </label>
                      <input
                        type="number"
                        name="duration"
                        value={formData.duration}
                        onChange={handleInputChange}
                        min="30"
                        max="480"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Batch *
                      </label>
                      <input
                        type="number"
                        name="batch"
                        value={formData.batch}
                        onChange={handleInputChange}
                        placeholder="e.g., 2021"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Exam Type *
                      </label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        {examTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Room
                      </label>
                      <input
                        type="text"
                        name="room"
                        value={formData.room}
                        onChange={handleInputChange}
                        placeholder="e.g., Room 301"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Schedule Exam
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminExam