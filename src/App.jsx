import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Header from './components/Header';
import Search from './pages/Search';
import CarResults from './pages/CarResults';
import Invoice from './pages/Invoice';
import BookingStatus from './pages/BookingStatus';
import BookingSuccess from './pages/BookingSuccess';
import Profile from './pages/Profile';
import History from './pages/History';
import Help from './pages/Help';
import PrivacyPolicy from './pages/PrivacyPolicy';

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-gray-50">
          <Header />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Search />} />
              <Route path="/results" element={<CarResults />} />
              <Route path="/invoice" element={<Invoice />} />
              <Route path="/booking-success" element={<BookingSuccess />} />
              <Route path="/status/:id" element={<BookingStatus />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/history" element={<History />} />
              <Route path="/help" element={<Help />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
            </Routes>
          </main>
          {/* Premium Dark Footer */}
          <footer style={{ background: '#1C1F26', borderTop: '1px solid #2C303A' }}>
            <div style={{ maxWidth: 1180, margin: '0 auto', padding: '48px 24px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '24px' }}>
              {/* Social Media Icons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" style={{ color: '#9CA3AF', fontSize: '24px', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#F5A623'} onMouseLeave={e => e.currentTarget.style.color = '#9CA3AF'}>
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" style={{ color: '#9CA3AF', fontSize: '22px', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#F5A623'} onMouseLeave={e => e.currentTarget.style.color = '#9CA3AF'}>
                  <i className="fab fa-x-twitter"></i>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" style={{ color: '#9CA3AF', fontSize: '22px', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#F5A623'} onMouseLeave={e => e.currentTarget.style.color = '#9CA3AF'}>
                  <i className="fab fa-linkedin-in"></i>
                </a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" style={{ color: '#9CA3AF', fontSize: '22px', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#F5A623'} onMouseLeave={e => e.currentTarget.style.color = '#9CA3AF'}>
                  <i className="fab fa-facebook-f"></i>
                </a>
              </div>

              {/* Copyright & Legal Links */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                <Link to="/privacy" style={{ color: '#9CA3AF', fontSize: '13px', fontWeight: 700, textDecoration: 'none', transition: 'color 0.2s', fontFamily: "'Space Grotesk', sans-serif", display: 'flex', alignItems: 'center', gap: '6px' }} onMouseEnter={e => e.currentTarget.style.color = '#F5A623'} onMouseLeave={e => e.currentTarget.style.color = '#9CA3AF'}>
                  <i className="fas fa-shield-alt" style={{ fontSize: '12px' }}></i>
                  Privacy & Policy
                </Link>
                <span style={{ color: '#9CA3AF', fontSize: '13px', fontWeight: 700, letterSpacing: '0.05em', fontFamily: "'Space Grotesk', sans-serif" }}>
                  © {new Date().getFullYear()} <span style={{ color: '#F5A623' }}>RENTOX CAR RENTAL PVT. LTD.</span>
                </span>
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;
