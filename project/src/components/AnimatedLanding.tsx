import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LandingNavbar } from './LandingNavbar';
import { LoginCard } from './LoginCard';
import { Sparkles, FileText, Linkedin, ArrowRight, UserCheck, UploadCloud, BarChart2, Star, Users, Quote } from 'lucide-react';
import { GlassmorphismCard } from './GlassmorphismCard';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import ConfettiBackground from './confetti-background';
import { GoogleMap as GoogleMapComponent, useJsApiLoader, Marker as MarkerComponent, InfoWindow as InfoWindowComponent } from '@react-google-maps/api';

const testimonials = [
  {
    name: 'Priya S.',
    text: 'LinkLens helped me land my dream job! The resume checker and LinkedIn analysis gave me actionable tips I never thought of.',
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
  },
  {
    name: 'Rahul M.',
    text: 'The AI feedback is spot on. My profile score jumped 20 points and recruiters started reaching out more.',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  },
  {
    name: 'Aisha K.',
    text: 'I love the design and the instant results. The ATS resume match is a game changer!',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
  },
];

const stats = [
  { icon: <Users className="w-8 h-8 text-blue-400" />, label: 'Users', value: '12,400+' },
  { icon: <Star className="w-8 h-8 text-yellow-400" />, label: 'Avg. Profile Score', value: '87/100' },
  { icon: <Sparkles className="w-8 h-8 text-purple-400" />, label: 'Resumes Analyzed', value: '8,900+' },
];

