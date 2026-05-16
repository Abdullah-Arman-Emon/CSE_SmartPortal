import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    CheckCircle,
    Clock,
    AlertCircle,
    Eye,
    Check,
    X,
    DollarSign,
    CreditCard,
    User,
    Calendar,
    FileText
} from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const AdminPaymentVerification = () => {
    const [pendingPayments, setPendingPayments] = useState([]);
    const [paidPayments, setPaidPayments] = useState([]);
    const [financeEvents, setFinanceEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [verifying, setVerifying] = useState(false);

    // Filter states
    const [filterStudentId, setFilterStudentId] = useState('');
    const [filterBatch, setFilterBatch] = useState('');
    const [filterDeadline, setFilterDeadline] = useState('');

    useEffect(() => {
        fetchPaymentData();
    }, []);

    const fetchPaymentData = async () => {
        try {
            setLoading(true);
            const [pendingRes, paidRes, eventsRes] = await Promise.all([
                axios.get(`${BACKEND_URL}/v1/finance/payments/pending`),
                axios.get(`${BACKEND_URL}/v1/finance/payments/paid`),
                axios.get(`${BACKEND_URL}/v1/finance/events`)
            ]);

            setPendingPayments(pendingRes.data);
            setPaidPayments(paidRes.data);
            setFinanceEvents(eventsRes.data);
        } catch (error) {
            console.error('Failed to fetch payment data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filtering logic for payments
    const filterPayments = (payments) => {
        return payments.filter(payment => {
            const event = financeEvents.find(e => e.id === payment.event_id);
            let match = true;
            if (filterStudentId && payment.user_id.toString() !== filterStudentId.trim()) match = false;
            if (filterBatch && event && event.batch && !event.batch.toString().toLowerCase().includes(filterBatch.toLowerCase())) match = false;
            if (filterDeadline && event && event.deadline && !event.deadline.startsWith(filterDeadline)) match = false;
            return match;
        });
    };

    const handleVerifyPayment = async (paymentId) => {
        if (!window.confirm('Are you sure you want to verify this payment?')) {
            return;
        }

        setVerifying(true);
        try {
            await axios.post(`${BACKEND_URL}/v1/finance/payments/verify/${paymentId}`);
            await fetchPaymentData(); // Refresh data
            alert('Payment verified successfully!');
        } catch (error) {
            console.error('Failed to verify payment:', error);
            alert('Failed to verify payment. Please try again.');
        } finally {
            setVerifying(false);
        }
    };

    const getEventDetails = (eventId) => {
        return financeEvents.find(event => event.id === eventId);
    };

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Clock size={12} className="mr-1" />
                        Pending
                    </span>
                );
            case 'paid':
                return (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle size={12} className="mr-1" />
                        Paid
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {status}
                    </span>
                );
        }
    };

    // Deduplicate: Only keep the latest payment per (user, event)
    const dedupedPaidPayments = (() => {
        const map = {};
        filterPayments(paidPayments).forEach(p => {
            const key = `${p.user_id}_${p.event_id}`;
            if (!map[key] || new Date(p.submitted_at) > new Date(map[key].submitted_at)) {
                map[key] = p;
            }
        });
        return Object.values(map);
    })();

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading payments...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filter Controls */}
            <div className="flex flex-wrap gap-4 mb-4">
                <input
                    type="text"
                    placeholder="Filter by Student ID"
                    value={filterStudentId}
                    onChange={e => setFilterStudentId(e.target.value)}
                    className="border rounded px-2 py-1"
                />
                <input
                    type="text"
                    placeholder="Filter by Batch"
                    value={filterBatch}
                    onChange={e => setFilterBatch(e.target.value)}
                    className="border rounded px-2 py-1"
                />
                <input
                    type="date"
                    placeholder="Filter by Deadline"
                    value={filterDeadline}
                    onChange={e => setFilterDeadline(e.target.value)}
                    className="border rounded px-2 py-1"
                />
            </div>
            {/* Verified Payments Only */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Verified Payments</h3>
                    <p className="text-sm text-gray-600">Successfully verified payments</p>
                </div>

                <div className="p-6">
                    {dedupedPaidPayments.length === 0 ? (
                        <div className="text-center py-8">
                            <CheckCircle size={48} className="mx-auto mb-4 text-gray-300" />
                            <p className="text-gray-600">No verified payments</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {dedupedPaidPayments.slice(0, 50).map((payment) => {
                                const event = financeEvents.find(e => e.id === payment.event_id);
                                return (
                                    <div key={payment.id} className="border border-gray-200 rounded-lg p-4 bg-green-50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h4 className="font-semibold text-gray-900">
                                                        {event ? event.title : 'Unknown Event'}
                                                    </h4>
                                                    {getStatusBadge(payment.status)}
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                                                    <div className="flex items-center gap-2">
                                                        <DollarSign size={14} />
                                                        <span>৳{event ? event.amount.toLocaleString() : 'N/A'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <User size={14} />
                                                        <span>Student ID: {payment.user_id}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <FileText size={14} />
                                                        <span>TXN: {payment.transaction_id}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={14} />
                                                        <span>Verified: {payment.verified_at ? formatDateTime(payment.verified_at) : 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Payment Details Modal */}
            {showPaymentModal && selectedPayment && (
                <div className="fixed inset-0 bg-black/20 bg-opacity-50 backdrop-blur-lg flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900">Payment Details</h3>
                                <button
                                    onClick={() => setShowPaymentModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="font-semibold text-gray-900 mb-3">Transaction Information</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-600">Transaction ID:</span>
                                            <p className="font-mono text-gray-900">{selectedPayment.transaction_id}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Status:</span>
                                            <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Submitted:</span>
                                            <p className="text-gray-900">{formatDateTime(selectedPayment.submitted_at)}</p>
                                        </div>
                                        {selectedPayment.verified_at && (
                                            <div>
                                                <span className="text-gray-600">Verified:</span>
                                                <p className="text-gray-900">{formatDateTime(selectedPayment.verified_at)}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {getEventDetails(selectedPayment.event_id) && (
                                    <div className="bg-blue-50 rounded-lg p-4">
                                        <h4 className="font-semibold text-gray-900 mb-3">Fee Information</h4>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-600">Fee Title:</span>
                                                <p className="text-gray-900">{getEventDetails(selectedPayment.event_id).title}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Amount:</span>
                                                <p className="text-gray-900">৳{getEventDetails(selectedPayment.event_id).amount.toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Batch:</span>
                                                <p className="text-gray-900">{getEventDetails(selectedPayment.event_id).batch}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Deadline:</span>
                                                <p className="text-gray-900">{formatDateTime(getEventDetails(selectedPayment.event_id).deadline)}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="bg-yellow-50 rounded-lg p-4">
                                    <h4 className="font-semibold text-gray-900 mb-3">Student Information</h4>
                                    <div className="text-sm">
                                        <div>
                                            <span className="text-gray-600">Student ID:</span>
                                            <p className="text-gray-900">{selectedPayment.user_id}</p>
                                        </div>
                                    </div>
                                </div>

                                {selectedPayment.status === 'pending' && (
                                    <div className="flex gap-3 pt-4">
                                        <button
                                            onClick={() => {
                                                handleVerifyPayment(selectedPayment.id);
                                                setShowPaymentModal(false);
                                            }}
                                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Check size={16} />
                                            Verify Payment
                                        </button>
                                        <button
                                            onClick={() => setShowPaymentModal(false)}
                                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            Close
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPaymentVerification; 