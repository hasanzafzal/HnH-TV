import React, { useState } from 'react';
import Header from '../components/Header';
import '../styles/pages.css';

const faqs = [
  {
    question: 'What is HnH TV?',
    answer:
      'HnH TV is a premium streaming platform built by Hasan and co. offering a curated library of movies and TV series for your entertainment.',
  },
  {
    question: 'How do I create an account?',
    answer:
      'Click the "Sign Up" button in the top-right corner, fill in your name, email, and password, and you\'re good to go!',
  },
  {
    question: 'Is HnH TV free to use?',
    answer:
      'We offer a Free plan with limited content and ad support. For the full experience, check out our Basic, Premium, and VIP subscription plans.',
  },
  {
    question: 'What subscription plans are available?',
    answer:
      'We have four plans: Free (480p, 1 screen), Basic ($99/mo — HD, 1 screen), Premium ($199/mo — Full HD, 4 screens), and VIP ($299/mo — 4K, 6 screens, priority support).',
  },
  {
    question: 'Can I watch on multiple devices?',
    answer:
      'Yes! Depending on your plan, you can stream on 1 to 6 screens simultaneously. Upgrade your plan for more screens.',
  },
  {
    question: 'How do I add content to my watchlist?',
    answer:
      'Navigate to any movie or TV series detail page and click the "+ Watchlist" button. You can view your saved items from "My List" in the navigation.',
  },
  {
    question: 'What video formats are supported?',
    answer:
      'HnH TV supports MP4, WebM, and MKV formats. MKV files are automatically remuxed on the fly for seamless browser playback.',
  },
  {
    question: 'Why is there no audio on some videos?',
    answer:
      'Some source files use AC3 audio which browsers don\'t support natively. Our backend automatically re-encodes these to AAC for compatibility.',
  },
  {
    question: 'How do I cancel my subscription?',
    answer:
      'Go to your Account page, navigate to the Subscription section, and click "Cancel Subscription". You\'ll retain access until the end of your billing period.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Absolutely. We use JWT-based authentication, encrypted passwords, and role-based access control to keep your account and data safe.',
  },
];

function Help() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="help-page">
      <Header />

      {/* Hero */}
      <section className="help-hero">
        <div className="about-hero-glow"></div>
        <div className="help-hero-content">
          <h1>Help & <span className="gold-text">Support</span></h1>
          <p>Find answers to common questions or get in touch with us</p>
        </div>
      </section>

      {/* FAQs */}
      <section className="help-section">
        <div className="help-container">
          <div className="about-section-header">
            <h2>Frequently Asked <span className="gold-text">Questions</span></h2>
          </div>

          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`faq-item ${openIndex === index ? 'open' : ''}`}
              >
                <button className="faq-question" onClick={() => toggleFaq(index)}>
                  <span>{faq.question}</span>
                  <span className="faq-icon">{openIndex === index ? '−' : '+'}</span>
                </button>
                {openIndex === index && (
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Us */}
      <section className="help-section help-section-alt">
        <div className="help-container">
          <div className="about-section-header">
            <h2>Contact <span className="gold-text">Us</span></h2>
            <p>Can't find what you're looking for? Reach out to us directly.</p>
          </div>

          <div className="contact-grid">
            <div className="contact-card">
              <div className="contact-icon">📧</div>
              <h3>Email</h3>
              <p>support@hnhtv.com</p>
              <a href="mailto:support@hnhtv.com" className="contact-link">Send Email</a>
            </div>
            <div className="contact-card">
              <div className="contact-icon">💬</div>
              <h3>Live Chat</h3>
              <p>Available 24/7 for Premium & VIP members</p>
              <span className="contact-link">Coming Soon</span>
            </div>
            <div className="contact-card">
              <div className="contact-icon">🐛</div>
              <h3>Report a Bug</h3>
              <p>Found an issue? Let us know so we can fix it</p>
              <a href="mailto:bugs@hnhtv.com" className="contact-link">Report Issue</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Help;
