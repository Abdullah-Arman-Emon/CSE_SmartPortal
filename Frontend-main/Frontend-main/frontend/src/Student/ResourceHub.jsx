import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
    Package,
    Calendar,
    Clock,
    Plus,
    History,
    CheckCircle,
    XCircle,
    Search,
    Filter,
    AlertCircle,
    User,
    Hash,
    ArrowLeft,
} from "lucide-react";


import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

console.log("BACKEND_URL:", BACKEND_URL);

const ResourceHub = () => {

    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("browse");
    const [equipments, setEquipments] = useState([]);
    const [myOrders, setMyOrders] = useState([]);
    const [orderHistory, setOrderHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");


    // Order form state
    const [selectedEquipment, setSelectedEquipment] = useState(null);
    const [orderQuantity, setOrderQuantity] = useState(1);
    const [endDate, setEndDate] = useState("");
    const [showOrderModal, setShowOrderModal] = useState(false);

    // Get current user - with better error handling
    const { user } = useContext(AuthContext);
    let studentId = user?.id; // Default fallback

    useEffect(() => {
        const fetchMyOrdersInternal = async () => {
            if (!studentId) {
                setError("Student ID not found. Please log in again.");
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const response = await axios.get(
                    `${BACKEND_URL}/student/equipment/equipment/my-orders`,
                    {
                        params: { student_id: studentId },
                    }
                );
                setMyOrders(response.data);
            } catch (error) {
                console.error("Error fetching my orders:", error);
                setError("Failed to load your orders. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        const fetchOrderHistoryInternal = async () => {
            if (!studentId) {
                setError("Student ID not found. Please log in again.");
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const response = await axios.get(
                    `${BACKEND_URL}/student/equipment/equipment/my-order-history`,
                    {
                        params: { student_id: studentId },
                    }
                );
                setOrderHistory(response.data);
            } catch (error) {
                console.error("Error fetching order history:", error);
                setError("Failed to load order history. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        if (activeTab === "browse") {
            fetchEquipments();
        } else if (activeTab === "orders") {
            fetchMyOrdersInternal();
        } else if (activeTab === "history") {
            fetchOrderHistoryInternal();
        }
    }, [activeTab, studentId]);

    const fetchEquipments = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log(
                "Fetching equipments from:",
                `${BACKEND_URL}/student/equipment/equipments`
            );
            const response = await axios.get(
                `${BACKEND_URL}/student/equipment/equipments`
            );
            console.log("Equipments response:", response.data);
            setEquipments(response.data);
        } catch (error) {
            console.error("Error fetching equipments:", error);
            setError("Failed to load equipments. Please try again.");
            // Set some mock data for testing
            setEquipments([
                {
                    id: 1,
                    name: "Test Equipment",
                    description: "This is test equipment",
                    category: "Electronics",
                    quantity_available: 5,
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handlePlaceOrder = async () => {
        if (!studentId) {
            setError("Student ID not found. Please log in again.");
            return;
        }

        if (!endDate) {
            setError("Please select an end date for the equipment rental.");
            return;
        }

        if (
            orderQuantity < 1 ||
            orderQuantity > selectedEquipment.quantity_available
        ) {
            setError(
                `Please enter a quantity between 1 and ${selectedEquipment.quantity_available}.`
            );
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const orderData = {
                student_id: studentId,
                equipment_id: selectedEquipment.id,
                quantity: orderQuantity,
                end_date: endDate,
            };

            await axios.post(
                `${BACKEND_URL}/student/equipment/equipment/place-order`,
                orderData
            );

            // Reset form and close modal
            setShowOrderModal(false);
            setSelectedEquipment(null);
            setOrderQuantity(1);
            setEndDate("");

            // Refresh equipments list
            fetchEquipments();

            // Show success message
            alert("Order placed successfully!");
        } catch (error) {
            console.error("Error placing order:", error);
            setError(
                error.response?.data?.detail ||
                    "Failed to place order. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const openOrderModal = (equipment) => {
        setSelectedEquipment(equipment);
        setOrderQuantity(1);
        setEndDate("");
        setShowOrderModal(true);
        setError(null);
    };

    const closeOrderModal = () => {
        setShowOrderModal(false);
        setSelectedEquipment(null);
        setOrderQuantity(1);
        setEndDate("");
        setError(null);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    // Filter equipments based on search and category
    const filteredEquipments = equipments.filter((equipment) => {
        const matchesSearch =
            equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            equipment.description
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase());
        const matchesCategory =
            filterCategory === "all" || equipment.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    // Get unique categories for filter
    const categories = [
        ...new Set(equipments.map((eq) => eq.category).filter(Boolean)),
    ];

    // If no backend URL, show error message
    if (!BACKEND_URL) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h2 className="text-lg font-semibold text-red-800 mb-2">
                        Configuration Error
                    </h2>
                    <p className="text-red-700">
                        Backend URL is not configured. Please check your
                        environment variables.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Resource Hub
                            </h1>
                            <p className="text-gray-600">
                                Browse and manage equipment rentals
                            </p>
                        </div>
                        <button
                            onClick={() => navigate("/student-dashboard")}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Dashboard
                        </button>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab("browse")}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === "browse"
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                            >
                                <Package className="inline-block w-4 h-4 mr-2" />
                                Browse Equipment
                            </button>
                            <button
                                onClick={() => setActiveTab("orders")}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === "orders"
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                            >
                                <Clock className="inline-block w-4 h-4 mr-2" />
                                My Orders
                            </button>
                            <button
                                onClick={() => setActiveTab("history")}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === "history"
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                            >
                                <History className="inline-block w-4 h-4 mr-2" />
                                Order History
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                        <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                        <span className="text-red-700">{error}</span>
                    </div>
                )}

                {/* Browse Equipment Tab */}
                {activeTab === "browse" && (
                    <div>
                        {/* Search and Filter */}
                        <div className="mb-6 flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search equipment..."
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <select
                                    value={filterCategory}
                                    onChange={(e) =>
                                        setFilterCategory(e.target.value)
                                    }
                                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="all">All Categories</option>
                                    {categories.map((category) => (
                                        <option key={category} value={category}>
                                            {category}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Equipment Grid */}
                        {loading ? (
                            <div className="flex justify-center items-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredEquipments.map((equipment) => (
                                    <div
                                        key={equipment.id}
                                        className="bg-white rounded-lg shadow-md overflow-hidden"
                                    >
                                        <div className="p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {equipment.name}
                                                </h3>
                                                <span
                                                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                        equipment.quantity_available >
                                                        0
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-red-100 text-red-800"
                                                    }`}
                                                >
                                                    {equipment.quantity_available >
                                                    0
                                                        ? "Available"
                                                        : "Out of Stock"}
                                                </span>
                                            </div>

                                            {equipment.description && (
                                                <p className="text-gray-600 text-sm mb-4">
                                                    {equipment.description}
                                                </p>
                                            )}

                                            <div className="space-y-2 mb-4">
                                                {equipment.category && (
                                                    <div className="flex items-center text-sm text-gray-500">
                                                        <Package className="w-4 h-4 mr-2" />
                                                        Category:{" "}
                                                        {equipment.category}
                                                    </div>
                                                )}
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <Hash className="w-4 h-4 mr-2" />
                                                    Available:{" "}
                                                    {
                                                        equipment.quantity_available
                                                    }{" "}
                                                    units
                                                </div>
                                            </div>

                                            <button
                                                onClick={() =>
                                                    openOrderModal(equipment)
                                                }
                                                disabled={
                                                    equipment.quantity_available ===
                                                    0
                                                }
                                                className={`w-full flex items-center justify-center px-4 py-2 rounded-lg font-medium ${
                                                    equipment.quantity_available >
                                                    0
                                                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                                                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                }`}
                                            >
                                                <Plus className="w-4 h-4 mr-2" />
                                                {equipment.quantity_available >
                                                0
                                                    ? "Place Order"
                                                    : "Out of Stock"}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* My Orders Tab */}
                {activeTab === "orders" && (
                    <div>
                        {loading ? (
                            <div className="flex justify-center items-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                            </div>
                        ) : myOrders.length === 0 ? (
                            <div className="text-center py-12">
                                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    No Active Orders
                                </h3>
                                <p className="text-gray-500">
                                    You don't have any active equipment orders.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {myOrders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="bg-white rounded-lg shadow-md p-6"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                    Order #{order.id}
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                                                    <div className="flex items-center">
                                                        <Package className="w-4 h-4 mr-2" />
                                                        Equipment ID:{" "}
                                                        {order.equipment_id}
                                                    </div>
                                                    <div className="flex items-center">
                                                        <Hash className="w-4 h-4 mr-2" />
                                                        Quantity:{" "}
                                                        {order.quantity}
                                                    </div>
                                                    <div className="flex items-center">
                                                        <Calendar className="w-4 h-4 mr-2" />
                                                        Started:{" "}
                                                        {formatDate(
                                                            order.start_date
                                                        )}
                                                    </div>
                                                    <div className="flex items-center">
                                                        <Calendar className="w-4 h-4 mr-2" />
                                                        Due:{" "}
                                                        {formatDate(
                                                            order.end_date
                                                        )}
                                                    </div>
                                                    <div className="flex items-center">
                                                        <User className="w-4 h-4 mr-2" />
                                                        Student ID:{" "}
                                                        {order.student_id}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                                                    Active
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Order History Tab */}
                {activeTab === "history" && (
                    <div>
                        {loading ? (
                            <div className="flex justify-center items-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                            </div>
                        ) : orderHistory.length === 0 ? (
                            <div className="text-center py-12">
                                <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    No Order History
                                </h3>
                                <p className="text-gray-500">
                                    You haven't returned any equipment yet.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {orderHistory.map((order) => (
                                    <div
                                        key={order.id}
                                        className="bg-white rounded-lg shadow-md p-6"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                    Order #{order.id}
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                                                    <div className="flex items-center">
                                                        <Package className="w-4 h-4 mr-2" />
                                                        Equipment ID:{" "}
                                                        {order.equipment_id}
                                                    </div>
                                                    <div className="flex items-center">
                                                        <Hash className="w-4 h-4 mr-2" />
                                                        Quantity:{" "}
                                                        {order.quantity}
                                                    </div>
                                                    <div className="flex items-center">
                                                        <Calendar className="w-4 h-4 mr-2" />
                                                        Started:{" "}
                                                        {formatDate(
                                                            order.start_date
                                                        )}
                                                    </div>
                                                    <div className="flex items-center">
                                                        <Calendar className="w-4 h-4 mr-2" />
                                                        Ended:{" "}
                                                        {formatDate(
                                                            order.end_date
                                                        )}
                                                    </div>
                                                    <div className="flex items-center">
                                                        <User className="w-4 h-4 mr-2" />
                                                        Student ID:{" "}
                                                        {order.student_id}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full flex items-center">
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    Returned
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Order Modal */}
                {showOrderModal && selectedEquipment && (
                    <div className="fixed inset-0 bg-black/20 bg-opacity-50 backdrop-blur-lg flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                Place Equipment Order
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Equipment
                                    </label>
                                    <p className="text-gray-900 font-medium">
                                        {selectedEquipment.name}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {selectedEquipment.description}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Quantity (Max:{" "}
                                        {selectedEquipment.quantity_available})
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max={
                                            selectedEquipment.quantity_available
                                        }
                                        value={orderQuantity}
                                        onChange={(e) =>
                                            setOrderQuantity(
                                                parseInt(e.target.value)
                                            )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Return Date
                                    </label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) =>
                                            setEndDate(e.target.value)
                                        }
                                        min={
                                            new Date()
                                                .toISOString()
                                                .split("T")[0]
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    onClick={closeOrderModal}
                                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePlaceOrder}
                                    disabled={loading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {loading
                                        ? "Placing Order..."
                                        : "Place Order"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResourceHub;
