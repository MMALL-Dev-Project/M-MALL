import React from 'react';

const FAQ = () => {
    const faqs = [
        {
            question: 'How do I reset my password?',
            answer: 'Click on "Forgot password" at the login page and follow the instructions.'
        },
        {
            question: 'Where can I view my orders?',
            answer: 'Go to your account dashboard and select "My Orders".'
        },
        {
            question: 'How do I contact support?',
            answer: 'You can contact support via the "Contact Us" page or email us at support@example.com.'
        }
    ];

    return (
        <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
            <h1>Frequently Asked Questions</h1>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {faqs.map((faq, idx) => (
                    <li key={idx} style={{ marginBottom: 24 }}>
                        <strong>{faq.question}</strong>
                        <p>{faq.answer}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default FAQ;