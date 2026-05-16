import { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  Package, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  X,
  Check,
  AlertCircle,
  Users,
  Calendar,
  ArrowLeft
} from 'lucide-react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

function AdminEquipment() {
  const [activeView, setActiveView] = useState('equipment') // 'equipment' or 'orders'
  const [equipment, setEquipment] = useState([])
  const [studentOrders, setStudentOrders] = useState([])
  const [filteredEquipment, setFilteredEquipment] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('create') // 'create', 'edit', 'view'
  const [selectedEquipment, setSelectedEquipment] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity_available: 0,
    image_url: ''
  })

  useEffect(() => {
    fetchEquipment()
    fetchStudentOrders()
  }, [])

  useEffect(() => {
    filterData()
  }, [equipment, studentOrders, searchTerm, activeView]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchEquipment = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${BACKEND_URL}/admin/equipment/list`)
      setEquipment(response.data)
    } catch (err) {
      setError('Failed to fetch equipment')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchStudentOrders = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/admin/equipment/student-equipments/list-all`)
      setStudentOrders(response.data)
    } catch (err) {
      console.error('Failed to fetch student orders:', err)
    }
  }

  const filterData = () => {
    if (activeView === 'equipment') {
      let filtered = equipment
      if (searchTerm) {
        filtered = filtered.filter(item => 
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }
      setFilteredEquipment(filtered)
    } else {
      let filtered = studentOrders
      if (searchTerm) {
        filtered = filtered.filter(order => 
          order.id.toString().includes(searchTerm) ||
          order.student_id.toString().includes(searchTerm)
        )
      }
      setFilteredOrders(filtered)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity_available' ? parseInt(value) || 0 : value
    }))
  }

  const handleCreateEquipment = async (e) => {
    e.preventDefault()
    try {
      setError('')
      setSuccess('')
      
      await axios.post(`${BACKEND_URL}/admin/equipment/create`, formData)
      
      setSuccess('Equipment created successfully!')
      setShowModal(false)
      resetForm()
      fetchEquipment()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create equipment')
    }
  }

  const handleEditEquipment = async (e) => {
    e.preventDefault()
    try {
      setError('')
      setSuccess('')
      
      await axios.put(`${BACKEND_URL}/admin/equipment/edit?equipment_id=${selectedEquipment.id}`, formData)
      
      setSuccess('Equipment updated successfully!')
      setShowModal(false)
      resetForm()
      fetchEquipment()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update equipment')
    }
  }

  const handleDeleteEquipment = async (equipmentId) => {
    if (!window.confirm('Are you sure you want to delete this equipment? This action cannot be undone.')) {
      return
    }

    try {
      await axios.delete(`${BACKEND_URL}/admin/equipment/delete?equipment_id=${equipmentId}`)
      setSuccess('Equipment deleted successfully!')
      fetchEquipment()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete equipment')
    }
  }

  const handleAcceptReturn = async (orderId) => {
    try {
      await axios.post(`${BACKEND_URL}/admin/equipment/student-equipments/accept-return?order_id=${orderId}`)
      setSuccess('Equipment return accepted successfully!')
      fetchStudentOrders()
      fetchEquipment() // Refresh to update quantities
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to accept return')
    }
  }

  const openCreateModal = () => {
    setModalType('create')
    resetForm()
    setShowModal(true)
  }

  const openEditModal = (item) => {
    setModalType('edit')
    setSelectedEquipment(item)
    setFormData({
      name: item.name,
      description: item.description || '',
      quantity_available: item.quantity_available,
      image_url: item.image_url || ''
    })
    setShowModal(true)
  }

  const openViewModal = (item) => {
    setModalType('view')
    setSelectedEquipment(item)
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      quantity_available: 0,
      image_url: ''
    })
    setSelectedEquipment(null)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
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
          <h1 className="text-2xl font-bold text-gray-900">Equipment Management</h1>
          <p className="text-gray-600 mt-1">Manage laboratory equipment and student orders</p>
        </div>
        <div className="flex items-center gap-3">
          {activeView === 'equipment' && (
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Add Equipment
            </button>
          )}
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

      {/* View Toggle */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveView('equipment')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeView === 'equipment'
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Package size={18} />
            Equipment Inventory
          </button>
          <button
            onClick={() => setActiveView('orders')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeView === 'orders'
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Users size={18} />
            Student Orders
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder={
              activeView === 'equipment' 
                ? "Search equipment by name or description..." 
                : "Search orders by ID or student ID..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Equipment View */}
      {activeView === 'equipment' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEquipment.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-lg border border-gray-200">
              <Package size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No equipment found</p>
              <button
                onClick={openCreateModal}
                className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
              >
                Add your first equipment
              </button>
            </div>
          ) : (
            filteredEquipment.map((item) => (
              <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                        <Package size={32} className="text-gray-400" />
                      </div>
                    )}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.name}</h3>
                    <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Available:</span>
                      <span className={`font-semibold ${
                        item.quantity_available > 10 ? 'text-green-600' : 
                        item.quantity_available > 0 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {item.quantity_available} units
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openViewModal(item)}
                    className="flex-1 text-blue-600 hover:text-blue-800 p-2 rounded border border-blue-200 hover:bg-blue-50 transition-colors"
                  >
                    <Eye size={16} className="mx-auto" />
                  </button>
                  <button
                    onClick={() => openEditModal(item)}
                    className="flex-1 text-yellow-600 hover:text-yellow-800 p-2 rounded border border-yellow-200 hover:bg-yellow-50 transition-colors"
                  >
                    <Edit size={16} className="mx-auto" />
                  </button>
                  <button
                    onClick={() => handleDeleteEquipment(item.id)}
                    className="flex-1 text-red-600 hover:text-red-800 p-2 rounded border border-red-200 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={16} className="mx-auto" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Student Orders View */}
      {activeView === 'orders' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No student orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Equipment ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.student_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.equipment_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} className="text-gray-400" />
                          <span>{formatDate(order.start_date)} - {formatDate(order.end_date)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.returned 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.returned ? 'Returned' : 'In Use'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {!order.returned && (
                          <button
                            onClick={() => handleAcceptReturn(order.id)}
                            className="text-green-600 hover:text-green-900 flex items-center gap-1"
                            title="Accept Return"
                          >
                            <Check size={16} />
                            Accept Return
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 bg-opacity-50 backdrop-blur-lg flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {modalType === 'create' && 'Add New Equipment'}
                  {modalType === 'edit' && 'Edit Equipment'}
                  {modalType === 'view' && 'Equipment Details'}
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
                  {selectedEquipment?.image_url && (
                    <img
                      src={selectedEquipment.image_url}
                      alt={selectedEquipment.name}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold">{selectedEquipment?.name}</h3>
                    <p className="text-gray-600 mt-2">{selectedEquipment?.description}</p>
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Available Quantity: </span>
                      <span className="font-semibold">{selectedEquipment?.quantity_available} units</span>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={modalType === 'create' ? handleCreateEquipment : handleEditEquipment} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Equipment Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
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
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Available Quantity *
                    </label>
                    <input
                      type="number"
                      name="quantity_available"
                      value={formData.quantity_available}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Image URL
                    </label>
                    <input
                      type="url"
                      name="image_url"
                      value={formData.image_url}
                      onChange={handleInputChange}
                      placeholder="https://example.com/image.jpg"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {modalType === 'create' ? 'Create Equipment' : 'Update Equipment'}
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

export default AdminEquipment