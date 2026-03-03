import React, { useState } from 'react';
import './Navbar.css';

const Navbar = () => {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleDropdown = (menu) => {
    setActiveDropdown(activeDropdown === menu ? null : menu);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    setActiveDropdown(null); // Close dropdowns when toggling mobile menu
  };

  const primaryMenuItems = [
    {
      id: 'home',
      name: 'Home',
      icon: '🏠',
      dropdownItems: [
        'Dashboard overview',
        'Quick stats',
        'Recent activity'
      ]
    },
    {
      id: 'career',
      name: 'Career Paths',
      icon: '🗺',
      dropdownItems: [
        'Explore Careers',
        'My Roadmaps',
        'Skill Assessment',
        'Industry Trends',
        'Salary Insights',
        'Compare Paths'
      ]
    },
    {
      id: 'study',
      name: 'Study Hub',
      icon: '📚',
      dropdownItems: [
        'Smart Quizzer',
        'Problem Solver',
        'Study Planner',
        'Revision Scheduler',
        'My Weaknesses',
        'Topic Explorer'
      ]
    },
    {
      id: 'ai',
      name: 'AI Companion',
      icon: '💬',
      dropdownItems: [
        'Ask a Question',
        'Concept Explanation',
        'Motivation Boost',
        'Mental Health Check',
        'Conversation History',
        'Learning Tips'
      ]
    },
    {
      id: 'groups',
      name: 'Study Groups',
      icon: '👥',
      dropdownItems: [
        'Find Partners',
        'My Groups',
        'Virtual Rooms',
        'Group Challenges',
        'Peer Teaching',
        'Schedule Session'
      ]
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: '📊',
      dropdownItems: [
        'Performance Dashboard',
        'Progress Tracking',
        'Grade Predictor',
        'Strength/Weakness Map',
        'Improvement Plan',
        'Share Reports'
      ]
    }
  ];

  const secondaryMenuItems = [
    {
      id: 'search',
      name: 'Search',
      icon: '🔍'
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: '🔔',
      dropdownItems: [
        'Study reminders',
        'Group updates',
        'Progress alerts',
        'System messages'
      ]
    },
    {
      id: 'profile',
      name: 'Profile',
      icon: '👤',
      dropdownItems: [
        'My Account',
        'Subscription',
        'Achievements',
        'Settings',
        'Help Center',
        'Logout'
      ]
    }
  ];

  return (
    <nav className="navbar">
      {/* Logo */}
      <div className="navbar-brand">
        <h2>EduMitra</h2>
      </div>

      {/* Desktop Navigation */}
      <div className="navbar-desktop">
        {/* Primary Menu Items */}
        <ul className="navbar-primary">
          {primaryMenuItems.map((item) => (
            <li
              key={item.id}
              className={`nav-item ${activeDropdown === item.id ? 'active' : ''}`}
              onMouseEnter={() => toggleDropdown(item.id)}
              onMouseLeave={() => toggleDropdown(null)}
            >
              <button className="nav-link">
                <span className="nav-icon">{item.icon}</span>
                {item.name}
              </button>

              {item.dropdownItems && activeDropdown === item.id && (
                <div className="dropdown-menu">
                  {item.dropdownItems.map((dropdownItem, index) => (
                    <a key={index} href="#" className="dropdown-item">
                      {dropdownItem}
                    </a>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>

        {/* Secondary Menu Items */}
        <ul className="navbar-secondary">
          {secondaryMenuItems.map((item) => (
            <li
              key={item.id}
              className={`nav-item ${activeDropdown === item.id ? 'active' : ''}`}
              onMouseEnter={() => toggleDropdown(item.id)}
              onMouseLeave={() => toggleDropdown(null)}
            >
              <button className="nav-link">
                <span className="nav-icon">{item.icon}</span>
                {item.name}
              </button>

              {item.dropdownItems && activeDropdown === item.id && (
                <div className="dropdown-menu">
                  {item.dropdownItems.map((dropdownItem, index) => (
                    <a key={index} href="#" className="dropdown-item">
                      {dropdownItem}
                    </a>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Mobile Menu Button */}
      <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Mobile Navigation */}
      <div className={`navbar-mobile ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <h3>EduMitra Menu</h3>
          <button className="mobile-menu-close" onClick={toggleMobileMenu}>×</button>
        </div>

        <div className="mobile-quick-access">
          <button className="quick-access-btn ai-companion">
            💬 AI Companion
          </button>
          <button className="quick-access-btn stress-relief">
            🧘 Emergency Stress Relief
          </button>
        </div>

        <ul className="mobile-nav-items">
          {primaryMenuItems.map((item) => (
            <li key={item.id} className="mobile-nav-item">
              <button
                className="mobile-nav-link"
                onClick={() => toggleDropdown(item.id)}
              >
                <span className="mobile-nav-icon">{item.icon}</span>
                {item.name}
                {item.dropdownItems && <span className="dropdown-arrow">▼</span>}
              </button>

              {item.dropdownItems && activeDropdown === item.id && (
                <ul className="mobile-dropdown-menu">
                  {item.dropdownItems.map((dropdownItem, index) => (
                    <li key={index}>
                      <a href="#" className="mobile-dropdown-item">
                        {dropdownItem}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}

          {secondaryMenuItems.map((item) => (
            <li key={item.id} className="mobile-nav-item">
              <button
                className="mobile-nav-link"
                onClick={() => toggleDropdown(item.id)}
              >
                <span className="mobile-nav-icon">{item.icon}</span>
                {item.name}
                {item.dropdownItems && <span className="dropdown-arrow">▼</span>}
              </button>

              {item.dropdownItems && activeDropdown === item.id && (
                <ul className="mobile-dropdown-menu">
                  {item.dropdownItems.map((dropdownItem, index) => (
                    <li key={index}>
                      <a href="#" className="mobile-dropdown-item">
                        {dropdownItem}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;