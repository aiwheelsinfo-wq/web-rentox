import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import { endpoints } from '../config/api';

// One-time font injection — purely presentational, doesn't touch app logic.
const useTicketFonts = () => {
  useEffect(() => {
    if (document.getElementById('trip-ticket-fonts')) return;
    const link = document.createElement('link');
    link.id = 'trip-ticket-fonts';
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=IBM+Plex+Mono:wght@500;600&family=Inter:wght@400;600;700&display=swap';
    document.head.appendChild(link);
  }, []);
};

// Winding route pattern used as the header's background image — a dashed road curving
// across the band with small waypoint dots, like a trip path on a map. Inline SVG
// data-uri, so there's no external asset that can go missing or slow the page down.
const routeMapBg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='120'%3E%3Cpath d='M-10,80 C40,20 80,20 130,60 C180,100 220,100 270,40 C300,4 320,4 320,4' fill='none' stroke='%23F5A623' stroke-width='3' stroke-dasharray='2 14' stroke-linecap='round' opacity='0.65'/%3E%3Ccircle cx='40' cy='34' r='4' fill='%23F5A623' opacity='0.9'/%3E%3Ccircle cx='170' cy='84' r='4' fill='%23F5A623' opacity='0.9'/%3E%3Ccircle cx='270' cy='40' r='5' fill='%23F5A623' opacity='0.9'/%3E%3C/svg%3E")`;

// Soft radial glow layered behind the route, so the header has depth instead of flat asphalt.
const glowBg =
  'radial-gradient(circle at 15% -10%, rgba(245,166,35,0.18), transparent 55%), radial-gradient(circle at 90% 120%, rgba(15,118,110,0.18), transparent 50%)';

