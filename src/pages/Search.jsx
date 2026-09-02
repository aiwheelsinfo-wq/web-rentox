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
  'Alibaug, Maharashtra, India',
  'Matheran, Maharashtra, India',
  'Mumbai Airport T2, Maharashtra, India',
  'Pune Airport, Maharashtra, India',
  'Kolhapur, Maharashtra, India',
  'Nagpur, Maharashtra, India',
  'Thane, Maharashtra, India',
  'Chhatrapati Sambhajinagar, Maharashtra, India',
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

const HERO_IMAGE_URL =
  'https://images.unsplash.com/photo-1683220042545-ef1348b2cfb6?fm=jpg&q=80&w=2000&auto=format&fit=crop';

const MAHARASHTRA_DESTINATIONS = [
  {
    name: 'Mumbai',
    tagline: 'Gateway to Maharashtra',
    desc: 'Financial capital, Marine Drive & iconic skyline',
    image: 'https://images.unsplash.com/photo-1566552881560-0be862a7c445?fm=jpg&q=80&w=800&auto=format&fit=crop',
    query: 'Mumbai, Maharashtra, India'
  },
  {
    name: 'Pune',
    tagline: 'Culture, IT & Weekend Escapes',
    desc: 'Historic forts, Oxford of the East & tech parks',
    image: 'https://images.unsplash.com/photo-1588416936097-41850ab3d86d?fm=jpg&q=80&w=800&auto=format&fit=crop',
    query: 'Pune, Maharashtra, India'
  },
  {
    name: 'Nashik',
    tagline: 'Vineyards & Sacred Temples',
    desc: 'Wine capital of India & Trimbakeshwar pilgrimage',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?fm=jpg&q=80&w=800&auto=format&fit=crop',
    query: 'Nashik, Maharashtra, India'
  },
  {
    name: 'Lonavala',
    tagline: 'Popular Hill-Station Getaway',
    desc: 'Western Ghats waterfalls, Tiger Point & lush hills',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fm=jpg&q=80&w=800&auto=format&fit=crop',
    query: 'Lonavala, Maharashtra, India'
  },
  {
    name: 'Mahabaleshwar',
    tagline: 'Scenic Mountain Destination',
    desc: 'Strawberry valleys, Venna Lake & panoramic cliffs',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?fm=jpg&q=80&w=800&auto=format&fit=crop',
    query: 'Mahabaleshwar, Maharashtra, India'
  },
  {
    name: 'Alibaug',
    tagline: 'Coastal Beaches & Sea Forts',
    desc: 'Sandy beaches, Kolaba Fort, water sports & coastal getaways',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?fm=jpg&q=80&w=800&auto=format&fit=crop',
    query: 'Alibaug, Maharashtra, India'
  },
  {
    name: 'Matheran',
    tagline: 'Eco Hill Station & Viewpoints',
    desc: 'Automobile-free paradise, Charlotte Lake & cliff panoramas',
    image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?fm=jpg&q=80&w=800&auto=format&fit=crop',
    query: 'Matheran, Maharashtra, India'
  },
  {
    name: 'Shirdi',
    tagline: 'Spiritual Pilgrimage',
    desc: 'Holy shrine of Sai Baba attracting millions yearly',
    image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?fm=jpg&q=80&w=800&auto=format&fit=crop',
    query: 'Shirdi, Maharashtra, India'
  },
  {
    name: 'Kolhapur',
    tagline: 'Royal Maratha Heritage',
    desc: 'Mahalaxmi Temple, royal palaces & authentic culture',
    image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?fm=jpg&q=80&w=800&auto=format&fit=crop',
    query: 'Kolhapur, Maharashtra, India'
  },
  {
    name: 'Nagpur',
    tagline: 'Orange City & Central Hub',
    desc: 'Zero Mile Stone, wildlife gateways & bustling commerce',
    image: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?fm=jpg&q=80&w=800&auto=format&fit=crop',
    query: 'Nagpur, Maharashtra, India'
  },
  {
    name: 'Thane',
    tagline: 'City of Lakes',
    desc: 'Yeoor Hills, scenic waterfronts & urban charm',
    image: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?fm=jpg&q=80&w=800&auto=format&fit=crop',
    query: 'Thane, Maharashtra, India'
  },
  {
    name: 'Chhatrapati Sambhajinagar',
    tagline: 'Ajanta & Ellora Gateway',
    desc: 'UNESCO World Heritage caves & historic Bibi Ka Maqbara',
    image: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?fm=jpg&q=80&w=800&auto=format&fit=crop',
    query: 'Chhatrapati Sambhajinagar, Maharashtra, India'
  }
];

