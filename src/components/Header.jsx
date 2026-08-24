import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

const Header = () => {
  const { isLoggedIn, phoneNumber, logoutUser } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        const isHamburger = event.target.closest('.hamburger-btn');
        if (!isHamburger) {
          setMobileMenuOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logoutUser();
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    navigate('/');
  };

  const navLinks = [
    { to: '/', label: 'Book Cab', always: true, icon: 'fa-car-side' },
    { to: '/history', label: 'My Bookings', always: false, icon: 'fa-receipt' },
  ];

  return (
    <header className="bg-white sticky top-0 z-50 shadow-sm border-b border-gray-100">
      <div className="max-w-[1180px] mx-auto px-4 md:px-6 flex items-center justify-between h-[60px]">
        
        {/* Left: Logo */}
        <Link to="/" className="flex items-center gap-2 no-underline flex-shrink-0">
          <img
            src="https://agnicarrental.com/admin2025/images/pnglogoagni.png"
            alt="Rentox Car Rental"
            className="h-9 w-auto object-contain"
          />
          <span className="font-extrabold text-base md:text-lg tracking-tight text-[#1a2433] hidden min-[380px]:inline-flex gap-1">
            RENTOX <span className="text-[#FFB300]">CAR RENTAL</span>
          </span>
        </Link>

        {/* Middle: Desktop Navigation links */}
        <nav className="hidden md:flex items-center justify-center gap-6 flex-1">
          {navLinks.map(({ to, label, always, icon }) => {
            if (!always && !isLoggedIn) return null;
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`no-underline px-3 py-1.5 text-[13px] font-bold flex items-center gap-2 border-b-2 transition-all duration-150 ${
                  active 
                    ? 'text-[#008CFF] border-[#008CFF]' 
                    : 'text-[#5a6a7a] border-transparent hover:text-[#008CFF]'
                }`}
              >
                {icon && <i className={`fas ${icon} text-[13px]`}></i>}
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/help"
            className={`no-underline px-3 py-1.5 text-[13px] font-bold flex items-center gap-2 transition-all duration-150 ${
              location.pathname === '/help' ? 'text-[#008CFF]' : 'text-[#5a6a7a] hover:text-[#008CFF]'
            }`}
          >
            <i className="fas fa-headset text-[13px]"></i>
            Help & Support
          </Link>

          {isLoggedIn ? (
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`flex items-center justify-center w-9 h-9 rounded-full border border-[#dde5f0] cursor-pointer transition-all duration-200 ${
                  dropdownOpen 
                    ? 'bg-[#008CFF] text-white' 
                    : 'bg-[#f3f7ff] text-[#008CFF] hover:bg-[#008CFF] hover:text-white'
                }`}
                title="Account Menu"
              >
                <i className="fas fa-user text-sm"></i>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-[200px] bg-white rounded-2xl shadow-xl border border-[#E8E4DA] p-2 flex flex-col gap-0.5 z-[150] animate-in fade-in slide-in-from-top-2 duration-200">
                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-semibold text-[#1a2433] no-underline rounded-lg hover:bg-[#f3f7ff] hover:text-[#008CFF] transition-all duration-200"
                  >
                    <i className="fas fa-user-gear text-[#008CFF] w-4"></i>
                    Manage Account
                  </Link>

                  <Link
                    to="/history"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-semibold text-[#1a2433] no-underline rounded-lg hover:bg-[#f3f7ff] hover:text-[#008CFF] transition-all duration-200"
                  >
                    <i className="fas fa-receipt text-[#0F766E] w-4"></i>
                    My Bookings
                  </Link>

                  <Link
                    to="/help"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-semibold text-[#1a2433] no-underline rounded-lg hover:bg-[#f3f7ff] hover:text-[#008CFF] transition-all duration-200"
                  >
                    <i className="fas fa-headset text-[#B4750C] w-4"></i>
                    Help Support
                  </Link>

                  <Link
                    to="/privacy"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-semibold text-[#1a2433] no-underline rounded-lg hover:bg-[#f3f7ff] hover:text-[#008CFF] transition-all duration-200"
                  >
                    <i className="fas fa-shield-alt text-[#4F46E5] w-4"></i>
                    Privacy Policy
                  </Link>

                  <hr className="border-0 border-t border-[#E8E4DA] my-1.5 mx-1" />

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-semibold text-[#E85D4C] bg-transparent border-0 w-full text-left cursor-pointer rounded-lg hover:bg-[#fee2e2] hover:text-[#ef4444] transition-all duration-200"
                  >
                    <i className="fas fa-sign-out-alt w-4"></i>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/profile"
              className="bg-[#008CFF] text-white no-underline px-5 py-2 rounded-full text-xs font-bold shadow-md shadow-[#008cff]/20 hover:bg-[#0070cc] transition-all duration-150"
            >
              LOGIN / SIGN UP
            </Link>
          )}
        </div>

        {/* Mobile Right Actions: Login Button + Hamburger Menu */}
        <div className="flex md:hidden items-center gap-2">
          {isLoggedIn ? (
            <Link
              to="/profile"
              className="flex items-center justify-center w-8 h-8 rounded-full bg-[#f3f7ff] text-[#008CFF] border border-[#dde5f0] text-xs font-bold transition-all no-underline"
              title="My Account"
            >
              <i className="fas fa-user text-xs"></i>
            </Link>
          ) : (
            <Link
              to="/profile"
              className="bg-[#008CFF] text-white no-underline px-3.5 py-1.5 rounded-full text-xs font-extrabold shadow-sm hover:bg-[#0070cc] transition-all flex items-center gap-1.5"
            >
              <i className="fas fa-user text-3xs"></i>
              <span>Login</span>
            </Link>
          )}

          {/* Mobile: Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="hamburger-btn flex items-center justify-center p-1.5 rounded-lg text-gray-600 hover:text-[#008CFF] hover:bg-gray-50 transition-all duration-150 cursor-pointer"
            aria-label="Toggle Menu"
          >
            <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'} text-lg`}></i>
          </button>
        </div>

      </div>

      {/* Mobile Navigation Drawer/Menu */}
      {mobileMenuOpen && (
        <div 
          ref={mobileMenuRef}
          className="absolute top-[60px] left-0 right-0 bg-white border-b border-gray-200 shadow-lg p-4 flex flex-col gap-2 z-50 md:hidden animate-in fade-in slide-in-from-top-4 duration-200"
        >
          {navLinks.map(({ to, label, always, icon }) => {
            if (!always && !isLoggedIn) return null;
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileMenuOpen(false)}
                className={`no-underline px-3 py-2.5 text-sm font-semibold flex items-center gap-3 rounded-xl transition-all ${
                  active 
                    ? 'bg-[#f3f7ff] text-[#008CFF]' 
                    : 'text-[#5a6a7a] hover:bg-gray-50 hover:text-[#008CFF]'
                }`}
              >
                {icon && <i className={`fas ${icon} text-base w-5`}></i>}
                {label}
              </Link>
            );
          })}

          <Link
            to="/help"
            onClick={() => setMobileMenuOpen(false)}
            className={`no-underline px-3 py-2.5 text-sm font-semibold flex items-center gap-3 rounded-xl transition-all ${
              location.pathname === '/help' 
                ? 'bg-[#f3f7ff] text-[#008CFF]' 
                : 'text-[#5a6a7a] hover:bg-gray-50 hover:text-[#008CFF]'
            }`}
          >
            <i className="fas fa-headset text-base w-5"></i>
            Help & Support
          </Link>

          {isLoggedIn && (
            <>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className={`no-underline px-3 py-2.5 text-sm font-semibold flex items-center gap-3 rounded-xl transition-all ${
                  location.pathname === '/profile' 
                    ? 'bg-[#f3f7ff] text-[#008CFF]' 
                    : 'text-[#5a6a7a] hover:bg-gray-50 hover:text-[#008CFF]'
                }`}
              >
                <i className="fas fa-user-gear text-base w-5"></i>
                Manage Account
              </Link>

              <Link
                to="/privacy"
                onClick={() => setMobileMenuOpen(false)}
                className={`no-underline px-3 py-2.5 text-sm font-semibold flex items-center gap-3 rounded-xl transition-all ${
                  location.pathname === '/privacy' 
                    ? 'bg-[#f3f7ff] text-[#008CFF]' 
                    : 'text-[#5a6a7a] hover:bg-gray-50 hover:text-[#008CFF]'
                }`}
              >
                <i className="fas fa-shield-alt text-base w-5"></i>
                Privacy Policy
              </Link>
            </>
          )}

          <hr className="border-0 border-t border-gray-150 my-1" />

          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-[#E85D4C] bg-transparent border-0 w-full text-left cursor-pointer rounded-xl hover:bg-red-50 hover:text-[#ef4444] transition-all"
            >
              <i className="fas fa-sign-out-alt text-base w-5"></i>
              Logout
            </button>
          ) : (
            <Link
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="bg-[#008CFF] text-white text-center no-underline py-2.5 rounded-xl text-sm font-bold shadow-md shadow-[#008cff]/20 hover:bg-[#0070cc] transition-all duration-150"
            >
              LOGIN / SIGN UP
            </Link>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
