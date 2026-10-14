import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import { endpoints } from '../config/api';
import { parseRoute, buildRouteString } from '../utils/routeHelper';

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

export const convert12hTo24hInput = (time12h) => {
  if (!time12h) return '';
  const clean = time12h.trim().toUpperCase();
  if (clean.includes('AM') || clean.includes('PM')) {
    const parts = clean.split(' ');
    const timePart = parts[0];
    const modifier = parts[1] || (clean.includes('PM') ? 'PM' : 'AM');
    let [hours, minutes] = timePart.split(':');
    let h = parseInt(hours, 10);
    if (modifier === 'AM' && h === 12) h = 0;
    if (modifier === 'PM' && h !== 12) h += 12;
    return `${h.toString().padStart(2, '0')}:${(minutes || '00').padStart(2, '0')}`;
  }
  const [h, m] = clean.split(':');
  return `${(h || '00').padStart(2, '0')}:${(m || '00').padStart(2, '0')}`;
};

export const convert24hTo12h = (time24h) => {
  if (!time24h) return '';
  const [hStr, mStr] = time24h.split(':');
  let h = parseInt(hStr, 10);
  const m = (mStr || '00').padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  return `${h}:${m} ${ampm}`;
};

export const getCurrentTimeString = () => {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
};

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
    toLng, setToLng,
    intermediateStops, setIntermediateStops,
    dropAddress, setDropAddress,
    setCalculatedDistanceKm
  } = useContext(AppContext);

  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const [activeStopIndex, setActiveStopIndex] = useState(null);
  const [stopSuggestions, setStopSuggestions] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [routeDistance, setRouteDistance] = useState('');
  const [routeDuration, setRouteDuration] = useState('');
  const [boundaries, setBoundaries] = useState([]);
  const [boundaryMatch, setBoundaryMatch] = useState(null);
  const [intraCityMatch, setIntraCityMatch] = useState(null);
  const [outstationBoundaryMatch, setOutstationBoundaryMatch] = useState(null);
  const [minAdvanceHours, setMinAdvanceHours] = useState(5.0);

  // Restore stops and drop address if toAddress was populated previously for Local-Duty
  useEffect(() => {
    if (tripType === 'Local-Duty') {
      if ((!intermediateStops || intermediateStops.length === 0) && (!dropAddress || dropAddress.trim() === '') && toAddress && toAddress.trim()) {
        const parsed = parseRoute(toAddress);
        if (parsed.isMultiStop) {
          setIntermediateStops(parsed.intermediateStops.map(s => ({ address: s.address, lat: null, lng: null, isOutside: false })));
          if (parsed.finalDrop) {
            setDropAddress(parsed.finalDrop.address);
          }
        } else if (parsed.finalDrop) {
          setDropAddress(parsed.finalDrop.address);
        }
      }
    }
  }, [tripType]);

  // Fetch dynamic booking configuration (advance hours) from database
  useEffect(() => {
    let isMounted = true;
    axios.get(endpoints.getBookingConfig)
      .then((res) => {
        if (isMounted && res.data && res.data.success && res.data.min_advance_booking_hours !== undefined) {
          setMinAdvanceHours(Number(res.data.min_advance_booking_hours));
        }
      })
      .catch((err) => console.warn('Could not load booking config:', err));
    return () => { isMounted = false; };
  }, []);

  // Fetch configured city boundaries from database
  useEffect(() => {
    let isMounted = true;
    axios.get(endpoints.getCityBoundaries)
      .then((res) => {
        if (isMounted && res.data && res.data.status === 'success') {
          const list = res.data.cities || res.data.data || [];
          setBoundaries(list);
        }
      })
      .catch((err) => console.warn('Could not load city boundaries:', err));
    return () => { isMounted = false; };
  }, []);

  // Fetch live service availability & coming soon statuses from database
  const [serviceStatus, setServiceStatus] = useState({});
  useEffect(() => {
    let isMounted = true;
    axios.get(endpoints.getServiceStatus)
      .then((res) => {
        if (isMounted && res.data?.success && res.data.services) {
          setServiceStatus(res.data.services);
        }
      })
      .catch((err) => console.warn('Could not load service status:', err));
    return () => { isMounted = false; };
  }, []);

  const isServiceEnabled = (tripKey) => {
    const keyMap = {
      'One-way': 'one_way',
      'Round-Trip': 'round_trip',
      'Local-taxi': 'local_taxi',
      'Local-Duty': 'local_duty',
    };
    const sKey = keyMap[tripKey];
    if (!sKey || !serviceStatus[sKey]) return true;
    return serviceStatus[sKey].is_enabled !== false;
  };

  const getServiceInfo = (tripKey) => {
    const keyMap = {
      'One-way': 'one_way',
      'Round-Trip': 'round_trip',
      'Local-taxi': 'local_taxi',
      'Local-Duty': 'local_duty',
    };
    const sKey = keyMap[tripKey];
    return serviceStatus[sKey] || {};
  };

  // Ray Casting Polygon Point-in-Polygon Check
  const isPointInPolygon = (lat, lng, polygonCoords) => {
    if (!polygonCoords) return true;
    let coords = polygonCoords;
    if (typeof coords === 'string') {
      try { coords = JSON.parse(coords); } catch (_) { return true; }
    }
    if (!Array.isArray(coords) || coords.length === 0) return true;

    let inside = false;
    for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
      const xi = parseFloat(coords[i].lat ?? coords[i][0]);
      const yi = parseFloat(coords[i].lng ?? coords[i][1]);
      const xj = parseFloat(coords[j].lat ?? coords[j][0]);
      const yj = parseFloat(coords[j].lng ?? coords[j][1]);

      const intersect = ((yi > lng) !== (yj > lng)) &&
        (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const checkCoordinatesInBoundary = (lat, lng, city) => {
    const cLat = parseFloat(lat);
    const cLng = parseFloat(lng);
    if (isNaN(cLat) || isNaN(cLng)) return false;

    const minLat = parseFloat(city.min_lat ?? city.minLat);
    const maxLat = parseFloat(city.max_lat ?? city.maxLat);
    const minLng = parseFloat(city.min_lng ?? city.minLng);
    const maxLng = parseFloat(city.max_lng ?? city.maxLng);

    const withinBoundingBox = (
      cLat >= minLat && cLat <= maxLat &&
      cLng >= minLng && cLng <= maxLng
    );

    if (!withinBoundingBox) return false;

    const poly = city.polygon_coords ?? city.polygonCoords;
    if (poly) {
      return isPointInPolygon(cLat, cLng, poly);
    }
    return true;
  };

  // Live real-time boundary verification (Checks BOTH pickup & destination for Local Taxi & Local Duty)
  useEffect(() => {
    if (!fromLat || !fromLng || boundaries.length === 0 || !fromAddress || (tripType !== 'Local-taxi' && tripType !== 'Local-Duty')) {
      setBoundaryMatch(null);
      return;
    }

    const activeBoundaries = boundaries.filter(b => (b.status || 'active').toLowerCase() === 'active');
    const fromCity = activeBoundaries.find(b => checkCoordinatesInBoundary(fromLat, fromLng, b));

    const tripLabel = tripType === 'Local-Duty' ? 'Hourly Rental' : 'Local Taxi';

    if (!fromCity) {
      setBoundaryMatch({
        isInside: false,
        reason: 'pickup',
        cityName: null,
        message: `Pickup location is outside our ${tripLabel} service zone.`
      });
      return;
    }

    const cName = fromCity.city_name || fromCity.cityName || 'City';

    // Check destination if provided
    if (toAddress && toAddress.trim().length > 1 && toLat && toLng) {
      const isToInside = checkCoordinatesInBoundary(toLat, toLng, fromCity);
      if (!isToInside) {
        const destShort = toAddress.split(',')[0].trim();
        setBoundaryMatch({
          isInside: false,
          reason: 'destination',
          cityName: cName,
          destinationName: destShort,
          message: `Destination (${destShort}) is outside the ${cName} ${tripLabel} boundary.`
        });
        return;
      }
    }

    setBoundaryMatch({
      isInside: true,
      cityName: cName,
      tripLabel: tripLabel
    });
  }, [fromLat, fromLng, toLat, toLng, boundaries, fromAddress, toAddress, tripType]);

  // Real-time Intra-City check for One-Way & Round-Trip (e.g. Mulund to Thane inside Mumbai)
  useEffect(() => {
    if (
      !fromLat || !fromLng || !toLat || !toLng ||
      boundaries.length === 0 || !fromAddress || !toAddress ||
      (tripType !== 'One-way' && tripType !== 'Round-Trip')
    ) {
      setIntraCityMatch(null);
      return;
    }

    const activeBoundaries = boundaries.filter(b => (b.status || 'active').toLowerCase() === 'active');
    const fromCity = activeBoundaries.find(b => checkCoordinatesInBoundary(fromLat, fromLng, b));
    const toCity = activeBoundaries.find(b => checkCoordinatesInBoundary(toLat, toLng, b));

    if (fromCity && toCity && (fromCity.id === toCity.id || fromCity.city_name === toCity.city_name)) {
      setIntraCityMatch({
        isInsideSameCity: true,
        cityName: fromCity.city_name || fromCity.cityName || 'City'
      });
    } else {
      setIntraCityMatch(null);
    }
  }, [fromLat, fromLng, toLat, toLng, boundaries, fromAddress, toAddress, tripType]);

  // Real-time pickup boundary verification for One-Way & Round-Trip
  useEffect(() => {
    if (
      !fromLat || !fromLng ||
      boundaries.length === 0 || !fromAddress ||
      (tripType !== 'One-way' && tripType !== 'Round-Trip' && tripType !== 'Local-Duty')
    ) {
      setOutstationBoundaryMatch(null);
      return;
    }

    const activeBoundaries = boundaries.filter(b => (b.status || 'active').toLowerCase() === 'active');
    const fromCity = activeBoundaries.find(b => checkCoordinatesInBoundary(fromLat, fromLng, b));

    if (!fromCity) {
      const pickupCity = fromAddress.split(',')[0].trim() || 'This location';
      const cityNames = activeBoundaries.map(b => b.city_name || b.cityName).join(', ') || 'Mumbai, Pune, Nashik, Aurangabad';
      setOutstationBoundaryMatch({
        isInside: false,
        cityName: pickupCity,
        message: `Pickup location "${pickupCity}" is outside Rentox's service boundary. Cab pickups are currently available from: ${cityNames}.`
      });
    } else {
      setOutstationBoundaryMatch({
        isInside: true,
        cityName: fromCity.city_name || fromCity.cityName || 'City'
      });
    }
  }, [fromLat, fromLng, boundaries, fromAddress, tripType]);

  // Dynamic geocode sync for destination address
  useEffect(() => {
    if (!toAddress || !window.google || !window.google.maps) return;
    const timer = setTimeout(() => {
      new window.google.maps.Geocoder().geocode({ address: toAddress, componentRestrictions: { country: 'in' } }, (results, status) => {
        if (status === 'OK' && results[0]) {
          setToLat(results[0].geometry.location.lat());
          setToLng(results[0].geometry.location.lng());
        }
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [toAddress]);

  // Dynamic geocode sync for pickup address
  useEffect(() => {
    if (!fromAddress || !window.google || !window.google.maps) return;
    const timer = setTimeout(() => {
      new window.google.maps.Geocoder().geocode({ address: fromAddress, componentRestrictions: { country: 'in' } }, (results, status) => {
        if (status === 'OK' && results[0]) {
          setFromLat(results[0].geometry.location.lat());
          setFromLng(results[0].geometry.location.lng());
        }
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [fromAddress]);

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
              if (el.distance && el.distance.value) {
                const km = el.distance.value / 1000;
                if (setCalculatedDistanceKm) setCalculatedDistanceKm(km);
                localStorage.setItem('search_calculatedDistanceKm', String(km));
              }
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

  // Intermediate Stops Handlers for Local Duty (Hourly Rental)
  const addIntermediateStop = () => {
    if (intermediateStops.length < 4) {
      setIntermediateStops(prev => [
        ...prev,
        { address: '', lat: null, lng: null, isOutside: false }
      ]);
    }
  };

  const removeIntermediateStop = (index) => {
    setIntermediateStops(prev => prev.filter((_, i) => i !== index));
    if (activeStopIndex === index) {
      setActiveStopIndex(null);
      setStopSuggestions([]);
    }
  };

  const handleStopChange = (index, value) => {
    setIntermediateStops(prev => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], address: value, isOutside: false };
      }
      return next;
    });
    setActiveStopIndex(index);
    fetchPlacesSuggestions(value, setStopSuggestions);
  };

  const selectStopSuggestion = (index, prediction) => {
    setActiveStopIndex(null);
    setStopSuggestions([]);

    if (!prediction.isFallback && window.google && window.google.maps) {
      new window.google.maps.Geocoder().geocode({ placeId: prediction.place_id }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const sLat = results[0].geometry.location.lat();
          const sLng = results[0].geometry.location.lng();
          const activeBoundaries = boundaries.filter(b => (b.status || 'active').toLowerCase() === 'active');
          const fromCity = activeBoundaries.find(b => checkCoordinatesInBoundary(fromLat, fromLng, b));
          const isInside = fromCity ? checkCoordinatesInBoundary(sLat, sLng, fromCity) : true;
          setIntermediateStops(prev => {
            const next = [...prev];
            if (next[index]) {
              next[index] = {
                ...next[index],
                address: prediction.description,
                lat: sLat,
                lng: sLng,
                isOutside: !isInside,
                cityName: fromCity ? (fromCity.city_name || fromCity.cityName) : 'City'
              };
            }
            return next;
          });
        }
      });
    } else {
      setIntermediateStops(prev => {
        const next = [...prev];
        if (next[index]) {
          next[index] = { ...next[index], address: prediction.description };
        }
        return next;
      });
    }
  };

  const handleDropChange = (e) => {
    setDropAddress(e.target.value);
    fetchPlacesSuggestions(e.target.value, setToSuggestions);
  };

  const selectDropSuggestion = (prediction) => {
    setDropAddress(prediction.description);
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
    if (!time12h) return '00:00:00';
    const clean = time12h.trim().toUpperCase();
    if (clean.includes('AM') || clean.includes('PM')) {
      const parts = clean.split(' ');
      const timePart = parts[0];
      const modifier = parts[1] || (clean.includes('PM') ? 'PM' : 'AM');
      let [hours, minutes] = timePart.split(':');
      let h = parseInt(hours, 10);
      if (modifier === 'AM' && h === 12) h = 0;
      if (modifier === 'PM' && h !== 12) h += 12;
      return `${h.toString().padStart(2, '0')}:${(minutes || '00').padStart(2, '0')}:00`;
    }
    const [h, m] = clean.split(':');
    return `${(h || '00').padStart(2, '0')}:${(m || '00').padStart(2, '0')}:00`;
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!isServiceEnabled(tripType)) {
      const info = getServiceInfo(tripType);
      setErrorMsg(info.message || `${tripType} service is temporarily unavailable.`);
      return;
    }
    if (!fromAddress.trim()) { setErrorMsg('Please enter a pickup city.'); return; }
    if (tripType !== 'Local-Duty' && !toAddress.trim()) { setErrorMsg('Please enter a destination city.'); return; }
    if (!pickupDate) { setErrorMsg('Please choose your travel date.'); return; }

    const travelDateTime = new Date(`${pickupDate}T${convertTimeTo24h(pickupTime)}`);
    const now = new Date();
    const leadHours = minAdvanceHours ?? 5.0;
    if (tripType !== 'Local-taxi') {
      if (leadHours <= 0) {
        if (travelDateTime < new Date(now.getTime() - 5 * 60 * 1000)) {
          setErrorMsg('Pickup time cannot be in the past.');
          return;
        }
      } else if ((travelDateTime - now) / (1000 * 60 * 60) < leadHours) {
        setErrorMsg(`Pickup time must be at least ${leadHours} ${leadHours === 1 ? 'hour' : 'hours'} from now for Outstation trips.`);
        return;
      }
    }
    if (tripType === 'Local-taxi' && travelDateTime < new Date(now.getTime() - 10 * 60 * 1000)) {
      setErrorMsg('Pickup time cannot be in the past.');
      return;
    }
    if (tripType === 'Round-Trip') {
      const rDate = new Date(`${returnDate}T${convertTimeTo24h(returnTime)}`);
      if (rDate <= travelDateTime) { setErrorMsg('Return must be after pickup.'); return; }
    }
    if (!isLoggedIn) { navigate('/profile'); return; }

    if (tripType === 'Local-taxi' || tripType === 'Local-Duty') {
      const tripLabel = tripType === 'Local-Duty' ? 'Hourly Rental' : 'Local Taxi';
      let activeList = boundaries;
      if (activeList.length === 0) {
        try {
          const boundaryResp = await axios.get(endpoints.getCityBoundaries);
          if (boundaryResp.data && boundaryResp.data.status === 'success') {
            activeList = boundaryResp.data.cities || boundaryResp.data.data || [];
            setBoundaries(activeList);
          }
        } catch (err) {
          console.warn('Boundary verification fetch error:', err);
        }
      }

      if (activeList.length > 0) {
        const activeCities = activeList.filter(b => (b.status || 'active').toLowerCase() === 'active');
        const fromCity = activeCities.find(b => checkCoordinatesInBoundary(fromLat, fromLng, b));
        if (!fromCity) {
          const cityNames = activeCities.map(b => b.city_name || b.cityName).join(', ') || 'Mumbai, Pune';
          setErrorMsg(`${tripLabel} is not available for this pickup location. ${tripLabel} operates strictly within municipal boundaries (${cityNames}). Please choose One-Way.`);
          return;
        }

        if (tripType === 'Local-Duty') {
          // Construct formatted multi-stop route
          const fullRoute = buildRouteString(intermediateStops, dropAddress);
          setToAddress(fullRoute);
          localStorage.setItem('search_toAddress', fullRoute);

          const cName = fromCity.city_name || fromCity.cityName || 'City';
          // Check intermediate stops boundary
          for (let i = 0; i < intermediateStops.length; i++) {
            const stop = intermediateStops[i];
            if (stop.lat && stop.lng) {
              const isStopInside = checkCoordinatesInBoundary(stop.lat, stop.lng, fromCity);
              if (!isStopInside) {
                const sName = (stop.address || '').split(',')[0].trim() || `Stop ${i + 1}`;
                setErrorMsg(`Stop ${i + 1} (${sName}) is outside the ${cName} Hourly Rental boundary.`);
                return;
              }
            }
          }
          // Check final drop boundary if provided
          if (dropAddress && dropAddress.trim().length > 0 && toLat && toLng) {
            const isToInside = checkCoordinatesInBoundary(toLat, toLng, fromCity);
            if (!isToInside) {
              const destShort = dropAddress.split(',')[0].trim();
              setErrorMsg(`Drop location (${destShort}) is outside the ${cName} Hourly Rental boundary. For trips traveling outside the city boundary, please choose One-Way or Round-Trip.`);
              return;
            }
          }
        } else {
          // Local Taxi single destination boundary check
          if (toAddress && toAddress.trim().length > 0 && toLat && toLng) {
            const isToInside = checkCoordinatesInBoundary(toLat, toLng, fromCity);
            if (!isToInside) {
              const destShort = toAddress.split(',')[0].trim();
              const cName = fromCity.city_name || fromCity.cityName;
              setErrorMsg(`Drop location (${destShort}) is outside the ${cName} ${tripLabel} boundary. For trips traveling outside the city boundary, please choose One-Way or Round-Trip.`);
              return;
            }
          }
        }
      }
    }

    // Check if One-Way or Round-Trip pickup is within operational boundaries
    if (tripType === 'One-way' || tripType === 'Round-Trip') {
      let activeList = boundaries;
      if (activeList.length === 0) {
        try {
          const boundaryResp = await axios.get(endpoints.getCityBoundaries);
          if (boundaryResp.data && boundaryResp.data.status === 'success') {
            activeList = boundaryResp.data.cities || boundaryResp.data.data || [];
            setBoundaries(activeList);
          }
        } catch (err) {
          console.warn('Boundary verification fetch error:', err);
        }
      }

      if (activeList.length > 0 && fromLat && fromLng) {
        const activeCities = activeList.filter(b => (b.status || 'active').toLowerCase() === 'active');
        const fromCity = activeCities.find(b => checkCoordinatesInBoundary(fromLat, fromLng, b));

        if (!fromCity) {
          const pickupCity = fromAddress.split(',')[0].trim() || 'This location';
          const cityNames = activeCities.map(b => b.city_name || b.cityName).join(', ') || 'Mumbai, Pune, Nashik, Aurangabad';
          setErrorMsg(
            `Pickup location "${pickupCity}" is outside Rentox's service boundary. Cab pickups are currently available from: ${cityNames}.`
          );
          return;
        }

        if (tripType !== 'Local-Duty' && toLat && toLng && toAddress && toAddress.trim().length > 0) {
          const toCity = activeCities.find(b => checkCoordinatesInBoundary(toLat, toLng, b));

          if (toCity && (fromCity.id === toCity.id || fromCity.city_name === toCity.city_name)) {
            const fromShort = fromAddress.split(',')[0].trim();
            const toShort = toAddress.split(',')[0].trim();
            const cName = fromCity.city_name || fromCity.cityName;
            setErrorMsg(
              `This route (${fromShort} to ${toShort}) is an intra-city trip within ${cName} city limits. One-Way and Round-Trip are for outstation journeys. Please switch to Local Taxi for lower city rates and ₹0 advance!`
            );
            return;
          }
        }
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
    { key: 'Local-Duty', label: 'Hourly Rental', sub: 'Hourly / Daily', icon: 'fa-clock' },
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

      {/* ── UNIFIED HERO & BOOKING SECTION (Matching Route Page Aesthetic) ── */}
      <section className="bg-[#1C1F26] text-white pt-6 sm:pt-12 pb-12 sm:pb-20 px-3 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-[1180px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-10 items-center">
            
            {/* Left Column: Heading & Value Props */}
            <div className="lg:col-span-5 text-left">
              <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-3xs font-black uppercase tracking-wider mb-2.5 sm:mb-4">
                <i className="fas fa-shield-alt text-amber-400"></i>
                Guaranteed Lowest One-Way Fare
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-[44px] font-black text-white tracking-tight leading-tight">
                Reliable Rides. <span className="text-amber-400">Every Time.</span>
              </h1>

              <p className="text-xs sm:text-base text-slate-300 mt-2 sm:mt-4 leading-relaxed max-w-xl font-normal hidden sm:block">
                Doorstep outstation &amp; city cab bookings across Maharashtra &amp; Kerala. Verified chauffeurs, sanitized AC vehicles, zero hidden surge, and guaranteed on-time pickups.
              </p>

              {/* Quick Value Badges (Desktop View - Visible on lg screens) */}
              <div className="hidden lg:grid grid-cols-2 gap-3 mt-8">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-center backdrop-blur-sm">
                  <div className="text-3xs text-slate-400 uppercase font-bold tracking-wider">Outstation From</div>
                  <div className="text-base sm:text-lg font-black text-amber-400 mt-0.5">₹1,599</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-center backdrop-blur-sm">
                  <div className="text-3xs text-slate-400 uppercase font-bold tracking-wider">Customer Rating</div>
                  <div className="text-base sm:text-lg font-black text-emerald-400 mt-0.5 flex items-center justify-center gap-1">
                    <i className="fas fa-star text-xs"></i> 4.9/5
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-center backdrop-blur-sm">
                  <div className="text-3xs text-slate-400 uppercase font-bold tracking-wider">Verified Drivers</div>
                  <div className="text-base sm:text-lg font-black text-white mt-0.5">100% Vetted</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-center backdrop-blur-sm">
                  <div className="text-3xs text-slate-400 uppercase font-bold tracking-wider">Customer Support</div>
                  <div className="text-base sm:text-lg font-black text-sky-400 mt-0.5">24x7 Helpline</div>
                </div>
              </div>
            </div>

            {/* Right Column: Instant Booking Box */}
            <div id="booking-widget" className="lg:col-span-7">
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-2xl border border-slate-100 text-slate-800">
                
                {/* Trip Type Tabs Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
                  <div className="font-black text-xs sm:text-sm text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <i className="fas fa-car-side text-amber-500 text-base"></i>
                    <span>Instant Cab Booking</span>
                  </div>
                  <div className="grid grid-cols-2 sm:flex bg-slate-100 p-1 rounded-2xl gap-1">
                    {tripTabs.map((tab) => {
                      const active = tripType === tab.key;
                      const isEnabled = isServiceEnabled(tab.key);
                      const info = getServiceInfo(tab.key);

                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setTripType(tab.key)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            active
                              ? 'bg-[#1E3A8A] text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                          }`}
                        >
                          <i className={`fas ${tab.icon} text-3xs ${active ? 'text-amber-400' : 'text-slate-400'}`}></i>
                          <span>{tab.label}</span>
                          {!isEnabled && (
                            <span className="text-[7.5px] font-black uppercase px-1 py-0.2 rounded-full bg-amber-500 text-white">
                              {info.badge_text || 'Soon'}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSearch} className="p-0">
            {!isServiceEnabled(tripType) ? (
              <div className="py-10 px-4 sm:px-8 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-orange-500/15 to-amber-100 flex items-center justify-center mb-4 ring-8 ring-amber-50/50">
                  <i className="fas fa-clock text-amber-500 text-2xl sm:text-3xl"></i>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/80 border border-amber-300 text-amber-900 text-[11px] font-bold tracking-wide uppercase mb-3">
                  <i className="fas fa-sparkles text-amber-600 text-xs"></i>
                  <span>{getServiceInfo(tripType).badge_text || 'Coming Soon'}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight mb-2">
                  {getServiceInfo(tripType).title || `${tripType} Service Launching Soon`}
                </h3>
                <p className="text-slate-500 text-xs sm:text-sm max-w-lg leading-relaxed mb-6">
                  {getServiceInfo(tripType).message ||
                    'This service is currently being fine-tuned for the best riding experience in your city. Please check out our other available services below.'}
                </p>

                <div className="w-full max-w-md bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Available Services You Can Book Right Now:
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {tripTabs
                      .filter((t) => isServiceEnabled(t.key))
                      .map((t) => (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => setTripType(t.key)}
                          className="px-3.5 py-2 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <i className={`fas ${t.icon} text-blue-500 text-xs`}></i>
                          <span>{t.label}</span>
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
            {errorMsg && (
              <div className="mb-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 px-4 text-xs font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
                <div className="flex items-center gap-2">
                  <i className="fas fa-exclamation-circle text-rose-600 text-base flex-shrink-0"></i>
                  <span>{errorMsg}</span>
                </div>
                {errorMsg.toLowerCase().includes('switch to local taxi') || errorMsg.toLowerCase().includes('choose local taxi') ? (
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg('');
                      setTripType('Local-taxi');
                    }}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-lg text-xs transition-all shadow-2xs whitespace-nowrap cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <span>Switch to Local Taxi</span>
                    <i className="fas fa-arrow-right text-[10px]"></i>
                  </button>
                ) : errorMsg.toLowerCase().includes('one-way') ? (
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg('');
                      setTripType('One-way');
                    }}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-lg text-xs transition-all shadow-2xs whitespace-nowrap cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <span>Switch to One-Way</span>
                    <i className="fas fa-arrow-right text-[10px]"></i>
                  </button>
                ) : null}
              </div>
            )}

            {/* ROUTE SELECTION: Multi-Stop for Local Duty, 2-Col Grid for Outstation & Local Taxi */}
            {tripType === 'Local-Duty' ? (
              <div className="flex flex-col gap-3.5 mb-3.5 relative bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs">
                {/* Header Info */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">
                      <i className="fas fa-route"></i>
                    </span>
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                      Route &amp; Multiple Stops
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-100/80 border border-amber-200/80 px-2.5 py-0.5 rounded-full">
                    {intermediateStops.length > 0 ? `${intermediateStops.length} Intermediate ${intermediateStops.length === 1 ? 'Stop' : 'Stops'}` : 'Local Hourly Rental'}
                  </span>
                </div>

                {/* 1. PICKUP LOCATION */}
                <div className="relative">
                  <label className="block text-[10px] font-extrabold text-slate-400 tracking-wider mb-1.5 uppercase">
                    1. PICKUP LOCATION
                  </label>
                  <div className="relative">
                    <span className="agni-route-dot-from absolute left-4 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#008CFF] z-10"></span>
                    <input
                      type="text"
                      className="agni-input w-full pl-9 pr-10 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none focus:border-[#008CFF] focus:bg-white focus:ring-4 focus:ring-[#008cff]/5 transition-all shadow-2xs"
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

                {/* 2. INTERMEDIATE STOPS LIST */}
                {intermediateStops.length > 0 && (
                  <div className="flex flex-col gap-2.5 pl-3 border-l-2 border-dashed border-amber-300 ml-4 py-1">
                    {intermediateStops.map((stop, sIdx) => (
                      <div key={sIdx} className="relative bg-white border border-amber-200/90 rounded-xl p-3 shadow-2xs">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-amber-800 uppercase tracking-wider bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md">
                            <i className="fas fa-location-dot text-[9px] text-amber-500"></i> Stop {sIdx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeIntermediateStop(sIdx)}
                            className="text-slate-400 hover:text-rose-600 text-xs transition-colors p-1 cursor-pointer"
                            title="Remove Stop"
                          >
                            <i className="fas fa-trash-can"></i>
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            value={stop.address || ''}
                            onChange={(e) => handleStopChange(sIdx, e.target.value)}
                            onFocus={() => setActiveStopIndex(sIdx)}
                            placeholder={`Enter stop ${sIdx + 1} (e.g. Bandra, Dadar, Mall)`}
                            className="agni-input w-full pl-8 pr-8 py-2 bg-slate-50/60 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none focus:border-amber-500 focus:bg-white transition-all"
                          />
                          <i className="fas fa-map-pin absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 text-xs"></i>
                          {stop.address && (
                            <button
                              type="button"
                              onClick={() => handleStopChange(sIdx, '')}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 text-xs cursor-pointer"
                            >
                              <i className="fas fa-xmark"></i>
                            </button>
                          )}
                        </div>
                        {activeStopIndex === sIdx && stopSuggestions.length > 0 && (
                          <ul className="absolute z-50 left-0 right-0 top-full bg-white border border-gray-100 rounded-xl shadow-lg mt-1 p-0 list-none max-h-[180px] overflow-y-auto">
                            {stopSuggestions.map((item, pIdx) => (
                              <li
                                key={pIdx}
                                onMouseDown={() => selectStopSuggestion(sIdx, item)}
                                className="px-3.5 py-2 flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-800 hover:bg-amber-50/60 border-b border-gray-50"
                              >
                                <i className="fas fa-location-dot text-amber-500 text-xs w-4"></i>
                                {item.description}
                              </li>
                            ))}
                          </ul>
                        )}
                        {stop.isOutside && (
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md mt-2">
                            <i className="fas fa-triangle-exclamation text-rose-500 text-xs"></i>
                            <span>Stop {sIdx + 1} is outside the {stop.cityName || 'city'} service boundary.</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* 3. ADD STOP BUTTON */}
                {intermediateStops.length < 4 && (
                  <div className="ml-4">
                    <button
                      type="button"
                      onClick={addIntermediateStop}
                      className="inline-flex items-center gap-2 py-2 px-3.5 rounded-xl border border-dashed border-amber-400 bg-white hover:bg-amber-50 text-amber-900 text-xs font-extrabold transition-all cursor-pointer shadow-2xs hover:shadow-xs"
                    >
                      <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[9px]">
                        <i className="fas fa-plus"></i>
                      </span>
                      <span>
                        {intermediateStops.length === 0
                          ? '+ Add Stop (Multiple Places)'
                          : `+ Add Another Stop (${intermediateStops.length}/4)`}
                      </span>
                    </button>
                  </div>
                )}

                {/* 4. DROP LOCATION (OPTIONAL) */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">
                      {intermediateStops.length > 0 ? 'FINAL DROP DESTINATION' : 'DROP DESTINATION'}
                    </label>
                    <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md">Optional</span>
                  </div>
                  <div className="relative">
                    <i className="fas fa-location-dot absolute left-4 top-1/2 -translate-y-1/2 text-rose-500 text-sm"></i>
                    <input
                      type="text"
                      className="agni-input w-full pl-9 pr-10 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none focus:border-[#008CFF] focus:bg-white focus:ring-4 focus:ring-[#008cff]/5 transition-all shadow-2xs"
                      value={dropAddress}
                      onChange={handleDropChange}
                      onFocus={() => setShowToDropdown(true)}
                      onBlur={() => setTimeout(() => setShowToDropdown(false), 180)}
                      placeholder={intermediateStops.length > 0 ? "Enter final drop destination (optional)" : "Enter drop-off area / destination (e.g. Bandra, Pune)"}
                    />
                    {dropAddress ? (
                      <i
                        onClick={() => { setDropAddress(''); setToLat(null); setToLng(null); }}
                        className="fas fa-xmark absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm cursor-pointer hover:text-slate-600"
                      ></i>
                    ) : (
                      <i className="fas fa-crosshairs absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm cursor-pointer hover:text-[#008CFF]"></i>
                    )}
                  </div>
                  {showToDropdown && toSuggestions.length > 0 && (
                    <ul className="absolute z-50 w-full bg-white border border-gray-100 rounded-xl shadow-lg mt-1 p-0 list-none max-h-[200px] overflow-y-auto">
                      {toSuggestions.map((item, idx) => (
                        <li key={idx} onMouseDown={() => selectDropSuggestion(item)}
                          className="px-4 py-2.5 flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-gray-800 hover:bg-sky-50/50 border-b border-gray-50"
                        >
                          <i className="fas fa-location-dot text-gray-300 w-4"></i>
                          {item.description}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ) : (
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

                {/* TO */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">TO</label>
                  </div>
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
              </div>
            )}

            {/* Geo-Fence & Road Distance Information Bar for Local Taxi & One-Way */}
            <div className="flex flex-wrap items-center gap-2 mb-3.5">
              {/* Boundary Matched Inside Badge */}
              {(tripType === 'Local-taxi' || tripType === 'Local-Duty') && boundaryMatch?.isInside && (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200/90 rounded-xl py-1.5 px-3 text-xs font-semibold text-blue-800 shadow-2xs">
                  <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0 text-[10px]">
                    <i className="fas fa-map-pin"></i>
                  </span>
                  <span>Pickup inside <strong>{boundaryMatch.cityName}</strong> {tripType === 'Local-Duty' ? 'Local Duty' : 'Local Taxi'} Zone</span>
                </div>
              )}

              {/* Live Calculated Road Distance Pill */}
              {routeDistance && tripType !== 'Local-Duty' && (
                <div className="flex items-center gap-2.5 bg-emerald-50/90 border border-emerald-200/90 rounded-xl py-1.5 px-3.5 text-xs font-semibold text-emerald-800 shadow-2xs">
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
            </div>

            {/* Out-of-Boundary Alert Recommendation for Local Taxi */}
            {tripType === 'Local-taxi' && boundaryMatch && boundaryMatch.isInside === false && (
              <div className="mb-3.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <i className="fas fa-circle-exclamation text-amber-600 text-base flex-shrink-0"></i>
                  <span>
                    {boundaryMatch.message ? (
                      <strong>{boundaryMatch.message} </strong>
                    ) : (
                      <>
                        Local Taxi operates strictly within municipal boundaries (<strong>{boundaries.map(b => b.city_name || b.cityName).join(', ') || 'Mumbai, Pune'}</strong>).{' '}
                      </>
                    )}
                    For trips outside the city polygon boundary, please choose <strong>One-Way</strong>.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setTripType('One-way');
                  }}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-lg text-xs transition-all shadow-2xs whitespace-nowrap cursor-pointer self-start sm:self-auto flex items-center gap-1.5"
                >
                  <span>Switch to One-Way</span>
                  <i className="fas fa-arrow-right text-[10px]"></i>
                </button>
              </div>
            )}

            {/* Recommendation to choose Local Taxi for short intra-city trips on One-Way / Round-Trip */}
            {(tripType === 'One-way' || tripType === 'Round-Trip') && intraCityMatch?.isInsideSameCity && fromAddress.trim() && toAddress.trim() && (
              <div className="mb-3.5 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black flex-shrink-0 text-xs">
                    🚕
                  </span>
                  <span>
                    <strong>Intra-City Trip Detected ({fromAddress.split(',')[0]} ➔ {toAddress.split(',')[0]}):</strong> Both locations are within the <strong>{intraCityMatch.cityName}</strong> city zone. Please choose <strong>Local Taxi</strong> for lower per-KM city rates and ₹0 advance payment!
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setTripType('Local-taxi');
                  }}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-lg text-xs transition-all shadow-2xs whitespace-nowrap cursor-pointer self-start sm:self-auto flex items-center gap-1.5"
                >
                  <span>Switch to Local Taxi</span>
                  <i className="fas fa-arrow-right text-[10px]"></i>
                </button>
              </div>
            )}

            {/* Out-of-Boundary Alert for One-Way, Round-Trip & Local Duty */}
            {(tripType === 'One-way' || tripType === 'Round-Trip' || tripType === 'Local-Duty') && outstationBoundaryMatch && !outstationBoundaryMatch.isInside && fromAddress.trim() && (
              <div className="mb-3.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 text-xs flex items-center gap-2.5 shadow-2xs">
                <i className="fas fa-circle-exclamation text-rose-600 text-base flex-shrink-0"></i>
                <div className="flex-1">
                  <strong>Pickup Outside Operational Boundary:</strong> {outstationBoundaryMatch.message}
                </div>
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">PICKUP TIME</label>
                  <button
                    type="button"
                    onClick={() => {
                      const nowTime = getCurrentTimeString();
                      setPickupTime(nowTime);
                      const todayStr = new Date().toISOString().split('T')[0];
                      if (!pickupDate || pickupDate < todayStr) {
                        setPickupDate(todayStr);
                      }
                    }}
                    className="text-[10px] font-bold text-[#008CFF] hover:text-[#0070cc] flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded bg-blue-50 hover:bg-blue-100"
                    title="Set to current time"
                  >
                    <i className="fas fa-bolt text-amber-500"></i> Set to Now
                  </button>
                </div>
                <div className="relative">
                  <i className="fas fa-clock absolute left-4 top-1/2 -translate-y-1/2 text-[#008CFF] text-sm pointer-events-none"></i>
                  <input
                    type="time"
                    className="agni-input w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 outline-none cursor-pointer focus:border-[#008CFF] focus:bg-white focus:ring-4 focus:ring-[#008cff]/5 transition-all"
                    value={convert12hTo24hInput(pickupTime)}
                    onChange={(e) => {
                      if (e.target.value) {
                        setPickupTime(convert24hTo12h(e.target.value));
                      }
                    }}
                  />
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
                    <i className="fas fa-clock absolute left-4 top-1/2 -translate-y-1/2 text-[#008CFF] text-sm pointer-events-none"></i>
                    <input
                      type="time"
                      className="agni-input w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 outline-none cursor-pointer focus:border-[#008CFF] focus:bg-white focus:ring-4 focus:ring-[#008cff]/5 transition-all"
                      value={convert12hTo24hInput(returnTime)}
                      onChange={(e) => {
                        if (e.target.value) {
                          setReturnTime(convert24hTo12h(e.target.value));
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* CTA Button + Trust Bullet Points */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-4 bg-[#F5A623] hover:bg-[#e09612] text-slate-950 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition shadow-lg shadow-amber-500/20 hover:shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                disabled={loading}
              >
                {loading ? (
                  <><i className="fas fa-circle-notch fa-spin"></i> Searching Available Cabs...</>
                ) : (
                  <>
                    <span>CHECK AVAILABLE CABS &amp; FARES</span>
                    <i className="fas fa-arrow-right text-xs"></i>
                  </>
                )}
              </button>

              <div className="grid grid-cols-3 gap-2 pt-4 mt-4 border-t border-slate-100 text-center text-3xs sm:text-2xs font-bold text-slate-500">
                <div className="flex items-center justify-center gap-1.5">
                  <i className="fas fa-check-circle text-emerald-500"></i> Free Cancellation
                </div>
                <div className="flex items-center justify-center gap-1.5">
                  <i className="fas fa-check-circle text-emerald-500"></i> AC Guaranteed
                </div>
                <div className="flex items-center justify-center gap-1.5">
                  <i className="fas fa-check-circle text-emerald-500"></i> 24/7 Helpline
                </div>
              </div>
            </div>
              </>
            )}
          </form>
        </div>

        {/* Mobile Trust Badges (Shown below the booking box on mobile screens) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:hidden gap-2 mt-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center backdrop-blur-sm">
            <div className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Outstation From</div>
            <div className="text-sm font-black text-amber-400 mt-0.5">₹1,599</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center backdrop-blur-sm">
            <div className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Rating</div>
            <div className="text-sm font-black text-emerald-400 mt-0.5 flex items-center justify-center gap-1">
              <i className="fas fa-star text-[10px]"></i> 4.9/5
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center backdrop-blur-sm">
            <div className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Verified Drivers</div>
            <div className="text-sm font-black text-white mt-0.5">100% Vetted</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center backdrop-blur-sm">
            <div className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Live Support</div>
            <div className="text-sm font-black text-sky-400 mt-0.5">24x7 Helpline</div>
          </div>
        </div>

      </div>
    </div>
  </div>
</section>

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
          {POPULAR_ROUTES.map((route, i) => {
            const slug = `${route.from.toLowerCase()}-to-${route.to.toLowerCase()}-cabs`;
            return (
              <Link
                key={i}
                to={`/cabs/${slug}`}
                className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-sky-300 transition-all duration-200 cursor-pointer flex flex-col justify-between group no-underline text-inherit"
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
                  <span>View Route & Fares</span>
                  <i className="fas fa-chevron-right text-[9px]"></i>
                </div>
              </Link>
            );
          })}
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