const POPULAR_ROUTES = [
  { from: 'Mumbai', to: 'Pune', distance: '~150 KM', time: '3.0 Hrs', tag: 'Fast Highway' },
  { from: 'Pune', to: 'Mumbai', distance: '~150 KM', time: '3.0 Hrs', tag: 'Expressway' },
  { from: 'Mumbai', to: 'Nashik', distance: '~165 KM', time: '3.5 Hrs', tag: 'Samruddhi Mahamarg' },
  { from: 'Nashik', to: 'Mumbai', distance: '~165 KM', time: '3.5 Hrs', tag: 'Scenic Ghats' },
  { from: 'Mumbai', to: 'Lonavala', distance: '~85 KM', time: '1.8 Hrs', tag: 'Weekend Escape' },
  { from: 'Lonavala', to: 'Mumbai', distance: '~85 KM', time: '1.8 Hrs', tag: 'Direct Route' },
  { from: 'Mumbai', to: 'Mahabaleshwar', distance: '~230 KM', time: '5.5 Hrs', tag: 'Hill Holiday' },
  { from: 'Mumbai', to: 'Shirdi', distance: '~240 KM', time: '4.5 Hrs', tag: 'Pilgrimage Cab' },
  { from: 'Pune', to: 'Mahabaleshwar', distance: '~120 KM', time: '2.5 Hrs', tag: 'Quick Getaway' },
  { from: 'Pune', to: 'Shirdi', distance: '~185 KM', time: '4.0 Hrs', tag: 'Darshan Special' }
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
  const [swapRotation, setSwapRotation] = useState(0);
  const [routeDistance, setRouteDistance] = useState('');
  const [routeDuration, setRouteDuration] = useState('');

  // Live Road Distance & Duration Calculator
  useEffect(() => {
    if (!fromAddress || !toAddress || tripType === 'Local-Duty') {
      setRouteDistance('');
      setRouteDuration('');
      return;
    }

    let isMounted = true;
    const calculateRoadDistance = () => {
      if (window.google && window.google.maps) {
        const service = new window.google.maps.DistanceMatrixService();
        const origin = (fromLat && fromLng)
          ? new window.google.maps.LatLng(fromLat, fromLng)
          : fromAddress;
        const destination = (toLat && toLng)
          ? new window.google.maps.LatLng(toLat, toLng)
          : toAddress;

        service.getDistanceMatrix(
          {
            origins: [origin],
            destinations: [destination],
            travelMode: window.google.maps.TravelMode.DRIVING,
            unitSystem: window.google.maps.UnitSystem.METRIC,
          },
          (data, status) => {
            if (
              isMounted &&
              status === 'OK' &&
              data.rows &&
              data.rows.length > 0 &&
              data.rows[0].elements &&
              data.rows[0].elements[0].status === 'OK'
            ) {
              const el = data.rows[0].elements[0];
              setRouteDistance(el.distance.text);
              setRouteDuration(el.duration.text);
            }
          }
        );
      } else {
        setTimeout(calculateRoadDistance, 350);
      }
    };

    calculateRoadDistance();
    return () => { isMounted = false; };
  }, [fromAddress, toAddress, fromLat, fromLng, toLat, toLng, tripType]);

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

  const scrollToBookingWidget = () => {
    const el = document.getElementById('booking-widget');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSelectDestination = (destQuery) => {
    if (tripType === 'Local-Duty') {
      setTripType('One-way');
    }
    setToAddress(destQuery);
    scrollToBookingWidget();
  };

  const handleSelectRoute = (fromCity, toCity) => {
    if (tripType === 'Local-Duty') {
      setTripType('One-way');
    }
    setFromAddress(`${fromCity}, Maharashtra, India`);
    setToAddress(`${toCity}, Maharashtra, India`);
    scrollToBookingWidget();
  };

  const fetchPlacesSuggestions = (input, setSuggestions) => {
    if (!input || input.trim() === '') { setSuggestions([]); return; }
    if (window.google && window.google.maps && window.google.maps.places) {
      const service = new window.google.maps.places.AutocompleteService();
      service.getPlacePredictions(
        { input, componentRestrictions: { country: 'in' } },
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

  const handleSwapLocations = (e) => {
    if (e) e.preventDefault();
    if (tripType === 'Local-Duty') return;

    setSwapRotation(prev => prev + 180);

    const tempAddress = fromAddress;
    const tempLatVal = fromLat;
    const tempLngVal = fromLng;

    setFromAddress(toAddress);
    setFromLat(toLat);
    setFromLng(toLng);

    setToAddress(tempAddress);
    setToLat(tempLatVal);
    setToLng(tempLngVal);
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

    if (tripType === 'Local-taxi' || tripType === 'One-way' || tripType === 'Round-Trip') {
      const isPointInPolygon = (lat, lng, polygonCoordsStr) => {
        if (!polygonCoordsStr) return true;
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
          return true;
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
        const boundaryResp = await axios.get(endpoints.getCityBoundaries);
        if (boundaryResp.data && boundaryResp.data.status === 'success') {
          const boundaryList = boundaryResp.data.data;
          let fromAllowed = false;
          let toAllowed = false;
          for (const city of boundaryList) {
            if (checkCoordinatesInBoundary(fromLat, fromLng, city)) fromAllowed = true;
            if (tripType === 'Local-taxi') {
              toAllowed = true;
            } else {
              if (checkCoordinatesInBoundary(toLat, toLng, city)) toAllowed = true;
            }
            if (fromAllowed && toAllowed) break;
          }
          if (!fromAllowed && !toAllowed) {
            setErrorMsg('Currently Rentox operates specifically within verified city zones.');
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Boundary verification error, proceeding to backend:', err);
      }
    }

    try {
      navigate('/results');
    } catch {
      setErrorMsg('Navigation error. Please try again.');
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
    { icon: 'fa-users', title: 'Trusted by 10,000+ Drivers', desc: 'Join our happy customers' },
    { icon: 'fa-bolt', title: 'Quick & Easy Booking', desc: 'Book in less than 2 minutes' },
    { icon: 'fa-shield-halved', title: 'Secure Payments', desc: '100% Safe & Secure' },
  ];

  return (
    <div className="bg-[#F6F8FC] min-h-screen text-slate-800" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
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

      {/* ── HERO SECTION ─────────────────────────────────────────────────── */}
      <div
        className="relative pt-6 sm:pt-8 md:pt-10 pb-20 sm:pb-24 md:pb-28 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(100deg, rgba(8,20,40,0.92) 0%, rgba(8,20,40,0.8) 40%, rgba(8,20,40,0.4) 75%, rgba(8,20,40,0.15) 100%), url(${HERO_IMAGE_URL})`,
        }}
      >
        <div className="max-w-[1180px] mx-auto px-4 sm:px-6">
          <div className="agni-fade max-w-[700px]">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full mb-3 backdrop-blur-md">
              <i className="fas fa-car-side text-[#7ab8ff] text-xs"></i>
              <span className="text-[10px] sm:text-xs font-bold text-sky-50 tracking-wider uppercase">RENTOX CAR RENTAL</span>
            </div>

            <h1 className="agni-hero-title font-extrabold text-white text-2xl sm:text-3xl md:text-4xl lg:text-[40px] leading-[1.15] tracking-tight mb-2">
              Reliable Rides. <span className="text-[#008CFF]">Every Time.</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-xl mb-4">
              Outstation &amp; local cabs at fair, transparent prices — safe rides, professional drivers, on time, always.
            </p>

            {/* Compact Trust Badges */}
            <div className="flex flex-wrap gap-2.5 sm:gap-3">
              {[
                { icon: 'fa-shield-halved', color: '#5fb0ff', title: 'Safe & Secure', sub: 'Verified Drivers' },
                { icon: 'fa-tag', color: '#FFC94D', title: 'Best Prices', sub: 'Transparent Pricing' },
                { icon: 'fa-headset', color: '#4ADE80', title: '24/7 Support', sub: "We're here for you" },
              ].map((b, i) => (
                <div key={i} className="flex items-center gap-2.5 bg-black/30 border border-white/15 rounded-xl py-1.5 px-3 backdrop-blur-sm">
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white flex-shrink-0 text-xs">
                    <i className={`fas ${b.icon}`} style={{ color: b.color }}></i>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white leading-tight">{b.title}</div>
                    <div className="text-[10px] text-gray-300">{b.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── BOOKING WIDGET (Primary Action, High Visual Priority) ────────── */}
      <div id="booking-widget" className="max-w-[1180px] mx-auto px-4 sm:px-6 relative -mt-14 sm:-mt-16 md:-mt-20 z-10">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-200/90 overflow-hidden agni-fade">

          {/* Trip Type Tabs */}
          <div className="grid grid-cols-2 md:flex border-b border-gray-100 bg-slate-50/80 p-1 gap-1">
            {tripTabs.map((tab) => {
              const active = tripType === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  className="agni-tab-btn cursor-pointer rounded-xl"
                  onClick={() => setTripType(tab.key)}
                  style={{
                    flex: 1,
                    padding: '9px 8px',
                    border: 'none',
                    background: active ? 'white' : 'transparent',
                    textAlign: 'center',
                    position: 'relative',
                    borderBottom: active ? '2px solid #008CFF' : '2px solid transparent',
                    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <i className={`fas ${tab.icon}`} style={{ color: active ? '#008CFF' : '#64748B', fontSize: 12 }}></i>
                    <span className="text-[12px] sm:text-[13px] font-bold" style={{ color: active ? '#008CFF' : '#334155' }}>{tab.label}</span>
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-gray-400 mt-0.5">{tab.sub}</div>
                </button>
              );
            })}
          </div>

          {/* Form */}
          <form onSubmit={handleSearch} className="p-4 sm:p-5 md:p-6">
            {errorMsg && (
              <div className="mb-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 px-4 text-xs font-semibold flex items-center gap-2">
                <i className="fas fa-exclamation-circle text-rose-600"></i> <span>{errorMsg}</span>
              </div>
            )}

            {/* FROM / TO row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 md:gap-4 mb-3.5 relative">
              {/* FROM */}
              <div className="relative">
                <label className="block text-[10px] font-extrabold text-slate-400 tracking-wider mb-1.5 uppercase">FROM</label>
                <div className="relative">
                  <span className="agni-route-dot-from absolute left-4 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#008CFF] z-10"></span>
                  <input
                    type="text"
                    className="agni-input w-full pl-9 pr-10 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none focus:border-[#008CFF] focus:bg-white focus:ring-4 focus:ring-[#008cff]/5 transition-all"
                    value={fromAddress}
                    onChange={handleFromChange}
                    onFocus={() => setShowFromDropdown(true)}
                    onBlur={() => setTimeout(() => setShowFromDropdown(false), 180)}
                    placeholder="Enter pickup city (e.g. Mumbai, Pune)"
                  />
                  <i className="fas fa-crosshairs absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm cursor-pointer hover:text-[#008CFF]"></i>
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

              {/* SWAP BUTTON (Desktop Center: 34px Minimal Floating Control) */}
              {tripType !== 'Local-Duty' && (
                <button
                  type="button"
                  onClick={handleSwapLocations}
                  title="Swap pickup & destination"
                  aria-label="Swap pickup & destination"
                  className="hidden md:flex absolute left-1/2 top-[41px] -translate-x-1/2 -translate-y-1/2 z-20 w-[34px] h-[34px] bg-white border border-[#D9E2EC] hover:border-[#F59E0B] hover:bg-[#FFF7ED] rounded-full items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-[0_2px_8px_rgba(245,158,11,0.18)] hover:scale-[1.04] active:scale-95 transition-all duration-150 cursor-pointer group"
                >
                  <svg
                    style={{
                      transform: `rotate(${swapRotation}deg)`,
                      transition: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    className="w-4 h-4 text-[#2563EB] group-hover:text-[#D97706] transition-colors duration-150 flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M7 10h14l-4-4" />
                    <path d="M17 14H3l4 4" />
                  </svg>
                </button>
              )}

              {/* Mobile Swap Button (34px Centered with Clean Spacing) */}
              {tripType !== 'Local-Duty' && (
                <div className="flex md:hidden justify-center my-1 z-20">
                  <button
                    type="button"
                    onClick={handleSwapLocations}
                    title="Swap pickup & destination"
                    aria-label="Swap pickup & destination"
                    className="w-[34px] h-[34px] bg-white border border-[#D9E2EC] hover:border-[#F59E0B] hover:bg-[#FFF7ED] rounded-full flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:scale-[1.04] active:scale-95 transition-all duration-150 cursor-pointer group"
                  >
                    <svg
                      style={{
                        transform: `rotate(${swapRotation}deg)`,
                        transition: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                      className="w-4 h-4 text-[#2563EB] group-hover:text-[#D97706] transition-colors duration-150"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M10 7v14l-4-4" />
                      <path d="M14 17V3l4 4" />
                    </svg>
                  </button>
                </div>
              )}

              {/* TO */}
              {tripType !== 'Local-Duty' ? (
                <div className="relative">
                  <label className="block text-[10px] font-extrabold text-slate-400 tracking-wider mb-1.5 uppercase">TO</label>
                  <div className="relative">
                    <i className="fas fa-location-dot absolute left-4 top-1/2 -translate-y-1/2 text-rose-500 text-sm"></i>
                    <input
                      type="text"
                      className="agni-input w-full pl-9 pr-10 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none focus:border-[#008CFF] focus:bg-white focus:ring-4 focus:ring-[#008cff]/5 transition-all"
                      value={toAddress}
                      onChange={handleToChange}
                      onFocus={() => setShowToDropdown(true)}
                      onBlur={() => setTimeout(() => setShowToDropdown(false), 180)}
                      placeholder="Enter destination city (e.g. Lonavala, Nashik)"
                    />
                    <i className="fas fa-crosshairs absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm cursor-pointer hover:text-[#008CFF]"></i>
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
                <div className="flex items-end pb-2">
                  <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                    <i className="fas fa-circle-info text-slate-300 text-sm"></i>
                    Local duty — pick your area at the next step.
                  </p>
                </div>
              )}
            </div>

            {/* Live Calculated Road Distance Pill */}
            {routeDistance && tripType !== 'Local-Duty' && (
              <div className="mb-3.5 flex items-center gap-2.5 bg-emerald-50/90 border border-emerald-200/90 rounded-xl py-2 px-3.5 w-fit text-xs font-semibold text-emerald-800 shadow-2xs">
                <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0 text-[10px]">
                  <i className="fas fa-route"></i>
                </span>
                <span>
                  Road Distance: <strong className="text-emerald-950 font-extrabold">{routeDistance}</strong>
                </span>
                {routeDuration && (
                  <>
                    <span className="text-emerald-300">•</span>
                    <span className="text-emerald-700 font-medium">
                      <i className="fas fa-clock text-emerald-500 mr-1 text-[11px]"></i>~{routeDuration} driving time
                    </span>
                  </>
                )}
              </div>
            )}

            {/* DATE / TIME row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 md:gap-4 mb-3.5">
              {/* Travel Date */}
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 tracking-wider mb-1.5 uppercase">TRAVEL DATE</label>
                <div className="relative">
                  <i className="fas fa-calendar-days absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                  <input
                    type="date"
                    className="agni-input w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 outline-none cursor-pointer focus:border-[#008CFF] focus:bg-white focus:ring-4 focus:ring-[#008cff]/5 transition-all"
                    value={pickupDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setPickupDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Pickup Time */}
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 tracking-wider mb-1.5 uppercase">PICKUP TIME</label>
                <div className="relative">
                  <i className="fas fa-clock absolute left-4 top-1/2 -translate-y-1/2 text-[#008CFF] text-sm"></i>
                  <select
                    className="agni-input w-full pl-10 pr-10 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 outline-none appearance-none cursor-pointer focus:border-[#008CFF] focus:bg-white focus:ring-4 focus:ring-[#008cff]/5 transition-all"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                  >
                    {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
                </div>
              </div>
            </div>

            {/* Round-Trip Return Date / Time */}
            {tripType === 'Round-Trip' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 md:gap-4 mb-3.5 pt-3.5 border-t border-dashed border-slate-100">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 tracking-wider mb-1.5 uppercase">RETURN DATE</label>
                  <div className="relative">
                    <i className="fas fa-calendar-week absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                    <input
                      type="date"
                      className="agni-input w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 outline-none cursor-pointer focus:border-[#008CFF] focus:bg-white focus:ring-4 focus:ring-[#008cff]/5 transition-all"
                      value={returnDate}
                      min={pickupDate || new Date().toISOString().split('T')[0]}
                      onChange={(e) => setReturnDate(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 tracking-wider mb-1.5 uppercase">RETURN TIME</label>
                  <div className="relative">
                    <i className="fas fa-clock absolute left-4 top-1/2 -translate-y-1/2 text-[#008CFF] text-sm"></i>
                    <select
                      className="agni-input w-full pl-10 pr-10 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 outline-none appearance-none cursor-pointer focus:border-[#008CFF] focus:bg-white focus:ring-4 focus:ring-[#008cff]/5 transition-all"
                      value={returnTime}
                      onChange={(e) => setReturnTime(e.target.value)}
                    >
                      {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom row: USPs + Search Button */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
              <div className="hidden lg:flex items-center gap-5">
                {[
                  { icon: 'fa-mobile-screen', color: '#008CFF', title: 'Easy Booking', sub: 'Quick & hassle-free' },
                  { icon: 'fa-bolt', color: '#FFB300', title: 'Instant Confirmation', sub: 'Get details instantly' },
                ].map((b, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: b.color + '15' }}>
                      <i className={`fas ${b.icon}`} style={{ color: b.color, fontSize: 12 }}></i>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 leading-tight">{b.title}</div>
                      <div className="text-[10px] text-slate-400">{b.sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="agni-cta w-full lg:w-auto px-8 py-3 bg-[#1E3A8A] hover:bg-[#172554] text-white border-none rounded-xl text-xs font-extrabold tracking-wider cursor-pointer shadow-md shadow-blue-900/10 hover:brightness-105 transition-all duration-200 flex items-center justify-center gap-2 h-11"
                disabled={loading}
              >
                {loading ? (
                  <><i className="fas fa-circle-notch fa-spin"></i> Searching...</>
                ) : (
                  <>SEARCH CABS <i className="fas fa-arrow-right text-xs"></i></>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── POPULAR DESTINATIONS IN MAHARASHTRA ─────────────────────────── */}
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 mt-16 sm:mt-20">
        <div className="text-center mb-8 sm:mb-10">
          <span className="text-xs font-extrabold text-[#008CFF] tracking-widest uppercase bg-sky-50 border border-sky-100 px-3 py-1 rounded-full">
            EXPLORE MAHARASHTRA
          </span>
          <h2 className="font-extrabold text-2xl sm:text-3xl text-slate-900 mt-3 mb-2">
            Popular Destinations in Maharashtra
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Explore comfortable and reliable cab services across Mumbai and popular destinations in Maharashtra.
          </p>
        </div>

        {/* 10-Destination Responsive Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {MAHARASHTRA_DESTINATIONS.map((dest, i) => (
            <div
              key={dest.name}
              onClick={() => handleSelectDestination(dest.query)}
              className="group bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col"
            >
              {/* Destination Image Container */}
              <div className="relative h-44 overflow-hidden bg-slate-100">
                <img
                  src={dest.image}
                  alt={`${dest.name}, Maharashtra`}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?fm=jpg&q=80&w=800&auto=format&fit=crop';
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/20 to-transparent"></div>
                <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-white/20">
                  Maharashtra
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-base font-extrabold text-white leading-tight drop-shadow-sm">
                    {dest.name}
                  </h3>
                  <p className="text-[11px] text-sky-200 font-medium truncate mt-0.5">
                    {dest.tagline}
                  </p>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                  {dest.desc}
                </p>

                <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#008CFF] group-hover:text-[#1E3A8A] transition-colors">
                  <span>Explore routes</span>
                  <i className="fas fa-arrow-right text-[11px] transform group-hover:translate-x-1 transition-transform"></i>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── POPULAR ROUTES ──────────────────────────────────────────────── */}
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 mt-16 sm:mt-20">
        <div className="text-center mb-8">
          <span className="text-xs font-extrabold text-[#008CFF] tracking-widest uppercase bg-sky-50 border border-sky-100 px-3 py-1 rounded-full">
            DIRECT OUTSTATION CABS
          </span>
          <h2 className="font-extrabold text-2xl sm:text-3xl text-slate-900 mt-3 mb-2">
            Popular Routes
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
            Book one-way and round-trip cabs between Maharashtra's most popular travel routes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {POPULAR_ROUTES.map((route, i) => (
            <div
              key={i}
              onClick={() => handleSelectRoute(route.from, route.to)}
              className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-sky-300 transition-all duration-200 cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-md">
                    {route.tag}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">{route.distance}</span>
                </div>

                <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900 my-1">
                  <span className="truncate">{route.from}</span>
                  <i className="fas fa-arrow-right text-[10px] text-amber-500 flex-shrink-0"></i>
                  <span className="truncate">{route.to}</span>
                </div>
                <div className="text-[10.5px] text-slate-400 font-medium">Est. {route.time} travel</div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-[#008CFF] group-hover:text-[#1E3A8A]">
                <span>View Route</span>
                <i className="fas fa-chevron-right text-[9px]"></i>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SERVING MUMBAI & MAHARASHTRA BANNER ─────────────────────────── */}
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 mt-16 sm:mt-20">
        <div className="bg-gradient-to-r from-slate-900 via-[#1E3A8A] to-slate-900 rounded-2xl p-6 sm:p-10 text-white shadow-lg border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-2xl text-center md:text-left">
            <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full mb-3">
              PREMIUM OUTSTATION & CITY CABS
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              Serving Mumbai &amp; Maharashtra
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              Rentox provides reliable one-way, round-trip, local taxi and local duty services across Mumbai and major destinations in Maharashtra with verified drivers and 24/7 assistance.
            </p>
          </div>

          <button
            onClick={scrollToBookingWidget}
            className="flex-shrink-0 bg-[#008CFF] hover:bg-[#0077dd] text-white font-extrabold text-xs uppercase tracking-wider px-7 py-3.5 rounded-xl transition-all shadow-md shadow-blue-500/20 hover:scale-105 cursor-pointer flex items-center gap-2"
          >
            <i className="fas fa-car-side text-sm"></i>
            Book a Cab
          </button>
        </div>
      </div>

      {/* ── WHY CHOOSE RENTOX ─────────────────────────────────────────── */}
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 mt-16 sm:mt-20">
        <div className="text-center mb-8 sm:mb-10">
          <span className="text-xs font-extrabold text-[#008CFF] tracking-widest uppercase bg-sky-50 border border-sky-100 px-3 py-1 rounded-full">
            WHY RIDE WITH US
          </span>
          <h2 className="font-extrabold text-2xl sm:text-3xl text-slate-900 mt-3 mb-2">
            Why Choose Rentox Car Rental?
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {whyChoose.map((card, i) => (
            <div key={i} className="agni-why-card bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-default">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: card.color }}>
                <i className={`fas ${card.icon}`} style={{ color: card.iconColor, fontSize: 18 }}></i>
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 mb-1.5">{card.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed m-0">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── STATS BAR & FOOTER ─────────────────────────────────────────── */}
      <div className="bg-slate-900 text-white mt-16 sm:mt-20">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <div key={i} className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                <i className={`fas ${s.icon} text-sky-400 text-base`}></i>
              </div>
              <div>
                <div className="text-xs font-bold text-white">{s.title}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 py-4 text-center">
          <p className="m-0 text-[10.5px] text-slate-400 tracking-wider">© 2025 RENTOX CAR RENTAL. ALL RIGHTS RESERVED.</p>
        </div>
      </div>
    </div>
  );
};

export default Search;