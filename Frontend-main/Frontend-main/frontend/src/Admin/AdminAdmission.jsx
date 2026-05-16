import { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Trash2, 
  Calendar,
  Mail,
  GraduationCap,
  FileText,
  User,
  Building
} from 'lucide-react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

function AdminAdmission() {
  const [applications, setApplications] = useState([])
  const [filteredApplications, setFilteredApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterProgram, setFilterProgram] = useState('all')
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchApplications()
  }, [])

  useEffect(() => {
    filterApplications()
  }, [applications, searchTerm, filterProgram]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${BACKEND_URL}/admin/admission/list`)
      setApplications(response.data)
    } catch (err) {
      setError('Failed to fetch admission applications')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filterApplications = () => {
    let filtered = applications

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(app => 
        app.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.program.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by program
    if (filterProgram !== 'all') {
      filtered = filtered.filter(app => app.program === filterProgram)
    }

    setFilteredApplications(filtered)
  }

  const handleDeleteApplication = async (applicationId) => {
    if (!window.confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
      return
    }

    try {
      await axios.delete(`${BACKEND_URL}/admin/admission/delete/${applicationId}`)
      setSuccess('Application deleted successfully')
      fetchApplications()
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete application')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleViewApplication = (application) => {
    setSelectedApplication(application)
    setShowModal(true)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getUniquePrograms = () => {
    const programs = applications.map(app => app.program)
    return [...new Set(programs)]
  }

  const exportToCSV = () => {
    const headers = [
      'Name', 'Email', 'Program', 'Date of Birth', 'Highest Qualification',
      'Institution', 'Field of Study', 'Graduation Date', 'Grade/GPA', 'Submitted On'
    ]
    
    const csvData = filteredApplications.map(app => [
      `${app.first_name} ${app.last_name}`,
      app.email,
      app.program,
      formatDate(app.date_of_birth),
      app.highest_qualification,
      app.institution_name,
      app.field_of_study,
      formatDate(app.graduation_date),
      app.grade_gpa || 'N/A',
      formatDate(app.form_given_on)
    ])

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `admission_applications_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
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
          <h1 className="text-2xl font-bold text-gray-900">Admission Management</h1>
          <p className="text-gray-600 mt-1">Manage and review admission applications</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {filteredApplications.length} of {applications.length} applications
          </span>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download size={20} />
            Export CSV
          </button>
        </div>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Applications</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{applications.length}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <Users size={24} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Programs Applied</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{getUniquePrograms().length}</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <GraduationCap size={24} className="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Recent Applications</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {applications.filter(app => {
                  const submittedDate = new Date(app.form_given_on)
                  const sevenDaysAgo = new Date()
                  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
                  return submittedDate >= sevenDaysAgo
                }).length}
              </p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <Calendar size={24} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, email, or program..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={filterProgram}
              onChange={(e) => setFilterProgram(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Programs</option>
              {getUniquePrograms().map(program => (
                <option key={program} value={program}>{program}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filteredApplications.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No applications found matching your criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applicant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Program
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Education
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredApplications.map((application) => (
                  <tr key={application.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {application.profile_image ? (
                          <img
                            src={application.profile_image}
                            alt={`${application.first_name} ${application.last_name}`}
                            className="w-10 h-10 rounded-full object-cover mr-4"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center mr-4">
                            <User size={20} className="text-gray-600" />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {application.first_name} {application.last_name}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail size={14} />
                            {application.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {application.program}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-1">
                        <Building size={14} className="text-gray-400" />
                        <span>{application.highest_qualification}</span>
                      </div>
                      <div className="text-xs text-gray-500">{application.institution_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} className="text-gray-400" />
                        {formatDate(application.form_given_on)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewApplication(application)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteApplication(application.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="Delete Application"
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

      {/* Application Details Modal */}
      {showModal && selectedApplication && (
        <div className="fixed inset-0 bg-black/20 bg-opacity-50 backdrop-blur-lg flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Application Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Personal Information</h3>
                  
                  <div className="flex items-center gap-4">
                    {selectedApplication.profile_image ? (
                      <img
                        src={selectedApplication.profile_image}
                        alt={`${selectedApplication.first_name} ${selectedApplication.last_name}`}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center">
                        <User size={32} className="text-gray-600" />
                      </div>
                    )}
                    <div>
                      <p className="text-xl font-medium">{selectedApplication.first_name} {selectedApplication.last_name}</p>
                      <p className="text-gray-600">{selectedApplication.email}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-600">Date of Birth</p>
                    <p className="text-gray-900">{formatDate(selectedApplication.date_of_birth)}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-600">Program Applied</p>
                    <p className="text-gray-900">{selectedApplication.program}</p>
                  </div>
                </div>

                {/* Educational Background */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Educational Background</h3>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-600">Highest Qualification</p>
                    <p className="text-gray-900">{selectedApplication.highest_qualification}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-600">Institution</p>
                    <p className="text-gray-900">{selectedApplication.institution_name}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-600">Field of Study</p>
                    <p className="text-gray-900">{selectedApplication.field_of_study}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-600">Graduation Date</p>
                    <p className="text-gray-900">{formatDate(selectedApplication.graduation_date)}</p>
                  </div>

                  {selectedApplication.grade_gpa && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Grade/GPA</p>
                      <p className="text-gray-900">{selectedApplication.grade_gpa}</p>
                    </div>
                  )}
                </div>

                {/* Documents */}
                <div className="col-span-1 md:col-span-2 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Submitted Documents</h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Required Documents', value: selectedApplication.required_doc },
                      { label: 'Transcript', value: selectedApplication.transcript },
                      { label: 'Recommendation Letter', value: selectedApplication.recommendation_letter },
                      { label: 'Personal Essay', value: selectedApplication.personal_essay }
                    ].map((doc, index) => (
                      <div key={index} className="text-center">
                        <div className={`w-full p-4 rounded-lg border-2 border-dashed ${
                          doc.value ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-gray-50'
                        }`}>
                          <FileText size={24} className={`mx-auto mb-2 ${
                            doc.value ? 'text-green-600' : 'text-gray-400'
                          }`} />
                          <p className="text-xs font-medium text-gray-600">{doc.label}</p>
                          <p className={`text-xs mt-1 ${
                            doc.value ? 'text-green-600' : 'text-gray-400'
                          }`}>
                            {doc.value ? 'Submitted' : 'Not Submitted'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Application Info */}
                <div className="col-span-1 md:col-span-2">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">
                      <strong>Application Submitted:</strong> {formatDate(selectedApplication.form_given_on)}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      <strong>Application ID:</strong> #{selectedApplication.id}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleDeleteApplication(selectedApplication.id)
                    setShowModal(false)
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminAdmission