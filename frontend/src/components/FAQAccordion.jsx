import React, { useState } from 'react';

function FAQAccordion() {
    const [openIndex, setOpenIndex] = useState(null);

    const faqs = [
        {
            question: "What is Multi-Tenant Architecture?",
            answer: "Multi-tenant architecture allows multiple organizations (tenants) to use the same application instance while keeping their data completely isolated. Each tenant has their own unique slug and data partition."
        },
        {
            question: "How does tenant isolation work?",
            answer: "We use the X-Tenant-Slug header to identify which tenant's data to access. The backend filters all database queries by tenant ID, ensuring complete data isolation between organizations."
        },
        {
            question: "Is my data secure?",
            answer: "Yes! We use JWT-based authentication with Clerk, row-level tenant isolation in the database, and strict API validation. Your data is encrypted in transit and at rest."
        },
        {
            question: "Can I invite team members?",
            answer: "Absolutely! Use the Admin Console to invite users to your tenant. They'll receive an invitation and can sign up using Clerk authentication."
        },
        {
            question: "What ticket priorities are available?",
            answer: "We support four priority levels: Low, Medium, High, and Urgent. You can assign priorities when creating or updating tickets to help your team prioritize work."
        }
    ];

    const toggleFAQ = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="space-y-4">
            {faqs.map((faq, index) => (
                <div key={index} className="glass-card-light overflow-hidden">
                    <button
                        onClick={() => toggleFAQ(index)}
                        className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                    >
                        <span className="font-semibold text-gray-900">{faq.question}</span>
                        <svg
                            className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${openIndex === index ? 'transform rotate-180' : ''
                                }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    <div
                        className={`overflow-hidden transition-all duration-300 ${openIndex === index ? 'max-h-96' : 'max-h-0'
                            }`}
                    >
                        <div className="px-6 pb-4 text-gray-700">
                            {faq.answer}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default FAQAccordion;
