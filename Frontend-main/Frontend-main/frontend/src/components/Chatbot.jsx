import React, { useState, useRef, useEffect } from "react";
import {
    MessageCircle,
    Send,
    X,
    Bot,
    User,
    Minimize2,
    ExternalLink,
} from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const GEMINI_API_KEY =
    import.meta.env.VITE_GEMINI_API_KEY ||
    "AIzaSyCN_-ErIwiQk1y3PGWsg5p5kHngL2kGlvo";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

// Database query functions
const queryDatabase = async (intent, query) => {
    try {
        const response = await fetch(`${BACKEND_URL}/api/chatbot/query`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ intent, query }),
        });

        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.error("Database query error:", error);
    }
    return null;
};

// Intent classification and route mapping
const classifyIntent = (message) => {
    const lowerMessage = message.toLowerCase();

    const intentMap = {
        faculty: {
            keywords: [
                "faculty",
                "teacher",
                "professor",
                "instructor",
                "staff",
            ],
            route: "/pepople",
            dbQuery: "teachers",
        },
        courses: {
            keywords: [
                "course",
                "courses",
                "curriculum",
                "syllabus",
                "subject",
                "class",
            ],
            route: "/admission-hub",
            dbQuery: "courses",
        },
        admission: {
            keywords: [
                "admission",
                "admissions",
                "requirements",
                "eligibility",
            ],
            route: "/admission-hub",
            dbQuery: "admission",
        },
        apply: {
            keywords: ["apply", "application"],
            route: "/apply",
            dbQuery: "admission",
        },
        alumni: {
            keywords: ["alumni", "graduate", "placement", "career", "job"],
            route: "https://cseduaa.org/", // external URL
            dbQuery: "alumni",
        },
        about: {
            keywords: ["about", "history", "department", "university", "cse"],
            route: "/chairman",
            dbQuery: "about",
        },
    };

    for (const [intent, config] of Object.entries(intentMap)) {
        if (config.keywords.some((keyword) => lowerMessage.includes(keyword))) {
            return { intent, ...config };
        }
    }

    return { intent: "general", route: null, dbQuery: null };
};

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: 1,
            text: "Hello! I'm the DU CSE Assistant. I can help you with:\n\n• Events and workshops\n• Faculty information\n• Course details\n• Admission process\n• Research opportunities\n• Alumni network\n• Contact information\n\nWhat would you like to know?",
            sender: "bot",
            timestamp: new Date(),
            hasLinks: false,
        },
    ]);
    const [inputText, setInputText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const generateSystemPrompt = () => {
        return `You are a helpful AI assistant for Dhaka University's Computer Science and Engineering (CSE) Department. You should provide accurate and helpful information about the university and department.

Key information about Dhaka University (DU):
- Founded in 1921, the oldest and most prestigious university in Bangladesh
- Located in Dhaka, the capital city of Bangladesh
- Known as the "Oxford of the East"
- Beautiful historic campus with over 100 years of academic excellence
- Home to numerous Nobel laureates, researchers, and distinguished alumni

About the CSE Department at DU:
- One of the top Computer Science departments in Bangladesh
- Offers Bachelor's and Master's programs in Computer Science and Engineering
- Strong curriculum covering programming, algorithms, data structures, databases, AI/ML, software engineering, computer networks, cybersecurity, and more
- Excellent faculty with PhD degrees from top international universities
- State-of-the-art computer labs and research facilities
- Strong industry connections and internship opportunities
- Alumni working at top tech companies like Google, Microsoft, Facebook, Amazon, and leading Bangladeshi tech firms
- Active research in areas like AI, machine learning, data science, robotics, and software engineering
- Regular programming contests, hackathons, and tech events
- Strong placement record with graduates joining both local and international companies

Academic Programs:
- 4-year Bachelor of Science in Computer Science and Engineering (B.Sc. in CSE)
- Master of Science in Computer Science and Engineering (M.Sc. in CSE)
- PhD programs in Computer Science

Admission Information:
- Highly competitive admission process
- Admission through university entrance examination
- Merit-based selection
- Limited seats available due to high demand

Campus Life:
- Vibrant student community with various clubs and organizations
- Cultural events, seminars, and workshops
- Beautiful campus with historic buildings
- Central library with extensive collection
- Hostels for both male and female students

Please provide helpful, accurate, and encouraging information. If you don't know specific current details like exact admission dates, fees, or specific faculty information, suggest contacting the department directly. Keep responses conversational and informative.`;
    };

    const generateEnhancedResponse = async (
        userMessage,
        dbData,
        classifiedIntent
    ) => {
        const systemPrompt = `You are an intelligent assistant for Dhaka University's CSE Department. 
    
Context: The user asked about "${classifiedIntent.intent}" related topics.
Database Information: ${
            dbData
                ? JSON.stringify(dbData)
                : "No specific database information available"
        }

Instructions:
1. Provide helpful, accurate information based on the database data when available
2. If database data is available, incorporate it naturally into your response
3. Keep responses conversational and informative
4. If you mention specific items (events, faculty, courses), format them in a structured way
5. Always be encouraging and helpful
6. If you don't have specific current information, suggest contacting the department directly

User Query: ${userMessage}

Provide a comprehensive response that helps the user understand the information and guides them appropriately.`;

        try {
            const response = await fetch(GEMINI_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: systemPrompt,
                                },
                            ],
                        },
                    ],
                }),
            });

            if (!response.ok) {
                console.error(
                    "Gemini API Error:",
                    response.status,
                    response.statusText
                );
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();

            // Check if response has the expected structure
            if (
                !data.candidates ||
                !data.candidates[0] ||
                !data.candidates[0].content ||
                !data.candidates[0].content.parts ||
                !data.candidates[0].content.parts[0]
            ) {
                console.error("Unexpected API response structure:", data);
                throw new Error("Invalid response structure");
            }

            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error("Error calling Gemini API:", error);

            // Fallback response based on intent
            const fallbackResponses = {
                events: "I'd be happy to help you with events information! Our department regularly hosts workshops, seminars, and competitions. For the latest events, please check our events page or contact the department directly.",
                faculty:
                    "Our CSE department has excellent faculty members with expertise in various areas of computer science. For detailed faculty information including their research areas and contact details, please visit our faculty page.",
                courses:
                    "The CSE department offers a comprehensive curriculum covering programming, algorithms, data structures, AI/ML, and more. For detailed course information and curriculum, please check our courses page.",
                admission:
                    "Admission to our CSE program is highly competitive and merit-based. For current admission requirements, deadlines, and application procedures, please visit our admission page or contact the admissions office.",
                research:
                    "Our department is actively involved in cutting-edge research in AI, machine learning, software engineering, and more. For research opportunities and ongoing projects, please visit our research page.",
                contact:
                    "You can reach the CSE department through various channels. For complete contact information including phone numbers, email addresses, and office locations, please visit our contact page.",
                about: "The CSE department at Dhaka University is one of the premier computer science departments in Bangladesh, offering excellent education and research opportunities since its establishment.",
                general:
                    "I'm here to help you with information about the CSE department at Dhaka University. You can ask me about events, faculty, courses, admission, research, or any other department-related topics.",
            };

            return (
                fallbackResponses[classifiedIntent.intent] ||
                fallbackResponses.general
            );
        }
    };

    const sendMessage = async () => {
        if (!inputText.trim()) return;

        const userMessage = {
            id: messages.length + 1,
            text: inputText,
            sender: "user",
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        const currentInput = inputText;
        setInputText("");
        setIsLoading(true);

        try {
            // Classify user intent
            const classifiedIntent = classifyIntent(currentInput);

            // Query database if applicable
            let dbData = null;
            if (classifiedIntent.dbQuery) {
                dbData = await queryDatabase(
                    classifiedIntent.intent,
                    currentInput
                );
            }

            // Generate AI response with context
            const aiResponse = await generateEnhancedResponse(
                currentInput,
                dbData,
                classifiedIntent
            );

            // Create bot response with potential navigation links
            const botMessage = {
                id: messages.length + 2,
                text: aiResponse,
                sender: "bot",
                timestamp: new Date(),
                hasLinks: classifiedIntent.route !== null,
                navigationLink: classifiedIntent.route,
                linkText: classifiedIntent.route
                    ? `View ${
                          classifiedIntent.intent.charAt(0).toUpperCase() +
                          classifiedIntent.intent.slice(1)
                      } Page`
                    : null,
                dbData: dbData,
            };

            setMessages((prev) => [...prev, botMessage]);
        } catch (error) {
            console.error("Error processing message:", error);
            const errorMessage = {
                id: messages.length + 2,
                text: "I apologize, but I'm having trouble connecting right now. Please try again in a moment, or feel free to contact the CSE Department directly for immediate assistance.",
                sender: "bot",
                timestamp: new Date(),
                hasLinks: false,
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLinkClick = (route) => {
        // Navigate to the specified route
        window.location.href = route;
    };

    const renderDatabaseInfo = (dbData, intent) => {
        if (!dbData || !dbData.data) return null;

        switch (intent) {
            case "events":
                return (
                    <div className="mt-2 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                        <h4 className="font-semibold text-sm text-blue-800 mb-1">
                            Recent Events:
                        </h4>
                        {dbData.data.slice(0, 3).map((event, index) => (
                            <div
                                key={index}
                                className="text-xs text-blue-700 mb-1"
                            >
                                • {event.name} -{" "}
                                {new Date(
                                    event.start_date
                                ).toLocaleDateString()}
                            </div>
                        ))}
                    </div>
                );
            case "faculty":
                return (
                    <div className="mt-2 p-2 bg-green-50 rounded border-l-4 border-green-400">
                        <h4 className="font-semibold text-sm text-green-800 mb-1">
                            Faculty Members:
                        </h4>
                        {dbData.data.slice(0, 3).map((faculty, index) => (
                            <div
                                key={index}
                                className="text-xs text-green-700 mb-1"
                            >
                                • {faculty.name} - {faculty.designation}
                            </div>
                        ))}
                    </div>
                );
            default:
                return null;
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const formatTime = (timestamp) => {
        return timestamp.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    if (!isOpen) {
        return (
            <div className="fixed bottom-6 right-6 z-50">
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110"
                    aria-label="Open chatbot"
                >
                    <MessageCircle className="w-6 h-6" />
                </button>
            </div>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <div
                className={`bg-white rounded-lg shadow-2xl border border-gray-200 transition-all duration-300 ${
                    isMinimized ? "w-80 h-16" : "w-96 h-[500px]"
                }`}
            >
                {/* Header */}
                <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Bot className="w-5 h-5" />
                        <div>
                            <h3 className="font-semibold text-sm">
                                DU CSE Smart Assistant
                            </h3>
                            <p className="text-blue-100 text-xs">
                                AI-powered help with database access
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setIsMinimized(!isMinimized)}
                            className="text-blue-100 hover:text-white transition-colors"
                            aria-label={isMinimized ? "Maximize" : "Minimize"}
                        >
                            <Minimize2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-blue-100 hover:text-white transition-colors"
                            aria-label="Close chatbot"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {!isMinimized && (
                    <>
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 h-80 bg-gray-50">
                            <div className="space-y-3">
                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex ${
                                            message.sender === "user"
                                                ? "justify-end"
                                                : "justify-start"
                                        }`}
                                    >
                                        <div
                                            className={`flex items-start space-x-2 max-w-[85%] ${
                                                message.sender === "user"
                                                    ? "flex-row-reverse space-x-reverse"
                                                    : ""
                                            }`}
                                        >
                                            <div
                                                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${
                                                    message.sender === "user"
                                                        ? "bg-blue-600"
                                                        : "bg-gray-600"
                                                }`}
                                            >
                                                {message.sender === "user" ? (
                                                    <User className="w-4 h-4" />
                                                ) : (
                                                    <Bot className="w-4 h-4" />
                                                )}
                                            </div>
                                            <div
                                                className={`rounded-lg p-3 ${
                                                    message.sender === "user"
                                                        ? "bg-blue-600 text-white"
                                                        : "bg-white text-gray-800 border border-gray-200"
                                                }`}
                                            >
                                                <p className="text-sm whitespace-pre-wrap">
                                                    {message.text}
                                                </p>

                                                {/* Render database information */}
                                                {message.sender === "bot" &&
                                                    message.dbData &&
                                                    renderDatabaseInfo(
                                                        message.dbData,
                                                        classifyIntent(
                                                            message.text
                                                        ).intent
                                                    )}

                                                {/* Navigation link */}
                                                {message.hasLinks &&
                                                    message.navigationLink && (
                                                        <button
                                                            onClick={() =>
                                                                handleLinkClick(
                                                                    message.navigationLink
                                                                )
                                                            }
                                                            className="mt-2 inline-flex items-center px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md text-xs transition-colors"
                                                        >
                                                            <ExternalLink className="w-3 h-3 mr-1" />
                                                            {message.linkText}
                                                        </button>
                                                    )}

                                                <p
                                                    className={`text-xs mt-1 ${
                                                        message.sender ===
                                                        "user"
                                                            ? "text-blue-100"
                                                            : "text-gray-500"
                                                    }`}
                                                >
                                                    {formatTime(
                                                        message.timestamp
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="flex items-start space-x-2 max-w-[80%]">
                                            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-xs">
                                                <Bot className="w-4 h-4" />
                                            </div>
                                            <div className="bg-white text-gray-800 border border-gray-200 rounded-lg p-3">
                                                <div className="flex space-x-1">
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                                    <div
                                                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                                        style={{
                                                            animationDelay:
                                                                "0.1s",
                                                        }}
                                                    ></div>
                                                    <div
                                                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                                        style={{
                                                            animationDelay:
                                                                "0.2s",
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
                            <div className="flex space-x-2">
                                <textarea
                                    value={inputText}
                                    onChange={(e) =>
                                        setInputText(e.target.value)
                                    }
                                    onKeyPress={handleKeyPress}
                                    placeholder="Ask about events, faculty, courses, admission..."
                                    className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows="2"
                                    disabled={isLoading}
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={!inputText.trim() || isLoading}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg px-4 py-2 transition-colors"
                                    aria-label="Send message"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Chatbot;
