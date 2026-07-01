import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

const Header = () => {
  const { isLoggedIn, phoneNumber, logoutUser } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logoutUser();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <img 
                src="https://agnicarrental.com/admin2025/images/pnglogoagni.png" 
                alt="Agni Car Rental" 
                className="h-10 w-auto object-contain"
              />
              <span className="font-extrabold text-xl tracking-tight text-brandCharcoal">
                AGNI <span className="text-brandAmber">CAR RENTAL</span>
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-8">
            <Link 
              to="/" 
              className={`text-sm font-semibold transition-colors duration-200 ${
                location.pathname === '/' ? 'text-brandBlue border-b-2 border-brandBlue pb-1' : 'text-gray-500 hover:text-brandBlue'
              }`}
            >
              Book Cab
            </Link>
            {isLoggedIn && (
              <>
                <Link 
                  to="/history" 
                  className={`text-sm font-semibold transition-colors duration-200 ${
                    location.pathname === '/history' ? 'text-brandBlue border-b-2 border-brandBlue pb-1' : 'text-gray-500 hover:text-brandBlue'
                  }`}
                >
                  My Bookings
                </Link>
                <Link 
                  to="/profile" 
                  className={`text-sm font-semibold transition-colors duration-200 ${
                    location.pathname === '/profile' ? 'text-brandBlue border-b-2 border-brandBlue pb-1' : 'text-gray-500 hover:text-brandBlue'
                  }`}
                >
                  My Profile
                </Link>
              </>
            )}
          </nav>

          {/* User Section / Login Button */}
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <div className="flex items-center gap-3 bg-brandBgLight px-3 py-1.5 rounded-full border border-brandAmber/30">
                <i className="fas fa-user-circle text-brandAmber text-lg"></i>
                <span className="text-xs font-bold text-brandCharcoal">{phoneNumber}</span>
                <button 
                  onClick={handleLogout} 
                  className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors ml-2"
                  title="Logout"
                >
                  <i className="fas fa-sign-out-alt"></i>
                </button>
              </div>
            ) : (
              <Link 
                to="/profile" 
                className="bg-brandBlue text-white hover:bg-blue-600 transition-all text-xs font-bold px-5 py-2.5 rounded-full shadow-sm"
              >
                LOGIN / SIGN UP
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
