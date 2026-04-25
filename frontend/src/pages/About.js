import React from 'react';
import Header from '../components/Header';
import '../styles/pages.css';

function About() {
  const projects = [
    {
      icon: '🎮',
      title: 'H&H-Plays.com',
      description:
        'A HTML based webpage aims to connect like minded PC Gaming enthusiasts of Pakistan.',
      link: '#',
    },
    {
      icon: '🗺️',
      title: 'Quest Trek',
      description:
        'C++ Console based Capstone Project: Text-Based RPG - "Quests of Eldoria".',
      link: '#',
    },
    {
      icon: '🏨',
      title: 'H&H for the Stay',
      description:
        'Our very own Hotel Reservation SQL Application for managing bookings and stays efficiently. Made using Qt and PostgreSQL.',
      link: '#',
    },
    {
      icon: '🏎️',
      title: 'F1 Grub Themes',
      description:
        'FIA Formula One World Championship teams GRUB themes for bootloaders made by Hasan. Created it for friends, family and the OpenSource community.',
      link: '#',
    },
  ];

  return (
    <div className="about-page">
      <Header />

      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-glow"></div>
        <div className="about-hero-content">
          <h1>About <span className="gold-text">HnH TV</span></h1>
          <p>A project by Hasan, Huzaifa and Zunnorain; H&H group of companies</p>
        </div>
      </section>

      {/* Mission / Vision / Values */}
      <section className="about-section">
        <div className="about-container">
          <div className="about-grid about-grid-3">
            <div className="about-card about-card-centered">
              <div className="about-card-icon">🎯</div>
              <h3>Our Mission</h3>
              <p>
                We're dedicated to providing high quality, safe, and OpenSource
                projects to the community.
              </p>
            </div>
            <div className="about-card about-card-centered">
              <div className="about-card-icon">✨</div>
              <h3>Our Vision</h3>
              <p>
                To be the best in what we do, contributing our part in making
                the world a better place.
              </p>
            </div>
            <div className="about-card about-card-centered">
              <div className="about-card-icon">💎</div>
              <h3>Our Values</h3>
              <p>
                Quality and transparency are at the heart of everything we do.
                We believe in OpenSource.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="about-section about-section-alt">
        <div className="about-container">
          <div className="about-story-card">
            <h2 className="about-story-title">About HnH TV</h2>
            <p>
              About this streaming platform; we carefully curate every piece of
              content in our collection, ensuring that each title meets our
              strict standards for quality and entertainment value. Our team
              works tirelessly to bring you the best selection of movies and TV
              series for every taste, from blockbusters to hidden gems.
            </p>
            <p>
              Today in HnH TV, we serve thousands of happy viewers who trust us
              to deliver not just entertainment, but happiness, imagination, and
              the building blocks of cherished memories.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="about-section">
        <div className="about-container">
          <div className="about-stats-bar">
            <div className="about-stat">
              <span className="about-stat-number">5000+</span>
              <span className="about-stat-label">Happy Customers</span>
            </div>
            <div className="about-stat">
              <span className="about-stat-number">30+</span>
              <span className="about-stat-label">Unique Titles</span>
            </div>
            <div className="about-stat">
              <span className="about-stat-number">5+</span>
              <span className="about-stat-label">Categories</span>
            </div>
            <div className="about-stat">
              <span className="about-stat-number">24/7</span>
              <span className="about-stat-label">Customer Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* More Projects */}
      <section className="about-section about-section-alt">
        <div className="about-container">
          <div className="about-section-header">
            <h2>More Projects by <span className="gold-text">H&H</span></h2>
          </div>

          <div className="about-grid about-grid-4">
            {projects.map((project, index) => (
              <a
                key={index}
                href={project.link}
                className="about-project-card"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="about-project-icon">{project.icon}</div>
                <h4>{project.title}</h4>
                <p>{project.description}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="about-footer">
        <div className="about-container">
          <div className="about-footer-content">
            <span className="about-footer-logo">HnH TV</span>
            <p>© {new Date().getFullYear()} HnH TV. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default About;
