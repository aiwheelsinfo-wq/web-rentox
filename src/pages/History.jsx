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
    <div className="min-h-screen bg-[#F7F4EE]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header band — asphalt with dashed lane-marker background image */}
      <div
        className="relative overflow-hidden py-10"
        style={{
          backgroundColor: '#1C1F26',
          backgroundImage: `${glowBg}, ${routeMapBg}`,
          backgroundRepeat: 'no-repeat, repeat-x',
          backgroundPosition: 'center, center 60%',
          backgroundSize: 'cover, auto',
        }}
      >
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 24px' }} className="relative">
          <span
            className="inline-block text-[#F5A623] text-[10px] font-semibold tracking-[0.25em] uppercase mb-2"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Trip Log
          </span>
          <h1
            className="text-3xl sm:text-4xl font-bold text-white tracking-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            My Bookings
          </h1>
          <p className="text-[#9CA3AF] text-xs mt-2 max-w-md">
            Track details and status of all your outstation and local trips.
          </p>
          {!loading && !errorMsg && bookings.length > 0 && (
            <div
              className="mt-6 inline-flex items-baseline gap-2 text-white"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              <span className="text-2xl font-semibold">{String(bookings.length).padStart(2, '0')}</span>
              <span className="text-[10px] uppercase tracking-widest text-[#9CA3AF]">
                {bookings.length === 1 ? 'trip recorded' : 'trips recorded'}
              </span>
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 24px' }}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-[#E8E4DA]">
            <div className="w-10 h-10 rounded-full border-2 border-[#E8E4DA] border-t-[#F5A623] animate-spin" />
            <span
              className="text-xs font-semibold text-[#6B7280] mt-4 uppercase tracking-wider"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Reading the meter...
            </span>
          </div>
        ) : errorMsg ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-[#F3C9C1]">
            <div className="w-12 h-12 rounded-full bg-[#FDECEA] flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-exclamation-circle text-[#C4432F] text-lg"></i>
            </div>
            <p className="text-sm font-semibold text-[#1C1F26]">{errorMsg}</p>
            <button
              onClick={fetchBookings}
              className="mt-5 bg-[#1C1F26] text-white px-6 py-2.5 rounded-xl text-xs font-bold tracking-wide hover:bg-[#2C303A] transition-colors"
            >
              RETRY
            </button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-14 text-center border border-[#E8E4DA] flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-[#F7F4EE] rounded-full flex items-center justify-center border border-[#E8E4DA]">
              <i className="fas fa-road text-[#C9C2B2] text-2xl"></i>
            </div>
            <div>
              <p className="text-sm font-bold text-[#1C1F26]">No trips yet</p>
              <p className="text-xs text-[#9B9484] mt-1">Your first booking will show up here.</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="bg-[#F5A623] text-[#1C1F26] px-7 py-2.5 rounded-xl text-xs font-bold tracking-wide hover:bg-[#E8991A] transition-colors mt-2"
            >
              BOOK A CAB
            </button>
          </div>
        ) : (
          <>
            {/* Filter controls */}
            <div className="bg-white rounded-2xl border border-[#E8E4DA] p-5 mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5 shadow-xs">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#9B9484]">Filter by Status</span>
                <div className="flex flex-wrap gap-2">
                  {['All', 'Pending', 'Completed', 'Cancelled'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                        statusFilter === status
                          ? 'bg-[#1C1F26] text-white border-[#1C1F26] shadow-sm'
                          : 'bg-white text-[#6B7280] border-[#E8E4DA] hover:bg-[#F7F4EE]'
                      }`}
                    >
                      {status === 'Cancelled' ? 'Cancelled / Failed' : status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#9B9484]">Trip Type</span>
                <div className="flex flex-wrap gap-2">
                  {['All', 'One-Way', 'Round-Trip', 'Local-Taxi', 'Local-Duty'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setTypeFilter(type)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                        typeFilter === type
                          ? 'bg-[#1C1F26] text-white border-[#1C1F26] shadow-sm'
                          : 'bg-white text-[#6B7280] border-[#E8E4DA] hover:bg-[#F7F4EE]'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2 lg:w-48">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#9B9484]">Travel Date</span>
                <div className="relative">
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full bg-[#F7F4EE] border border-[#E8E4DA] rounded-xl py-2 px-3 text-xs font-semibold text-[#1C1F26] outline-none"
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

            {filteredBookings.length === 0 ? (
              <div className="bg-white rounded-2xl p-14 text-center border border-[#E8E4DA] flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-[#F7F4EE] rounded-full flex items-center justify-center border border-[#E8E4DA]">
                  <i className="fas fa-search-minus text-[#C9C2B2] text-2xl"></i>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1C1F26]">No matching bookings</p>
                  <p className="text-xs text-[#9B9484] mt-1">Try resetting your filters to view other bookings.</p>
                </div>
                <button
                  onClick={() => {
                    setStatusFilter('All');
                    setTypeFilter('All');
                    setDateFilter('');
                  }}
                  className="bg-[#1C1F26] text-white px-6 py-2 rounded-xl text-xs font-bold hover:bg-[#2C303A] transition-colors mt-2"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {filteredBookings.map((booking) => {
                  const isCompleted = booking.booking_status.toLowerCase().includes('complet');
              const isCancelled =
                booking.booking_status.toLowerCase().includes('cancel') ||
                booking.booking_status.toLowerCase().includes('fail');
              const status = getStatusStyle(booking.booking_status);

              return (
                <div
                  key={booking.id}
                  className="relative bg-white rounded-2xl border border-[#E8E4DA] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col md:flex-row overflow-hidden"
                >
                  {/* Route stub */}
                  <div className="flex-1 p-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[11px] font-semibold text-[#9B9484] tracking-wide"
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                      >
                        #{booking.id}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border flex items-center gap-1.5 ${status.badge}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        {booking.booking_status}
                      </span>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex flex-col items-center pt-1">
                        <span className="w-2 h-2 rounded-full bg-[#F5A623]" />
                        <span className="w-[2px] flex-1 my-1 bg-[repeating-linear-gradient(to_bottom,#E8E4DA_0,#E8E4DA_4px,transparent_4px,transparent_8px)]" />
                        <i className="fas fa-location-dot text-[#E85D4C] text-[10px]"></i>
                      </div>
                      <div className="flex-1 flex flex-col gap-3 text-sm">
                        <p className="font-semibold text-[#1C1F26] leading-snug">{booking.from_address}</p>
                        <p className="font-semibold text-[#1C1F26] leading-snug">{booking.to_address}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-[11px] text-[#6B7280] font-medium border-t border-dashed border-[#E8E4DA] pt-3">
                      <span>
                        <i className="fas fa-calendar-alt text-[#C9C2B2] mr-1.5"></i>
                        {booking.date}
                      </span>
                      <span>
                        <i className="fas fa-clock text-[#C9C2B2] mr-1.5"></i>
                        {booking.time}
                      </span>
                      <span className="capitalize">
                        <i className="fas fa-car text-[#C9C2B2] mr-1.5"></i>
                        {booking.car_type}
                      </span>
                      <span className="uppercase tracking-wide text-[#B4750C]">
                        <i className="fas fa-route text-[#C9C2B2] mr-1.5"></i>
                        {booking.trip_type}
                      </span>
                    </div>
                  </div>

                  {/* Perforated ticket divider */}
                  <div className="hidden md:block relative w-0 border-l-2 border-dashed border-[#E8E4DA]">
                    <span className="absolute -top-2.5 -left-2.5 w-5 h-5 rounded-full bg-[#F7F4EE]" />
                    <span className="absolute -bottom-2.5 -left-2.5 w-5 h-5 rounded-full bg-[#F7F4EE]" />
                  </div>
                  <div className="md:hidden border-t-2 border-dashed border-[#E8E4DA] mx-5" />

                  {/* Fare / action stub */}
                  <div className="w-full md:w-52 shrink-0 p-5 flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4">
                    <div className="text-left md:text-right">
                      <span
                        className="text-[10px] text-[#9B9484] font-bold uppercase tracking-wider block"
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                      >
                        Total Fare
                      </span>
                      <span
                        className="text-xl font-bold text-[#1C1F26]"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        {"\u20B9"}{Math.round(booking.total_amount)}
                      </span>
                      {booking.payment_id && (
                        <p className="text-[10px] text-[#9B9484] font-medium mt-1">
                          Paid {"\u20B9"}{Math.round(booking.paid_amount)}
                        </p>
                      )}
                    </div>

                    {!isCompleted && !isCancelled && (
                      <button
                        onClick={() => handleTrackBooking(booking.id)}
                        className="bg-[#1C1F26] text-white hover:bg-[#2C303A] transition-colors font-bold text-[11px] px-5 py-2.5 rounded-xl tracking-wide whitespace-nowrap"
                      >
                        TRACK BOOKING
                      </button>
                    )}
                    {(isCompleted || isCancelled) && (
                      <button
                        onClick={() => handleTrackBooking(booking.id)}
                        className="border border-[#E8E4DA] hover:bg-[#F7F4EE] text-[#1C1F26] transition-colors font-bold text-[11px] px-5 py-2.5 rounded-xl tracking-wide whitespace-nowrap"
                      >
                        VIEW INVOICE
                      </button>
                    )}
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