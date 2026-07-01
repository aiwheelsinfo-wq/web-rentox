import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import { endpoints } from '../config/api';

const CITIES = [
  'Pune, Maharashtra, India',
  'Mumbai, Maharashtra, India',
  'Nashik, Maharashtra, India',
  'Shirdi, Maharashtra, India',
  'Mahabaleshwar, Maharashtra, India',
  'Lonavala, Maharashtra, India',
  'Mumbai Airport T2, Maharashtra, India',
  'Pune Airport, Maharashtra, India',
];

const Search = () => {
  const navigate = useNavigate();
  const {
    tripType, setTripType,
    fromAddress, setFromAddress,
    toAddress, setToAddress,
    pickupDate, setPickupDate,
    pickupTime, setPickupTime,
    returnDate, setReturnDate,
    returnTime, setReturnTime,
    setTempBookingId,
    phoneNumber,
    isLoggedIn
  } = useContext(AppContext);

  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Set default pickup date on mount if empty
  useEffect(() => {
    if (!pickupDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setPickupDate(tomorrow.toISOString().split('T')[0]);
    }
    if (!returnDate) {
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);
      setReturnDate(dayAfter.toISOString().split('T')[0]);
    }
  }, [pickupDate, returnDate, setPickupDate, setReturnDate]);

  const handleFromChange = (e) => {
    const val = e.target.value;
    setFromAddress(val);
    if (val.trim() === '') {
      setFromSuggestions([]);
    } else {
      const filtered = CITIES.filter(c => c.toLowerCase().includes(val.toLowerCase()));
      setFromSuggestions(filtered);
    }
  };

  const handleToChange = (e) => {
    const val = e.target.value;
    setToAddress(val);
    if (val.trim() === '') {
      setToSuggestions([]);
    } else {
      const filtered = CITIES.filter(c => c.toLowerCase().includes(val.toLowerCase()));
      setToSuggestions(filtered);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fromAddress.trim()) {
      setErrorMsg('Please enter a pickup city.');
      return;
    }
    if (tripType !== 'Local-Duty' && !toAddress.trim()) {
      setErrorMsg('Please enter a destination city.');
      return;
    }
    if (!pickupDate) {
      setErrorMsg('Please choose your travel date.');
      return;
    }

    // Verify time validation
    const travelDateTime = new Date(`${pickupDate}T${convertTimeTo24h(pickupTime)}`);
    const now = new Date();
    const diffInHours = (travelDateTime - now) / (1000 * 60 * 60);

    if (diffInHours < 5) {
      setErrorMsg('Pickup time must be at least 5 hours from current time.');
      return;
    }

    if (tripType === 'Round-Trip') {
      const rDate = new Date(`${returnDate}T${convertTimeTo24h(returnTime)}`);
      if (rDate <= travelDateTime) {
        setErrorMsg('Return date & time must be after the pickup date & time.');
        return;
      }
    }

    // Redirect to login if user is not logged in yet (required for database temporary booking)
    if (!isLoggedIn) {
      setErrorMsg('Please login to search and book cabs.');
      navigate('/profile');
      return;
    }

    setLoading(true);

    try {
      if (tripType === 'One-way') {
        // Save temporary booking for One-way
        const response = await axios.post(endpoints.saveOneWayTemp, {
          from: fromAddress,
          to: toAddress,
          date: pickupDate,
          time: pickupTime,
          savedNumber: phoneNumber
        }, {
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.data && response.data.success === true && response.data.booking_id) {
          setTempBookingId(response.data.booking_id.toString());
          navigate('/results');
        } else {
          setErrorMsg(response.data.message || 'Failed to initialize booking on server. Please try again.');
        }
      } else {
        // For Round-trip and Local-duty, we go directly to results
        navigate('/results');
      }
    } catch (e) {
      setErrorMsg('Error communicating with the server. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const convertTimeTo24h = (time12h) => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') {
      hours = '00';
    }
    if (modifier === 'PM') {
      hours = parseInt(hours, 10) + 12;
    }
    return `${hours.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Background Heading */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-brandCharcoal tracking-tight">
          Book Outstation & Local <span className="text-brandBlue">Cabs</span>
        </h1>
        <p className="text-gray-500 text-sm md:text-base mt-2">
          Affordable, transparent pricing. Clean cars & professional drivers.
        </p>
      </div>

      {/* Main MakeMyTrip Search Card */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        {/* Tabs Row */}
        <div className="flex border-b border-gray-100 bg-gray-50/50">
          {['One-way', 'Round-Trip', 'Local-Duty'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setTripType(type)}
              className={`flex-1 text-center py-4 text-sm font-bold transition-all duration-200 ${
                tripType === type
                  ? 'text-brandBlue bg-white border-t-2 border-brandBlue shadow-sm'
                  : 'text-gray-500 hover:text-brandBlue hover:bg-gray-50'
              }`}
            >
              <i className={`fas ${
                type === 'One-way' ? 'fa-arrow-right-long' : type === 'Round-Trip' ? 'fa-arrows-rotate' : 'fa-clock'
              } mr-2`}></i>
              {type}
            </button>
          ))}
        </div>

        {/* Inputs Form */}
        <form onSubmit={handleSearch} className="p-6 md:p-8">
          {errorMsg && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-xs font-semibold flex items-center gap-2">
              <i className="fas fa-exclamation-circle text-sm"></i>
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* From City */}
            <div className="relative">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">FROM CITY</label>
              <div className="relative">
                <i className="fas fa-circle-dot absolute left-4 top-1/2 -translate-y-1/2 text-brandBlue"></i>
                <input
                  type="text"
                  value={fromAddress}
                  onChange={handleFromChange}
                  onFocus={() => setShowFromDropdown(true)}
                  onBlur={() => setTimeout(() => setShowFromDropdown(false), 200)}
                  placeholder="Enter pickup city"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 text-sm font-semibold text-brandCharcoal focus:border-brandBlue focus:ring-1 focus:ring-brandBlue outline-none"
                />
              </div>
              {showFromDropdown && fromSuggestions.length > 0 && (
                <ul className="absolute z-30 w-full bg-white border border-gray-100 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
                  {fromSuggestions.map((item, idx) => (
                    <li
                      key={idx}
                      onMouseDown={() => setFromAddress(item)}
                      className="px-4 py-2.5 hover:bg-gray-50 text-xs font-semibold text-brandCharcoal cursor-pointer flex items-center gap-2"
                    >
                      <i className="fas fa-location-dot text-gray-400"></i>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* To City */}
            {tripType !== 'Local-Duty' && (
              <div className="relative">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">TO CITY</label>
                <div className="relative">
                  <i className="fas fa-location-dot absolute left-4 top-1/2 -translate-y-1/2 text-red-500"></i>
                  <input
                    type="text"
                    value={toAddress}
                    onChange={handleToChange}
                    onFocus={() => setShowToDropdown(true)}
                    onBlur={() => setTimeout(() => setShowToDropdown(false), 200)}
                    placeholder="Enter destination city"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 text-sm font-semibold text-brandCharcoal focus:border-brandBlue focus:ring-1 focus:ring-brandBlue outline-none"
                  />
                </div>
                {showToDropdown && toSuggestions.length > 0 && (
                  <ul className="absolute z-30 w-full bg-white border border-gray-100 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
                    {toSuggestions.map((item, idx) => (
                      <li
                        key={idx}
                        onMouseDown={() => setToAddress(item)}
                        className="px-4 py-2.5 hover:bg-gray-50 text-xs font-semibold text-brandCharcoal cursor-pointer flex items-center gap-2"
                      >
                        <i className="fas fa-location-dot text-gray-400"></i>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Travel Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">TRAVEL DATE</label>
              <div className="relative">
                <i className="fas fa-calendar-day absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                  type="date"
                  value={pickupDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 text-sm font-semibold text-brandCharcoal focus:border-brandBlue focus:ring-1 focus:ring-brandBlue outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">PICKUP TIME</label>
              <div className="relative">
                <i className="fas fa-clock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <select
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 text-sm font-semibold text-brandCharcoal focus:border-brandBlue focus:ring-1 focus:ring-brandBlue outline-none appearance-none"
                >
                  {Array.from({ length: 24 }).map((_, i) => {
                    const hour = i === 0 ? 12 : i > 12 ? i - 12 : i;
                    const ampm = i >= 12 ? 'PM' : 'AM';
                    return (
                      <React.Fragment key={i}>
                        <option value={`${hour}:00 ${ampm}`}>{`${hour}:00 ${ampm}`}</option>
                        <option value={`${hour}:30 ${ampm}`}>{`${hour}:30 ${ampm}`}</option>
                      </React.Fragment>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>

          {/* Return Date & Time for Round Trip */}
          {tripType === 'Round-Trip' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 border-t border-gray-100 pt-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">RETURN DATE</label>
                <div className="relative">
                  <i className="fas fa-calendar-week absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="date"
                    value={returnDate}
                    min={pickupDate || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 text-sm font-semibold text-brandCharcoal focus:border-brandBlue focus:ring-1 focus:ring-brandBlue outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">RETURN TIME</label>
                <div className="relative">
                  <i className="fas fa-clock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                  <select
                    value={returnTime}
                    onChange={(e) => setReturnTime(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 text-sm font-semibold text-brandCharcoal focus:border-brandBlue focus:ring-1 focus:ring-brandBlue outline-none appearance-none"
                  >
                    {Array.from({ length: 24 }).map((_, i) => {
                      const hour = i === 0 ? 12 : i > 12 ? i - 12 : i;
                      const ampm = i >= 12 ? 'PM' : 'AM';
                      return (
                        <React.Fragment key={i}>
                          <option value={`${hour}:00 ${ampm}`}>{`${hour}:00 ${ampm}`}</option>
                          <option value={`${hour}:30 ${ampm}`}>{`${hour}:30 ${ampm}`}</option>
                        </React.Fragment>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="mt-8 text-center">
            <button
              type="submit"
              disabled={loading}
              className="bg-brandBlue text-white hover:bg-blue-600 transition-all font-extrabold text-sm md:text-base px-10 py-4 rounded-xl shadow-lg w-full md:w-auto min-w-[200px]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="fas fa-circle-notch fa-spin"></i> Initializing...
                </span>
              ) : (
                'SEARCH CABS'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Search;
