import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import { endpoints } from '../config/api';

// Fallback high-quality illustrative car images from Unsplash to look premium
const CAR_IMAGES = {
  'Hatchback': 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=400&q=80',
  'Sedan': 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&q=80',
  'Ertiga': 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=400&q=80',
  'Innova': '/innova_crysta.png',
  'SUV': 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&q=80'
};

const CarResults = () => {
  const navigate = useNavigate();
  const {
    tripType,
    fromAddress,
    toAddress,
    pickupDate,
    pickupTime,
    returnDate,
    tempBookingId,
    setSelectedCar,
    phoneNumber,
    fromLat,
    fromLng,
    toLat,
    toLng,
  } = useContext(AppContext);

  const [cars, setCars] = useState([]);
  const [filteredCars, setFilteredCars] = useState([]);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('All');
  const [sortBy, setSortBy] = useState('none');
  const [maxPriceFilter, setMaxPriceFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [distanceKm, setDistanceKm] = useState(null);   // null = still checking
  const [distChecked, setDistChecked] = useState(false);  // have we finished the check?

  // â”€â”€ Google Distance Matrix check (mirrors Flutter _getDistanceFromGoogle) â”€â”€
  useEffect(() => {
    if (tripType === 'Local-Duty') {
      // Local Duty has no distance restriction
      setDistanceKm(999);
      setDistChecked(true);
      return;
    }
    if (!fromAddress || !toAddress) {
      setDistChecked(true);
      return;
    }
    // Wait for Google Maps API to be available (it's loaded in index.html)
    const checkGoogle = () => {
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
            origins:      [origin],
            destinations: [destination],
            travelMode:   window.google.maps.TravelMode.DRIVING,
            unitSystem:   window.google.maps.UnitSystem.METRIC,
          },
          (data, status) => {
            try {
              if (
                status === 'OK' &&
                data.rows.length > 0 &&
                data.rows[0].elements[0].status === 'OK'
              ) {
                const meters = data.rows[0].elements[0].distance.value;
                const km = meters / 1000;
                setDistanceKm(km);
              } else {
                // Can't determine — allow booking (don't block on API failure)
                setDistanceKm(999);
              }
            } catch (_) {
              setDistanceKm(999);
            }
            setDistChecked(true);
          }
        );
      } else {
        // Google not loaded yet, retry in 300ms
        setTimeout(checkGoogle, 300);
      }
    };
    checkGoogle();
  }, [fromAddress, toAddress, tripType, fromLat, fromLng, toLat, toLng]);

  // Local Taxi City Boundary & Polygon Limit
  const isLocalTaxi = (tripType || '').toLowerCase().replace(/[-_]/g, ' ').includes('local taxi');
  const [activeBoundaries, setActiveBoundaries] = useState([]);
  const [outOfBoundaryInfo, setOutOfBoundaryInfo] = useState(null);

  // Fetch active city boundary polygons from AWS
  useEffect(() => {
    let isMounted = true;
    const fetchBoundaries = async () => {
      try {
        const res = await axios.get('https://agnicarrental.com/2025/get_city_boundaries.php?action=active_only');
        if (isMounted && res.data && res.data.cities) {
          setActiveBoundaries(res.data.cities);
        }
      } catch (e) {
        console.warn('Failed to load active boundaries', e);
      }
    };
    if (isLocalTaxi) {
      fetchBoundaries();
    }
    return () => { isMounted = false; };
  }, [isLocalTaxi]);

  // Point in polygon mathematical ray-casting algorithm
  const isPointInPolygon = (lat, lng, polygon) => {
    if (!polygon || !Array.isArray(polygon) || polygon.length < 3) return true;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lat, yi = polygon[i].lng;
      const xj = polygon[j].lat, yj = polygon[j].lng;
      const intersect = ((yi > lng) !== (yj > lng)) &&
          (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const isLocationInCity = (lat, lng, city) => {
    if (!lat || !lng) return false;
    if (city.polygon_coords && Array.isArray(city.polygon_coords) && city.polygon_coords.length >= 3) {
      return isPointInPolygon(lat, lng, city.polygon_coords);
    }
    return (
      lat >= parseFloat(city.min_lat) &&
      lat <= parseFloat(city.max_lat) &&
      lng >= parseFloat(city.min_lng) &&
      lng <= parseFloat(city.max_lng)
    );
  };

  // Validate Local Taxi pickup & drop coordinates against active city polygons
  useEffect(() => {
    if (!isLocalTaxi || activeBoundaries.length === 0) {
      setOutOfBoundaryInfo(null);
      return;
    }

    if (distanceKm !== null && distanceKm > 80) {
      setOutOfBoundaryInfo({
        isOut: true,
        reason: `Your route is ${Math.round(distanceKm)} KM, which exceeds the Local Taxi city limit (80 KM).`
      });
      return;
    }

    const validateCoords = (fLat, fLng, tLat, tLng) => {
      let matchedCity = null;
      // 1. Find city for pickup
      for (const city of activeBoundaries) {
        if (city.status === 'active' && isLocationInCity(fLat, fLng, city)) {
          matchedCity = city;
          break;
        }
      }

      if (!matchedCity) {
        setOutOfBoundaryInfo({
          isOut: true,
          reason: `Pickup location "${fromAddress.split(',')[0]}" is outside active Local Taxi city boundaries.`
        });
        return;
      }

      // 2. Destination must also be in the same city polygon
      const isDropInside = isLocationInCity(tLat, tLng, matchedCity);
      if (!isDropInside) {
        setOutOfBoundaryInfo({
          isOut: true,
          cityName: matchedCity.city_name,
          reason: `Destination "${toAddress.split(',')[0]}" is outside the active ${matchedCity.city_name} Local Taxi polygon boundary.`
        });
        return;
      }

      setOutOfBoundaryInfo(null);
    };

    if (fromLat && fromLng && toLat && toLng) {
      validateCoords(parseFloat(fromLat), parseFloat(fromLng), parseFloat(toLat), parseFloat(toLng));
    } else if (window.google && window.google.maps && fromAddress && toAddress) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: fromAddress }, (fRes, fStat) => {
        if (fStat === 'OK' && fRes[0]) {
          const fl = fRes[0].geometry.location.lat();
          const fg = fRes[0].geometry.location.lng();
          geocoder.geocode({ address: toAddress }, (tRes, tStat) => {
            if (tStat === 'OK' && tRes[0]) {
              const tl = tRes[0].geometry.location.lat();
              const tg = tRes[0].geometry.location.lng();
              validateCoords(fl, fg, tl, tg);
            }
          });
        }
      });
    }
  }, [isLocalTaxi, fromLat, fromLng, toLat, toLng, fromAddress, toAddress, distanceKm, activeBoundaries]);

  const isLocalTaxiBlocked = isLocalTaxi && (outOfBoundaryInfo?.isOut || (distanceKm !== null && distanceKm > 80));
  const isBelowMinDistance = false;

  useEffect(() => {
    if (!isLocalTaxiBlocked) {
      fetchCars();
    }
  }, [tripType, tempBookingId, distanceKm, isLocalTaxiBlocked]);

  const fetchCars = async () => {
    if (isLocalTaxi && distanceKm === null) {
      // Wait for distanceKm to be resolved by Google Maps API first
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const normalizedTripType = (tripType === 'Local-taxi' || tripType === 'Local Taxi') ? 'Local Taxi' : tripType;
      let url = `${endpoints.selectCarCostList}?tripType=${encodeURIComponent(normalizedTripType)}`;
      if (distanceKm && distanceKm > 0 && distanceKm !== 999) {
        url += `&distance=${encodeURIComponent(Math.round(distanceKm))}`;
      }
      if (fromAddress) {
        url += `&fromAddress=${encodeURIComponent(fromAddress)}`;
      }
      if (toAddress) {
        url += `&toAddress=${encodeURIComponent(toAddress)}`;
      }
      if (pickupDate) {
        url += `&pickupDate=${encodeURIComponent(pickupDate)}`;
      }
      if (pickupTime) {
        url += `&pickupTime=${encodeURIComponent(pickupTime)}`;
      }
      if (fromLat && fromLng) {
        url += `&fromLat=${fromLat}&fromLng=${fromLng}`;
      }
      if (toLat && toLng) {
        url += `&toLat=${toLat}&toLng=${toLng}`;
      }

      const response = await axios.get(url);
      if (Array.isArray(response.data)) {
        setCars(response.data);
        setFilteredCars(response.data);
      } else {
        setErrorMsg('Invalid response received from the server.');
      }
    } catch (e) {
      setErrorMsg('Failed to load cars list. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  // Unified filter and sort effect
  useEffect(() => {
    let result = [...cars];

    // 1. Filter by Car Type
    if (selectedTypeFilter !== 'All') {
      result = result.filter(c => {
        const carTypeLower = c.carType.toLowerCase();
        if (selectedTypeFilter === 'Hatchback') return carTypeLower.includes('hatchback');
        if (selectedTypeFilter === 'Sedan') return carTypeLower.includes('sedan');
        if (selectedTypeFilter === 'SUV') return carTypeLower.includes('ertiga') || carTypeLower.includes('innova') || carTypeLower.includes('suv');
        return true;
      });
    }

    // 2. Filter by Max Price
    if (maxPriceFilter !== '') {
      const maxPrice = parseFloat(maxPriceFilter);
      result = result.filter(c => {
        const price = tripType === 'Round-Trip' ? parseFloat(c.kmRate) : parseInt(c.discounted_price, 10);
        return price <= maxPrice;
      });
    }

    // 3. Sort by Price
    if (sortBy === 'price-asc') {
      result.sort((a, b) => {
        const priceA = tripType === 'Round-Trip' ? parseFloat(a.kmRate) : parseInt(a.discounted_price, 10);
        const priceB = tripType === 'Round-Trip' ? parseFloat(b.kmRate) : parseInt(b.discounted_price, 10);
        return priceA - priceB;
      });
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => {
        const priceA = tripType === 'Round-Trip' ? parseFloat(a.kmRate) : parseInt(a.discounted_price, 10);
        const priceB = tripType === 'Round-Trip' ? parseFloat(b.kmRate) : parseInt(b.discounted_price, 10);
        return priceB - priceA;
      });
    }

    setFilteredCars(result);
  }, [cars, selectedTypeFilter, sortBy, maxPriceFilter, tripType]);

  const handleFilterChange = (type) => {
    setSelectedTypeFilter(type);
  };

  const selectCarAndBook = (car) => {
    setSelectedCar(car);
    navigate('/invoice');
  };

  const getCarModelPlaceholder = (carType) => {
    if (carType.toLowerCase().includes('hatchback')) return 'Swift, WagonR or similar';
    if (carType.toLowerCase().includes('sedan')) return 'Etios, DZire or similar';
    if (carType.toLowerCase().includes('ertiga')) return 'Ertiga, Kia Carens or similar';
    if (carType.toLowerCase().includes('innova')) return 'Innova Crysta, Xylo or similar';
    return 'Premium outstation cab';
  };

  const getCarImage = (carType) => {
    const type = carType.toLowerCase();
    if (type.includes('hatchback')) return CAR_IMAGES['Hatchback'];
    if (type.includes('sedan')) return CAR_IMAGES['Sedan'];
    if (type.includes('ertiga')) return CAR_IMAGES['Ertiga'];
    if (type.includes('innova')) return CAR_IMAGES['Innova'];
    return CAR_IMAGES['SUV'];
  };

  const getSeats = (carType) => {
    const type = carType.toLowerCase();
    if (type.includes('hatchback') || type.includes('sedan')) return '4 Seats';
    return '6-7 Seats';
  };

  const getLuggage = (carType) => {
    const type = carType.toLowerCase();
    if (type.includes('hatchback') || type.includes('sedan')) return '2 Bags';
    return '4 Bags';
  };

  const getPriceRange = () => {
    if (cars.length === 0) return { min: 0, max: 10000 };
    const prices = cars.map(c => tripType === 'Round-Trip' ? parseFloat(c.kmRate) : parseInt(c.discounted_price, 10));
    return { min: Math.min(...prices), max: Math.max(...prices) };
  };
  const { min: minPriceLimit, max: maxPriceLimit } = getPriceRange();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Search Summary */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-brandBlue/10 text-brandBlue px-2.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide">
              {tripType}
            </span>
            {distanceKm && distanceKm > 0 && distanceKm !== 999 && (
              <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                <i className="fas fa-route text-emerald-600 text-[11px]"></i>
                <span>{Math.round(distanceKm)} KM Distance</span>
              </span>
            )}
          </div>
          <h2 className="text-lg font-extrabold text-brandCharcoal mt-2 flex items-center gap-2">
            <span>{fromAddress.split(',')[0]}</span>
            {tripType !== 'Local-Duty' && (
              <>
                <i className="fas fa-arrow-right text-gray-400 text-xs"></i>
                <span>{toAddress.split(',')[0]}</span>
              </>
            )}
          </h2>
          <p className="text-gray-400 text-xs mt-1 flex items-center gap-2 flex-wrap">
            <span><i className="fas fa-calendar-alt mr-1 text-slate-400"></i> {pickupDate} at {pickupTime}</span>
            {tripType === 'Round-Trip' && ` to ${returnDate}`}
            {distanceKm && distanceKm > 0 && distanceKm !== 999 && (
              <>
                <span>•</span>
                <span className="text-slate-600 font-semibold"><i className="fas fa-road mr-1 text-slate-400"></i> {Math.round(distanceKm)} KM Distance</span>
              </>
            )}
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="text-brandBlue hover:text-blue-700 font-bold text-xs flex items-center gap-1.5 border border-brandBlue/30 hover:border-brandBlue/70 px-4 py-2 rounded-xl transition-all"
        >
          <i className="fas fa-edit"></i> Modify Search
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-1/4 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-fit">
          {/* Car type filters */}
          <h3 className="font-extrabold text-sm text-brandCharcoal uppercase tracking-wider border-b border-gray-100 pb-4 mb-4">
            Filter Cabs
          </h3>
          <div className="flex flex-col gap-2.5">
            {['All', 'Hatchback', 'Sedan', 'SUV'].map((filter) => (
              <button
                key={filter}
                onClick={() => handleFilterChange(filter)}
                className={`text-left px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  selectedTypeFilter === filter
                    ? 'bg-brandBlue text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {filter === 'All' && <i className="fas fa-list mr-2"></i>}
                {filter === 'Hatchback' && <i className="fas fa-car-rear mr-2"></i>}
                {filter === 'Sedan' && <i className="fas fa-car-side mr-2"></i>}
                {filter === 'SUV' && <i className="fas fa-truck-pickup mr-2"></i>}
                {filter}
              </button>
            ))}
          </div>

          {/* Sort By Price options */}
          <div className="mt-6 border-t border-gray-100 pt-5">
            <h4 className="font-extrabold text-[10px] text-gray-400 uppercase tracking-widest mb-3.5">
              Sort By Price
            </h4>
            <div className="flex flex-col gap-2">
              {[
                { value: 'none', label: 'Default Sorting', icon: 'fa-sort' },
                { value: 'price-asc', label: 'Price: Low to High', icon: 'fa-sort-amount-up' },
                { value: 'price-desc', label: 'Price: High to Low', icon: 'fa-sort-amount-down' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value)}
                  className={`text-left px-4 py-2.5 rounded-xl text-2xs font-bold transition-all flex items-center gap-2 ${
                    sortBy === option.value
                      ? 'bg-brandBlue/10 text-brandBlue'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <i className={`fas ${option.icon} text-3xs`}></i>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Slider */}
          {cars.length > 0 && (
            <div className="mt-6 border-t border-gray-100 pt-5">
              <h4 className="font-extrabold text-[10px] text-gray-400 uppercase tracking-widest mb-3.5">
                Max Price
              </h4>
              <div className="flex items-center justify-between text-xs font-bold text-brandCharcoal mb-2">
                <span>{"\u20B9"}{minPriceLimit}</span>
                <span className="text-brandBlue bg-brandBlue/10 px-2 py-0.5 rounded">
                  Max: {"\u20B9"}{maxPriceFilter || maxPriceLimit}
                </span>
              </div>
              <input
                type="range"
                min={minPriceLimit}
                max={maxPriceLimit}
                value={maxPriceFilter || maxPriceLimit}
                onChange={(e) => setMaxPriceFilter(e.target.value)}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brandBlue"
              />
              <button
                onClick={() => setMaxPriceFilter('')}
                className="w-full mt-3 text-center text-3xs text-gray-400 hover:text-brandBlue font-bold uppercase tracking-wider transition-colors"
              >
                Reset Price Limit
              </button>
            </div>
          )}
        </aside>

        {/* Cars List */}
        <main className="w-full lg:w-3/4 flex flex-col gap-6">
          {/* Local Taxi Out of Boundary / Outstation Route Notice */}
          {isLocalTaxiBlocked ? (
            <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-8 sm:p-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mb-4 text-amber-600 text-2xl">
                <i className="fas fa-map-location-dot"></i>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-3xs font-extrabold uppercase tracking-wider mb-2">
                Outside Local Taxi Boundary
              </div>
              <h3 className="text-lg font-black text-brandCharcoal mb-2">
                Out of City Boundary Limit
              </h3>
              <p className="text-gray-600 text-xs font-medium max-w-md leading-relaxed mb-4">
                {outOfBoundaryInfo?.reason || `Local Taxi is reserved strictly for short city rides within active city boundary polygons. Your route is outside this zone.`}
              </p>
              <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl p-3.5 max-w-md w-full text-xs text-amber-950 font-semibold mb-6">
                👉 Please book our dedicated <strong>One-Way Outstation Cabs</strong> for highway drivers, verified luggage space, and outstation pricing.
              </div>
              <div className="flex gap-3 flex-wrap justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setTripType('One-way');
                  }}
                  className="bg-brandBlue hover:bg-blue-600 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <i className="fas fa-arrow-right"></i> View One-Way Cabs for this Route
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold text-xs px-5 py-3 rounded-xl transition-all cursor-pointer"
                >
                  Modify Search
                </button>
              </div>
            </div>
          ) : isBelowMinDistance ? (
            <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-5">
                <i className="fas fa-exclamation-triangle text-red-400 text-3xl"></i>
              </div>
              <h3 className="text-lg font-black text-red-500 mb-2">No Service Available</h3>
              <p className="text-gray-500 text-sm font-medium max-w-sm leading-relaxed mb-1">
                Distance between your pickup and drop is approximately <strong>{distanceKm} km</strong>, which is less than <strong>50 km</strong>.
              </p>
              <p className="text-gray-400 text-xs font-medium mb-6">
                One-Way and Round-Trip services are for outstation travel only. For short city rides, please use <strong>Local Taxi</strong> or <strong>Local Duty</strong>.
              </p>
              <div className="flex gap-3 flex-wrap justify-center">
                <button
                  onClick={() => navigate('/')}
                  className="bg-brandBlue text-white font-extrabold text-xs px-6 py-3 rounded-xl hover:bg-blue-600 transition-all shadow-sm flex items-center gap-2"
                >
                  <i className="fas fa-arrow-left"></i> Modify Search
                </button>
              </div>
              <p className="mt-6 text-3xs text-gray-300 font-semibold">
                Select "Local Duty" tab on the home page for trips within city limits.
              </p>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <i className="fas fa-spinner fa-spin text-brandBlue text-3xl"></i>
              <span className="text-sm font-bold text-gray-500 mt-4">Finding best fares for you...</span>
            </div>
          ) : errorMsg ? (
            <div className="bg-red-50 text-red-600 rounded-2xl p-6 text-center border border-red-100">
              <i className="fas fa-exclamation-circle text-2xl mb-2"></i>
              <p className="text-sm font-bold">{errorMsg}</p>
              <button
                onClick={fetchCars}
                className="mt-4 bg-brandBlue text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-blue-600 transition-all"
              >
                Retry Search
              </button>
            </div>
          ) : filteredCars.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
              <i className="fas fa-car-slash text-gray-300 text-4xl mb-4"></i>
              <p className="text-sm font-bold text-gray-500">No cabs available matching this filter.</p>
            </div>
          ) : (
            filteredCars.map((car, idx) => {
              const discountedPrice = parseInt(car.discounted_price, 10);
              const basePrice = parseInt(car.baseAmount, 10);
              const hasDiscount = car.discount_percentage > 0;

              return (
                <div 
                  key={idx} 
                  className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-brandBlue/30 hover:shadow-md transition-all flex flex-col md:flex-row items-center gap-6"
                >
                  {/* Car Image Preview */}
                  <div className="w-full md:w-1/4 rounded-xl overflow-hidden bg-gray-50 aspect-video relative flex items-center justify-center">
                    <img 
                      src={getCarImage(car.carType)} 
                      alt={car.carType} 
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Car Metadata */}
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-lg font-black text-brandCharcoal">{car.carType}</h3>
                    <p className="text-gray-400 text-xs font-semibold mt-1">
                      {getCarModelPlaceholder(car.carType)}
                    </p>

                    <div className="flex flex-wrap gap-2.5 justify-center md:justify-start mt-3">
                      <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-2xs font-extrabold flex items-center gap-1.5">
                        <i className="fas fa-couch text-gray-400"></i> {getSeats(car.carType)}
                      </span>
                      <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-2xs font-extrabold flex items-center gap-1.5">
                        <i className="fas fa-briefcase text-gray-400"></i> {getLuggage(car.carType)}
                      </span>
                      <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-2xs font-extrabold flex items-center gap-1.5">
                        <i className="fas fa-snowflake"></i> AC
                      </span>
                    </div>

                    {/* Included In Fare Summary */}
                    <div className="mt-4 bg-gray-50/50 rounded-xl p-3 text-2xs text-gray-500 border border-gray-100 flex flex-wrap gap-x-4 gap-y-1.5 justify-center md:justify-start">
                      <span><strong>Includes:</strong> {car.packageKm} Kms limit</span>
                      <span>• Extra Kms: {"\u20B9"}{car.extraKMAmount}/km</span>
                      {parseInt(car.driverAllowance) > 0 && (
                        <span>• Driver Allowance: Included</span>
                      )}
                      {parseFloat(car.tollCharge) > 0 && (
                        <span>• Toll: Included</span>
                      )}
                    </div>
                  </div>

                  {/* Fare and Actions */}
                  <div className="w-full md:w-1/4 text-center md:text-right flex flex-col items-center md:items-end border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                    {hasDiscount && tripType !== 'Round-Trip' && (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2.5 py-0.5 rounded-md text-3xs font-extrabold uppercase tracking-wide flex items-center gap-1 mb-1">
                        <i className="fas fa-tag text-emerald-500"></i> Save {Math.round(car.discount_percentage)}%
                      </span>
                    )}

                    <div className="mt-1 flex flex-col items-center md:items-end">
                      {tripType === 'Round-Trip' ? (
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-brandCharcoal">{"\u20B9"}{car.kmRate}</span>
                          <span className="text-xs text-gray-500 font-bold">/km</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-1.5 justify-center md:justify-end">
                            <i className="fas fa-tag text-[#E15B45] text-sm"></i>
                            <span className="text-2xl font-black text-brandCharcoal">
                              {"\u20B9"}{discountedPrice.toLocaleString('en-IN')}
                            </span>
                          </div>
                          {hasDiscount && (
                            <span className="text-xs text-rose-500/90 font-bold line-through mt-0.5">
                              {"\u20B9"}{basePrice.toLocaleString('en-IN')}
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    <p className="text-gray-400 text-3xs font-semibold mt-1">
                      {tripType === 'Round-Trip' 
                        ? `Min. ${car.kmPerDay || 250} km/day` 
                        : `Inclusive of ${car.gstPercent || 5}% GST${parseFloat(car.tollCharge) > 0 ? ' & Tolls' : ''}`}
                    </p>

                    <button
                      onClick={() => selectCarAndBook(car)}
                      className="mt-4 bg-brandBlue text-white hover:bg-blue-600 transition-all font-extrabold text-xs px-6 py-3 rounded-xl shadow-sm tracking-wider w-full cursor-pointer hover:shadow-md active:scale-95"
                    >
                      BOOK NOW
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </main>
      </div>
    </div>
  );
};

export default CarResults;
