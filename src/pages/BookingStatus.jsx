import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import { endpoints } from '../config/api';

const BookingStatus = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { phoneNumber, isLoggedIn } = useContext(AppContext);

  const [booking, setBooking] = useState(null);
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Change of plans');

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/profile');
      return;
    }
    fetchBookingDetails();
  }, [id, isLoggedIn]);

  const fetchBookingDetails = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await axios.get(`${endpoints.getInvoiceData}?bookingId=${id}`);
      if (response.data && !response.data.error) {
        setBooking(response.data);
        if (response.data.driver_id && response.data.driver_id.trim() !== '') {
          fetchDriverDetails(response.data.driver_id);
        } else {
          setLoading(false);
        }
      } else {
        setErrorMsg(response.data.error || 'Failed to read booking record.');
        setLoading(false);
      }
    } catch (e) {
      setErrorMsg('Failed to connect to the server.');
      setLoading(false);
    }
  };

  const fetchDriverDetails = async (driverId) => {
    try {
      const response = await axios.get(`${endpoints.driverDetails}?driver_id=${driverId}`);
      if (response.data && response.data.status === 'success') {
        setDriver(response.data.data);
      }
    } catch (e) {
      console.error('Error fetching driver details:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setShowCancelModal(false);

    const body = new URLSearchParams();
    body.append('booking_id', id);
    body.append('phone_number', phoneNumber);
    body.append('reason', cancelReason);

    try {
      const response = await axios.post(endpoints.cancelBooking, body, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      if (response.data && response.data.status === 'success') {
        setSuccessMsg('Booking cancelled successfully.');
        fetchBookingDetails();
      } else {
        setErrorMsg(response.data.message || 'Failed to cancel this booking.');
      }
    } catch (e) {
      setErrorMsg('Communication error during cancellation.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    const s = status.toLowerCase();
    if (s.includes('cancel') || s.includes('fail')) return 'bg-red-100 text-red-800 border-red-200';
    if (s.includes('complet')) return 'bg-green-100 text-green-800 border-green-200';
    if (s.includes('start') || s.includes('accept') || s.includes('assign')) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-amber-100 text-amber-800 border-amber-200';
  };

  const getStepProgress = (status) => {
    const s = status.toLowerCase();
    if (s.includes('cancel') || s.includes('fail')) return 0;
    if (s.includes('complet')) return 4;
    if (s.includes('start')) return 3;
    if (s.includes('accept') || s.includes('assign')) return 2;
    return 1; // Pending / confirmed deposit
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <i className="fas fa-spinner fa-spin text-brandBlue text-3xl"></i>
        <p className="text-gray-500 font-bold text-xs mt-4">Loading trip status details...</p>
      </div>
    );
  }

  if (errorMsg && !booking) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <div className="bg-red-50 text-red-600 rounded-2xl p-6 border border-red-100">
          <i className="fas fa-exclamation-circle text-2xl mb-2"></i>
          <p className="text-sm font-bold">{errorMsg}</p>
          <button onClick={() => navigate('/history')} className="mt-4 bg-brandBlue text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-blue-600 transition-all">
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  const isCancellable = booking.booking_status.toLowerCase() === 'pending' || booking.booking_status.toLowerCase() === 'temp';
  const progress = getStepProgress(booking.booking_status);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back to Bookings */}
      <div className="mb-6 flex items-center justify-between">
        <button onClick={() => navigate('/history')} className="text-gray-500 hover:text-brandBlue font-bold text-sm">
          <i className="fas fa-chevron-left mr-1"></i> Back to My Bookings
        </button>
        <span className="text-gray-400 text-3xs font-extrabold">ID: #{booking.id}</span>
      </div>

      {successMsg && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 text-xs font-semibold flex items-center gap-2">
          <i className="fas fa-check-circle text-sm"></i>
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-xs font-semibold flex items-center gap-2">
          <i className="fas fa-exclamation-circle text-sm"></i>
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left 2 Cols: Details & Tracking */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {/* Status Tracker */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-base font-extrabold text-brandCharcoal border-b border-gray-100 pb-3 mb-6 uppercase tracking-wider">
              Trip Tracking
            </h2>

            {progress > 0 ? (
              <div className="relative pl-8 flex flex-col gap-8">
                {/* Visual Line */}
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-100"></div>

                {/* Step 1: Confirmed */}
                <div className="relative flex gap-4">
                  <div className={`absolute -left-[27px] w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    progress >= 1 ? 'bg-brandBlue border-brandBlue text-white text-3xs font-black' : 'bg-white border-gray-300'
                  }`}>
                    {progress >= 1 ? <i className="fas fa-check"></i> : '1'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-brandCharcoal">Booking Confirmed</h4>
                    <p className="text-3xs text-gray-400 mt-0.5">Payment received successfully.</p>
                  </div>
                </div>

                {/* Step 2: Driver Assigned */}
                <div className="relative flex gap-4">
                  <div className={`absolute -left-[27px] w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    progress >= 2 ? 'bg-brandBlue border-brandBlue text-white text-3xs font-black' : 'bg-white border-gray-300'
                  }`}>
                    {progress >= 2 ? <i className="fas fa-check"></i> : '2'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-brandCharcoal">Cab Assigned</h4>
                    <p className="text-3xs text-gray-400 mt-0.5">
                      {driver ? `Driver ${driver.full_name} is assigned to your trip.` : 'Assigning best driver soon...'}
                    </p>
                  </div>
                </div>

                {/* Step 3: Started */}
                <div className="relative flex gap-4">
                  <div className={`absolute -left-[27px] w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    progress >= 3 ? 'bg-brandBlue border-brandBlue text-white text-3xs font-black' : 'bg-white border-gray-300'
                  }`}>
                    {progress >= 3 ? <i className="fas fa-check"></i> : '3'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-brandCharcoal">On Ride</h4>
                    <p className="text-3xs text-gray-400 mt-0.5">Your journey has commenced.</p>
                  </div>
                </div>

                {/* Step 4: Completed */}
                <div className="relative flex gap-4">
                  <div className={`absolute -left-[27px] w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    progress >= 4 ? 'bg-brandBlue border-brandBlue text-white text-3xs font-black' : 'bg-white border-gray-300'
                  }`}>
                    {progress >= 4 ? <i className="fas fa-check"></i> : '4'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-brandCharcoal">Trip Completed</h4>
                    <p className="text-3xs text-gray-400 mt-0.5">Hope you had a safe and pleasant ride!</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 text-red-600 rounded-xl p-4 text-xs font-semibold flex items-center gap-2 border border-red-100">
                <i className="fas fa-ban"></i> This booking is Cancelled.
              </div>
            )}
          </div>

          {/* Driver & Cab details */}
          {driver && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-base font-extrabold text-brandCharcoal border-b border-gray-100 pb-3 mb-5 uppercase tracking-wider">
                <i className="fas fa-id-card text-brandBlue mr-2"></i> Driver & Vehicle details
              </h2>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brandBgLight border border-brandAmber/35 rounded-full flex items-center justify-center">
                    <i className="fas fa-user-tie text-brandAmber text-xl"></i>
                  </div>
                  <div>
                    <span className="text-3xs font-extrabold text-gray-400 uppercase tracking-wide">YOUR DRIVER</span>
                    <h4 className="text-sm font-bold text-brandCharcoal mt-0.5">{driver.full_name}</h4>
                    <p className="text-xs text-gray-500 font-semibold">{driver.phone_number}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-3xs font-extrabold text-gray-400 uppercase tracking-wide">VEHICLE DETAILS</span>
                  <h4 className="text-sm font-bold text-brandCharcoal mt-0.5">{driver.vehicle_name}</h4>
                  <span className="inline-block bg-brandCharcoal text-white font-mono text-2xs px-2.5 py-1 rounded font-bold uppercase tracking-wider mt-1.5 border border-brandCharcoal">
                    {driver.vehicle_id}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Trip Card Summary & Actions */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-brandCharcoal text-white p-4 flex justify-between items-center">
              <div>
                <span className="text-3xs font-extrabold text-brandAmber uppercase tracking-wider">{booking.trip_type}</span>
                <h3 className="text-sm font-extrabold">{booking.car_type}</h3>
              </div>
              <span className={`px-2.5 py-0.5 rounded text-3xs font-extrabold border ${getStatusBadgeClass(booking.booking_status)}`}>
                {booking.booking_status}
              </span>
            </div>

            <div className="p-5 flex flex-col gap-4 text-xs">
              <div>
                <span className="text-gray-400 text-3xs uppercase font-extrabold tracking-wider">PICKUP ADDRESS</span>
                <p className="font-semibold text-brandCharcoal mt-0.5">{booking.from_address}</p>
              </div>
              <div>
                <span className="text-gray-400 text-3xs uppercase font-extrabold tracking-wider">DESTINATION ADDRESS</span>
                <p className="font-semibold text-brandCharcoal mt-0.5">{booking.to_address}</p>
              </div>
              <hr className="border-gray-100" />
              <div className="flex justify-between text-2xs font-semibold">
                <span className="text-gray-400 uppercase">Travel Date:</span>
                <span className="text-brandCharcoal">{booking.date}</span>
              </div>
              <div className="flex justify-between text-2xs font-semibold">
                <span className="text-gray-400 uppercase">Pickup Time:</span>
                <span className="text-brandCharcoal">{booking.time}</span>
              </div>
              <hr className="border-gray-100" />
              <div className="flex justify-between font-extrabold text-sm">
                <span>Total Fare:</span>
                <span className="text-brandBlue">₹{Math.round(booking.total_amount)}</span>
              </div>
              {booking.payment_id && (
                <div className="flex justify-between text-3xs text-gray-500 font-semibold mt-1">
                  <span>Advance Deposit Paid:</span>
                  <span className="text-green-600 font-bold">₹{Math.round(booking.paid_amount)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Cancellation Option */}
          {isCancellable && (
            <button
              onClick={() => setShowCancelModal(true)}
              disabled={actionLoading}
              className="border border-red-200 hover:bg-red-50 text-red-500 font-bold text-xs py-3.5 rounded-xl transition-all shadow-2xs w-full flex items-center justify-center gap-1.5"
            >
              <i className="fas fa-times-circle"></i> CANCEL BOOKING
            </button>
          )}
        </div>
      </div>

      {/* Cancellation Dialog modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-brandCharcoal/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-gray-100 flex flex-col gap-4 text-center">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto border border-red-100">
              <i className="fas fa-trash-alt text-red-500 text-lg"></i>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-brandCharcoal">Cancel Booking?</h3>
              <p className="text-xs text-gray-500 mt-2">
                Are you sure you want to cancel this cab booking? Refunds will be calculated based on the cancellation policy.
              </p>
            </div>
            <div className="text-left mt-2">
              <label className="block text-4xs font-bold text-gray-400 uppercase tracking-wider mb-2">REASON FOR CANCELLATION</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-xs font-semibold text-brandCharcoal outline-none"
              >
                <option value="Change of plans">Change of plans</option>
                <option value="Booked another cab">Booked another cab</option>
                <option value="Delay in driver matching">Delay in driver matching</option>
                <option value="Incorrect booking details">Incorrect booking details</option>
              </select>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-500 text-xs font-bold py-3 rounded-xl transition-all"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancelBooking}
                className="flex-1 bg-red-500 text-white hover:bg-red-600 text-xs font-bold py-3 rounded-xl transition-all shadow-sm"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingStatus;
