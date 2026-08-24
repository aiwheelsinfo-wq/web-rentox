import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import { endpoints } from '../config/api';
import { generateInvoiceHtml } from '../utils/generateInvoiceHtml';

const BookingStatus = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { phoneNumber, isLoggedIn } = useContext(AppContext);

  const [booking, setBooking] = useState(null);
  const [driver, setDriver] = useState(null);
  const [otp, setOtp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Change of plans');
  const [copiedOtp, setCopiedOtp] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/profile');
      return;
    }
    fetchBookingDetails();
    // Auto-refresh every 15 seconds to catch driver assignment / status updates
    const interval = setInterval(fetchBookingDetails, 15000);
    return () => clearInterval(interval);
  }, [id, isLoggedIn]);

  const fetchBookingDetails = async () => {
    setErrorMsg('');
    try {
      const response = await axios.get(`${endpoints.getInvoiceData}?bookingId=${id}`);
      if (response.data && !response.data.error) {
        setBooking(response.data);
        fetchOtp();
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

  const fetchOtp = async () => {
    try {
      const body = new URLSearchParams();
      body.append('action', 'get_booking_otp');
      body.append('booking_id', id);
      const response = await axios.post(endpoints.tripLiveMapping, body, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      if (response.data && response.data.success && response.data.otp) {
        setOtp(response.data.otp);
      }
    } catch (e) {
      console.error('OTP fetch error:', e);
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

  const handleCopyOtp = async () => {
    try {
      await navigator.clipboard.writeText(otp);
      setCopiedOtp(true);
      setTimeout(() => setCopiedOtp(false), 2000);
    } catch (e) {
      console.error('Clipboard copy failed:', e);
    }
  };

  const getStepProgress = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('cancel') || s.includes('fail')) return 0;
    if (s.includes('complet')) return 4;
    if (s.includes('start') || s.includes('ride') || s.includes('progress')) return 3;
    if (s.includes('accept') || s.includes('assign')) return 2;
    return 1; // Confirmed deposit / pending
  };

  const handleDownloadInvoice = () => {
    if (!booking) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to download/print your invoice.");
      return;
    }
    const htmlContent = generateInvoiceHtml(booking);
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const getAdvanceReceiptDetails = () => {
    if (!booking) return null;

    const isRoundTrip = (booking.trip_type || '').toLowerCase().includes('round');
    const isLocalDuty = (booking.trip_type || '').toLowerCase().includes('local-duty');
    const isCompleted = (booking.booking_status || '').toLowerCase().includes('complet');

    const totalFare = parseFloat(booking.total_amount || 0);
    let advancePaid = parseFloat(booking.paid_amount || 0);

    if (booking.payment_type === 'Advance' && advancePaid === 0) {
      if (isLocalDuty) {
        advancePaid = 250.0;
      } else {
        advancePaid = totalFare * 0.25;
      }
    }

    let remaining = totalFare - advancePaid;

    if (isRoundTrip) {
      let days = 1;
      try {
        const startStr = booking.booked_start_date || booking.date || '';
        const returnStr = booking.booked_return_date || booking.return_date || '';
        if (startStr && returnStr) {
          const s = new Date(startStr);
          const r = new Date(returnStr);
          const d = Math.round((r - s) / (1000 * 60 * 60 * 24)) + 1;
          if (d > 0) days = d;
        }
      } catch (_) {}

      const startingKm = parseFloat(booking.starting_km || 0);
      const closingKm = parseFloat(booking.closing_km || 0);
      const totalKm = closingKm - startingKm;
      const kmRate = parseFloat(booking.kmRate || 0);
      const dailyLimit = parseFloat(booking.daily_limit || 250);
      const gstPercent = parseFloat(booking.gstPercent || 5);
      const parkingCharge = parseFloat(booking.parking_charge || 0);
      const tollCharge = parseFloat(booking.toll_charge || 0);
      const permitCharge = parseFloat(booking.permit_charge || 0);
      const driverAllowance = parseFloat(booking.driver_allowance || 0);
      const agent_commission = parseFloat(booking.agent_commission || 0);

      const maxKm = Math.max(totalKm, dailyLimit * days);
      const commissionRate = (agent_commission > 0 && days > 0 && dailyLimit > 0) 
        ? Math.round(agent_commission / (dailyLimit * days)) 
        : 0;
      const effectiveKmRate = kmRate + commissionRate;
      const baseAmount = maxKm * effectiveKmRate;

      const gstAmount = baseAmount * (gstPercent / 100);
      const driverTotal = driverAllowance * days;
      const netTotal = baseAmount + gstAmount + parkingCharge + tollCharge + permitCharge + driverTotal;

      remaining = netTotal - advancePaid;
    }

    return {
      advancePaid,
      remaining: Math.max(0, remaining),
      isCompleted
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto rounded-full border-2 border-slate-200 border-t-amber-500 animate-spin" />
          <p className="text-slate-500 font-semibold text-xs mt-4 uppercase tracking-wider">
            Loading trip status...
          </p>
        </div>
      </div>
    );
  }

  if (errorMsg && !booking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 font-sans">
        <div className="max-w-md w-full bg-white text-center rounded-2xl p-8 border border-slate-200 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-circle text-rose-500 text-lg"></i>
          </div>
          <h3 className="text-base font-bold text-slate-800">Booking Not Found</h3>
          <p className="text-xs text-slate-500 mt-2">{errorMsg}</p>
          <button
            onClick={() => navigate('/history')}
            className="mt-6 bg-[#1E3A8A] text-white px-6 py-2.5 rounded-xl text-xs font-bold tracking-wide hover:bg-[#172554] transition-colors shadow-xs"
          >
            Back to My Bookings
          </button>
        </div>
      </div>
    );
  }

  const isCancellable = (booking.booking_status || '').toLowerCase() === 'pending' || (booking.booking_status || '').toLowerCase() === 'temp';
  const progress = getStepProgress(booking.booking_status);
  const isLocalTaxi = (booking.trip_type || '').toLowerCase().includes('local');
  const details = getAdvanceReceiptDetails();

  const steps = [
    { 
      stepNum: 1, 
      title: 'Booking Confirmed', 
      desc: 'Payment received successfully.',
      icon: 'fa-check'
    },
    { 
      stepNum: 2, 
      title: 'Cab Assigned', 
      desc: driver ? `Driver ${driver.full_name} has been assigned.` : 'Assigning verified driver soon...',
      icon: 'fa-user-check'
    },
    { 
      stepNum: 3, 
      title: 'On Ride', 
      desc: 'Your journey has commenced.',
      icon: 'fa-car'
    },
    { 
      stepNum: 4, 
      title: 'Trip Completed', 
      desc: 'Hope you had a safe and pleasant ride!',
      icon: 'fa-flag-checkered'
    },
  ];

  // Helper for dynamic progress indicator in tracking header
  const renderProgressHeaderBadge = () => {
    if (progress === 0) {
      return (
        <span className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1.5">
          <i className="fas fa-ban text-rose-500 text-xs"></i>
          <span>Trip Cancelled</span>
        </span>
      );
    }
    if (progress === 4) {
      return (
        <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1.5">
          <i className="fas fa-check text-emerald-600 text-xs"></i>
          <span>Trip Completed</span>
        </span>
      );
    }
    if (progress === 3) {
      return (
        <span className="bg-amber-50 border border-amber-300 text-amber-900 px-3 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          <span>Step 3 of 4 · On Ride</span>
        </span>
      );
    }
    if (progress === 2) {
      return (
        <span className="bg-amber-50 border border-amber-300 text-amber-900 px-3 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          <span>Step 2 of 4 · Cab Assigned</span>
        </span>
      );
    }
    return (
      <span className="bg-amber-50 border border-amber-300 text-amber-900 px-3 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
        <span>Step 1 of 4 · Booking Confirmed</span>
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/80 font-sans text-slate-800 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-6">
        
        {/* ── Top Navigation & Compact Header ── */}
        <div className="mb-5">
          <button
            onClick={() => navigate('/history')}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors mb-2.5"
          >
            <i className="fas fa-arrow-left text-3xs"></i>
            Back to My Bookings
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600">
                  Trip Status
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-bold text-slate-700">
                  Trip #{booking.id}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                Live Trip Tracking
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Track your booking and monitor your journey status.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className="bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide">
                {booking.trip_type || 'Trip'} · {booking.car_type}
              </span>
            </div>
          </div>
        </div>

        {/* ── Alerts ── */}
        {successMsg && (
          <div className="mb-5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 text-xs font-semibold flex items-center gap-2.5">
            <i className="fas fa-check-circle text-emerald-600 text-sm"></i>
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="mb-5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 text-xs font-semibold flex items-center gap-2.5">
            <i className="fas fa-exclamation-circle text-rose-600 text-sm"></i>
            {errorMsg}
          </div>
        )}

        {/* ── Main Layout: Desktop 65/35, Mobile Reordered ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* ════ LEFT COLUMN (Desktop 65%, Mobile Step 2) ════ */}
          <div className="order-2 lg:order-1 lg:col-span-7 xl:col-span-8 flex flex-col gap-5">
            
            {/* 1. Trip Tracking Timeline Card */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-wide">
                    Trip Tracking
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Stay updated with your trip progress
                  </p>
                </div>

                {/* Dynamic Progress Header Badge */}
                <div className="self-start sm:self-auto">
                  {renderProgressHeaderBadge()}
                </div>
              </div>

              {/* Timeline Items */}
              {progress > 0 ? (
                <div className="mt-5 flex flex-col gap-2.5">
                  {steps.map((s) => {
                    const isCompleted = progress > s.stepNum || (progress === 4 && s.stepNum === 4);
                    const isCurrent = progress === s.stepNum && progress !== 4;
                    const isFullyCompleted = progress === 4 && s.stepNum === 4;

                    let rowBg = 'bg-slate-50/60 border-slate-200/60';
                    let iconBg = 'bg-white text-slate-400 border border-slate-200';
                    let badgeBg = 'bg-slate-100 text-slate-500 border border-slate-200/60';
                    let badgeText = 'Pending';

                    if (isCompleted) {
                      rowBg = isFullyCompleted 
                        ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-200/50' 
                        : 'bg-emerald-50/40 border-emerald-200/60';
                      iconBg = 'bg-emerald-100 text-emerald-700 border border-emerald-200';
                      badgeBg = 'bg-emerald-100 text-emerald-800 border border-emerald-200 font-extrabold';
                      badgeText = 'Completed';
                    } else if (isCurrent) {
                      rowBg = 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-300/40';
                      iconBg = 'bg-amber-500 text-white shadow-xs';
                      badgeBg = 'bg-amber-100 text-amber-900 border border-amber-300 font-extrabold';
                      badgeText = 'In Progress';
                    }

                    return (
                      <div
                        key={s.title}
                        className={`flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl border transition-all ${rowBg}`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Step icon / indicator */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${iconBg}`}>
                            {isCompleted ? (
                              <i className="fas fa-check text-[11px]"></i>
                            ) : (
                              <i className={`fas ${s.icon} text-[11px]`}></i>
                            )}
                          </div>

                          {/* Titles */}
                          <div className="min-w-0">
                            <h4 className={`text-xs sm:text-sm font-bold truncate ${isCurrent ? 'text-amber-950 font-black' : isCompleted ? 'text-slate-900' : 'text-slate-600'}`}>
                              {s.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                              {s.desc}
                            </p>
                          </div>
                        </div>

                        {/* Status Badge on Right */}
                        <span className={`text-[10.5px] px-2.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${badgeBg}`}>
                          {badgeText}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-5 bg-rose-50 text-rose-700 rounded-xl p-4 text-xs font-semibold flex items-center gap-2 border border-rose-200">
                  <i className="fas fa-ban text-rose-500"></i> This booking has been cancelled.
                </div>
              )}
            </div>

            {/* 2. Payment Summary Card */}
            {details && (
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Payment Summary
                  </h3>
                  {details.remaining <= 0 ? (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Verified & Settled
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200/70 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      Pending Settlement
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mt-3.5">
                  <div className="bg-slate-50/80 border border-slate-200/70 rounded-xl p-3.5 sm:p-4">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
                      Advance Paid
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-emerald-600 block mt-1">
                      ₹{details.advancePaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Paid online via Razorpay
                    </span>
                  </div>

                  <div className="bg-slate-50/80 border border-slate-200/70 rounded-xl p-3.5 sm:p-4">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
                      {details.remaining <= 0 ? 'Balance Paid' : 'Balance Due'}
                    </span>
                    <span className={`text-xl sm:text-2xl font-black block mt-1 ${details.remaining > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      ₹{details.remaining.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      {details.remaining <= 0 ? 'Trip fully settled' : 'Payable directly to driver'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end mt-3.5 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setShowReceiptModal(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1E3A8A] hover:text-blue-900 transition-colors cursor-pointer"
                  >
                    <i className="fas fa-receipt text-slate-400"></i>
                    View Receipt <span className="text-sm">→</span>
                  </button>
                </div>
              </div>
            )}

            {/* 3. Trip Start OTP (Security Card) */}
            {otp && (
              <div className="bg-amber-50/50 border border-amber-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs">
                      <i className="fas fa-key"></i>
                    </span>
                    <h3 className="text-xs font-black text-amber-950 uppercase tracking-wider">
                      Trip Start OTP
                    </h3>
                  </div>
                  <span className="text-[10.5px] font-bold text-amber-800 bg-amber-100/80 border border-amber-200 px-2.5 py-0.5 rounded-full">
                    Required for Pickup
                  </span>
                </div>

                <p className="text-xs text-slate-600 mb-3.5 leading-relaxed">
                  Share this 4-digit OTP with your driver only when your ride begins.
                </p>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-amber-200/80 rounded-xl p-3.5 sm:p-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-[0.25em] font-mono">
                      {otp}
                    </div>
                  </div>

                  <button
                    onClick={handleCopyOtp}
                    className="inline-flex items-center justify-center gap-2 bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all shadow-2xs cursor-pointer"
                  >
                    <i className={`fas ${copiedOtp ? 'fa-check text-emerald-300' : 'fa-copy'}`}></i>
                    {copiedOtp ? 'OTP Copied!' : 'Copy OTP'}
                  </button>
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-amber-800 font-medium">
                  <i className="fas fa-shield-alt text-amber-600 text-xs"></i>
                  <span>Do not share this OTP before the cab arrives at your pickup location.</span>
                </div>
              </div>
            )}

            {/* 4. Driver & Vehicle Details Card (when assigned) */}
            {driver && (
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 pb-3 mb-3.5 border-b border-slate-100">
                  <i className="fas fa-id-card text-amber-500 mr-1.5"></i> Driver & Vehicle Details
                </h3>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center text-base font-bold flex-shrink-0">
                      <i className="fas fa-user-tie text-slate-600"></i>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Driver</span>
                      <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">{driver.full_name}</h4>
                      <p className="text-xs text-slate-600 font-semibold mt-0.5">
                        <i className="fas fa-phone-alt text-3xs mr-1 text-slate-400"></i>
                        {driver.phone_number}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-left sm:text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vehicle Details</span>
                    <h5 className="text-xs font-bold text-slate-800 mt-0.5">{driver.vehicle_name || booking.car_type}</h5>
                    <span className="inline-block bg-[#1E3A8A] text-white text-[11px] px-2.5 py-0.5 rounded-md font-mono font-bold uppercase tracking-wider mt-1">
                      {booking.vehicle_id || driver.vehicle_id || 'Allocated'}
                    </span>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* ════ RIGHT COLUMN (Desktop 35%, Mobile Step 1 / Top) ════ */}
          <div className="order-1 lg:order-2 lg:col-span-5 xl:col-span-4 flex flex-col gap-5">
            
            {/* Trip Summary Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
              
              {/* Header block */}
              <div className="p-4.5 sm:p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-100/80 border border-amber-200 px-2 py-0.5 rounded-full mb-1">
                    {booking.trip_type || 'Trip'}
                  </span>
                  <h3 className="text-lg font-black text-slate-900">
                    {booking.car_type}
                  </h3>
                </div>

                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  (booking.booking_status || '').toLowerCase().includes('complet')
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : (booking.booking_status || '').toLowerCase().includes('cancel')
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  {booking.booking_status || 'Confirmed'}
                </span>
              </div>

              {/* Route & Schedules */}
              <div className="p-5 sm:p-6 flex flex-col gap-4">
                
                {/* Route */}
                <div className="flex gap-3">
                  <div className="flex flex-col items-center mt-1">
                    <i className="fas fa-circle text-[9px] text-blue-600"></i>
                    {booking.to_address && booking.to_address.trim() !== '' && (
                      <>
                        <div className="w-[1.5px] h-7 bg-slate-200 my-1"></div>
                        <i className="fas fa-location-dot text-[11px] text-rose-500"></i>
                      </>
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                        Pickup Location
                      </span>
                      <p className="font-bold text-slate-900 text-[13px] mt-0.5 leading-snug">
                        {booking.from_address}
                      </p>
                    </div>

                    {booking.to_address && booking.to_address.trim() !== '' && (
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                          Destination
                        </span>
                        <p className="font-bold text-slate-900 text-[13px] mt-0.5 leading-snug">
                          {booking.to_address}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Date & Time Row */}
                <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Travel Date
                    </span>
                    <span className="block font-black text-xs text-slate-800 mt-1">
                      {booking.date}
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Pickup Time
                    </span>
                    <span className="block font-black text-xs text-slate-800 mt-1">
                      {booking.time}
                    </span>
                  </div>
                </div>

                {/* Fare Summary */}
                <div className="pt-2.5 border-t border-slate-100 flex flex-col gap-1.5">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      TOTAL FARE
                    </span>
                    <span className="text-2xl font-black text-[#1E3A8A]">
                      ₹{Math.round(booking.total_amount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {booking.payment_id && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-semibold">Advance Deposit Paid</span>
                      <span className="font-extrabold text-emerald-600">
                        ₹{Math.round(booking.paid_amount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Safe badge */}
                <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3 flex items-center gap-2.5 text-xs text-slate-600 mt-0.5">
                  <i className="fas fa-shield-check text-emerald-600 text-base"></i>
                  <span className="text-[11px] leading-tight">
                    <strong>100% Guaranteed Ride</strong> · Verified drivers & sanitized cabs.
                  </span>
                </div>

              </div>
            </div>

            {/* Action 1: Download Invoice Button */}
            <button
              onClick={handleDownloadInvoice}
              className="bg-[#1E3A8A] hover:bg-[#172554] text-white font-extrabold text-xs py-3.5 px-4 rounded-xl transition-all shadow-xs w-full flex items-center justify-center gap-2 h-12 cursor-pointer"
            >
              <i className="fas fa-file-pdf text-sm"></i>
              Download Invoice PDF
            </button>

            {/* Action 2: Cancellation Option (if pending) */}
            {isCancellable && (
              <button
                onClick={() => setShowCancelModal(true)}
                disabled={actionLoading}
                className="text-left border border-rose-200 hover:bg-rose-50/60 rounded-xl p-3.5 transition-all w-full flex items-start gap-3 bg-white cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0 text-xs">
                  <i className="fas fa-times"></i>
                </div>
                <div>
                  <p className="text-xs font-bold text-rose-700">Cancel This Booking</p>
                  <p className="text-[10.5px] text-slate-400 mt-0.5 leading-snug">
                    You can cancel free of charge before the driver starts the journey.
                  </p>
                </div>
              </button>
            )}

          </div>
        </div>

        {/* ── Trust Strip Footer ── */}
        <div className="mt-8 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {[
            { icon: 'fa-shield-halved', color: '#2563EB', bg: '#EFF6FF', title: '24/7 Helpline', text: 'Instant phone & WhatsApp support.' },
            { icon: 'fa-user-check', color: '#059669', bg: '#ECFDF5', title: 'Verified Drivers', text: 'Background checked professionals.' },
            { icon: 'fa-clock', color: '#D97706', bg: '#FFFBEB', title: 'On-Time Pickup', text: 'Punctual rides on every journey.' },
            { icon: 'fa-lock', color: '#7C3AED', bg: '#F5F3FF', title: 'Secure Payments', text: '100% encrypted & protected.' },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: item.bg }}>
                <i className={`fas ${item.icon}`} style={{ color: item.color }}></i>
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-900">{item.title}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{item.text}</p>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* ── Cancellation Modal ── */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-xl border border-slate-200 flex flex-col gap-4 text-center">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-200 text-lg">
              <i className="fas fa-trash-alt"></i>
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">Cancel Booking?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to cancel this booking? Any eligible refund will be credited back to your source account.
              </p>
            </div>

            <div className="text-left mt-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Reason for cancellation
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800 outline-none focus:border-amber-400 focus:bg-white"
              >
                <option value="Change of plans">Change of plans</option>
                <option value="Booked another cab">Booked another cab</option>
                <option value="Delay in driver matching">Delay in driver matching</option>
                <option value="Incorrect booking details">Incorrect booking details</option>
              </select>
            </div>

            {/* Policy Info */}
            <div className="text-left bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600">
              <div className="flex items-center gap-1.5 font-bold text-amber-800 mb-2">
                <i className="fas fa-info-circle"></i>
                <span className="text-[10.5px] uppercase tracking-wide">Cancellation Terms</span>
              </div>
              {isLocalTaxi ? (
                <p className="text-emerald-700 font-semibold">
                  Free Cancellation: You can cancel your Local Taxi booking anytime before pickup.
                </p>
              ) : (
                <div className="space-y-1 text-[11.5px]">
                  <div className="flex justify-between font-bold text-emerald-700">
                    <span>&gt; 48 Hours before pickup:</span>
                    <span>100% Refund</span>
                  </div>
                  <div className="flex justify-between">
                    <span>24–48 Hours:</span>
                    <span>75% Refund</span>
                  </div>
                  <div className="flex justify-between">
                    <span>12–24 Hours:</span>
                    <span>50% Refund</span>
                  </div>
                  <div className="flex justify-between font-bold text-rose-600">
                    <span>&lt; 6 Hours:</span>
                    <span>No Refund</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold py-3 rounded-xl transition-all"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={actionLoading}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-xs"
              >
                {actionLoading ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Advance Receipt Modal ── */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Advance Payment Receipt
                </h3>
                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> PAID & CONFIRMED
                </span>
              </div>
              <button 
                onClick={() => setShowReceiptModal(false)}
                className="w-7 h-7 rounded-full bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 transition-colors shadow-2xs"
              >
                <i className="fas fa-times text-xs"></i>
              </button>
            </div>

            {/* Receipt Details */}
            <div className="p-6 flex flex-col gap-3 text-xs text-slate-800">
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 font-medium">Booking ID</span>
                <span className="font-bold">#{booking.id}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 font-medium">Journey Schedule</span>
                <span className="font-bold">{booking.date} • {booking.time}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 font-medium">Vehicle Model</span>
                <span className="font-bold">{booking.car_type}</span>
              </div>
              <div className="flex justify-between items-start py-1">
                <span className="text-slate-500 font-medium">Route</span>
                <span className="font-bold text-right max-w-[200px] truncate">
                  {booking.from_address} ➔ {booking.to_address || 'Local Duty'}
                </span>
              </div>

              <div className="border-t border-dashed border-slate-200 my-1"></div>

              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 font-medium">Total Trip Fare</span>
                <span className="font-bold text-sm">₹{parseFloat(booking.total_amount || 0).toFixed(2)}</span>
              </div>

              {details && (
                <>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-900 font-bold">Advance Paid Online</span>
                    <span className="text-base font-black text-emerald-600">₹{details.advancePaid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500 font-medium">Remaining Balance to Driver</span>
                    <span className="font-bold text-slate-800">₹{details.remaining.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowReceiptModal(false)}
                className="bg-[#1E3A8A] text-white hover:bg-[#172554] text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BookingStatus;