const History = () => {
  useTicketFonts();
  const navigate = useNavigate();
  const { phoneNumber, isLoggedIn } = useContext(AppContext);
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/profile');
      return;
    }
    fetchBookings();
  }, [isLoggedIn]);

  // Unified filter effect
  useEffect(() => {
    let result = [...bookings];

    // 1. Status Filter
    if (statusFilter !== 'All') {
      result = result.filter(booking => {
        const s = booking.booking_status.toLowerCase();
        if (statusFilter === 'Pending') {
          return !s.includes('cancel') && !s.includes('fail') && !s.includes('complet');
        }
        if (statusFilter === 'Completed') {
          return s.includes('complet');
        }
        if (statusFilter === 'Cancelled') {
          return s.includes('cancel') || s.includes('fail');
        }
        return true;
      });
    }

    // 2. Trip Type Filter
    if (typeFilter !== 'All') {
      result = result.filter(booking => {
        const type = (booking.trip_type || '').toLowerCase();
        return type.includes(typeFilter.toLowerCase());
      });
    }

    // 3. Date Filter
    if (dateFilter !== '') {
      result = result.filter(booking => {
        return booking.date === dateFilter;
      });
    }

    setFilteredBookings(result);
  }, [bookings, statusFilter, typeFilter, dateFilter]);

  const fetchBookings = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await axios.get(`${endpoints.bookingStatus}?phone_number=${phoneNumber}`);
      if (response.data && response.data.status === 'success') {
        // Sort by booking date descending
        const sorted = response.data.data.sort((a, b) => b.id - a.id);
        setBookings(sorted);
        setFilteredBookings(sorted);
      } else if (response.data && response.data.status === 'no_data') {
        setBookings([]);
        setFilteredBookings([]);
      } else {
        setErrorMsg('Failed to read bookings database.');
      }
    } catch (e) {
      setErrorMsg('Failed to load bookings list. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    const s = status.toLowerCase();
    if (s.includes('cancel') || s.includes('fail')) {
      return { badge: 'bg-[#FDECEA] text-[#C4432F] border-[#F3C9C1]', dot: 'bg-[#E85D4C]' };
    }
    if (s.includes('complet')) {
      return { badge: 'bg-[#E8F3F0] text-[#0F766E] border-[#BFE1D8]', dot: 'bg-[#0F766E]' };
    }
    if (s.includes('start') || s.includes('accept') || s.includes('assign')) {
      return { badge: 'bg-[#EAF1FB] text-[#2854A6] border-[#C7D9F2]', dot: 'bg-[#2854A6]' };
    }
    return { badge: 'bg-[#FDF3E1] text-[#B4750C] border-[#F2DDA9]', dot: 'bg-[#F5A623]' }; // Pending, etc.
  };

  const handleTrackBooking = (bookingId) => {
    navigate(`/status/${bookingId}`);
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-brandCharcoal font-sans">
      {/* 2. COMPACT HERO / PAGE HEADER */}
      <div className="bg-[#1C1F26] text-white px-4 sm:px-8 py-8 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <span className="text-amber-400 text-3xs font-extrabold uppercase tracking-widest block mb-1">
              TRIP HISTORY
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              My Bookings
            </h1>
            <p className="text-gray-400 text-xs mt-1">
              Track and manage all your outstation and local trips.
            </p>
          </div>

          {!loading && !errorMsg && bookings.length > 0 && (
            <div className="hidden sm:flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl text-xs font-bold text-gray-200 border border-white/10 backdrop-blur-sm">
              <span className="text-amber-400 font-extrabold text-sm">{String(bookings.length).padStart(2, '0')}</span>
              <span className="text-gray-300 font-medium">
                {bookings.length === 1 ? 'trip recorded' : 'trips recorded'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT CONTAINER */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-10 h-10 rounded-full border-2 border-gray-200 border-t-amber-500 animate-spin mb-4" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Reading your trips...
            </span>
          </div>
        ) : errorMsg ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-red-200 shadow-sm flex flex-col items-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-3">
              <i className="fas fa-exclamation-circle text-xl"></i>
            </div>
            <p className="text-sm font-bold text-brandCharcoal">{errorMsg}</p>
            <button
              onClick={fetchBookings}
              className="mt-4 bg-[#1C1F26] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-800 transition-all"
            >
              Retry
            </button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm flex flex-col items-center gap-3 max-w-lg mx-auto">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center border border-amber-100 mb-1">
              <i className="fas fa-route text-2xl"></i>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-brandCharcoal">No trips yet</h3>
              <p className="text-xs text-gray-400 mt-1">Your first booking will show up here after checkout.</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="bg-amber-400 text-brandCharcoal font-extrabold px-6 py-3 rounded-xl text-xs hover:bg-amber-300 transition-all mt-2 shadow-2xs"
            >
              Book a Cab
            </button>
          </div>
        ) : (
          <>
            {/* 3. FILTER TOOLBAR CARD */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              
              {/* Status Filter Group */}
              <div className="flex flex-col gap-2">
                <span className="text-4xs font-extrabold uppercase tracking-wider text-gray-400">STATUS</span>
                <div className="flex flex-wrap gap-2">
                  {['All', 'Pending', 'Completed', 'Cancelled'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        statusFilter === status
                          ? 'bg-[#1C1F26] text-white border-[#1C1F26] shadow-2xs'
                          : 'bg-gray-50/80 text-gray-600 border-gray-200/80 hover:bg-gray-100'
                      }`}
                    >
                      {status === 'Cancelled' ? 'Cancelled / Failed' : status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trip Type Filter Group */}
              <div className="flex flex-col gap-2">
                <span className="text-4xs font-extrabold uppercase tracking-wider text-gray-400">TRIP TYPE</span>
                <div className="flex flex-wrap gap-2">
                  {['All', 'One-Way', 'Round-Trip', 'Local-Taxi', 'Local-Duty'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setTypeFilter(type)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        typeFilter === type
                          ? 'bg-[#1C1F26] text-white border-[#1C1F26] shadow-2xs'
                          : 'bg-gray-50/80 text-gray-600 border-gray-200/80 hover:bg-gray-100'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Filter Group */}
              <div className="flex flex-col gap-2 lg:w-48">
                <span className="text-4xs font-extrabold uppercase tracking-wider text-gray-400">TRAVEL DATE</span>
                <div className="relative">
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full bg-gray-50/80 border border-gray-200/80 rounded-xl py-1.5 px-3 text-xs font-bold text-brandCharcoal outline-none focus:border-amber-400 focus:bg-white transition-all h-9"
                  />
                  {dateFilter && (
                    <button
                      onClick={() => setDateFilter('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-none p-1 cursor-pointer"
                      title="Clear Date"
                    >
                      <i className="fas fa-times text-xs"></i>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 12. FILTER EMPTY STATE OR LIST */}
            {filteredBookings.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm flex flex-col items-center gap-3 max-w-md mx-auto">
                <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-xl flex items-center justify-center text-lg">
                  <i className="fas fa-filter-circle-xmark"></i>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-brandCharcoal">No bookings found</h4>
                  <p className="text-xs text-gray-400 mt-1">Try resetting your filters or select a different date.</p>
                </div>
                <button
                  onClick={() => {
                    setStatusFilter('All');
                    setTypeFilter('All');
                    setDateFilter('');
                  }}
                  className="bg-[#1C1F26] text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-gray-800 transition-all mt-1"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              /* 4. BOOKING CARDS LIST */
              <div className="flex flex-col gap-4">
                {filteredBookings.map((booking) => {
                  const isCompleted = booking.booking_status.toLowerCase().includes('complet');
                  const isCancelled =
                    booking.booking_status.toLowerCase().includes('cancel') ||
                    booking.booking_status.toLowerCase().includes('fail');
                  const status = getStatusStyle(booking.booking_status);

                  return (
                    <div
                      key={booking.id}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-6 flex flex-col md:flex-row items-stretch justify-between gap-6"
                    >
                      {/* Left Details Panel */}
                      <div className="flex-1 flex flex-col gap-4">
                        {/* 5. Header: Booking ID & Status Pill */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                            #{booking.id}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-3xs font-extrabold uppercase border flex items-center gap-1.5 ${status.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                            {booking.booking_status}
                          </span>
                        </div>

                        {/* 6. Vertical Route Display */}
                        <div className="flex gap-3">
                          <div className="flex flex-col items-center pt-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-4 ring-amber-50 shrink-0" />
                            {booking.to_address && booking.to_address.trim() !== '' && (
                              <>
                                <div className="w-0.5 flex-1 my-1 bg-gray-200" />
                                <i className="fas fa-location-dot text-red-500 text-xs shrink-0"></i>
                              </>
                            )}
                          </div>
                          <div className="flex-1 flex flex-col gap-3 text-sm font-semibold text-brandCharcoal">
                            <p className="leading-tight">{booking.from_address}</p>
                            {booking.to_address && booking.to_address.trim() !== '' && (
                              <p className="leading-tight">{booking.to_address}</p>
                            )}
                          </div>
                        </div>

                        {/* 7. Trip Metadata Row */}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 font-medium pt-3 border-t border-gray-100">
                          <span className="flex items-center gap-1.5">
                            <i className="fas fa-calendar-alt text-brandBlue"></i>
                            {booking.date}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <i className="fas fa-clock text-brandBlue"></i>
                            {booking.time}
                          </span>
                          <span className="flex items-center gap-1.5 capitalize">
                            <i className="fas fa-car text-brandBlue"></i>
                            {booking.car_type}
                          </span>
                          <span className="flex items-center gap-1.5 uppercase font-bold text-amber-600">
                            <i className="fas fa-[#F5A623] fa-route text-amber-500"></i>
                            {booking.trip_type}
                          </span>
                        </div>
                      </div>

                      {/* 8 & 9. Right Fare & Action Section */}
                      <div className="w-full md:w-60 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-gray-100 md:pl-6 flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4">
                        <div className="text-left md:text-right">
                          <span className="text-4xs font-extrabold uppercase tracking-wider text-gray-400 block">
                            TOTAL FARE
                          </span>
                          <span className="text-2xl font-extrabold text-brandCharcoal tracking-tight">
                            {"\u20B9"}{Math.round(booking.total_amount)}
                          </span>
                          {booking.payment_id && (
                            <p className="text-3xs font-semibold text-gray-400 mt-0.5">
                              Paid {"\u20B9"}{Math.round(booking.paid_amount)}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => handleTrackBooking(booking.id)}
                          className="w-auto md:w-full bg-[#1C1F26] text-white hover:bg-gray-800 transition-all font-bold text-xs px-5 py-3 rounded-xl shadow-2xs h-11 flex items-center justify-center gap-1.5"
                        >
                          {!isCompleted && !isCancelled ? (
                            <>Track Booking <i className="fas fa-chevron-right text-3xs text-amber-400"></i></>
                          ) : (
                            <>View Invoice <i className="fas fa-receipt text-3xs text-amber-400"></i></>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default History;