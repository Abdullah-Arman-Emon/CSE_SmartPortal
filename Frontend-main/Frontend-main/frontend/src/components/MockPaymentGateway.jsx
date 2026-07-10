import React, { useState, useEffect } from "react";
import {
    CreditCard,
    Lock,
    Shield,
    CheckCircle,
    AlertCircle,
    Loader,
    ArrowLeft,
    Eye,
    EyeOff,
    Globe,
    Smartphone,
    Building,
} from "lucide-react";

const MockPaymentGateway = ({
    amount,
    feeTitle,
    onSuccess,
    onCancel,
    onClose,
}) => {
    const [step, setStep] = useState("select-method"); // select-method, card-details, ssl-commerz, processing, success, failed
    const [paymentMethod, setPaymentMethod] = useState("");
    const [cardData, setCardData] = useState({
        cardNumber: "",
        cardHolder: "",
        expiryMonth: "",
        expiryYear: "",
        cvv: "",
        email: "",
        phone: "",
    });
    const [sslData, setSslData] = useState({
        email: "",
        phone: "",
        address: "",
        city: "",
        postalCode: "",
    });
    const [showCvv, setShowCvv] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState("");

    // SSL Commerz-like styling
    const sslStyles = {
        primary: "#2563eb",
        secondary: "#1e40af",
        success: "#059669",
        danger: "#dc2626",
        warning: "#d97706",
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (paymentMethod === "card") {
            setCardData((prev) => ({
                ...prev,
                [name]: value,
            }));
        } else {
            setSslData((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const formatCardNumber = (value) => {
        const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
        const matches = v.match(/\d{4,16}/g);
        const match = (matches && matches[0]) || "";
        const parts = [];
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        if (parts.length) {
            return parts.join(" ");
        } else {
            return v;
        }
    };

    const validateCardForm = () => {
        if (!cardData.cardNumber.replace(/\s/g, "").match(/^\d{16}$/)) {
            setError("Please enter a valid 16-digit card number");
            return false;
        }
        if (!cardData.cardHolder.trim()) {
            setError("Please enter card holder name");
            return false;
        }
        if (!cardData.expiryMonth || !cardData.expiryYear) {
            setError("Please enter expiry date");
            return false;
        }
        if (!cardData.cvv.match(/^\d{3,4}$/)) {
            setError("Please enter a valid CVV");
            return false;
        }
        if (!cardData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            setError("Please enter a valid email address");
            return false;
        }
        if (!cardData.phone.match(/^\d{11}$/)) {
            setError("Please enter a valid 11-digit phone number");
            return false;
        }
        setError("");
        return true;
    };

    const validateSslForm = () => {
        if (!sslData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            setError("Please enter a valid email address");
            return false;
        }
        if (!sslData.phone.match(/^\d{11}$/)) {
            setError("Please enter a valid 11-digit phone number");
            return false;
        }
        if (!sslData.address.trim()) {
            setError("Please enter your address");
            return false;
        }
        if (!sslData.city.trim()) {
            setError("Please enter your city");
            return false;
        }
        if (!sslData.postalCode.trim()) {
            setError("Please enter your postal code");
            return false;
        }
        setError("");
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        let isValid = false;
        if (paymentMethod === "card") {
            isValid = validateCardForm();
        } else {
            isValid = validateSslForm();
        }

        if (!isValid) return;

        setProcessing(true);
        setStep("processing");

        // Simulate payment processing
        setTimeout(() => {
            // 90% success rate for demo
            const isSuccess = Math.random() > 0.1;

            if (isSuccess) {
                setStep("success");
                setTimeout(() => {
                    onSuccess({
                        transaction_id: `TXN_${Date.now()}_${Math.random()
                            .toString(36)
                            .substr(2, 9)}`,
                        amount: amount,
                        status: "success",
                        payment_method: paymentMethod,
                        timestamp: new Date().toISOString(),
                    });
                }, 2000);
            } else {
                setStep("failed");
            }
            setProcessing(false);
        }, 3000);
    };

    const getCardType = (number) => {
        const cleanNumber = number.replace(/\s/g, "");
        if (cleanNumber.startsWith("4")) return "visa";
        if (cleanNumber.startsWith("5")) return "mastercard";
        if (cleanNumber.startsWith("6")) return "discover";
        return "generic";
    };

    const cardType = getCardType(cardData.cardNumber);

    const renderPaymentMethodSelection = () => (
        <div className="space-y-4">
            <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Choose Payment Method
                </h3>
                <p className="text-gray-600">
                    Select your preferred payment method
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* SSL Commerz Option */}
                <button
                    onClick={() => {
                        setPaymentMethod("ssl");
                        setStep("ssl-commerz");
                    }}
                    className="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded flex items-center justify-center">
                            <Shield size={20} className="text-white" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900">
                                SSL Commerz
                            </h4>
                            <p className="text-sm text-gray-600">
                                Secure online payment
                            </p>
                        </div>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <Globe size={14} />
                            <span>Online banking, mobile banking</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Smartphone size={14} />
                            <span>BKash, Nagad, Rocket</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Building size={14} />
                            <span>Credit/Debit cards</span>
                        </div>
                    </div>
                </button>

                {/* Direct Card Option */}
                <button
                    onClick={() => {
                        setPaymentMethod("card");
                        setStep("card-details");
                    }}
                    className="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-8 bg-gradient-to-r from-green-600 to-green-700 rounded flex items-center justify-center">
                            <CreditCard size={20} className="text-white" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900">
                                Direct Card Payment
                            </h4>
                            <p className="text-sm text-gray-600">
                                Credit/Debit card
                            </p>
                        </div>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <CreditCard size={14} />
                            <span>Visa, Mastercard, Discover</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Lock size={14} />
                            <span>Secure encrypted payment</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Shield size={14} />
                            <span>PCI DSS compliant</span>
                        </div>
                    </div>
                </button>
            </div>

            <div className="flex justify-center pt-4">
                <button
                    onClick={onCancel}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );

    const renderSslCommerzForm = () => (
        <div className="flex flex-col h-[60vh] md:h-[70vh]">
            <div className="overflow-y-auto flex-grow pr-1 -mr-1">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Payment Info */}
                    <div className="bg-orange-50 rounded-lg p-4 mb-4">
                        <div className="flex justify-between items-center">
                            <span className="text-orange-600 font-medium">
                                Amount:
                            </span>
                            <span className="text-xl font-bold text-orange-900">
                                ৳{amount.toLocaleString()}
                            </span>
                        </div>
                        <div className="text-sm text-orange-600 mt-1">
                            {feeTitle}
                        </div>
                    </div>

                    {/* SSL Commerz Header */}
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg mb-4">
                        <div className="flex items-center gap-3">
                            <Shield size={24} />
                            <div>
                                <h3 className="font-semibold">
                                    SSL Commerz Payment
                                </h3>
                                <p className="text-orange-100 text-sm">
                                    Secure online payment gateway
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address *
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={sslData.email}
                                onChange={handleInputChange}
                                placeholder="your@email.com"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phone Number *
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={sslData.phone}
                                onChange={handleInputChange}
                                placeholder="01XXXXXXXXX"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                                required
                            />
                        </div>
                    </div>

                    {/* Address Information */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Address *
                        </label>
                        <input
                            type="text"
                            name="address"
                            value={sslData.address}
                            onChange={handleInputChange}
                            placeholder="Your full address"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                City *
                            </label>
                            <input
                                type="text"
                                name="city"
                                value={sslData.city}
                                onChange={handleInputChange}
                                placeholder="Dhaka"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Postal Code *
                            </label>
                            <input
                                type="text"
                                name="postalCode"
                                value={sslData.postalCode}
                                onChange={handleInputChange}
                                placeholder="1200"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                                required
                            />
                        </div>
                    </div>

                    {/* Payment Methods Preview */}
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                        <h4 className="font-medium text-slate-800 mb-3">
                            Available Payment Methods:
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div className="flex items-center gap-2 bg-white p-2 rounded-md shadow-sm">
                                <div className="w-6 h-4 bg-blue-600 rounded"></div>
                                <span>Visa</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white p-2 rounded-md shadow-sm">
                                <div className="w-6 h-4 bg-red-600 rounded"></div>
                                <span>Mastercard</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white p-2 rounded-md shadow-sm">
                                <div className="w-6 h-4 bg-green-600 rounded"></div>
                                <span>BKash</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white p-2 rounded-md shadow-sm">
                                <div className="w-6 h-4 bg-orange-600 rounded"></div>
                                <span>Nagad</span>
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {/* Bottom spacing for sticky button */}
                    <div className="h-16"></div>
                </form>
            </div>

            {/* Sticky Action Buttons */}
            <div className="pt-4 sticky bottom-0 bg-white shadow-md -mx-6 px-6 pb-4 mt-2 border-t border-slate-100">
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => setStep("select-method")}
                        className="flex items-center gap-2 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Back
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-colors shadow-sm hover:shadow focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                    >
                        Proceed to SSL Commerz
                    </button>
                </div>
            </div>
        </div>
    );

    const renderCardForm = () => (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Payment Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center">
                    <span className="text-gray-600">Amount:</span>
                    <span className="text-xl font-bold text-gray-900">
                        ৳{amount.toLocaleString()}
                    </span>
                </div>
                <div className="text-sm text-gray-500 mt-1">{feeTitle}</div>
            </div>

            {/* Card Number */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Card Number
                </label>
                <div className="relative">
                    <input
                        type="text"
                        name="cardNumber"
                        value={cardData.cardNumber}
                        onChange={(e) => {
                            const formatted = formatCardNumber(e.target.value);
                            setCardData((prev) => ({
                                ...prev,
                                cardNumber: formatted,
                            }));
                        }}
                        placeholder="1234 5678 9012 3456"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        maxLength="19"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {cardType === "visa" && (
                            <div className="w-8 h-5 bg-blue-600 rounded flex items-center justify-center">
                                <span className="text-white text-xs font-bold">
                                    VISA
                                </span>
                            </div>
                        )}
                        {cardType === "mastercard" && (
                            <div className="w-8 h-5 bg-red-600 rounded flex items-center justify-center">
                                <span className="text-white text-xs font-bold">
                                    MC
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Card Holder */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Card Holder Name
                </label>
                <input
                    type="text"
                    name="cardHolder"
                    value={cardData.cardHolder}
                    onChange={handleInputChange}
                    placeholder="JOHN DOE"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            {/* Expiry and CVV */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiry Date
                    </label>
                    <div className="flex gap-2">
                        <select
                            name="expiryMonth"
                            value={cardData.expiryMonth}
                            onChange={handleInputChange}
                            className="flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">MM</option>
                            {Array.from({ length: 12 }, (_, i) => (
                                <option
                                    key={i + 1}
                                    value={String(i + 1).padStart(2, "0")}
                                >
                                    {String(i + 1).padStart(2, "0")}
                                </option>
                            ))}
                        </select>
                        <select
                            name="expiryYear"
                            value={cardData.expiryYear}
                            onChange={handleInputChange}
                            className="flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">YY</option>
                            {Array.from({ length: 10 }, (_, i) => {
                                const year = new Date().getFullYear() + i;
                                return (
                                    <option
                                        key={year}
                                        value={String(year).slice(-2)}
                                    >
                                        {year}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        CVV
                    </label>
                    <div className="relative">
                        <input
                            type={showCvv ? "text" : "password"}
                            name="cvv"
                            value={cardData.cvv}
                            onChange={handleInputChange}
                            placeholder="123"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            maxLength="4"
                        />
                        <button
                            type="button"
                            onClick={() => setShowCvv(!showCvv)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {showCvv ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                    </label>
                    <input
                        type="email"
                        name="email"
                        value={cardData.email}
                        onChange={handleInputChange}
                        placeholder="john@example.com"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone
                    </label>
                    <input
                        type="tel"
                        name="phone"
                        value={cardData.phone}
                        onChange={handleInputChange}
                        placeholder="01XXXXXXXXX"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {/* Security Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-blue-700">
                    <Lock size={16} />
                    <span className="text-sm font-medium">Secure Payment</span>
                </div>
                <p className="text-blue-600 text-xs mt-1">
                    Your payment information is encrypted and secure
                </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
                <button
                    type="button"
                    onClick={() => setStep("select-method")}
                    className="flex items-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeft size={16} />
                    Back
                </button>
                <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                    <CreditCard size={16} />
                    Pay ৳{amount.toLocaleString()}
                </button>
            </div>
        </form>
    );

    return (
        <div className="fixed inset-0 bg-black/20 bg-opacity-50 backdrop-blur-lg flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Shield size={24} />
                            <div>
                                <h2 className="text-xl font-bold">
                                    Payment Gateway
                                </h2>
                                <p className="text-blue-100 text-sm">
                                    Choose your payment method
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-blue-200 transition-colors"
                        >
                            ×
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {step === "select-method" && renderPaymentMethodSelection()}
                    {step === "card-details" && renderCardForm()}
                    {step === "ssl-commerz" && renderSslCommerzForm()}

                    {step === "processing" && (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Processing{" "}
                                {paymentMethod === "ssl"
                                    ? "SSL Commerz"
                                    : "Card"}{" "}
                                Payment
                            </h3>
                            <p className="text-gray-600">
                                Please wait while we process your payment
                                securely...
                            </p>
                            <div className="mt-4 space-y-2">
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    Validating payment details
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    Connecting to{" "}
                                    {paymentMethod === "ssl"
                                        ? "SSL Commerz"
                                        : "payment processor"}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                    Processing transaction
                                </div>
                            </div>
                        </div>
                    )}

                    {step === "success" && (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle
                                    size={32}
                                    className="text-green-600"
                                />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Payment Successful!
                            </h3>
                            <p className="text-gray-600 mb-4">
                                Your payment has been processed successfully via{" "}
                                {paymentMethod === "ssl"
                                    ? "SSL Commerz"
                                    : "card"}
                                .
                            </p>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                <div className="text-sm text-green-700">
                                    <div className="flex justify-between">
                                        <span>Amount:</span>
                                        <span className="font-semibold">
                                            ৳{amount.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between mt-1">
                                        <span>Method:</span>
                                        <span className="font-semibold text-green-600">
                                            {paymentMethod === "ssl"
                                                ? "SSL Commerz"
                                                : "Card Payment"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() =>
                                    onSuccess({
                                        transaction_id: `TXN_${Date.now()}_${Math.random()
                                            .toString(36)
                                            .substr(2, 9)}`,
                                        amount: amount,
                                        status: "success",
                                        payment_method: paymentMethod,
                                        timestamp: new Date().toISOString(),
                                    })
                                }
                                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                Continue
                            </button>
                        </div>
                    )}

                    {step === "failed" && (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle
                                    size={32}
                                    className="text-red-600"
                                />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Payment Failed
                            </h3>
                            <p className="text-gray-600 mb-4">
                                Your payment could not be processed. Please try
                                again.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() =>
                                        setStep(
                                            paymentMethod === "ssl"
                                                ? "ssl-commerz"
                                                : "card-details"
                                        )
                                    }
                                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Try Again
                                </button>
                                <button
                                    onClick={onCancel}
                                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MockPaymentGateway;
