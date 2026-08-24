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

  // Lock body scroll when mobile menu drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

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
        
        {/* Left Section: Mobile Hamburger + Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Hamburger Button on the Left */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="hamburger-btn flex md:hidden items-center justify-center p-1.5 -ml-1.5 rounded-lg text-slate-700 hover:text-[#008CFF] hover:bg-slate-50 transition-all cursor-pointer"
            aria-label="Open Navigation Menu"
          >
            <i className="fas fa-bars text-lg"></i>
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 no-underline flex-shrink-0">
            <img
              src="https://agnicarrental.com/admin2025/images/pnglogoagni.png"
              alt="Rentox Car Rental"
              className="h-8 sm:h-9 w-auto object-contain"
            />
            <span className="font-extrabold text-base md:text-lg tracking-tight text-[#1a2433] inline-flex gap-1">
              RENTOX <span className="text-[#FFB300]">CAR RENTAL</span>
            </span>
          </Link>
        </div>

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

        {/* Mobile Right: Direct Login / Profile Avatar */}
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
        </div>

      </div>

      {/* ── LEFT-SIDE MOBILE SLIDE DRAWER / SIDEBAR ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          {/* Backdrop Overlay */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Left Slide Panel */}
          <div 
            ref={mobileMenuRef}
            className="fixed inset-y-0 left-0 w-[280px] sm:w-[300px] max-w-[85vw] bg-white shadow-2xl z-[101] flex flex-col justify-between overflow-y-auto animate-in slide-in-from-left duration-300 ease-out"
          >
            <div>
              {/* Drawer Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 no-underline">
                  <img
                    src="https://agnicarrental.com/admin2025/images/pnglogoagni.png"
                    alt="Rentox Car Rental"
                    className="h-8 w-auto object-contain"
                  />
                  <span className="font-extrabold text-sm tracking-tight text-slate-900 inline-flex gap-1">
                    RENTOX <span className="text-[#FFB300]">CAR RENTAL</span>
                  </span>
                </Link>

                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                  aria-label="Close Menu"
                >
                  <i className="fas fa-times text-xs"></i>
                </button>
              </div>

              {/* User Greeting / Account Banner */}
              <div className="p-4 bg-gradient-to-r from-sky-50 to-blue-50 border-b border-sky-100">
                {isLoggedIn ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#008CFF] text-white flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-xs">
                      <i className="fas fa-user"></i>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#008CFF] block">
                        Logged In
                      </span>
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {phoneNumber || 'My Account'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Welcome to Rentox
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Book rides & track bookings easily
                    </p>
                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="inline-flex items-center gap-1.5 mt-2 text-xs font-extrabold text-[#008CFF] hover:underline"
                    >
                      <i className="fas fa-sign-in-alt text-3xs"></i> Login / Sign Up →
                    </Link>
                  </div>
                )}
              </div>

              {/* Navigation Links */}
              <div className="p-3 flex flex-col gap-1">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all no-underline ${
                    location.pathname === '/'
                      ? 'bg-sky-50 text-[#008CFF]'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-[#008CFF]'
                  }`}
                >
                  <i className="fas fa-car-side text-sm w-5 text-sky-500"></i>
                  <span>Book Cab</span>
                </Link>

                {isLoggedIn && (
                  <Link
                    to="/history"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all no-underline ${
                      location.pathname === '/history'
                        ? 'bg-sky-50 text-[#008CFF]'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-[#008CFF]'
                    }`}
                  >
                    <i className="fas fa-receipt text-sm w-5 text-emerald-600"></i>
                    <span>My Bookings</span>
                  </Link>
                )}

                <Link
                  to="/help"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all no-underline ${
                    location.pathname === '/help'
                      ? 'bg-sky-50 text-[#008CFF]'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-[#008CFF]'
                  }`}
                >
                  <i className="fas fa-headset text-sm w-5 text-amber-500"></i>
                  <span>Help &amp; Support</span>
                </Link>

                {isLoggedIn && (
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all no-underline ${
                      location.pathname === '/profile'
                        ? 'bg-sky-50 text-[#008CFF]'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-[#008CFF]'
                    }`}
                  >
                    <i className="fas fa-user-gear text-sm w-5 text-indigo-500"></i>
                    <span>Manage Account</span>
                  </Link>
                )}

                <Link
                  to="/privacy"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all no-underline ${
                    location.pathname === '/privacy'
                      ? 'bg-sky-50 text-[#008CFF]'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-[#008CFF]'
                  }`}
                >
                  <i className="fas fa-shield-alt text-sm w-5 text-purple-500"></i>
                  <span>Privacy Policy</span>
                </Link>
              </div>
            </div>

            {/* Drawer Bottom Actions & Helpline */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/70">
              {isLoggedIn ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-extrabold transition-all border border-rose-200 cursor-pointer"
                >
                  <i className="fas fa-sign-out-alt"></i>
                  <span>Logout</span>
                </button>
              ) : (
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-[#008CFF] hover:bg-[#0070cc] text-white text-xs font-extrabold transition-all shadow-sm no-underline"
                >
                  <i className="fas fa-user"></i>
                  <span>LOGIN / SIGN UP</span>
                </Link>
              )}

              <div className="mt-3 text-center text-[10px] text-slate-400 font-medium">
                24/7 Rentox Customer Assistance
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
