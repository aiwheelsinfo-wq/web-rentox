import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import { endpoints } from '../config/api';

const History = () => {
  const navigate = useNavigate();
  const { phoneNumber, isLoggedIn } = useContext(AppContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/profile');
      return;
    }
    fetchBookings();
  }, [isLoggedIn]);

  const fetchBookings = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await axios.get(`${endpoints.bookingStatus}?phone_number=${phoneNumber}`);
      if (response.data && response.data.status === 'success') {
        // Sort by booking date descending
        const sorted = response.data.data.sort((a, b) => b.id - a.id);
        setBookings(sorted);
      } else if (response.data && response.data.status === 'no_data') {
        setBookings([]);
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
      return 'bg-red-50 text-red-700 border-red-150';
    }
    if (s.includes('complet')) {
      return 'bg-green-50 text-green-700 border-green-150';
    }
    if (s.includes('start') || s.includes('accept') || s.includes('assign')) {
      return 'bg-blue-50 text-blue-700 border-blue-150';
    }
    return 'bg-amber-50 text-amber-700 border-amber-150'; // Pending, etc.
  };

  const handleTrackBooking = (bookingId) => {
    navigate(`/status/${bookingId}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-brandCharcoal tracking-tight">MY BOOKINGS</h1>
        <p className="text-gray-400 text-xs mt-1">Track details and status of all your outstation and local trips.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <i className="fas fa-spinner fa-spin text-brandBlue text-3xl"></i>
          <span className="text-sm font-bold text-gray-500 mt-4 font-semibold">Loading your bookings...</span>
        </div>
      ) : errorMsg ? (
        <div className="bg-red-50 text-red-600 rounded-2xl p-6 text-center border border-red-100">
          <i className="fas fa-exclamation-circle text-2xl mb-2"></i>
          <p className="text-sm font-bold">{errorMsg}</p>
          <button
            onClick={fetchBookings}
            className="mt-4 bg-brandBlue text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-blue-600 transition-all"
          >
            Retry Fetch
          </button>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
            <i className="fas fa-calendar-times text-gray-300 text-2xl"></i>
          </div>
          <div>
            <p className="text-sm font-bold text-brandCharcoal">No bookings found</p>
            <p className="text-3xs text-gray-400 mt-1">You haven't booked any cabs yet.</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="bg-brandBlue text-white px-6 py-2.5 rounded-xl text-xs font-extrabold shadow-sm hover:bg-blue-600 transition-all mt-2"
          >
            BOOK NOW
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {bookings.map((booking) => {
            const isCompleted = booking.booking_status.toLowerCase().includes('complet');
            const isCancelled = booking.booking_status.toLowerCase().includes('cancel') || booking.booking_status.toLowerCase().includes('fail');

            return (
              <div 
                key={booking.id} 
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all overflow-hidden"
              >
                {/* Top Row: Header */}
                <div className="bg-gray-50/50 px-5 py-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-brandCharcoal">Booking #{booking.id}</span>
                    <span className="bg-brandBlue/10 text-brandBlue px-2 py-0.5 rounded text-3xs font-extrabold uppercase">
                      {booking.trip_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-3xs font-extrabold uppercase border ${getStatusStyle(booking.booking_status)}`}>
                      {booking.booking_status}
                    </span>
                  </div>
                </div>

                {/* Details grid */}
                <div className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex-1 flex flex-col gap-4">
                    {/* Route */}
                    <div className="flex gap-2">
                      <div className="flex flex-col items-center mt-1">
                        <i className="fas fa-circle-dot text-brandBlue text-4xs"></i>
                        <div className="w-[1px] h-6 bg-gray-200"></div>
                        <i className="fas fa-location-dot text-red-500 text-4xs"></i>
                      </div>
                      <div className="flex-1 flex flex-col gap-2.5 text-xs">
                        <p className="font-semibold text-brandCharcoal truncate max-w-sm">{booking.from_address}</p>
                        <p className="font-semibold text-brandCharcoal truncate max-w-sm">{booking.to_address}</p>
                      </div>
                    </div>

                    {/* Meta Indicators */}
                    <div className="flex flex-wrap gap-4 text-3xs text-gray-500 font-semibold border-t border-gray-50 pt-3">
                      <span><i className="fas fa-calendar-alt text-gray-400 mr-1.5"></i>{booking.date}</span>
                      <span><i className="fas fa-clock text-gray-400 mr-1.5"></i>{booking.time}</span>
                      <span><i className="fas fa-car text-gray-400 mr-1.5"></i>{booking.car_type}</span>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="w-full md:w-auto flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 border-t md:border-t-0 border-gray-50 pt-4 md:pt-0">
                    <div className="text-left md:text-right">
                      <span className="text-4xs text-gray-400 font-extrabold block">TOTAL FARE</span>
                      <span className="text-base font-black text-brandCharcoal">₹{Math.round(booking.total_amount)}</span>
                      {booking.payment_id && (
                        <p className="text-4xs text-gray-400 font-semibold mt-1">Paid: ₹{Math.round(booking.paid_amount)}</p>
                      )}
                    </div>
                    
                    {!isCompleted && !isCancelled && (
                      <button
                        onClick={() => handleTrackBooking(booking.id)}
                        className="bg-brandBlue text-white hover:bg-blue-600 transition-all font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-sm tracking-wider"
                      >
                        TRACK BOOKING
                      </button>
                    )}
                    {(isCompleted || isCancelled) && (
                      <button
                        onClick={() => handleTrackBooking(booking.id)}
                        className="border border-gray-200 hover:bg-gray-50 text-gray-600 transition-all font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-sm tracking-wider"
                      >
                        VIEW INVOICE
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default History;
