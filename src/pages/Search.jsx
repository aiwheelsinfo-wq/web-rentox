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

const TIME_OPTIONS = (() => {
  const opts = [];
  for (let i = 0; i < 24; i++) {
    const hour = i === 0 ? 12 : i > 12 ? i - 12 : i;
    const ampm = i >= 12 ? 'PM' : 'AM';
    opts.push(`${hour}:00 ${ampm}`);
    opts.push(`${hour}:30 ${ampm}`);
  }
  return opts;
})();

// Suitable hero background — open highway at golden hour, evokes a long-distance/outstation ride
const HERO_IMAGE_URL =
  'https://images.unsplash.com/photo-1683220042545-ef1348b2cfb6?fm=jpg&q=80&w=2000&auto=format&fit=crop';

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
    isLoggedIn,
    fromLat, setFromLat,
    fromLng, setFromLng,
    toLat, setToLat,
    toLng, setToLng
  } = useContext(AppContext);

  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

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

  const fetchPlacesSuggestions = (input, setSuggestions) => {
    if (!input || input.trim() === '') { setSuggestions([]); return; }
    if (window.google && window.google.maps && window.google.maps.places) {
      const service = new window.google.maps.places.AutocompleteService();
      service.getPlacePredictions(
        { input, componentRestrictions: { country: 'in' }, types: ['(cities)'] },
        (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions);
          } else {
            setSuggestions([]);
          }
        }
      );
    } else {
      const filtered = CITIES.filter(c => c.toLowerCase().includes(input.toLowerCase()));
      setSuggestions(filtered.map(c => ({ description: c, isFallback: true })));
    }
  };

  const handleFromChange = (e) => {
    setFromAddress(e.target.value);
    fetchPlacesSuggestions(e.target.value, setFromSuggestions);
  };

  const handleToChange = (e) => {
    setToAddress(e.target.value);
    fetchPlacesSuggestions(e.target.value, setToSuggestions);
  };

  const selectFromSuggestion = (prediction) => {
    setFromAddress(prediction.description);
    setShowFromDropdown(false);
    if (!prediction.isFallback && window.google && window.google.maps) {
      new window.google.maps.Geocoder().geocode({ placeId: prediction.place_id }, (results, status) => {
        if (status === 'OK' && results[0]) {
          setFromLat(results[0].geometry.location.lat());
          setFromLng(results[0].geometry.location.lng());
        }
      });
    }
  };

  const selectToSuggestion = (prediction) => {
    setToAddress(prediction.description);
    setShowToDropdown(false);
    if (!prediction.isFallback && window.google && window.google.maps) {
      new window.google.maps.Geocoder().geocode({ placeId: prediction.place_id }, (results, status) => {
        if (status === 'OK' && results[0]) {
          setToLat(results[0].geometry.location.lat());
          setToLng(results[0].geometry.location.lng());
        }
      });
    }
  };

  const convertTimeTo24h = (time12h) => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') hours = '00';
    if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
    return `${hours.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!fromAddress.trim()) { setErrorMsg('Please enter a pickup city.'); return; }
    if (tripType !== 'Local-Duty' && !toAddress.trim()) { setErrorMsg('Please enter a destination city.'); return; }
    if (!pickupDate) { setErrorMsg('Please choose your travel date.'); return; }

    const travelDateTime = new Date(`${pickupDate}T${convertTimeTo24h(pickupTime)}`);
    const now = new Date();
    if ((travelDateTime - now) / (1000 * 60 * 60) < 5) {
      setErrorMsg('Pickup time must be at least 5 hours from now.');
      return;
    }
    if (tripType === 'Round-Trip') {
      const rDate = new Date(`${returnDate}T${convertTimeTo24h(returnTime)}`);
      if (rDate <= travelDateTime) { setErrorMsg('Return must be after pickup.'); return; }
    }
    if (!isLoggedIn) { navigate('/profile'); return; }

    if (tripType === 'Local-taxi') {
      const isPointInPolygon = (lat, lng, polygonCoordsStr) => {
        if (!polygonCoordsStr) return true; // Fallback to bounding box only (same as Flutter)
        try {
          const coords = JSON.parse(polygonCoordsStr);
          if (!Array.isArray(coords) || coords.length === 0) return true;
          let oddNodes = false;
          let j = coords.length - 1;
          const x = lng;
          const y = lat;
          for (let i = 0; i < coords.length; i++) {
            const pi = coords[i];
            const pj = coords[j];
            const latI = parseFloat(pi.lat);
            const latJ = parseFloat(pj.lat);
            const lngI = parseFloat(pi.lng);
            const lngJ = parseFloat(pj.lng);
            if ((latI < y && latJ >= y || latJ < y && latI >= y) &&
                (lngI + (y - latI) / (latJ - latI) * (lngJ - lngI) < x)) {
              oddNodes = !oddNodes;
            }
            j = i;
          }
          return oddNodes;
        } catch (_) {
          return true; // Fallback to bounding box
        }
      };

      const checkCoordinatesInBoundary = (lat, lng, city) => {
        const withinCoords = (
          lat >= parseFloat(city.minLat) &&
          lat <= parseFloat(city.maxLat) &&
          lng >= parseFloat(city.minLng) &&
          lng <= parseFloat(city.maxLng)
        );
        if (withinCoords) {
          if (city.polygonCoords) {
            return isPointInPolygon(lat, lng, city.polygonCoords);
          }
          return true;
        }
        return false;
      };

      setLoading(true);
      try {
        let pLat = fromLat, pLng = fromLng;
        let dLat = toLat, dLng = toLng;

        const geocoder = new window.google.maps.Geocoder();
        const geocodeAddress = (address) => {
          return new Promise((resolve) => {
            geocoder.geocode({ address }, (results, status) => {
              if (status === 'OK' && results[0]) {
                resolve({
                  lat: results[0].geometry.location.lat(),
                  lng: results[0].geometry.location.lng()
                });
              } else {
                resolve(null);
              }
            });
          });
        };

        const pickupCoords = await geocodeAddress(fromAddress);
        if (pickupCoords) {
          pLat = pickupCoords.lat;
          pLng = pickupCoords.lng;
          setFromLat(pLat);
          setFromLng(pLng);
        }

        const dropCoords = await geocodeAddress(toAddress);
        if (dropCoords) {
          dLat = dropCoords.lat;
          dLng = dropCoords.lng;
          setToLat(dLat);
          setToLng(dLng);
        }

        if (!pLat || !pLng || !dLat || !dLng) {
          setErrorMsg('Failed to resolve coordinates for pickup/drop locations.');
          setLoading(false);
          return;
        }

        const boundaryRes = await axios.get('https://agnicarrental.com/admin2025/api_city_boundary.php?action=get_active_boundaries');
        if (boundaryRes.data && boundaryRes.data.success && Array.isArray(boundaryRes.data.cities)) {
          const activeCities = boundaryRes.data.cities;
          const validCity = activeCities.find(city => {
            const isPickupIn = checkCoordinatesInBoundary(pLat, pLng, city);
            const isDropIn = checkCoordinatesInBoundary(dLat, dLng, city);
            return isPickupIn && isDropIn;
          });

          if (!validCity) {
            setErrorMsg('Local Taxi rides must stay strictly within the same city boundaries (e.g. Pune limits or Mumbai limits). Please choose One-way or Round-Trip for intercity travel.');
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error('Boundaries error, falling back to name checks', err);
        const fromLower = fromAddress.toLowerCase();
        const toLower = toAddress.toLowerCase();
        const matchesPune = fromLower.includes('pune') && toLower.includes('pune');
        const matchesMumbai = (fromLower.includes('mumbai') || fromLower.includes('thane') || fromLower.includes('dadar')) && 
                              (toLower.includes('mumbai') || toLower.includes('thane') || toLower.includes('dadar'));
        const matchesNashik = fromLower.includes('nashik') && toLower.includes('nashik');
        
        if (!matchesPune && !matchesMumbai && !matchesNashik) {
          setErrorMsg('Local Taxi is limited to Pune, Mumbai, or Nashik city limits only. Please choose One-way for intercity trips.');
          setLoading(false);
          return;
        }
      }
    }

    setLoading(true);
    try {
      if (tripType === 'One-way') {
        const response = await axios.post(endpoints.saveOneWayTemp, {
          from: fromAddress, to: toAddress, date: pickupDate, time: pickupTime, savedNumber: phoneNumber
        }, { headers: { 'Content-Type': 'application/json' } });

        if (response.data && response.data.success === true && response.data.booking_id) {
          setTempBookingId(response.data.booking_id.toString());
          navigate('/results');
        } else {
          setErrorMsg(response.data.message || 'Failed to initialize booking. Please try again.');
        }
      } else {
        navigate('/results');
      }
    } catch {
      setErrorMsg('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const tripTabs = [
    { key: 'One-way', label: 'One-way', sub: 'One Destination', icon: 'fa-arrow-right' },
    { key: 'Round-Trip', label: 'Round-Trip', sub: 'Return Journey', icon: 'fa-arrows-rotate' },
    { key: 'Local-taxi', label: 'Local Taxi', sub: 'Within City limits', icon: 'fa-location-crosshairs' },
    { key: 'Local-Duty', label: 'Local Duty', sub: 'Hourly / Daily', icon: 'fa-clock' },
  ];

  const whyChoose = [
    { icon: 'fa-car', color: '#E3F0FF', iconColor: '#008CFF', title: 'Wide Range of Cabs', desc: 'Choose from Hatchback, Sedan, SUV & more' },
    { icon: 'fa-user-tie', color: '#E8F8F0', iconColor: '#22C55E', title: 'Professional Drivers', desc: 'Verified, Experienced & Courteous' },
    { icon: 'fa-tags', color: '#FFF8E3', iconColor: '#FFB300', title: 'Transparent Pricing', desc: 'No hidden fees. What you see is what you pay' },
    { icon: 'fa-clock', color: '#F3E8FF', iconColor: '#A855F7', title: 'On-Time Guarantee', desc: 'Punctual rides. Every single time' },
  ];

  const stats = [
    { icon: 'fa-headset', title: '24/7 Customer Support', desc: "We're here to help you" },
    { icon: 'fa-users', title: 'Trusted by 10,000+ Users', desc: 'Join our happy customers' },
    { icon: 'fa-bolt', title: 'Quick & Easy Booking', desc: 'Book in less than 2 minutes' },
    { icon: 'fa-shield-halved', title: 'Secure Payments', desc: '100% Safe & Secure' },
  ];

  return (
    <div className="bg-[#F5F8FD] min-h-screen" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');
        @keyframes agni-pulse { 0% { box-shadow: 0 0 0 0 rgba(0,140,255,0.45); } 70% { box-shadow: 0 0 0 9px rgba(0,140,255,0); } 100% { box-shadow: 0 0 0 0 rgba(0,140,255,0); } }
        @keyframes agni-fade-up { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .agni-hero-title { font-family: 'Sora', sans-serif; }
        .agni-fade { animation: agni-fade-up 0.6s ease both; }
        .agni-route-dot-from { animation: agni-pulse 2.2s infinite; }
        .agni-why-card:hover { transform: translateY(-4px); box-shadow: 0 14px 34px rgba(11,31,58,0.10); border-color: #d7e4f7; }
        .agni-tab-btn:hover { background: rgba(0,140,255,0.05); }
        .agni-cta:hover { filter: brightness(1.06); box-shadow: 0 10px 28px rgba(0,140,255,0.38); }
        .agni-input:focus { border-color: #008CFF !important; box-shadow: 0 0 0 4px rgba(0,140,255,0.10); }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <div
        className="relative py-12 md:py-20 lg:py-24 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(100deg, rgba(8,20,40,0.92) 0%, rgba(8,20,40,0.8) 40%, rgba(8,20,40,0.4) 75%, rgba(8,20,40,0.15) 100%), url(${HERO_IMAGE_URL})`,
        }}
      >
        <div className="max-w-[1180px] mx-auto px-4 sm:px-6">
          <div className="agni-fade max-w-[640px]">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 border border-white/22 rounded-full mb-5 backdrop-blur-md">
              <i className="fas fa-car-side text-[#7ab8ff] text-xs"></i>
              <span className="text-[10px] sm:text-xs font-bold text-sky-50 tracking-wider uppercase">AGNI CAR RENTAL</span>
            </div>

            <h1 className="agni-hero-title font-extrabold text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.1] tracking-tight mb-2">
              Reliable Rides. <br />
              <span className="text-[#5fb0ff]">Every Time.</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-lg mb-8">
              Outstation &amp; local cabs at fair, transparent prices — safe rides, professional drivers, on time, always.
            </p>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-4 sm:gap-6 mt-6">
              {[
                { icon: 'fa-shield-halved', color: '#5fb0ff', title: 'Safe & Secure', sub: 'Verified Drivers' },
                { icon: 'fa-tag', color: '#FFC94D', title: 'Best Prices', sub: 'Transparent Pricing' },
                { icon: 'fa-headset', color: '#4ADE80', title: '24/7 Support', sub: "We're here for you" },
              ].map((b, i) => (
                <div key={i} className="flex items-center gap-3 bg-black/25 border border-white/10 rounded-2xl p-3 pr-4 backdrop-blur-sm">
                  <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white flex-shrink-0">
                    <i className={`fas ${b.icon}`} style={{ color: b.color, fontSize: '14px' }}></i>
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-white">{b.title}</div>
                    <div className="text-[10px] sm:text-xs text-gray-400">{b.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rating badge, floating over the image on the right */}
        <div className="hidden lg:flex absolute right-6 top-12 bg-white/95 rounded-2xl p-4 items-center gap-3 shadow-2xl backdrop-blur-md border border-white/20">
          <i className="fas fa-star text-[#FFB300] text-2xl"></i>
          <div>
            <div className="text-lg font-extrabold text-[#0B1F3A] leading-none">4.8/5</div>
            <div className="text-[10px] text-gray-400 mt-1 font-semibold">Customer Rating</div>
          </div>
        </div>
      </div>

      {/* ── SEARCH CARD (overlaps hero) ─────────────────────────────── */}
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 relative -mt-16 sm:-mt-20 z-10">
        <div className="bg-white rounded-3xl shadow-xl border border-[#e8eef8] overflow-hidden agni-fade">

          {/* Trip Type Tabs */}
          <div className="grid grid-cols-2 md:flex border-b border-gray-100 bg-[#fafcff] p-1 gap-1">
            {tripTabs.map((tab) => {
              const active = tripType === tab.key;
              return (
                <button
                  key={tab.key}
                  className="agni-tab-btn"
                  onClick={() => setTripType(tab.key)}
                  style={{
                    flex: 1, padding: '12px 10px', border: 'none', background: active ? 'white' : 'transparent',
                    cursor: 'pointer', textAlign: 'center', position: 'relative',
                    borderBottom: active ? '2px solid #008CFF' : '2px solid transparent',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <i className={`fas ${tab.icon}`} style={{ color: active ? '#008CFF' : '#8a99aa', fontSize: 13 }}></i>
                    <span className="text-[12px] sm:text-[13px] font-bold" style={{ color: active ? '#008CFF' : '#5a6a7a' }}>{tab.label}</span>
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-gray-400 mt-0.5">{tab.sub}</div>
                </button>
              );
            })}
          </div>

          {/* Form */}
          <form onSubmit={handleSearch} className="p-4 sm:p-6 md:p-8">
            {errorMsg && (
              <div className="mb-4 bg-[#FEF2F2] border border-[#FECACA] color-[#DC2626] rounded-xl p-3 px-4 text-xs font-semibold flex items-center gap-2">
                <i className="fas fa-exclamation-circle text-red-600"></i> <span className="text-red-700">{errorMsg}</span>
              </div>
            )}

            {/* FROM / TO row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 relative">
              {/* FROM */}
              <div className="relative">
                <label className="block text-[10px] font-extrabold text-gray-400 tracking-wider mb-2 uppercase">FROM</label>
                <div className="relative">
                  <span className="agni-route-dot-from absolute left-4 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#008CFF] z-10"></span>
                  <input
                    type="text"
                    className="agni-input w-full pl-9 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-semibold text-gray-900 placeholder-gray-400 outline-none focus:border-[#008CFF] focus:bg-white focus:ring-4 focus:ring-[#008cff]/5 transition-all"
                    value={fromAddress}
                    onChange={handleFromChange}
                    onFocus={() => setShowFromDropdown(true)}
                    onBlur={() => setTimeout(() => setShowFromDropdown(false), 180)}
                    placeholder="Enter pickup city"
                  />
                  <i className="fas fa-crosshairs absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm cursor-pointer hover:text-[#008CFF]"></i>
                </div>
                {showFromDropdown && fromSuggestions.length > 0 && (
                  <ul className="absolute z-50 w-full bg-white border border-gray-100 rounded-xl shadow-lg mt-1 p-0 list-none max-h-[200px] overflow-y-auto">
                    {fromSuggestions.map((item, idx) => (
                      <li key={idx} onMouseDown={() => selectFromSuggestion(item)}
                        className="px-4 py-2.5 flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-gray-800 hover:bg-sky-50/50 border-b border-gray-50"
                      >
                        <i className="fas fa-location-dot text-gray-300 w-4"></i>
                        {item.description}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* TO */}
              {tripType !== 'Local-Duty' ? (
                <div className="relative">
                  <label className="block text-[10px] font-extrabold text-gray-400 tracking-wider mb-2 uppercase">TO</label>
                  <div className="relative">
                    <i className="fas fa-location-dot absolute left-4 top-1/2 -translate-y-1/2 text-red-500 text-sm"></i>
                    <input
                      type="text"
                      className="agni-input w-full pl-9 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-semibold text-gray-900 placeholder-gray-400 outline-none focus:border-[#008CFF] focus:bg-white focus:ring-4 focus:ring-[#008cff]/5 transition-all"
                      value={toAddress}
                      onChange={handleToChange}
                      onFocus={() => setShowToDropdown(true)}
                      onBlur={() => setTimeout(() => setShowToDropdown(false), 180)}
                      placeholder="Enter destination city"
                    />
                    <i className="fas fa-crosshairs absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm cursor-pointer hover:text-[#008CFF]"></i>
                  </div>
                  {showToDropdown && toSuggestions.length > 0 && (
                    <ul className="absolute z-50 w-full bg-white border border-gray-100 rounded-xl shadow-lg mt-1 p-0 list-none max-h-[200px] overflow-y-auto">
                      {toSuggestions.map((item, idx) => (
                        <li key={idx} onMouseDown={() => selectToSuggestion(item)}
                          className="px-4 py-2.5 flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-gray-800 hover:bg-sky-50/50 border-b border-gray-50"
                        >
                          <i className="fas fa-location-dot text-gray-300 w-4"></i>
                          {item.description}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <div className="flex items-end pb-3">
                  <p className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                    <i className="fas fa-circle-info text-gray-300 text-sm"></i>
                    Local duty — pick your area at the next step.
                  </p>
                </div>
              )}
            </div>

            {/* DATE / TIME row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-4">
              {/* Travel Date */}
              <div>
                <label className="block text-[10px] font-extrabold text-gray-400 tracking-wider mb-2 uppercase">TRAVEL DATE</label>
                <div className="relative">
                  <i className="fas fa-calendar-days absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                  <input
                    type="date"
                    className="agni-input w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-semibold text-gray-900 outline-none cursor-pointer focus:border-[#008CFF] focus:bg-white focus:ring-4 focus:ring-[#008cff]/5 transition-all"
                    value={pickupDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setPickupDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Pickup Time */}
              <div>
                <label className="block text-[10px] font-extrabold text-gray-400 tracking-wider mb-2 uppercase">PICKUP TIME</label>
                <div className="relative">
                  <i className="fas fa-clock absolute left-4 top-1/2 -translate-y-1/2 text-[#008CFF] text-sm"></i>
                  <select
                    className="agni-input w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-semibold text-gray-900 outline-none appearance-none cursor-pointer focus:border-[#008CFF] focus:bg-white focus:ring-4 focus:ring-[#008cff]/5 transition-all"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                  >
                    {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
                </div>
              </div>
            </div>

            {/* Round-Trip Return Date / Time */}
            {tripType === 'Round-Trip' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-4 pt-5 border-t border-dashed border-gray-100">
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-400 tracking-wider mb-2 uppercase">RETURN DATE</label>
                  <div className="relative">
                    <i className="fas fa-calendar-week absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                    <input
                      type="date"
                      className="agni-input w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-semibold text-gray-900 outline-none cursor-pointer focus:border-[#008CFF] focus:bg-white focus:ring-4 focus:ring-[#008cff]/5 transition-all"
                      value={returnDate}
                      min={pickupDate || new Date().toISOString().split('T')[0]}
                      onChange={(e) => setReturnDate(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-400 tracking-wider mb-2 uppercase">RETURN TIME</label>
                  <div className="relative">
                    <i className="fas fa-clock absolute left-4 top-1/2 -translate-y-1/2 text-[#008CFF] text-sm"></i>
                    <select
                      className="agni-input w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-semibold text-gray-900 outline-none appearance-none cursor-pointer focus:border-[#008CFF] focus:bg-white focus:ring-4 focus:ring-[#008cff]/5 transition-all"
                      value={returnTime}
                      onChange={(e) => setReturnTime(e.target.value)}
                    >
                      {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom row: USPs + Search Button */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-100">
              <div className="hidden lg:flex items-center gap-6">
                {[
                  { icon: 'fa-mobile-screen', color: '#008CFF', title: 'Easy Booking', sub: 'Quick & hassle-free' },
                  { icon: 'fa-circle-check', color: '#22C55E', title: 'No Hidden Charges', sub: '100% Transparent' },
                  { icon: 'fa-bolt', color: '#FFB300', title: 'Instant Confirmation', sub: 'Get details instantly' },
                ].map((b, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: b.color + '15' }}>
                      <i className={`fas ${b.icon}`} style={{ color: b.color, fontSize: 13 }}></i>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#1a2433]">{b.title}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{b.sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="agni-cta w-full lg:w-auto px-8 py-3.5 bg-gradient-to-r from-[#008CFF] to-[#0066cc] text-white border-none rounded-xl text-sm font-bold tracking-wider cursor-pointer shadow-lg shadow-[#008cff]/20 hover:brightness-105 transition-all duration-200 flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <><i className="fas fa-circle-notch fa-spin"></i> Searching...</>
                ) : (
                  <>SEARCH CABS <i className="fas fa-arrow-right"></i></>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── WHY CHOOSE ───────────────────────────────────────────────── */}
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 mt-16">
        <div className="text-center mb-10">
          <span className="text-xs font-bold text-[#008CFF] tracking-widest uppercase">WHY RIDE WITH US</span>
          <h2 className="font-extrabold text-2xl sm:text-3xl text-[#0B1F3A] mt-2 mb-0">
            Why Choose Agni Car Rental?
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {whyChoose.map((card, i) => (
            <div key={i} className="agni-why-card bg-white rounded-2xl p-6 border border-[#eef1f7] shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-default">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: card.color }}>
                <i className={`fas ${card.icon}`} style={{ color: card.iconColor, fontSize: 20 }}></i>
              </div>
              <h3 className="text-sm font-extrabold text-[#1a2433] mb-2">{card.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed m-0">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── STATS BAR ────────────────────────────────────────────────── */}
      <div className="bg-slate-900 text-white mt-16">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                <i className={`fas ${s.icon} text-sky-400 text-lg`}></i>
              </div>
              <div>
                <div className="text-sm font-bold text-white">{s.title}</div>
                <div className="text-xs text-gray-400 mt-0.5">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-white/5 py-4 text-center">
          <p className="m-0 text-[10px] text-gray-500 tracking-wider">© 2026 AGNI CAR RENTAL. ALL RIGHTS RESERVED.</p>
        </div>
      </div>
    </div>
  );
};

export default Search;