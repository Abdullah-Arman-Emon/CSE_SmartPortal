import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    CreditCard,
    DollarSign,
    Calendar,
    AlertCircle,
    CheckCircle,
    Clock,
    Receipt,
    Download,
    Eye,
} from "lucide-react";
import axios from "axios";
import React from "react";
import MockPaymentGateway from '../components/MockPaymentGateway';
import { financeApi } from '../api';


import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const getStatusColor = (status) => {
    switch (status) {
        case "paid":
            return "bg-green-100 text-green-800 border-green-200";
        case "pending":
            return "bg-yellow-100 text-yellow-800 border-yellow-200";
        case "overdue":
            return "bg-red-100 text-red-800 border-red-200";
        default:
            return "bg-gray-100 text-gray-800 border-gray-200";
    }
};

const getStatusIcon = (status) => {
    switch (status) {
        case "paid":
            return <CheckCircle size={16} />;
        case "pending":
            return <Clock size={16} />;
        case "overdue":
            return <AlertCircle size={16} />;
        default:
            return <Clock size={16} />;
    }
};

export default function Finance() {
    const navigate = useNavigate();
    const [fees, setFees] = useState([]);
    const [selectedFee, setSelectedFee] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // Get user from localStorage/sessionStorage
    const { user } = useContext(AuthContext);
    const userId = user?.id;

    // Fetch finance data from backend (using only Sami/api/financeApi.py endpoints)
    React.useEffect(() => {
        if (!userId) return;
        setLoading(true);
        setError("");
        setSuccessMessage("");
        Promise.all([
            axios.get(financeApi.listEvents()),
            axios.get(financeApi.listPaymentsPending()),
            axios.get(financeApi.listPaymentsPaid())
        ])
            .then(([eventsRes, pendingRes, paidRes]) => {
                const events = eventsRes.data;
                const allPayments = [...pendingRes.data, ...paidRes.data];
                // Deduplicate: Only keep the latest payment per event for this user
                const userPaymentsMap = {};
                allPayments
                    .filter(p => p.user_id === userId)
                    .forEach(p => {
                        if (!userPaymentsMap[p.event_id] || new Date(p.submitted_at) > new Date(userPaymentsMap[p.event_id].submitted_at)) {
                            userPaymentsMap[p.event_id] = p;
                        }
                    });
                // Map events to payment status for this user
                const fees = events.map(event => {
                    const payment = userPaymentsMap[event.id];
                    return {
                        ...event,
                        status: payment ? payment.status : 'pending',
                        transaction_id: payment ? payment.transaction_id : null,
                        paid_at: payment ? payment.verified_at : null,
                        event_id: event.id,
                        // Add any other fields needed for UI
                    };
                });
                setFees(fees);
            })
            .catch(() => setError("Failed to load finance data"))
            .finally(() => setLoading(false));
    }, [userId]);

    // Clear success message after 5 seconds
    React.useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage("");
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    const totalFees = fees.reduce((sum, fee) => sum + fee.amount, 0);
    const paidFees = fees.filter(fee => fee.status === "paid").reduce((sum, fee) => sum + fee.amount, 0);
    const pendingFees = fees.filter(fee => fee.status === "pending").reduce((sum, fee) => sum + fee.amount, 0);
    const overdueFees = fees.filter(fee => fee.status === "overdue").reduce((sum, fee) => sum + fee.amount, 0);

    const handlePayNow = (fee) => {
        setSelectedFee(fee);
        setShowPaymentModal(true);
        setError(""); // Clear any previous errors
        setSuccessMessage(""); // Clear any previous success messages
    };

    const handlePaymentSuccess = async (paymentData) => {
        if (!selectedFee || !userId) return;

        try {
            // Submit payment to backend
            const response = await axios.post(financeApi.submitPayment(), {
                user_id: userId,
                event_id: selectedFee.event_id,
                transaction_id: paymentData.transaction_id,
            });

            console.log('Payment submitted successfully:', response.data);

            // Refresh finance data
            setLoading(true);
            // Re-fetch events and payments
            Promise.all([
                axios.get(financeApi.listEvents()),
                axios.get(financeApi.listPaymentsPending()),
                axios.get(financeApi.listPaymentsPaid())
            ])
                .then(([eventsRes, pendingRes, paidRes]) => {
                    const events = eventsRes.data;
                    const allPayments = [...pendingRes.data, ...paidRes.data];
                    // Deduplicate: Only keep the latest payment per event for this user
                    const userPaymentsMap = {};
                    allPayments
                        .filter(p => p.user_id === userId)
                        .forEach(p => {
                            if (!userPaymentsMap[p.event_id] || new Date(p.submitted_at) > new Date(userPaymentsMap[p.event_id].submitted_at)) {
                                userPaymentsMap[p.event_id] = p;
                            }
                        });
                    const fees = events.map(event => {
                        const payment = userPaymentsMap[event.id];
                        return {
                            ...event,
                            status: payment ? payment.status : 'pending',
                            transaction_id: payment ? payment.transaction_id : null,
                            paid_at: payment ? payment.verified_at : null,
                            event_id: event.id,
                        };
                    });
                    setFees(fees);
                    setError("");
                    setSuccessMessage("Payment successful!");
                })
                .catch(() => setError("Failed to load finance data"))
                .finally(() => setLoading(false));

            setShowPaymentModal(false);
            setSelectedFee(null);
        } catch (err) {
            console.error("Payment submission failed:", err);
            setError("Failed to submit payment. Please try again.");
            setLoading(false);
        }
    };

    const handlePaymentCancel = () => {
        setShowPaymentModal(false);
        setSelectedFee(null);
    };

    const downloadStatement = (format) => {
        const studentName = "CSE Student"; // This would come from user context
        const studentId = "2021-1-60-123"; // This would come from user context
        const currentDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        if (format === 'csv') {
            // Generate CSV content
            let csvContent = "data:text/csv;charset=utf-8,";
            csvContent += "Student Name,Student ID,Date\n";
            csvContent += `${studentName},${studentId},${currentDate}\n\n`;
            csvContent += "Fee Title,Category,Amount (BDT),Status,Due Date,Semester\n";

            fees.forEach(fee => {
                csvContent += `"${fee.title}","${fee.category}","৳${fee.amount.toLocaleString()}","${fee.status}","${new Date(fee.dueDate).toLocaleDateString()}","${fee.semester}"\n`;
            });

            csvContent += `\nTotal Fees,৳${totalFees.toLocaleString()}\n`;
            csvContent += `Paid Amount,৳${paidFees.toLocaleString()}\n`;
            csvContent += `Pending Amount,৳${pendingFees.toLocaleString()}\n`;
            csvContent += `Overdue Amount,৳${overdueFees.toLocaleString()}\n`;

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `CSE_Finance_Statement_${currentDate.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else if (format === 'pdf') {
            // Generate PDF-like content (simulated)
            const pdfContent = `
                CSE FINANCE STATEMENT
                =====================

                Student Name: ${studentName}
                Student ID: ${studentId}
                Date: ${currentDate}

                FEE DETAILS:
                ============
                ${fees.map(fee => `
                ${fee.title}
                Category: ${fee.category}
                Amount: ৳${fee.amount.toLocaleString()}
                Status: ${fee.status.toUpperCase()}
                Due Date: ${new Date(fee.dueDate).toLocaleDateString()}
                Semester: ${fee.semester}
                `).join('\n')}

                SUMMARY:
                ========
                Total Fees: ৳${totalFees.toLocaleString()}
                Paid Amount: ৳${paidFees.toLocaleString()}
                Pending Amount: ৳${pendingFees.toLocaleString()}
                Overdue Amount: ৳${overdueFees.toLocaleString()}

                Generated on: ${currentDate}
            `;

            // Create a text file that simulates PDF content
            const blob = new Blob([pdfContent], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `CSE_Finance_Statement_${currentDate.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }

        setShowDownloadMenu(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            {/* Header */}
            <div className="flex justify-between items-center p-4 bg-white shadow-sm">
                <div className="flex items-center gap-4">
                    <Link
                        to="/student-dashboard"
                        className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span className="text-sm font-medium">Back to Dashboard</span>
                    </Link>
                    <div className="text-xl font-bold">CSE Finance & Fees</div>
                </div>
                <div className="flex items-center gap-4">
                    {successMessage && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg flex items-center gap-2">
                            <CheckCircle size={16} />
                            {successMessage}
                        </div>
                    )}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg flex items-center gap-2">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}
                    <div className="relative">
                        <button
                            onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                        >
                            <Receipt size={16} />
                            Download Statement
                        </button>

                        {showDownloadMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
                                <div className="py-1">
                                    <button
                                        onClick={() => downloadStatement('csv')}
                                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                                    >
                                        <Download size={14} />
                                        Download as CSV
                                    </button>
                                    <button
                                        onClick={() => downloadStatement('pdf')}
                                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                                    >
                                        <Download size={14} />
                                        Download as PDF
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
                <div className="bg-white rounded-xl p-4 shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600">Total Fees</p>
                            <p className="text-2xl font-bold text-slate-900">৳{totalFees.toLocaleString()}</p>
                        </div>
                        <DollarSign className="text-slate-400" size={24} />
                    </div>
                </div>

                <div className="bg-green-50 rounded-xl p-4 shadow border border-green-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-green-600">Paid</p>
                            <p className="text-2xl font-bold text-green-800">৳{paidFees.toLocaleString()}</p>
                        </div>
                        <CheckCircle className="text-green-500" size={24} />
                    </div>
                </div>

                <div className="bg-yellow-50 rounded-xl p-4 shadow border border-yellow-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-yellow-600">Pending</p>
                            <p className="text-2xl font-bold text-yellow-800">৳{pendingFees.toLocaleString()}</p>
                        </div>
                        <Clock className="text-yellow-500" size={24} />
                    </div>
                </div>

                <div className="bg-red-50 rounded-xl p-4 shadow border border-red-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-red-600">Overdue</p>
                            <p className="text-2xl font-bold text-red-800">৳{overdueFees.toLocaleString()}</p>
                        </div>
                        <AlertCircle className="text-red-500" size={24} />
                    </div>
                </div>
            </div>

            {/* Fees Grid */}
            <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <p>Loading fees...</p>
                    ) : error ? (
                        <p className="text-red-500">{error}</p>
                    ) : fees.length === 0 ? (
                        <p>No finance data available for this student.</p>
                    ) : (
                        fees.map((fee) => (
                            <div key={fee.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                                {/* Fee Image */}
                                <div className="relative h-48 bg-slate-200">
                                    <img
                                        src={fee.image}
                                        alt={fee.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-3 right-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(fee.status)}`}>
                                            <div className="flex items-center gap-1">
                                                {getStatusIcon(fee.status)}
                                                {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                                            </div>
                                        </span>
                                    </div>
                                </div>

                                {/* Fee Content */}
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="font-semibold text-lg text-slate-900 mb-1">{fee.title}</h3>
                                            <p className="text-sm text-slate-600 mb-2">{fee.description}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-slate-900">৳{fee.amount.toLocaleString()}</p>
                                            <p className="text-xs text-slate-500">{fee.category}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Calendar size={14} />
                                            <span>Due: {new Date(fee.dueDate).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Eye size={14} />
                                            <span>{fee.semester}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handlePayNow(fee)}
                                            disabled={fee.status === "paid"}
                                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${fee.status === "paid"
                                                ? "bg-green-100 text-green-800 cursor-not-allowed"
                                                : "bg-slate-600 text-white hover:bg-slate-700"
                                                }`}
                                        >
                                            <CreditCard size={16} />
                                            {fee.status === "paid" ? "Paid" : "Pay Now"}
                                        </button>
                                        <button
                                            onClick={() => downloadStatement('csv')}
                                            className="flex items-center justify-center p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                                            title="Download this fee receipt"
                                        >
                                            <Download size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Mock Payment Gateway Modal */}
            {showPaymentModal && selectedFee && (
                <MockPaymentGateway
                    amount={selectedFee.amount}
                    feeTitle={selectedFee.title}
                    onSuccess={handlePaymentSuccess}
                    onCancel={handlePaymentCancel}
                    onClose={handlePaymentCancel}
                />
            )}

            {/* Click outside to close download menu */}
            {showDownloadMenu && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowDownloadMenu(false)}
                />
            )}
        </div>
    );
} 