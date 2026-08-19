import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import { endpoints, RAZORPAY_KEY } from '../config/api';

const Invoice = () => {
  const navigate = useNavigate();
  const {
    tripType,
    fromAddress,
    toAddress,
    pickupDate,
    pickupTime,
    returnDate,
    returnTime,
    selectedCar,
    tempBookingId,
    phoneNumber,
    isLoggedIn,
    userRole,
    setUserRole,
    agentCommission,
    setAgentCommission
  } = useContext(AppContext);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [custMobile, setCustMobile] = useState('');
  
  // GST States
  const [includeGst, setIncludeGst] = useState(false);
  const [gstNumber, setGstNumber] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessPincode, setBusinessPincode] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/profile');
      return;
    }
    if (!selectedCar) {
      navigate('/');
      return;
    }
    fetchCustomerDetails();
  }, [isLoggedIn, selectedCar]);

  const fetchCustomerDetails = async () => {
    try {
      const response = await axios.post(endpoints.getCustomerData, {
        phone_number: phoneNumber
      });
      if (response.data && response.data.status === 'success' && response.data.user) {
        const u = response.data.user;
        const clean = (val, defaultVal = '') => {
          if (!val) return defaultVal;
          const s = val.toString().trim();
          return s.toLowerCase() === 'not filled' ? defaultVal : s;
        };
        setName(clean(u.name));
        setEmail(clean(u.email));
        setCity(clean(u.city));
        setPincode(clean(u.pincode === 0 ? '' : u.pincode));
        setCustMobile(clean(u.phone_number, phoneNumber));
      } else {
        setCustMobile(phoneNumber);
      }
    } catch (e) {
      setCustMobile(phoneNumber);
    }
  };

  const calculateDays = () => {
    if (!pickupDate || !returnDate) return 1;
    const dep = new Date(pickupDate + 'T00:00:00');
    const ret = new Date(returnDate + 'T00:00:00');
    const diffTime = Math.abs(ret - dep);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays <= 0 ? 1 : diffDays;
  };

  const days = calculateDays();
  const rawBaseFare = selectedCar ? parseFloat(selectedCar.discounted_price || selectedCar.baseAmount) : 0;
  const currentCommission = userRole === 'agent' ? (parseFloat(agentCommission) || 0) : 0;
  const tripFare = rawBaseFare + currentCommission;
  
  // Daily KM Limit (default to 250 if not specified by selected car)
  const dailyLimit = selectedCar ? parseFloat(selectedCar.kmPerDay || 250) : 250;
  const roundTripAdvance = dailyLimit * 2 * days;

  let payableNow, advanceAmount, gstAmount, remainingBalance;
  if (tripType === 'Round-Trip') {
    payableNow = roundTripAdvance;
    advanceAmount = roundTripAdvance;
    gstAmount = 0;
    remainingBalance = Math.max(0, tripFare - roundTripAdvance);
  } else if (tripType === 'Local-Duty') {
    payableNow = 250;
    advanceAmount = 250;
    gstAmount = 0;
    remainingBalance = Math.max(0, tripFare - 250);
  } else if (tripType === 'Local-taxi') {
    payableNow = 0;
    advanceAmount = 0;
    gstAmount = 0;
    remainingBalance = tripFare;
  } else {
    advanceAmount = rawBaseFare * 0.25;
    gstAmount = rawBaseFare * 0.05;
    payableNow = advanceAmount + gstAmount;
    remainingBalance = tripFare - advanceAmount;
  }

  const handlePayNow = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) return setErrorMsg('Please enter your full name.');
    if (!email.trim()) return setErrorMsg('Please enter your email.');
    if (!city.trim()) return setErrorMsg('Please enter your city.');
    if (!pincode.trim() || pincode.trim().length !== 6) return setErrorMsg('Please enter a valid 6-digit pincode.');
    if (!custMobile.trim() || custMobile.trim().length !== 10) return setErrorMsg('Please enter a valid 10-digit customer mobile.');
    if (!/^\d+$/.test(custMobile)) return setErrorMsg('Mobile number must contain only numbers.');

    if (includeGst) {
      if (!gstNumber.trim() || gstNumber.trim().length !== 15) return setErrorMsg('Please enter a valid 15-digit GST number.');
      if (!businessName.trim()) return setErrorMsg('Please enter your business name.');
      if (!businessAddress.trim()) return setErrorMsg('Please enter your business address.');
      if (!businessPincode.trim() || businessPincode.trim().length !== 6) return setErrorMsg('Please enter a valid 6-digit business pincode.');
    }

    setShowConfirmModal(true);
  };

  const submitBookingAndPayment = async () => {
    setShowConfirmModal(false);
    setLoading(true);

    if (tripType === 'Local-taxi') {
      try {
        const response = await axios.post(endpoints.saveLocalTaxi, {
          booking_number: custMobile,
          phone_number: phoneNumber,
          name: name,
          email: email,
          city: city,
          pincode: pincode,
          from_address: fromAddress,
          to_address: toAddress || '',
          car_type: selectedCar.carType,
          total_amount: tripFare,
          distance: selectedCar.packageKm || '40'
        }, {
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.data && response.data.status === 'success' && response.data.booking_id) {
          const savedBookingId = response.data.booking_id.toString();
          navigate(`/booking-success?id=${savedBookingId}`);
        } else {
          setErrorMsg(response.data.message || 'Failed to save booking. Please try again.');
          setLoading(false);
        }
      } catch (e) {
        setErrorMsg('Error communicating with the server. Please try again.');
        setLoading(false);
      }
      return;
    }

    const vendorEarnings = tripFare * 0.90;
    const platformCommission = tripFare * 0.10;

    // Build form body
    const body = new URLSearchParams();
    body.append('trip_type', tripType);
    body.append('car_type', selectedCar.carType);
    body.append('from_address', fromAddress);
    body.append('to_address', tripType === 'Local-Duty' ? '' : toAddress);
    body.append('distance', selectedCar.packageKm || '100');
    body.append('date', pickupDate);
    body.append('tripTime', pickupTime);
    body.append('name', name);
    body.append('email', email);
    body.append('userNumber', phoneNumber);
    body.append('pincode', pincode);
    body.append('base_charge', selectedCar.baseAmount);
    body.append('driver_ta', selectedCar.driverAllowance || '0');
    body.append('toll_charge', '0');
    const baseFareForVendor = tripType === 'Round-Trip' ? roundTripAdvance : rawBaseFare;
    const finalTotalAmount = tripType === 'Round-Trip' ? roundTripAdvance : tripFare;
    body.append('total_amount', finalTotalAmount.toFixed(2));
    body.append('payment_type', 'Advance');
    body.append('agent_commission', userRole === 'agent' ? String(agentCommission || 0) : '0');
    body.append('city', city);
    const isLocalTaxi = tripType === 'Local-taxi';
    body.append('agni_amount', isLocalTaxi ? '0.00' : (baseFareForVendor * 0.10).toFixed(2));
    body.append('vendor_amount', isLocalTaxi ? baseFareForVendor.toFixed(2) : (baseFareForVendor * 0.90).toFixed(2));
    body.append('user_type', userRole === 'agent' ? 'agent' : 'customer');
    body.append('customer_mob', custMobile);
    body.append('gst', includeGst.toString());
    body.append('gst_number', gstNumber);
    body.append('business_name', businessName);
    body.append('business_address', businessAddress);
    body.append('business_pincode', businessPincode);
    if (tripType === 'Round-Trip') {
      body.append('return_date', returnDate);
      body.append('return_time', returnTime);
    }
    if (tripType === 'One-way' && tempBookingId) {
      body.append('bookingId', tempBookingId);
    }

    try {
      const response = await axios.post(endpoints.saveBooking, body, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      if (response.data && response.data.success === true && response.data.booking_id) {
        const savedBookingId = response.data.booking_id.toString();
        launchRazorpayModal(savedBookingId);
      } else {
        setErrorMsg(response.data.message || 'Failed to save booking. Please try again.');
        setLoading(false);
      }
    } catch (e) {
      setErrorMsg('Error communicating with the server. Please try again.');
      setLoading(false);
    }
  };

  const launchRazorpayModal = async (bookingId) => {
    let activeKey = RAZORPAY_KEY;
    try {
      const configRes = await axios.get(endpoints.getPaymentConfig);
      if (configRes.data && configRes.data.success && configRes.data.razorpay_key) {
        activeKey = configRes.data.razorpay_key;
      }
    } catch (e) {
      console.error("Failed to load active Razorpay configuration, using fallback test key:", e);
    }

    const options = {
      key: activeKey,
      amount: Math.round(payableNow * 100), // in paise
      currency: "INR",
      name: "Rentox Car Rental",
      description: `Advance Booking for Trip #${bookingId}`,
      image: "https://agnicarrental.com/admin2025/images/pnglogoagni.png",
      handler: async function (response) {
        // Successful payment, verify and update
        try {
          const verifyResponse = await axios.post(endpoints.updatePayment, {
            booking_id: bookingId,
            payment_id: response.razorpay_payment_id,
            status: "success",
            amount: payableNow.toFixed(2)
          });
          if (verifyResponse.data && verifyResponse.data.success === true) {
            navigate(`/booking-success?id=${bookingId}`);
          } else {
            setErrorMsg('Payment successful, but failed to update status on server. Please contact support.');
          }
        } catch (e) {
          setErrorMsg('Error verifying payment. Please do not close this window and contact support.');
        } finally {
          setLoading(false);
        }
      },
      modal: {
        ondismiss: function () {
          setErrorMsg('Payment checkout was closed. Please try again.');
          setLoading(false);
        }
      },
      prefill: {
        name: name,
        email: email,
        contact: phoneNumber
      },
      theme: {
        color: "#008CFF"
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  if (!selectedCar) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-brandBlue font-bold text-sm">
          <i className="fas fa-chevron-left mr-1"></i> Back
        </button>
        <h1 className="text-2xl font-black text-brandCharcoal uppercase tracking-tight">Checkout</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Side: Summary & Billing Details Form */}
        <div className="w-full lg:w-3/5 flex flex-col gap-6">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-xs font-semibold flex items-center gap-2">
              <i className="fas fa-exclamation-circle text-sm"></i>
              {errorMsg}
            </div>
          )}

          {/* Booking Role & Agent Commission Card (Lightweight SaaS Style) */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col gap-4">
            {/* Booking Role Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 text-xs font-bold">
                  <i className="fas fa-user-shield"></i>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-brandCharcoal tracking-tight">Booking Role</h3>
                  <p className="text-4xs text-gray-400 font-medium">Select account mode for this checkout</p>
                </div>
              </div>

              {/* Segmented Control */}
              <div className="flex items-center bg-gray-100/80 p-1 rounded-xl border border-gray-200/70 h-11 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setUserRole('customer')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all h-9 flex items-center gap-1.5 ${
                    userRole === 'customer'
                      ? 'bg-white text-brandCharcoal shadow-sm border border-gray-200/50'
                      : 'text-gray-500 hover:text-brandCharcoal'
                  }`}
                >
                  <i className="fas fa-user text-3xs"></i>
                  Customer
                </button>
                <button
                  type="button"
                  onClick={() => setUserRole('agent')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all h-9 flex items-center gap-1.5 ${
                    userRole === 'agent'
                      ? 'bg-amber-400 text-brandCharcoal shadow-sm font-extrabold'
                      : 'text-gray-500 hover:text-brandCharcoal'
                  }`}
                >
                  <i className="fas fa-briefcase text-3xs"></i>
                  Agent Mode
                </button>
              </div>
            </div>

            {/* Agent Commission Section (Visible only when Agent Mode is selected) */}
            {userRole === 'agent' && (
              <div className="pt-3.5 border-t border-gray-100 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-brandCharcoal">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-3xs font-black">
                      ₹
                    </span>
                    <span>Agent Commission</span>
                  </div>
                  <span className="text-4xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md">
                    Included in total fare
                  </span>
                </div>

                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-gray-500 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={agentCommission}
                    onChange={(e) => setAgentCommission(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full bg-gray-50/80 border border-gray-200 rounded-xl py-2.5 pl-8 pr-4 text-sm font-extrabold text-brandCharcoal outline-none focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20 transition-all h-11"
                  />
                </div>
                <p className="text-4xs text-gray-400 font-medium flex items-center gap-1">
                  <i className="fas fa-info-circle text-amber-500 text-3xs"></i>
                  Commission is added to the total trip fare (advance payment stays fixed).
                </p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-base font-extrabold text-brandCharcoal border-b border-gray-100 pb-3 mb-5 uppercase tracking-wider">
              <i className="fas fa-user-edit text-brandBlue mr-2"></i> Passenger Details
            </h2>

            <form onSubmit={handlePayNow} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-3xs font-extrabold text-gray-400 uppercase mb-2">FULL NAME</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Enter full name"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-xs font-semibold text-brandCharcoal outline-none focus:border-brandBlue focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-3xs font-extrabold text-gray-400 uppercase mb-2">EMAIL ADDRESS</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@email.com"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-xs font-semibold text-brandCharcoal outline-none focus:border-brandBlue focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-3xs font-extrabold text-gray-400 uppercase mb-2">CONTACT NUMBER</label>
                  <input
                    type="text"
                    value={custMobile}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustMobile(val);
                      if (val && !/^\d+$/.test(val)) {
                        setErrorMsg('Only numbers are allowed. Please remove any alphabets or special characters.');
                      } else {
                        setErrorMsg('');
                      }
                    }}
                    maxLength={10}
                    required
                    placeholder="10-digit number"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-xs font-semibold text-brandCharcoal outline-none focus:border-brandBlue focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-3xs font-extrabold text-gray-400 uppercase mb-2">PINCODE</label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    maxLength={6}
                    required
                    placeholder="Pincode"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-xs font-semibold text-brandCharcoal outline-none focus:border-brandBlue focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-3xs font-extrabold text-gray-400 uppercase mb-2">CITY</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  placeholder="e.g. Pune"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-xs font-semibold text-brandCharcoal outline-none focus:border-brandBlue focus:bg-white transition-all"
                />
              </div>

              {/* GST Toggle */}
              <div className="border-t border-gray-100 pt-4 mt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeGst}
                    onChange={(e) => setIncludeGst(e.target.checked)}
                    className="w-4 h-4 text-brandBlue border-gray-300 rounded focus:ring-brandBlue focus:ring-offset-0 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-bold text-brandCharcoal">Include GST for Business</span>
                    <p className="text-3xs text-gray-400">Claim input tax credit on your corporate ride.</p>
                  </div>
                </label>
              </div>

              {includeGst && (
                <div className="bg-gray-50 rounded-xl p-4 mt-2 border border-gray-100 flex flex-col gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-3xs font-extrabold text-gray-400 uppercase mb-2">GST NUMBER</label>
                      <input
                        type="text"
                        value={gstNumber}
                        onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                        maxLength={15}
                        placeholder="15-digit GSTIN"
                        className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-xs font-semibold text-brandCharcoal outline-none focus:border-brandBlue transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-3xs font-extrabold text-gray-400 uppercase mb-2">BUSINESS NAME</label>
                      <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="Registered business name"
                        className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-xs font-semibold text-brandCharcoal outline-none focus:border-brandBlue transition-all"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-3xs font-extrabold text-gray-400 uppercase mb-2">BUSINESS ADDRESS</label>
                      <input
                        type="text"
                        value={businessAddress}
                        onChange={(e) => setBusinessAddress(e.target.value)}
                        placeholder="Official registered address"
                        className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-xs font-semibold text-brandCharcoal outline-none focus:border-brandBlue transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-3xs font-extrabold text-gray-400 uppercase mb-2">BUSINESS PINCODE</label>
                      <input
                        type="text"
                        value={businessPincode}
                        onChange={(e) => setBusinessPincode(e.target.value)}
                        maxLength={6}
                        placeholder="Pincode"
                        className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-xs font-semibold text-brandCharcoal outline-none focus:border-brandBlue transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Pay Trigger */}
              <button
                type="submit"
                disabled={loading}
                className="mt-4 bg-brandBlue text-white hover:bg-blue-600 transition-all font-extrabold text-sm py-4 rounded-xl shadow-lg w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <i className="fas fa-circle-notch fa-spin"></i> Processing...
                  </>
                ) : (
                  <>
                    {tripType === 'Local-taxi' ? 'CONFIRM BOOKING' : `PAY ADVANCE \u20B9${Math.round(payableNow)}`} <i className="fas fa-arrow-right"></i>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Fare Summary details */}
        <div className="w-full lg:w-2/5 flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-brandCharcoal text-white p-4 flex justify-between items-center">
              <div>
                <span className="text-3xs font-extrabold text-brandAmber uppercase tracking-wider">{tripType}</span>
                <h3 className="text-sm font-extrabold">{selectedCar.carType}</h3>
              </div>
              <div className="text-right">
                <span className="text-xs font-extrabold text-gray-400">INCL. KMS</span>
                <p className="text-sm font-black text-brandAmber">{selectedCar.packageKm} KM</p>
              </div>
            </div>

            <div className="p-6 flex flex-col gap-4">
              {/* Route Summary */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <i className="fas fa-circle-dot text-brandBlue text-xs"></i>
                  {tripType !== 'Local-Duty' && (
                    <>
                      <div className="w-[1.5px] h-10 bg-gray-100"></div>
                      <i className="fas fa-location-dot text-red-500 text-xs"></i>
                    </>
                  )}
                </div>
                <div className="flex-1 flex flex-col gap-5 text-2xs">
                  <div>
                    <span className="text-gray-400 uppercase tracking-wider font-extrabold">PICKUP ADDRESS</span>
                    <p className="font-semibold text-brandCharcoal truncate mt-0.5">{fromAddress}</p>
                  </div>
                  {tripType !== 'Local-Duty' && (
                    <div>
                      <span className="text-gray-400 uppercase tracking-wider font-extrabold">DESTINATION ADDRESS</span>
                      <p className="font-bold text-brandCharcoal truncate mt-0.5">{toAddress}</p>
                    </div>
                  )}
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Ride Schedules */}
              <div className="flex gap-4">
                <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
                  <span className="block text-4xs font-bold text-gray-400 uppercase tracking-wider">Pickup Date</span>
                  <span className="text-xs font-bold text-brandCharcoal block mt-1">{pickupDate}</span>
                </div>
                <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
                  <span className="block text-4xs font-bold text-gray-400 uppercase tracking-wider">Pickup Time</span>
                  <span className="text-xs font-bold text-brandCharcoal block mt-1">{pickupTime}</span>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Detailed Invoice Breakdown */}
              <div className="flex flex-col gap-2.5 text-xs">
                {tripType === 'Round-Trip' ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Rate per KM</span>
                      <span className="font-semibold text-brandCharcoal">{"\u20B9"}{selectedCar.kmRate}/km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Daily KM Limit</span>
                      <span className="font-semibold text-brandCharcoal">{dailyLimit} KM/day</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Duration</span>
                      <span className="font-semibold text-brandCharcoal">{days} Days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Driver Allowance</span>
                      <span className="font-semibold text-brandCharcoal">{"\u20B9"}{selectedCar.driverAllowance || 300}/day</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Base Trip Rate</span>
                      <span className="font-semibold text-brandCharcoal">{"\u20B9"}{Math.round(rawBaseFare)}</span>
                    </div>
                    {userRole === 'agent' && currentCommission > 0 && (
                      <div className="flex justify-between text-amber-700 font-bold">
                        <span className="flex items-center gap-1"><i className="fas fa-coins text-xs"></i> Agent Commission</span>
                        <span>+ {"\u20B9"}{Math.round(currentCommission)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Driver Allowance</span>
                      <span className="text-gray-400">Included</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tolls & Taxes (One-Way)</span>
                      <span className="text-gray-400">Included</span>
                    </div>
                    <hr className="border-gray-100 my-1" />
                    <div className="flex justify-between text-sm font-extrabold">
                      <span className="text-brandCharcoal">Total Trip Fare</span>
                      <span className="text-brandCharcoal">{"\u20B9"}{Math.round(tripFare)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Breakdown Panel */}
              <div className="bg-brandBgLight rounded-xl p-4 border border-brandAmber/20 mt-2 flex flex-col gap-2.5">
                <span className="text-3xs font-extrabold text-brandAmber uppercase tracking-wider">Advance Checkout Breakdown</span>
                {tripType === 'Round-Trip' ? (
                  <>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Booking Advance</span>
                      <span className="font-semibold text-brandCharcoal">{"\u20B9"}{Math.round(roundTripAdvance)}</span>
                    </div>
                    <hr className="border-brandAmber/20" />
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-green-700">Payable Now</span>
                      <span className="text-base font-black text-green-700">{"\u20B9"}{Math.round(payableNow)}</span>
                    </div>
                    <div className="text-3xs text-gray-400 mt-2 leading-relaxed">
                      *Remaining balance will be calculated based on actual distance run ({"\u20B9"}{selectedCar.kmRate}/km) and toll/permit receipts at trip end.
                    </div>
                  </>
                ) : tripType === 'Local-Duty' ? (
                  <>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Flat Booking Advance</span>
                      <span className="font-semibold text-brandCharcoal">{"\u20B9"}250</span>
                    </div>
                    <hr className="border-brandAmber/20" />
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-green-700">Payable Now</span>
                      <span className="text-base font-black text-green-700">{"\u20B9"}{Math.round(payableNow)}</span>
                    </div>
                    <div className="flex justify-between text-3xs text-gray-400 mt-1">
                      <span>Balance payable to Driver:</span>
                      <span className="font-bold">{"\u20B9"}{Math.round(remainingBalance)}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Advance (25%)</span>
                      <span className="font-semibold text-brandCharcoal">{"\u20B9"}{Math.round(advanceAmount)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">GST (5%)</span>
                      <span className="font-semibold text-brandCharcoal">{"\u20B9"}{Math.round(gstAmount)}</span>
                    </div>
                    <hr className="border-brandAmber/20" />
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-green-700">Payable Now (30%)</span>
                      <span className="text-base font-black text-green-700">{"\u20B9"}{Math.round(payableNow)}</span>
                    </div>
                    <div className="flex justify-between text-3xs text-gray-400 mt-1">
                      <span>Balance payable to Driver:</span>
                      <span className="font-bold">{"\u20B9"}{Math.round(remainingBalance)}</span>
                    </div>
                  </>
                )}
              </div>

              {(tripType === 'One-Way' || tripType === 'Round-Trip') && (
                <div className="bg-amber-50/80 rounded-xl p-3.5 border border-amber-200/60 mt-3 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold text-3xs uppercase tracking-wide">
                    <i className="fas fa-info-circle text-amber-600"></i>
                    <span>Driver Allowance Terms & Conditions</span>
                  </div>
                  <ul className="text-4xs text-amber-950/80 font-medium space-y-1 pl-3.5 list-disc">
                    <li>Early Morning Allowance (1:00 AM – 6:00 AM): ₹300 extra to be paid to the driver.</li>
                    <li>Late Arrival Allowance (after 11:45 PM): ₹300 extra to be paid to the driver.</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal overlay sheet */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-brandCharcoal/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-gray-100 flex flex-col gap-4 text-center">
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto border border-brandAmber/20">
              <i className="fas fa-credit-card text-brandAmber text-lg"></i>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-brandCharcoal">
                {tripType === 'Local-taxi' ? 'Confirm Booking' : 'Confirm Advance Payment'}
              </h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                {tripType === 'Local-taxi' ? (
                  <>
                    Confirm your booking for this <strong>{selectedCar.carType}</strong> trip. No advance payment is required.
                  </>
                ) : (
                  <>
                    You are paying a secure booking deposit of <strong>{"\u20B9"}{Math.round(payableNow)}</strong> to lock this {selectedCar.carType} trip.
                  </>
                )}
              </p>
            </div>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-500 text-xs font-bold py-3 rounded-xl transition-all"
              >
                Review Info
              </button>
              <button
                onClick={submitBookingAndPayment}
                className="flex-1 bg-brandBlue text-white hover:bg-blue-600 text-xs font-bold py-3 rounded-xl transition-all shadow-sm"
              >
                {tripType === 'Local-taxi' ? 'Confirm' : 'Pay Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppContext ? Invoice : null;