const demoUsers = [
  { lat: 28.6139, lng: 77.2090, name: 'Delhi', avatar: 'https://randomuser.me/api/portraits/men/45.jpg' },
  { lat: 19.0760, lng: 72.8777, name: 'Mumbai', avatar: 'https://randomuser.me/api/portraits/women/65.jpg' },
  { lat: 12.9716, lng: 77.5946, name: 'Bangalore', avatar: 'https://randomuser.me/api/portraits/men/56.jpg' },
  { lat: 13.0827, lng: 80.2707, name: 'Chennai', avatar: 'https://randomuser.me/api/portraits/women/77.jpg' },
  { lat: 23.0225, lng: 72.5714, name: 'Ahmedabad', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { lat: 28.7041, lng: 77.1025, name: 'Gurgaon', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { lat: 24.8607, lng: 67.0011, name: 'Karachi', avatar: 'https://randomuser.me/api/portraits/men/33.jpg' }, // Pakistan
  { lat: 27.7172, lng: 85.3240, name: 'Kathmandu', avatar: 'https://randomuser.me/api/portraits/women/46.jpg' }, // Nepal
  { lat: 23.8103, lng: 90.4125, name: 'Dhaka', avatar: 'https://randomuser.me/api/portraits/men/47.jpg' }, // Bangladesh
  { lat: 6.9271, lng: 79.8612, name: 'Colombo', avatar: 'https://randomuser.me/api/portraits/women/48.jpg' }, // Sri Lanka
  // Added Odisha, Gunupur, Rayagada, Muniguda
  { lat: 20.9517, lng: 85.0985, name: 'Odisha', avatar: 'https://randomuser.me/api/portraits/men/21.jpg' }, // Odisha (male)
  { lat: 19.0826, lng: 83.8078, name: 'Gunupur', avatar: 'https://randomuser.me/api/portraits/women/22.jpg' }, // Gunupur (female)
  { lat: 19.1717, lng: 83.4196, name: 'Rayagada', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=rayagada' }, // Rayagada (cartoon)
  { lat: 19.8397, lng: 83.5216, name: 'Muniguda', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=muniguda' }, // Muniguda (cartoon)
  // Bhubaneswar (BBSR) - Odisha capital
  { lat: 20.2961, lng: 85.8245, name: 'Bhubaneswar', avatar: 'https://randomuser.me/api/portraits/men/41.jpg' },
  // Extra users clustered around key Odisha locations (slight offsets to avoid overlap)
  // Gunupur cluster
  { lat: 19.0880, lng: 83.8150, name: 'Gunupur', avatar: 'https://randomuser.me/api/portraits/men/52.jpg' },
  { lat: 19.0755, lng: 83.7995, name: 'Gunupur', avatar: 'https://randomuser.me/api/portraits/women/51.jpg' },
  { lat: 19.0905, lng: 83.8020, name: 'Gunupur', avatar: 'https://randomuser.me/api/portraits/men/53.jpg' },
  // Rayagada cluster
  { lat: 19.1790, lng: 83.4250, name: 'Rayagada', avatar: 'https://randomuser.me/api/portraits/women/54.jpg' },
  { lat: 19.1650, lng: 83.4120, name: 'Rayagada', avatar: 'https://randomuser.me/api/portraits/men/55.jpg' },
  { lat: 19.1605, lng: 83.4305, name: 'Rayagada', avatar: 'https://randomuser.me/api/portraits/women/56.jpg' },
  // Bhubaneswar cluster
  { lat: 20.3020, lng: 85.8305, name: 'Bhubaneswar', avatar: 'https://randomuser.me/api/portraits/men/57.jpg' },
  { lat: 20.2880, lng: 85.8200, name: 'Bhubaneswar', avatar: 'https://randomuser.me/api/portraits/women/58.jpg' },
  { lat: 20.3000, lng: 85.8120, name: 'Bhubaneswar', avatar: 'https://randomuser.me/api/portraits/men/59.jpg' },
];

const pinLocations = [
  'Odisha',
  'Gunupur',
  'Rayagada',
  'Muniguda',
  'Bhubaneswar',
];

interface AnimatedLandingProps {
  showLogin: boolean;
  setShowLogin: (show: boolean) => void;
}

// Helper to show robust avatars with fallback to initials
const getInitials = (name: string) => {
  const clean = (name || 'User').trim();
  const parts = clean.split(' ').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return clean.slice(0, 2).toUpperCase();
};

const ReviewAvatar: React.FC<{ name: string; src?: string; className?: string }> = ({ name, src, className = '' }) => {
  const [error, setError] = useState(false);
  const generated = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'User')}&backgroundType=gradientLinear&fontFamily=Arial&fontWeight=700&fontSize=50`;
  const imgSrc = !error && (src || generated);
  return (
    <>
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={name}
          className={`${className} object-cover bg-white`}
          onError={() => setError(true)}
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className={`${className} bg-blue-700 text-white flex items-center justify-center`}>
          <span className="font-bold">{getInitials(name)}</span>
        </div>
      )}
    </>
  );
};

const AnimatedLanding: React.FC<AnimatedLandingProps> = ({ showLogin, setShowLogin }) => {
  const navigate = useNavigate();
  const [authVersion, setAuthVersion] = useState(0);
  const isAuthenticated = Boolean(localStorage.getItem('linklens_user'));
  // Reviews state
  const [userTestimonials, setUserTestimonials] = useState<{ name: string; text: string; avatar: string; rating?: number; }[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewName, setReviewName] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewError, setReviewError] = useState('');
  // 2. Add new state for FAQ and newsletter
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [newsletterError, setNewsletterError] = useState('');
  // Add state for visibleCards
  const [visibleCards, setVisibleCards] = useState(1);
  // Add state for selected marker
  const [selectedUser, setSelectedUser] = useState<null | typeof demoUsers[0]>(null);

  useEffect(() => {
    const handler = () => setAuthVersion(v => v + 1);
    window.addEventListener('linklens-auth-changed', handler);
    return () => window.removeEventListener('linklens-auth-changed', handler);
  }, []);

  // Default testimonials to fill up to 8
  const defaultTestimonials = [
    ...testimonials,
    {
      name: 'Samantha L.',
      text: 'The feedback was so detailed and actionable. I improved my profile in minutes!',
      avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
    },
    {
      name: 'Vikram P.',
      text: 'I got more recruiter messages after using LinkLens. Highly recommend!',
      avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
    },
    {
      name: 'Emily R.',
      text: 'The resume checker is the best I have tried. Super easy to use.',
      avatar: 'https://randomuser.me/api/portraits/women/23.jpg',
    },
    {
      name: 'Carlos M.',
      text: 'Love the design and the AI tips. Helped me land interviews!',
      avatar: 'https://randomuser.me/api/portraits/men/56.jpg',
    },
    {
      name: 'Fatima Z.',
      text: 'The best LinkedIn analyzer out there. The team is super helpful too.',
      avatar: 'https://randomuser.me/api/portraits/women/77.jpg',
    },
  ];

  // Fetch reviews from backend
  useEffect(() => {
    fetch('http://localhost:3001/api/reviews')
      .then(res => res.json())
      .then(data => {
        let reviews = Array.isArray(data) ? data : [];
        // Fill up to 8 reviews with defaults if needed
        if (reviews.length < 8) {
          const needed = 8 - reviews.length;
          reviews = reviews.concat(defaultTestimonials.slice(0, needed));
        }
        setUserTestimonials(reviews);
      })
      .catch(() => {
        // On error, show 8 default testimonials
        setUserTestimonials(defaultTestimonials.slice(0, 8));
      });
  }, [authVersion, showReviewModal]);

  // Handler for successful login
  const handleLoginSuccess = () => {
    setShowLogin(false);
    // Do not navigate; stay on landing page after login
  };

  // Post review to backend
  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError('');
    if (!reviewName.trim() || !reviewText.trim()) {
      setReviewError('Please enter your name and review.');
      return;
    }
    // Get user profile picture if logged in
    let avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(reviewName.trim())}`;
    try {
      const user = JSON.parse(localStorage.getItem('linklens_user') || '{}');
      if (user && user.picture) {
        avatarUrl = user.picture;
      }
    } catch { }
    try {
      const res = await fetch('http://localhost:3001/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: reviewName.trim(),
          text: reviewText.trim(),
          avatar: avatarUrl,
          rating: reviewRating,
        }),
      });
      if (!res.ok) {
        let errorMsg = 'Failed to submit review';
        try {
          const errorData = await res.json();
          if (errorData && errorData.error) errorMsg = errorData.error;
        } catch { }
        throw new Error(errorMsg);
      }
      const newReview = await res.json();
      // Always show the new review at the front, and fill up to 8 with defaults if needed
      let updated = [newReview, ...userTestimonials];
      if (updated.length < 8) {
        const needed = 8 - updated.length;
        updated = updated.concat(defaultTestimonials.slice(0, needed));
      }
      setUserTestimonials(updated.slice(0, 8));
      setTestimonialIndex(0); // Reset carousel to first page
      setShowReviewModal(false);
      setReviewName('');
      setReviewText('');
      setReviewRating(5);
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Failed to submit review. Please try again.');
    }
  };

  // HERO CARDS DATA
  const heroCards = [
    {
      icon: <Linkedin className="w-12 h-12 text-blue-400" />,
      headline: 'AI LinkedIn Analyzer',
      subtitle: 'Get instant, actionable insights for your LinkedIn profile.',
      cta: 'Analyze Profile',
      bg: 'from-blue-500/80 to-purple-500/80',
    },
    {
      icon: <FileText className="w-12 h-12 text-purple-400" />,
      headline: 'ATS Resume Match',
      subtitle: 'Upload your resume and see how you match any job.',
      cta: 'Try Resume Checker',
      bg: 'from-purple-500/80 to-pink-500/80',
    },
    {
      icon: <Star className="w-12 h-12 text-yellow-400" />, // Changed from Sparkles to Star
      headline: 'AI Career Tips',
      subtitle: 'Unlock personalized suggestions to stand out to recruiters.',
      cta: 'Get AI Tips',
      bg: 'from-yellow-400/80 to-blue-400/80',
    },
    {
      icon: <BarChart2 className="w-12 h-12 text-green-400" />,
      headline: 'Industry Benchmark',
      subtitle: 'See how your profile compares to top performers.',
      cta: 'See Benchmark',
      bg: 'from-green-400/80 to-blue-500/80',
    },
  ];
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselTimeout = useRef<NodeJS.Timeout | null>(null);

  // Responsive visibleCards calculation (used for both hero and testimonials)
  useEffect(() => {
    function updateVisibleCards() {
      if (window.innerWidth < 640) setVisibleCards(1);
      else if (window.innerWidth < 1024) setVisibleCards(2);
      else setVisibleCards(4); // 4 for testimonials, 3 for hero, but use 4 for both for consistency
    }
    updateVisibleCards();
    window.addEventListener('resize', updateVisibleCards);
    return () => window.removeEventListener('resize', updateVisibleCards);
  }, []);

  // AUTO-SLIDE LOGIC
  useEffect(() => {
    if (carouselTimeout.current) clearTimeout(carouselTimeout.current);
    carouselTimeout.current = setTimeout(() => {
      setCarouselIndex((prev) => (prev + 1) % heroCards.length);
    }, 4000);
    return () => {
      if (carouselTimeout.current) clearTimeout(carouselTimeout.current);
    };
  }, [carouselIndex]);

  // --- Testimonials Carousel State ---
  const [testimonialIndex, setTestimonialIndex] = useState(0); // which group is shown
  const testimonialScrollRef = useRef<HTMLDivElement>(null);
  const testimonialAutoScrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const testimonialUserInteracting = useRef(false);
  const testimonialsPerPage = visibleCards;
  const totalTestimonialPages = Math.ceil(userTestimonials.length / testimonialsPerPage);

  // Auto-scroll testimonials every 5s
  useEffect(() => {
    if (testimonialAutoScrollTimeout.current) clearTimeout(testimonialAutoScrollTimeout.current);
    if (userTestimonials.length <= testimonialsPerPage) return;
    if (testimonialUserInteracting.current) return;
    testimonialAutoScrollTimeout.current = setTimeout(() => {
      setTestimonialIndex((prev) => (prev + 1) % totalTestimonialPages);
    }, 5000);
    return () => {
      if (testimonialAutoScrollTimeout.current) clearTimeout(testimonialAutoScrollTimeout.current);
    };
  }, [testimonialIndex, userTestimonials.length, testimonialsPerPage, totalTestimonialPages]);

  // Pause auto-scroll on user interaction
  useEffect(() => {
    const container = testimonialScrollRef.current;
    if (!container) return;
    let interactionTimeout: NodeJS.Timeout | null = null;
    const onUserInteract = () => {
      testimonialUserInteracting.current = true;
      if (interactionTimeout) clearTimeout(interactionTimeout);
      interactionTimeout = setTimeout(() => {
        testimonialUserInteracting.current = false;
      }, 4000);
    };
    container.addEventListener('mousedown', onUserInteract);
    container.addEventListener('touchstart', onUserInteract);
    container.addEventListener('wheel', onUserInteract);
    return () => {
      container.removeEventListener('mousedown', onUserInteract);
      container.removeEventListener('touchstart', onUserInteract);
      container.removeEventListener('wheel', onUserInteract);
      if (interactionTimeout) clearTimeout(interactionTimeout);
    };
  }, []);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (showReviewModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showReviewModal]);

  // Google Maps API loader
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  // Prepare the Google Map element to avoid JSX linter errors
  let googleMapElement = null;
  if (isLoaded) {
    googleMapElement = React.createElement(GoogleMapComponent as any, {
      mapContainerStyle: { width: '100%', height: '100%' },
      center: { lat: 22.9734, lng: 78.6569 }, // Center of India
      zoom: 4, // Focus on India and neighbors
      options: {
        styles: [
          {
            featureType: "all",
            elementType: "all",
            stylers: [{ saturation: -100 }, { gamma: 0.5 }]
          }
        ],
        disableDefaultUI: true, // Hide all default controls
        zoomControl: true,      // Show only zoom control
        gestureHandling: "greedy", // Allow full interaction
        backgroundColor: "#f5f5f5", // Clean background
      },
      children: [
        ...demoUsers.map((user, idx) =>
          React.createElement(MarkerComponent as any, {
            key: idx,
            position: { lat: user.lat, lng: user.lng },
            animation: window.google.maps.Animation.DROP,
            onClick: () => setSelectedUser(user),
            ...(pinLocations.includes(user.name)
              ? {} // Use default pin for Odisha, Gunupur, Rayagada, Muniguda
              : {
                icon: {
                  url: user.avatar,
                  scaledSize: new window.google.maps.Size(44, 44),
                  origin: new window.google.maps.Point(0, 0),
                  anchor: new window.google.maps.Point(22, 22),
                },
              }),
          })
        ),
        selectedUser && React.createElement(InfoWindowComponent as any, {
          key: 'info',
          position: { lat: selectedUser.lat, lng: selectedUser.lng },
          onCloseClick: () => setSelectedUser(null),
          children: (
            <div style={{ minWidth: 220 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 4 }}>Order #RP202507211622583BDE3EC7</div>
              <div>Status: <span style={{ color: '#eab308', fontWeight: 500 }}>Pending</span></div>
              <div>Total: <span style={{ color: '#16a34a', fontWeight: 500 }}>₹2372.34</span></div>
              <div>Placed: 21 Jul 2025, 4:22 pm</div>
            </div>
          )
        })
      ].filter(Boolean),
    });
  }

  return (
    <>
      <LandingNavbar />
      <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0a1836] via-[#1a1047] to-[#0e1a2b] overflow-x-hidden overflow-hidden">
        <ConfettiBackground />
        {/* HERO SECTION: Full-width, edge-to-edge, at the top */}
        <section className="relative w-screen left-1/2 -translate-x-1/2 flex flex-col items-center justify-center min-h-screen pt-24 overflow-hidden" style={{ paddingTop: 0, paddingBottom: 0 }}>
          {/* Animated SVG background */}
          <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none" viewBox="0 0 1920 600" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <defs>
              <linearGradient id="hero-gradient" x1="0" y1="0" x2="1920" y2="600" gradientUnits="userSpaceOnUse">
                <stop stopColor="#60a5fa" stopOpacity="0.25" />
                <stop offset="0.5" stopColor="#a78bfa" stopOpacity="0.18" />
                <stop offset="1" stopColor="#f472b6" stopOpacity="0.18" />
              </linearGradient>
              <radialGradient id="hero-radial" cx="50%" cy="50%" r="80%" fx="50%" fy="50%">
                <stop offset="0%" stopColor="#a5b4fc" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#f472b6" stopOpacity="0.10" />
              </radialGradient>
            </defs>
            <rect width="1920" height="600" fill="url(#hero-gradient)" />
            <ellipse cx="960" cy="300" rx="700" ry="220" fill="url(#hero-radial)" className="animate-pulse" />
            <ellipse cx="400" cy="100" rx="220" ry="80" fill="#60a5fa" fillOpacity="0.10" className="animate-float" />
            <ellipse cx="1600" cy="500" rx="180" ry="60" fill="#f472b6" fillOpacity="0.10" className="animate-float-rev" />
          </svg>
          {/* Animated floating logos/icons in the background */}
          <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
            {/* LinkedIn Logo */}
            <svg className="absolute animate-float-1" style={{ left: '8%', top: '18%', width: '60px', height: '60px', opacity: 0.18 }} viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="12" fill="#0A66C2" /><path d="M14.5 19h5v15h-5V19zm2.5-2.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5zM21 19h4.8v2.1h.1c.7-1.3 2.3-2.6 4.7-2.6 5 0 5.9 3.3 5.9 7.6V34h-5v-7.1c0-1.7 0-3.9-2.4-3.9-2.4 0-2.8 1.8-2.8 3.7V34h-5V19z" fill="#fff" /></svg>
            {/* Resume Icon */}
            <svg className="absolute animate-float-2" style={{ right: '10%', top: '30%', width: '56px', height: '56px', opacity: 0.16 }} viewBox="0 0 48 48" fill="none"><rect x="8" y="8" width="32" height="32" rx="6" fill="#6366F1" /><rect x="16" y="16" width="16" height="2.5" rx="1.25" fill="#fff" /><rect x="16" y="22" width="16" height="2.5" rx="1.25" fill="#fff" /><rect x="16" y="28" width="10" height="2.5" rx="1.25" fill="#fff" /></svg>
            {/* AI/Robot Icon */}
            <svg className="absolute animate-float-3" style={{ left: '20%', bottom: '18%', width: '54px', height: '54px', opacity: 0.14 }} viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="20" fill="#a78bfa" /><rect x="16" y="20" width="16" height="10" rx="5" fill="#fff" /><circle cx="20" cy="25" r="2" fill="#a78bfa" /><circle cx="28" cy="25" r="2" fill="#a78bfa" /></svg>
            {/* Analytics Icon */}
            <svg className="absolute animate-float-4" style={{ right: '18%', bottom: '12%', width: '52px', height: '52px', opacity: 0.13 }} viewBox="0 0 48 48" fill="none"><rect x="8" y="8" width="32" height="32" rx="8" fill="#38bdf8" /><rect x="16" y="28" width="4" height="8" rx="2" fill="#fff" /><rect x="22" y="20" width="4" height="16" rx="2" fill="#fff" /><rect x="28" y="24" width="4" height="12" rx="2" fill="#fff" /></svg>
          </div>
          {/* Hero content */}
          <div className="relative z-10 w-full h-full flex flex-col items-center justify-center text-center gap-10 px-2 sm:px-6 md:px-12 lg:px-24" style={{ minHeight: '70vh' }}>
            <h1 className="text-6xl md:text-8xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent" style={{ textShadow: '0 4px 32px rgba(167,139,250,0.25), 0 2px 8px rgba(96,165,250,0.18)' }}>
              Unlock Your Career Potential
            </h1>
            <p className="text-2xl md:text-3xl text-blue-100/90 w-full max-w-5xl mx-auto">
              The next-generation AI platform for LinkedIn and resume analysis. Get personalized, actionable insights and stand out to recruiters.
            </p>
            {/* Icon Row - LinkedIn, Resume, AI (Sparkles) */}
            <div className="flex flex-row items-center justify-center gap-8 md:gap-16 my-4 w-full">
              <div className="flex flex-col items-center group">
                <div className="p-4 bg-blue-600/20 rounded-full border-2 border-blue-400/30 shadow-lg group-hover:scale-110 transition-transform">
                  <Linkedin className="w-8 h-8 md:w-10 md:h-10 text-blue-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <span className="mt-2 text-blue-200 text-xs md:text-sm font-semibold tracking-wide">LinkedIn</span>
              </div>
              <div className="flex flex-col items-center group">
                <div className="p-4 bg-purple-600/20 rounded-full border-2 border-purple-400/30 shadow-lg group-hover:scale-110 transition-transform">
                  <FileText className="w-8 h-8 md:w-10 md:h-10 text-purple-400 group-hover:text-purple-500 transition-colors" />
                </div>
                <span className="mt-2 text-purple-200 text-xs md:text-sm font-semibold tracking-wide">Resume</span>
              </div>
              <div className="flex flex-col items-center group">
                <div className="p-4 bg-yellow-400/20 rounded-full border-2 border-yellow-400/30 shadow-lg group-hover:scale-110 transition-transform">
                  <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-yellow-400 group-hover:text-yellow-300 transition-colors" />
                </div>
                <span className="mt-2 text-yellow-200 text-xs md:text-sm font-semibold tracking-wide">AI</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 justify-center mt-6 w-full max-w-2xl mx-auto">
              <button
                className="flex-1 px-0 py-5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white font-bold text-2xl shadow-xl border-2 border-white/10 hover:from-blue-700 hover:to-purple-700 transition-all focus:outline-none focus:ring-4 focus:ring-blue-400/40"
                onClick={() => {
                  if (isAuthenticated) {
                    navigate('/app');
                  } else {
                    setShowLogin(true);
                  }
                }}
              >
                Get Started Free
              </button>
              <button
                className="flex-1 px-0 py-5 bg-white/10 border border-blue-400/20 rounded-full text-blue-200 font-bold text-2xl shadow hover:bg-white/20 transition-all"
                onClick={() => {
                  if (isAuthenticated) {
                    const featuresSection = document.querySelector('.fixed-section');
                    if (featuresSection) {
                      featuresSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  } else {
                    setShowLogin(true);
                  }
                }}
              >
                See How It Works
              </button>
            </div>
          </div>

          <style>{`
             .animate-float { animation: floatHero 8s ease-in-out infinite; }
             .animate-float-rev { animation: floatHeroRev 10s ease-in-out infinite; }
             .animate-float-1 { animation: float1 12s ease-in-out infinite; }
             .animate-float-2 { animation: float2 14s ease-in-out infinite; }
             .animate-float-3 { animation: float3 11s ease-in-out infinite; }
             .animate-float-4 { animation: float4 13s ease-in-out infinite; }
             @keyframes float1 { 0%,100%{transform:translateY(0) scale(1);} 50%{transform:translateY(-30px) scale(1.08);} }
             @keyframes float2 { 0%,100%{transform:translateY(0) scale(1);} 50%{transform:translateY(24px) scale(1.04);} }
             @keyframes float3 { 0%,100%{transform:translateY(0) scale(1);} 50%{transform:translateY(-18px) scale(1.06);} }
             @keyframes float4 { 0%,100%{transform:translateY(0) scale(1);} 50%{transform:translateY(20px) scale(1.03);} }
             @keyframes floatHero { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-30px);} }
             @keyframes floatHeroRev { 0%,100%{transform:translateY(0);} 50%{transform:translateY(30px);} }
              /* .drop-shadow-glow { filter: drop-shadow(0 0 8px #fff7) drop-shadow(0 0 16px #fff3); } */
          `}</style>
        </section>
        {/* Main content below hero section */}
        <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center space-y-32 pt-40 pb-24 px-4">
          {/* Card Carousel Hero Section (now below previous hero) */}
          <section className="fixed-section w-screen flex flex-col items-center justify-center py-8 md:py-10 px-0 m-0" style={{ marginLeft: 0, marginRight: 0, paddingLeft: 0, paddingRight: 0, left: 0, right: 0, width: '100vw', position: 'relative' }}>
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-6 md:mb-10">Explore Our Features</h2>
            <div className="relative w-full overflow-x-hidden px-0 m-0" style={{ marginLeft: 0, marginRight: 0, paddingLeft: 0, paddingRight: 0 }}>
              {/* Cards Row */}
              <div
                className="flex items-center transition-transform duration-700 ease-in-out w-full px-0 m-0"
                style={{
                  transform: `translateX(-${carouselIndex * (100 / visibleCards)}vw)`,
                  marginLeft: 0,
                  marginRight: 0,
                  paddingLeft: 0,
                  paddingRight: 0,
                }}
              >
                {heroCards.concat(heroCards[0]).map((card, idx) => {
                  // Calculate position relative to center
                  const pos = (idx - carouselIndex + heroCards.length) % heroCards.length;
                  // Center card is scaled up
                  const isCenter = pos === 0;
                  const isSide = pos === 1 || pos === heroCards.length - 1;
                  return (
                    <div
                      key={idx}
                      className={`flex-shrink-0 transition-all duration-700 ease-in-out
                        ${isCenter ? 'scale-100 z-20 shadow-2xl' : isSide ? 'scale-95 z-10 opacity-90' : 'scale-90 z-0 opacity-60'}
                      `}
                      style={{
                        pointerEvents: isCenter ? 'auto' : 'none',
                        transitionProperty: 'transform, box-shadow, opacity',
                        minWidth: `calc(100vw / ${visibleCards})`,
                        maxWidth: `calc(100vw / ${visibleCards})`,
                        marginLeft: 0,
                        marginRight: 0,
                        paddingLeft: 0,
                        paddingRight: 0,
                      }}
                    >
                      <div className={`flex flex-col items-center gap-4 p-7 md:p-8 rounded-3xl bg-gradient-to-br ${card.bg} shadow-xl border border-white/10 backdrop-blur-xl`}
                        style={{ minHeight: 260 }}
                      >
                        <GlowingEffect glow proximity={64} spread={40} borderWidth={3} disabled={false} />
                        <div>{card.icon}</div>
                        <h2 className="text-xl font-bold text-white text-center">{card.headline}</h2>
                        <p className="text-blue-100 text-center mb-2 text-sm md:text-base">{card.subtitle}</p>
                        <button className="px-6 py-2 mt-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white font-bold text-base shadow-xl border-2 border-white/10 hover:from-blue-700 hover:to-purple-700 transition-all focus:outline-none focus:ring-4 focus:ring-blue-400/40"
                          onClick={() => {
                            if (isAuthenticated) {
                              if (card.cta === 'Analyze Profile' || card.cta === 'Get AI Tips' || card.cta === 'AI LinkedIn Analyzer') {
                                navigate('/app');
                              } else if (card.cta === 'Try Resume Checker' || card.cta === 'ATS Resume Match') {
                                navigate('/resume-analyzer');
                              } else {
                                // For other CTAs, scroll to features or show demo
                                const featuresSection = document.querySelector('.fixed-section');
                                if (featuresSection) {
                                  featuresSection.scrollIntoView({ behavior: 'smooth' });
                                }
                              }
                            } else {
                              setShowLogin(true);
                            }
                          }}
                        >
                          {card.cta}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Navigation Arrows */}
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-blue-900/70 text-white rounded-full p-2 md:p-3 shadow-lg hover:scale-110 transition-all border border-blue-400/30"
                onClick={() => setCarouselIndex((carouselIndex - 1 + heroCards.length) % heroCards.length)}
                aria-label="Previous card"
                style={{ left: 0 }}
              >
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-blue-900/70 text-white rounded-full p-2 md:p-3 shadow-lg hover:scale-110 transition-all border border-blue-400/30"
                onClick={() => setCarouselIndex((carouselIndex + 1) % heroCards.length)}
                aria-label="Next card"
                style={{ right: 0 }}
              >
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              {/* Dots navigation */}
              <div className="absolute bottom-2 md:bottom-4 left-1/2 -translate-x-1/2 flex gap-2 md:gap-3 z-30">
                {heroCards.map((_, idx) => (
                  <button
                    key={idx}
                    className={`w-3 h-3 md:w-4 md:h-4 rounded-full border-2 ${idx === carouselIndex ? 'bg-blue-400 border-blue-400' : 'bg-white/30 border-white/50'} transition-all`}
                    onClick={() => setCarouselIndex(idx)}
                    aria-label={`Go to card ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Feature Cards */}
          <section className="w-full flex flex-col md:flex-row gap-12 justify-center items-center">
            <button
              type="button"
              className="flex-1 p-0 bg-transparent border-none outline-none focus:outline-none"
              style={{ minWidth: 0 }}
              onClick={() => {
                if (isAuthenticated) {
                  navigate('/app');
                } else {
                  setShowLogin(true);
                }
              }}
            >
              <GlassmorphismCard className="p-10 flex flex-col items-center gap-5 hover:scale-105 transition-transform duration-300 shadow-xl border-2 border-blue-400/20 cursor-pointer" variant="primary" glowEffect>
                <GlowingEffect glow proximity={64} spread={40} borderWidth={3} disabled={false} />
                <div className="bg-blue-600/20 rounded-full p-4 mb-2">
                  <Linkedin className="w-12 h-12 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">Profile Analyzer</h2>
                <p className="text-blue-200 text-center mb-2">Analyze your LinkedIn profile for strengths, improvements, and keyword optimization. Get a personalized AI score and actionable tips.</p>
              </GlassmorphismCard>
            </button>
            <button
              type="button"
              className="flex-1 p-0 bg-transparent border-none outline-none focus:outline-none"
              style={{ minWidth: 0 }}
              onClick={() => {
                if (isAuthenticated) {
                  navigate('/resume-analyzer');
                } else {
                  setShowLogin(true);
                }
              }}
            >
              <GlassmorphismCard className="p-10 flex flex-col items-center gap-5 hover:scale-105 transition-transform duration-300 shadow-xl border-2 border-purple-400/20 cursor-pointer" variant="secondary" glowEffect>
                <GlowingEffect glow proximity={64} spread={40} borderWidth={3} disabled={false} />
                <div className="bg-purple-600/20 rounded-full p-4 mb-2">
                  <FileText className="w-12 h-12 text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">Resume ATS Checker</h2>
                <p className="text-blue-200 text-center mb-2">Upload your resume and paste a job description to see how well you match. Get an ATS-style score and improvement suggestions.</p>
              </GlassmorphismCard>
            </button>
          </section>

          {/* Animated Stats Section with parallax effect */}
          <section className="w-full flex flex-col md:flex-row gap-10 justify-center items-center mt-8 animate-parallax-stats">
            {stats.map((stat, idx) => (
              <GlassmorphismCard key={stat.label} className="flex-1 p-8 flex flex-col items-center gap-3 animate-float" variant="accent">
                <GlowingEffect glow proximity={64} spread={40} borderWidth={3} disabled={false} />
                <div>{stat.icon}</div>
                <div className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent drop-shadow-glow">{stat.value}</div>
                <div className="text-blue-200 text-lg font-semibold">{stat.label}</div>
              </GlassmorphismCard>
            ))}
          </section>

          {/* Global Community Map Section */}
          <section className="w-full max-w-5xl mx-auto mt-24 animate-fade-in">
            <GlassmorphismCard className="p-10 flex flex-col items-center gap-8 shadow-2xl border-2 border-blue-400/20" variant="primary" glowEffect>
              <GlowingEffect glow proximity={64} spread={40} borderWidth={3} disabled={false} />
              <h3 className="text-3xl font-bold text-white text-center mb-2">Global Community</h3>
              <p className="text-blue-200 text-center mb-4 max-w-2xl">LinkLens is used by professionals around the world. Join a global network of job seekers, career changers, and AI enthusiasts!</p>
              <div className="w-full h-[400px] rounded-2xl overflow-hidden relative">
                {isLoaded ? (
                  googleMapElement
                ) : (
                  <div className="flex items-center justify-center h-full text-blue-200">Loading map...</div>
                )}
                {/* Animated dots overlay for extra effect - removed for India map focus */}
              </div>
            </GlassmorphismCard>
          </section>

          {/* Testimonials Section with parallax effect */}
          <section className="w-full animate-parallax-testimonials">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-3xl font-bold text-white text-center mb-8">What Our Users Say</h3>
            </div>
            <div className="relative w-screen left-1/2 -translate-x-1/2" style={{ marginLeft: 0, marginRight: 0, paddingLeft: 0, paddingRight: 0 }}>
              {/* Left Arrow */}
              <button
                type="button"
                aria-label="Scroll testimonials left"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-gradient-to-r from-blue-900/80 to-blue-700/80 text-white rounded-full p-2 shadow-lg hover:scale-110 transition-all opacity-80 hover:opacity-100 backdrop-blur-md border border-blue-400/30"
                style={{ display: userTestimonials.length > testimonialsPerPage ? '' : 'none' }}
                onClick={() => setTestimonialIndex((testimonialIndex - 1 + totalTestimonialPages) % totalTestimonialPages)}
                id="testimonial-left-arrow"
              >
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              {/* Right Arrow */}
              <button
                type="button"
                aria-label="Scroll testimonials right"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-gradient-to-l from-blue-900/80 to-blue-700/80 text-white rounded-full p-2 shadow-lg hover:scale-110 transition-all opacity-80 hover:opacity-100 backdrop-blur-md border border-blue-400/30"
                style={{ display: userTestimonials.length > testimonialsPerPage ? '' : 'none' }}
                onClick={() => setTestimonialIndex((testimonialIndex + 1) % totalTestimonialPages)}
                id="testimonial-right-arrow"
              >
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <div
                ref={testimonialScrollRef}
                className="flex items-start gap-8 transition-transform duration-700 ease-in-out w-full"
                style={{
                  transform: `translateX(-${testimonialIndex * (100 / testimonialsPerPage)}vw)`,
                  marginLeft: 0,
                  marginRight: 0,
                  paddingLeft: 0,
                  paddingRight: 0,
                  width: '100vw',
                  overflow: 'hidden',
                }}
                id="testimonial-scroll-container"
              >
                {userTestimonials.map((t, idx) => {
                  const name = t.name?.trim() || 'Anonymous';
                  const text = t.text?.trim() || 'No review provided.';
                  const avatar = t.avatar?.trim() || 'https://api.dicebear.com/7.x/initials/svg?seed=Anonymous';
                  const rating = typeof t.rating === 'number' ? t.rating : 5;
                  // Calculate width minus gap for each card
                  const gapPx = 32; // gap-8 = 2rem = 32px
                  const totalGap = gapPx * (testimonialsPerPage - 1);
                  const cardWidth = `calc((100vw - ${totalGap}px) / ${testimonialsPerPage})`;
                  return (
                    <div key={name + text + idx} className={`flex-shrink-0 transition-all duration-700 ease-in-out`} style={{ width: cardWidth, maxWidth: cardWidth, minWidth: cardWidth, marginLeft: 0, marginRight: 0, paddingLeft: 0, paddingRight: 0 }} data-testid="testimonial-card">
                      <GlassmorphismCard
                        className="p-10 flex flex-col items-center gap-5 hover:scale-105 transition-transform duration-300 shadow-xl border-2 border-blue-400/20 min-h-[320px] h-full justify-between"
                        variant="primary"
                        glowEffect
                      >
                        <GlowingEffect glow proximity={64} spread={40} borderWidth={3} disabled={false} />
                        <ReviewAvatar name={name} src={avatar} className="w-16 h-16 rounded-full border-2 border-blue-400 shadow-lg" />
                        <div className="flex items-center gap-2 text-blue-200"><Quote className="w-5 h-5 text-blue-400" /> <span className="italic">{text}</span></div>
                        <div className="flex items-center gap-1 mt-2">
                          {[1, 2, 3, 4, 5].map(star => (
                            <svg key={star} className={`w-5 h-5 ${rating >= star ? 'text-yellow-400' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.455a1 1 0 00-1.175 0l-3.38 2.455c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z" /></svg>
                          ))}
                        </div>
                        <div className="text-blue-100 font-bold">{name}</div>
                      </GlassmorphismCard>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-center mt-8">
              <button
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                onClick={() => setShowReviewModal(true)}
              >
                + Add Review
              </button>
            </div>
          </section>

          {/* Features Grid Section */}
          <section className="w-full max-w-6xl mx-auto mt-24 animate-fade-in">
            <h3 className="text-3xl font-bold text-white text-center mb-10">Why Choose LinkLens?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                { icon: <Sparkles className="w-10 h-10 text-blue-400" />, title: 'AI-Powered Insights', desc: 'Get instant, actionable feedback on your LinkedIn and resume using next-gen AI.' },
                { icon: <FileText className="w-10 h-10 text-purple-400" />, title: 'ATS Resume Match', desc: 'See how your resume matches any job description and get improvement tips.' },
                { icon: <UserCheck className="w-10 h-10 text-green-400" />, title: 'Personalized Scoring', desc: 'Receive a unique profile score and tailored suggestions for your career.' },
                { icon: <UploadCloud className="w-10 h-10 text-pink-400" />, title: 'Easy Uploads', desc: 'Upload resumes or paste job descriptions with a seamless, secure experience.' },
                { icon: <BarChart2 className="w-10 h-10 text-yellow-400" />, title: 'Industry Benchmarking', desc: 'Compare your profile to industry averages and top performers.' },
                { icon: <Star className="w-10 h-10 text-orange-400" />, title: 'All-Star Badges', desc: 'Earn badges for profile completeness, engagement, and keyword optimization.' },
              ].map((f, i) => (
                <GlassmorphismCard key={f.title} className="p-8 flex flex-col items-center gap-4 hover:scale-105 transition-transform duration-300 shadow-xl border-2 border-blue-400/20 cursor-pointer animate-float" variant="accent" tiltEffect glowEffect>
                  <GlowingEffect glow proximity={64} spread={40} borderWidth={3} disabled={false} />
                  <div className="mb-2">{f.icon}</div>
                  <div className="text-xl font-bold text-white text-center">{f.title}</div>
                  <div className="text-blue-200 text-center">{f.desc}</div>
                </GlassmorphismCard>
              ))}
            </div>
          </section>

          {/* How It Works Timeline */}
          <section className="w-full max-w-4xl mx-auto mt-24 animate-fade-in">
            <h3 className="text-3xl font-bold text-white text-center mb-10">How LinkLens Works</h3>
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-10">
              {[
                { icon: <UserCheck className="w-10 h-10 text-green-400" />, label: 'Sign In', desc: 'Securely sign in with Google or LinkedIn.' },
                { icon: <Linkedin className="w-10 h-10 text-blue-400" />, label: 'Analyze', desc: 'Analyze your LinkedIn or upload your resume.' },
                { icon: <Sparkles className="w-10 h-10 text-purple-400" />, label: 'Get Results', desc: 'Receive instant AI-powered feedback and tips.' },
                { icon: <Star className="w-10 h-10 text-yellow-400" />, label: 'Level Up', desc: 'Track your progress and earn badges.' },
              ].map((step, idx) => (
                <div key={step.label} className="flex flex-col items-center gap-3 animate-float" style={{ animationDelay: `${idx * 0.2}s` }}>
                  <GlowingEffect glow proximity={64} spread={40} borderWidth={3} disabled={false} />
                  <div className="bg-blue-600/20 rounded-full p-4 mb-2">{step.icon}</div>
                  <div className="text-lg font-bold text-white">{step.label}</div>
                  <div className="text-blue-200 text-center text-sm">{step.desc}</div>
                  {idx < 3 && <div className="hidden md:block w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-400 my-2 rounded-full" />}
                </div>
              ))}
            </div>
          </section>

          {/* AI Demo/Preview Section */}
          <section className="w-full max-w-5xl mx-auto mt-24 animate-fade-in">
            <h3 className="text-3xl font-bold text-white text-center mb-10">See LinkLens in Action</h3>
            <div className="flex flex-col md:flex-row gap-10 items-center justify-center">
              <div className="flex-1 flex flex-col items-center">
                <div className="relative w-80 h-56 bg-gradient-to-br from-blue-900 via-purple-900 to-slate-900 rounded-3xl shadow-2xl border-2 border-blue-400/20 overflow-hidden animate-float">
                  <div className="absolute inset-0 z-0 pointer-events-none">
                    <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-500 opacity-20 rounded-full blur-2xl animate-blob1" />
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500 opacity-20 rounded-full blur-2xl animate-blob2" />
                  </div>
                  <div className="relative z-10 flex flex-col items-center justify-center h-full p-6">
                    <Linkedin className="w-12 h-12 text-blue-400 mb-2 animate-pulse" />
                    <div className="text-white text-lg font-bold mb-1">AI Profile Analysis</div>
                    <div className="text-blue-200 text-center text-sm mb-2">Watch as LinkLens analyzes a LinkedIn profile and generates instant feedback, scores, and tips!</div>
                    <div className="w-full h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-gradient-x mt-2" />
                  </div>
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-4">
                <div className="bg-blue-900/60 rounded-xl p-6 shadow-lg border border-blue-400/20 animate-fade-in">
                  <div className="text-blue-200 text-base mb-2">"Your profile headline is strong, but you can add more industry keywords for better visibility."</div>
                  <div className="text-yellow-300 font-bold">AI Suggestion</div>
                </div>
                <div className="bg-purple-900/60 rounded-xl p-6 shadow-lg border border-purple-400/20 animate-fade-in">
                  <div className="text-blue-200 text-base mb-2">Score: <span className="text-2xl font-bold text-white">87/100</span></div>
                  <div className="text-green-300 font-bold">Profile Score</div>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="w-full max-w-3xl mx-auto mt-24 animate-fade-in">
            <h3 className="text-3xl font-bold text-white text-center mb-10">Frequently Asked Questions</h3>
            <div className="space-y-4">
              {[
                { q: 'Is LinkLens free to use?', a: 'Yes! All core features are free. Some advanced features may require sign-in.' },
                { q: 'Is my data secure?', a: 'Absolutely. We use 256-bit SSL encryption and never store your data permanently.' },
                { q: 'Do I need a LinkedIn account?', a: 'You can analyze any public LinkedIn profile, but signing in unlocks more features.' },
                { q: 'Can I analyze multiple resumes?', a: 'Yes, you can analyze as many resumes and profiles as you like.' },
                { q: 'How accurate is the AI?', a: 'Our AI is powered by state-of-the-art models and is constantly improving.' },
              ].map((faq, idx) => (
                <div key={faq.q} className="rounded-xl bg-blue-900/60 border border-blue-400/20 shadow-lg overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-6 py-4 text-left focus:outline-none"
                    onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                  >
                    <span className="text-lg font-semibold text-white">{faq.q}</span>
                    <span className={`ml-4 transition-transform ${faqOpen === idx ? 'rotate-90' : ''}`}>▶</span>
                  </button>
                  <div className={`px-6 pb-4 text-blue-200 text-base transition-all duration-300 ${faqOpen === idx ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>{faq.a}</div>
                </div>
              ))}
            </div>
          </section>


          {/* Newsletter Signup Section */}
          <section className="w-full max-w-2xl mx-auto mt-24 animate-fade-in">
            <h3 className="text-3xl font-bold text-white text-center mb-6">Stay Updated</h3>
            <div className="bg-blue-900/60 rounded-2xl p-8 shadow-xl border border-blue-400/20 flex flex-col items-center gap-4">
              <div className="text-blue-200 text-center mb-2">Get the latest career tips, AI updates, and exclusive features straight to your inbox.</div>
              <form
                className="flex flex-col md:flex-row gap-4 w-full justify-center"
                onSubmit={async e => {
                  e.preventDefault();
                  setNewsletterStatus('idle');
                  setNewsletterError('');
                  if (!newsletterEmail.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) {
                    setNewsletterError('Please enter a valid email address.');
                    return;
                  }
                  try {
                    // Simulate API call
                    await new Promise(r => setTimeout(r, 1000));
                    setNewsletterStatus('success');
                    setNewsletterEmail('');
                  } catch {
                    setNewsletterStatus('error');
                    setNewsletterError('Failed to subscribe. Please try again.');
                  }
                }}
              >
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={e => setNewsletterEmail(e.target.value)}
                  placeholder="Your email address"
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all duration-300"
                  required
                />
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                  disabled={newsletterStatus === 'success'}
                >
                  {newsletterStatus === 'success' ? 'Subscribed!' : 'Subscribe'}
                </button>
              </form>
              {newsletterError && <div className="text-red-400 text-center font-semibold animate-pulse mt-2">{newsletterError}</div>}
              {newsletterStatus === 'success' && <div className="text-green-400 text-center font-semibold animate-pulse mt-2">Thank you for subscribing!</div>}
            </div>
          </section>

          {/* Contact & Support Section */}
          <section className="w-full max-w-2xl mx-auto mt-24 animate-fade-in relative">
            {/* Animated background blobs */}
            <div className="absolute -z-10 inset-0 pointer-events-none">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-500 opacity-20 rounded-full blur-2xl animate-blob1" />
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500 opacity-20 rounded-full blur-2xl animate-blob2" />
            </div>
            <GlassmorphismCard className="p-10 flex flex-col items-center gap-6 shadow-2xl border-2 border-blue-400/20" variant="primary" glowEffect>
              <GlowingEffect glow proximity={64} spread={40} borderWidth={3} disabled={false} />
              <h3 className="text-3xl font-bold text-white text-center mb-2">Contact & Support</h3>
              <p className="text-blue-200 text-center mb-4">Have questions, feedback, or need help? Reach out to our team and we'll get back to you as soon as possible.</p>
              <form
                className="w-full flex flex-col gap-4"
                onSubmit={e => {
                  e.preventDefault();
                  // Simulate sending message
                  alert('Thank you for contacting us! We will reply soon.');
                }}
              >
                <div className="flex flex-col md:flex-row gap-4">
                  <input
                    type="text"
                    placeholder="Your Name"
                    className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all duration-300"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Your Email"
                    className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all duration-300"
                    required
                  />
                </div>
                <textarea
                  placeholder="Your Message"
                  rows={4}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all duration-300"
                  required
                />
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                >
                  Send Message
                </button>
              </form>
              <div className="text-blue-300 text-sm mt-4 text-center">
                Or email us at <a href="mailto:support@linklens.ai" className="underline hover:text-blue-400">support@linklens.ai</a>
              </div>
            </GlassmorphismCard>
            <style>{`
              .animate-blob1 { animation: blob1 8s infinite ease-in-out; }
              .animate-blob2 { animation: blob2 10s infinite ease-in-out; }
              @keyframes blob1 { 0%,100%{transform:translateY(0) scale(1);} 50%{transform:translateY(-40px) scale(1.1);} }
              @keyframes blob2 { 0%,100%{transform:translateY(0) scale(1);} 50%{transform:translateY(40px) scale(1.1);} }
            `}</style>
          </section>

          {/* How It Works */}
          <section className="w-full max-w-3xl mx-auto mt-8">
            <GlassmorphismCard className="p-8 flex flex-col gap-6" variant="accent">
              <h3 className="text-2xl font-bold text-white text-center mb-2">How It Works</h3>
              <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
                <div className="flex flex-col items-center gap-2 flex-1">
                  <UserCheck className="w-10 h-10 text-green-400" />
                  <div className="text-lg font-semibold text-blue-200">1. Sign In</div>
                  <div className="text-blue-300 text-center text-sm">Securely sign in to access all features.</div>
                </div>
                <div className="flex flex-col items-center gap-2 flex-1">
                  <UploadCloud className="w-10 h-10 text-blue-400" />
                  <div className="text-lg font-semibold text-blue-200">2. Analyze</div>
                  <div className="text-blue-300 text-center text-sm">Analyze your LinkedIn profile or upload your resume and job description.</div>
                </div>
                <div className="flex flex-col items-center gap-2 flex-1">
                  <BarChart2 className="w-10 h-10 text-purple-400" />
                  <div className="text-lg font-semibold text-blue-200">3. Get Results</div>
                  <div className="text-blue-300 text-center text-sm">Receive instant AI-powered feedback and actionable tips.</div>
                </div>
              </div>
            </GlassmorphismCard>
          </section>

          {/* Footer */}
          <footer className="w-full text-center text-blue-300 text-sm py-10 mt-16 border-t border-blue-900/40">
            &copy; {new Date().getFullYear()} LinkLens. All rights reserved. | Designed with <span className="text-pink-400">♥</span> for your career
          </footer>
        </div>
        {/* Animated CSS for blobs, parallax, and button glow */}
        <style>{`
          @keyframes blob1 { 0%,100%{transform:translateY(0) scale(1);} 50%{transform:translateY(-40px) scale(1.1);} }
          @keyframes blob2 { 0%,100%{transform:translateY(0) scale(1);} 50%{transform:translateY(40px) scale(1.1);} }
          @keyframes blob3 { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(-30px,30px) scale(1.08);} }
          .animate-blob1 { animation: blob1 8s infinite ease-in-out; }
          .animate-blob2 { animation: blob2 10s infinite ease-in-out; }
          .animate-blob3 { animation: blob3 12s infinite ease-in-out; }
          .animate-glow { box-shadow: 0 0 40px 10px #a78bfa66, 0 0 80px 20px #38bdf866; }
          .drop-shadow-glow { filter: drop-shadow(0 0 8px #fff7) drop-shadow(0 0 16px #fff3); }
          .animate-float { animation: floatCard 8s ease-in-out infinite; }
          @keyframes floatCard { 0%, 100% { transform: translateY(0) scale(1.01); } 50% { transform: translateY(-18px) scale(1.04); } }
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
          @keyframes gradient-x {
            0%,100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          .animate-gradient-x {
            background-size: 200% 200%;
            animation: gradient-x 6s ease-in-out infinite;
          }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(20px);} to { opacity: 1; transform: none; } }
          .animate-fade-in { animation: fadeIn 1.2s cubic-bezier(0.4,0,0.2,1); }
          @keyframes parallax-wave { 0%,100%{transform:translateY(0);} 50%{transform:translateY(30px);} }
          .animate-parallax-wave { animation: parallax-wave 12s ease-in-out infinite; }
          @keyframes parallax-stats { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-20px);} }
          .animate-parallax-stats { animation: parallax-stats 10s ease-in-out infinite; }
          @keyframes parallax-testimonials { 0%,100%{transform:translateY(0);} 50%{transform:translateY(18px);} }
          .animate-parallax-testimonials { animation: parallax-testimonials 14s ease-in-out infinite; }
        `}</style>
        {/* Login overlay only when user tries to start and is not authenticated */}
        {showLogin && !isAuthenticated && <LoginCard onSuccess={handleLoginSuccess} />}
      </div>
      {/* Place the modal here, outside of the main content flow */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-auto">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-0" onClick={() => setShowReviewModal(false)} />
          <div className="relative z-10 flex items-center justify-center">
            <GlassmorphismCard className="p-8 max-w-md w-full shadow-2xl animate-float" variant="primary" glowEffect>
              <GlowingEffect glow proximity={64} spread={40} borderWidth={3} disabled={false} />
              <form onSubmit={handleAddReview} className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold text-white">Add Your Review</h2>
                  <p className="text-gray-300">Share your experience with LinkLens!</p>
                </div>
                <div className="flex items-center justify-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="focus:outline-none"
                    >
                      <svg className={`w-7 h-7 ${reviewRating >= star ? 'text-yellow-400' : 'text-gray-400'} transition-colors`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.455a1 1 0 00-1.175 0l-3.38 2.455c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z" /></svg>
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={reviewName}
                  onChange={e => setReviewName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all duration-300"
                  maxLength={32}
                />
                <textarea
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                  placeholder="Your review..."
                  rows={4}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all duration-300"
                  maxLength={300}
                />
                {reviewError && <div className="text-red-400 text-center font-semibold animate-pulse">{reviewError}</div>}
                <div className="flex gap-4 justify-center">
                  <button
                    type="button"
                    className="px-5 py-2 bg-gray-700 rounded-lg text-white hover:bg-gray-800 transition text-sm"
                    onClick={() => setShowReviewModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                  >
                    Submit Review
                  </button>
                </div>
              </form>
            </GlassmorphismCard>
          </div>
        </div>
      )}
      <script>{`
(function() {
  const container = document.getElementById('testimonial-scroll-container');
  const leftArrow = document.getElementById('testimonial-left-arrow');
  const rightArrow = document.getElementById('testimonial-right-arrow');
  if (!container || !leftArrow || !rightArrow) return;
  function updateArrows() {
    leftArrow.style.display = container.scrollLeft > 10 ? '' : 'none';
    rightArrow.style.display = (container.scrollLeft + container.offsetWidth < container.scrollWidth - 10) ? '' : 'none';
  }
  updateArrows();
  container.addEventListener('scroll', updateArrows);
  const scrollAmount = window.innerWidth;
  leftArrow.onclick = () => { container.scrollBy({ left: -scrollAmount, behavior: 'smooth' }); };
  rightArrow.onclick = () => { container.scrollBy({ left: scrollAmount, behavior: 'smooth' }); };
  // Drag-to-scroll
  let isDown = false, startX, scrollLeft;
  container.addEventListener('mousedown', (e) => {
    isDown = true;
    container.classList.add('cursor-grabbing');
    startX = e.pageX - container.offsetLeft;
    scrollLeft = container.scrollLeft;
  });
  container.addEventListener('mouseleave', () => {
    isDown = false;
    container.classList.remove('cursor-grabbing');
  });
  container.addEventListener('mouseup', () => {
    isDown = false;
    container.classList.remove('cursor-grabbing');
  });
  container.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX) * 1.2;
    container.scrollLeft = scrollLeft - walk;
  });
  // Touch support
  let touchStartX = 0, touchScrollLeft = 0;
  container.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].pageX;
    touchScrollLeft = container.scrollLeft;
  });
  container.addEventListener('touchmove', (e) => {
    const x = e.touches[0].pageX;
    const walk = (x - touchStartX) * 1.2;
    container.scrollLeft = touchScrollLeft - walk;
  });
})();
`}</script>
    </>
  );
};

export default AnimatedLanding;