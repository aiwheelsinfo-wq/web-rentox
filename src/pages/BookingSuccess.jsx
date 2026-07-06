import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { endpoints } from '../config/api';

const BookingSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const bookingId = params.get('id');

  const [booking, setBooking] = useState(null);
  const [loading, setLoading]  = useState(true);
  const [visible, setVisible]  = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setVisible(true), 80);
    if (bookingId) fetchBooking();
    else setLoading(false);
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      const res = await axios.get(`${endpoints.getInvoiceData}?bookingId=${bookingId}`);
      if (res.data && !res.data.error) setBooking(res.data);
    } catch (_) {}
    finally { setLoading(false); }
  };

  const steps = [
    { icon: 'fa-clock',        color: '#008CFF', label: 'Booking Confirmed',   desc: 'Your advance payment was received'   },
    { icon: 'fa-user-tie',     color: '#FFB300', label: 'Driver Being Assigned', desc: 'We are assigning a verified driver'  },
    { icon: 'fa-car',          color: '#22C55E', label: 'Driver Notified',      desc: 'Driver will contact you before trip'  },
    { icon: 'fa-flag-checkered', color: '#A855F7', label: 'Enjoy Your Ride',   desc: 'Show OTP to driver at pickup'         },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eaf4ff] via-white to-[#f0fff8] flex flex-col items-center justify-start py-10 px-4">

      {/* ── Animated Checkmark Card ── */}
      <div
        className="bg-white rounded-3xl shadow-xl border border-gray-100 w-full max-w-lg p-8 text-center transition-all duration-700"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(30px)' }}
      >
        {/* Animated green circle */}
        <div className="relative mx-auto mb-6 w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-green-100 animate-ping opacity-30" style={{ animationDuration: '2s' }}></div>
          <div className="relative w-24 h-24 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-200">
            <i className="fas fa-check text-white text-4xl"></i>
          </div>
        </div>

        <h1 className="text-2xl font-black text-gray-800 mb-1">Booking Confirmed! 🎉</h1>
        <p className="text-gray-500 text-sm font-medium leading-relaxed">
          Your advance payment was successful and your trip has been booked.
        </p>

        {bookingId && (
          <div className="mt-4 inline-flex items-center gap-2 bg-brandBlue/10 text-brandBlue px-4 py-2 rounded-full text-xs font-extrabold uppercase tracking-wider">
            <i className="fas fa-hashtag"></i>
            Booking ID: {bookingId}
          </div>
        )}

        {/* ── Booking Summary ── */}
        {!loading && booking && (
          <div className="mt-6 bg-gray-50 rounded-2xl p-5 text-left border border-gray-100 flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <span className="bg-brandBlue/10 text-brandBlue px-2.5 py-1 rounded-full text-2xs font-extrabold uppercase">{booking.trip_type}</span>
              <span className="font-extrabold text-sm text-gray-800">{booking.car_type}</span>
            </div>

            <div className="flex gap-3">
              <div className="flex flex-col items-center mt-1">
                <i className="fas fa-circle-dot text-brandBlue text-xs"></i>
                <div className="w-[1.5px] h-8 bg-gray-200 my-1"></div>
                <i className="fas fa-location-dot text-red-500 text-xs"></i>
              </div>
              <div className="flex flex-col gap-3 flex-1 text-xs">
                <div>
                  <span className="text-gray-400 uppercase font-bold tracking-wide text-3xs">From</span>
                  <p className="text-gray-700 font-semibold truncate">{booking.from_address}</p>
                </div>
                <div>
                  <span className="text-gray-400 uppercase font-bold tracking-wide text-3xs">To</span>
                  <p className="text-gray-700 font-semibold truncate">{booking.to_address}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
                <span className="block text-3xs font-bold text-gray-400 uppercase">Pickup Date</span>
                <span className="block font-extrabold text-xs text-gray-700 mt-1">{booking.date}</span>
              </div>
              <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
                <span className="block text-3xs font-bold text-gray-400 uppercase">Pickup Time</span>
                <span className="block font-extrabold text-xs text-gray-700 mt-1">{booking.time}</span>
              </div>
            </div>

            {booking.trip_type === 'Round-Trip' && booking.return_date && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
                <span className="text-3xs font-bold text-amber-600 uppercase">Return Date</span>
                <p className="font-extrabold text-xs text-amber-700 mt-1">{booking.return_date}</p>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-500 font-semibold">Advance Paid</span>
              <span className="text-green-600 font-black text-base">{"\u20B9"}{Math.round(booking.paid_amount || 0)}</span>
            </div>
          </div>
        )}

        {loading && (
          <div className="mt-6 py-6 flex justify-center">
            <i className="fas fa-spinner fa-spin text-brandBlue text-2xl"></i>
          </div>
        )}

        {/* ── Action Buttons ── */}
        <div className="mt-6 flex flex-col gap-3">
          {bookingId && (
            <button
              onClick={() => navigate(`/status/${bookingId}`)}
              className="w-full bg-brandBlue hover:bg-blue-600 text-white font-extrabold text-sm py-3.5 rounded-2xl transition-all shadow-md shadow-blue-200 flex items-center justify-center gap-2"
            >
              <i className="fas fa-map-marker-alt"></i> Track My Booking
            </button>
          )}
          <button
            onClick={() => navigate('/history')}
            className="w-full border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold text-sm py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            <i className="fas fa-list"></i> View All Bookings
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full text-brandBlue font-bold text-xs py-2 flex items-center justify-center gap-1.5 hover:underline"
          >
            <i className="fas fa-plus"></i> Book Another Trip
          </button>
        </div>
      </div>

      {/* ── What Happens Next ── */}
      <div
        className="w-full max-w-lg mt-6 transition-all duration-700 delay-200"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(30px)' }}
      >
        <h2 className="text-sm font-extrabold text-gray-600 uppercase tracking-wider mb-4 px-1">What Happens Next</h2>
        <div className="flex flex-col gap-3">
          {steps.map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: s.color + '18' }}
              >
                <i className={`fas ${s.icon} text-sm`} style={{ color: s.color }}></i>
              </div>
              <div>
                <p className="font-extrabold text-xs text-gray-800">{s.label}</p>
                <p className="text-gray-400 text-3xs font-medium mt-0.5">{s.desc}</p>
              </div>
              <div className="ml-auto w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-check text-green-500 text-2xs"></i>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Support Note ── */}
      <div
        className="mt-6 w-full max-w-lg bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center transition-all duration-700 delay-300"
        style={{ opacity: visible ? 1 : 0 }}
      >
        <i className="fas fa-headset text-amber-500 text-lg mb-1"></i>
        <p className="text-xs font-bold text-amber-700">Need help? Call us at <a href="tel:9619936999" className="underline">9619936999</a></p>
        <p className="text-3xs text-amber-500 font-medium mt-0.5">Available 24/7 for your travel assistance</p>
      </div>
    </div>
  );
};

export default BookingSuccess;
