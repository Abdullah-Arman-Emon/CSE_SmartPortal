// Central API utility for finance endpoints (and more in future)
// Update API_VERSION here to change version for all endpoints

const API_VERSION = 'v1';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Finance Endpoints
export const financeApi = {
    // Finance Events
    listEvents: () => `${BACKEND_URL}/${API_VERSION}/finance/events`,
    createEvent: () => `${BACKEND_URL}/${API_VERSION}/finance/events`,
    updateEvent: (eventId) => `${BACKEND_URL}/${API_VERSION}/finance/update/event/${eventId}`,
    deleteEvent: (eventId) => `${BACKEND_URL}/${API_VERSION}/finance/delete/event/${eventId}`,

    // Payments
    submitPayment: () => `${BACKEND_URL}/${API_VERSION}/finance/payments`,
    listPaymentsPending: () => `${BACKEND_URL}/${API_VERSION}/finance/payments/pending`,
    listPaymentsPaid: () => `${BACKEND_URL}/${API_VERSION}/finance/payments/paid`,
    verifyPayment: (paymentId) => `${BACKEND_URL}/${API_VERSION}/finance/payments/verify/${paymentId}`,
};

// Add more API groups (e.g., userApi, courseApi) as needed 