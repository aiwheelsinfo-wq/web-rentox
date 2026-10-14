import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { getRouteBySlug, POPULAR_ROUTES } from '../data/popularRoutes';

const RoutePage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const {
    setFromAddress,
    setToAddress,
    setTripType,
    setPickupDate,
    setPickupTime,
    setFromLat,
    setFromLng,
    setToLat,
    setToLng,
    isLoggedIn
  } = useContext(AppContext);

  const route = getRouteBySlug(slug);

  const [selectedType, setSelectedType] = useState('One-way');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('10:00 AM');
  const [openFaq, setOpenFaq] = useState(0);

  // Dynamic Google SEO & Schema.org injection
  useEffect(() => {
    if (!route) return;

    // 1. Dynamic Page Title & Meta Description
    document.title = `Book ${route.fromShort} to ${route.toShort} Cabs @ ₹${route.startingFare.toLocaleString('en-IN')} | Rentox Car Rental`;
    
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = `Book affordable one-way & round-trip cabs from ${route.fromShort} to ${route.toShort} starting at ₹${route.startingFare}. AC cabs, verified drivers, zero cancellation fees. Instant booking with Rentox.`;

    // 2. Schema.org JSON-LD: TaxiService + FAQPage + Breadcrumbs
    const schemaScriptId = 'route-seo-schema-jsonld';
    let existingScript = document.getElementById(schemaScriptId);
    if (!existingScript) {
      existingScript = document.createElement('script');
      existingScript.id = schemaScriptId;
      existingScript.type = 'application/ld+json';
      document.head.appendChild(existingScript);
    }

    const schemaData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "TaxiService",
          "name": `${route.fromShort} to ${route.toShort} Cab Booking`,
          "provider": {
            "@type": "AutoRental",
            "name": "Rentox Car Rental",
            "url": "https://www.rentox.co.in",
            "telephone": "+91-9847267465"
          },
          "serviceType": "Intercity One-Way & Round-Trip Taxi",
          "areaServed": [route.fromShort, route.toShort],
          "offers": {
            "@type": "AggregateOffer",
            "priceCurrency": "INR",
            "lowPrice": route.startingFare,
            "offerCount": route.carFares.length,
            "availability": "https://schema.org/InStock"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "reviewCount": "1280",
            "bestRating": "5",
            "worstRating": "1"
          }
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://www.rentox.co.in/"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Intercity Cabs",
              "item": "https://www.rentox.co.in/#popular-routes"
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": `${route.fromShort} to ${route.toShort} Cabs`,
              "item": `https://www.rentox.co.in/cabs/${route.slug}`
            }
          ]
        },
        {
          "@type": "FAQPage",
          "mainEntity": route.faqs.map(f => ({
            "@type": "Question",
            "name": f.q,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": f.a
            }
          }))
        }
      ]
    };

    existingScript.textContent = JSON.stringify(schemaData);

    return () => {
      // Restore default title on unmount
      document.title = 'Rentox Car Rental — Book Outstation Cabs & Taxis Online';
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
    };
  }, [route]);

  if (!route) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 font-sans py-16">
        <div className="max-w-md w-full bg-white text-center rounded-3xl p-8 border border-slate-200 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center text-2xl mx-auto mb-4">
            <i className="fas fa-route"></i>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Route Not Found</h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            We operate outstation and local cabs across all major cities in Maharashtra, Kerala, and South India. Search your cities directly on the homepage!
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 w-full bg-[#1E3A8A] text-white py-3 rounded-xl text-xs font-bold hover:bg-[#172554] transition shadow-sm"
          >
            Go to Cab Booking
          </button>
        </div>
      </div>
    );
  }

  const handleBookNow = (carType) => {
    // Populate AppContext with this route's coordinates and addresses
    setFromAddress(route.fromAddress);
    setToAddress(route.toAddress);
    setTripType(selectedType);
    setPickupDate(date);
    setPickupTime(time);

    if (route.fromLat && route.fromLng) {
      setFromLat(route.fromLat);
      setFromLng(route.fromLng);
    }
    if (route.toLat && route.toLng) {
      setToLat(route.toLat);
      setToLng(route.toLng);
    }

    if (!isLoggedIn) {
      navigate('/profile?redirect=/results');
    } else {
      navigate('/results');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-20">
      
      {/* 1. TOP BREADCRUMB & HERO */}
      <section className="bg-[#1C1F26] text-white pt-8 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-slate-400 mb-6 font-medium">
            <Link to="/" className="hover:text-amber-400 transition">Home</Link>
            <span>/</span>
            <Link to="/" className="hover:text-amber-400 transition">Intercity Cabs</Link>
            <span>/</span>
            <span className="text-amber-400 font-bold">{route.fromShort} to {route.toShort}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Heading & Key Value Props */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-3xs font-black uppercase tracking-wider mb-4">
                <i className="fas fa-shield-alt text-amber-400"></i>
                Guaranteed Lowest One-Way Fare
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                {route.fromShort} to {route.toShort} <span className="text-amber-400">Cab Booking</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 mt-4 leading-relaxed max-w-2xl font-normal">
                {route.tagline}. Travel comfortably with verified professional chauffeurs, sanitized AC vehicles, and transparent billing.
              </p>

              {/* Quick Trip Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center backdrop-blur-sm">
                  <div className="text-3xs text-slate-400 uppercase font-bold tracking-wider">Distance</div>
                  <div className="text-base sm:text-lg font-black text-white mt-0.5">~{route.distanceKm} km</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center backdrop-blur-sm">
                  <div className="text-3xs text-slate-400 uppercase font-bold tracking-wider">Travel Time</div>
                  <div className="text-base sm:text-lg font-black text-white mt-0.5">{route.durationHours}</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center backdrop-blur-sm">
                  <div className="text-3xs text-slate-400 uppercase font-bold tracking-wider">Starting At</div>
                  <div className="text-base sm:text-lg font-black text-amber-400 mt-0.5">₹{route.startingFare}</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center backdrop-blur-sm">
                  <div className="text-3xs text-slate-400 uppercase font-bold tracking-wider">Customer Rating</div>
                  <div className="text-base sm:text-lg font-black text-emerald-400 mt-0.5 flex items-center justify-center gap-1">
                    <i className="fas fa-star text-xs"></i> 4.9/5
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Instant Booking Box */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 text-slate-800">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                  <div className="font-black text-sm text-slate-900 uppercase tracking-wide">
                    Instant Cab Booking
                  </div>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setSelectedType('One-way')}
                      className={`px-3 py-1 rounded-lg text-3xs font-extrabold transition ${
                        selectedType === 'One-way' ? 'bg-[#1E3A8A] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      One-Way
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedType('Round-Trip')}
                      className={`px-3 py-1 rounded-lg text-3xs font-extrabold transition ${
                        selectedType === 'Round-Trip' ? 'bg-[#1E3A8A] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Round-Trip
                    </button>
                  </div>
                </div>

                <div className="space-y-3.5">
                  {/* From City */}
                  <div>
                    <label className="block text-3xs font-black uppercase tracking-wider text-slate-500 mb-1">
                      Pickup City
                    </label>
                    <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-800">
                      <i className="fas fa-circle-dot text-emerald-500 text-xs"></i>
                      <span className="truncate">{route.fromShort} ({route.fromAddress})</span>
                    </div>
                  </div>

                  {/* To City */}
                  <div>
                    <label className="block text-3xs font-black uppercase tracking-wider text-slate-500 mb-1">
                      Drop Destination
                    </label>
                    <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-800">
                      <i className="fas fa-location-dot text-rose-500 text-xs"></i>
                      <span className="truncate">{route.toShort} ({route.toAddress})</span>
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-3xs font-black uppercase tracking-wider text-slate-500 mb-1">
                        Travel Date
                      </label>
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-3xs font-black uppercase tracking-wider text-slate-500 mb-1">
                        Pickup Time
                      </label>
                      <select
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-amber-400"
                      >
                        <option value="06:00 AM">06:00 AM</option>
                        <option value="08:00 AM">08:00 AM</option>
                        <option value="10:00 AM">10:00 AM</option>
                        <option value="12:00 PM">12:00 PM</option>
                        <option value="02:00 PM">02:00 PM</option>
                        <option value="04:00 PM">04:00 PM</option>
                        <option value="06:00 PM">06:00 PM</option>
                        <option value="08:00 PM">08:00 PM</option>
                        <option value="10:00 PM">10:00 PM</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleBookNow()}
                    className="w-full mt-2 bg-[#F5A623] hover:bg-amber-500 text-slate-900 font-black text-xs py-3.5 rounded-xl uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <span>Check Available Cabs & Fares</span>
                    <i className="fas fa-arrow-right text-xs"></i>
                  </button>

                  <div className="flex items-center justify-center gap-4 text-3xs text-slate-500 pt-1">
                    <span><i className="fas fa-check-circle text-emerald-500 mr-1"></i>Free Cancellation</span>
                    <span><i className="fas fa-check-circle text-emerald-500 mr-1"></i>AC Guaranteed</span>
                    <span><i className="fas fa-check-circle text-emerald-500 mr-1"></i>24/7 Helpline</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FARES & VEHICLE CHOICES TABLE */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-5 mb-6">
            <div>
              <span className="text-3xs font-black uppercase tracking-wider text-amber-500">Transparent Pricing</span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {route.fromShort} to {route.toShort} Cab Options & Fares
              </h2>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Highway: <span className="font-bold text-slate-800">{route.highway}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {route.carFares.map((car, idx) => (
              <div
                key={idx}
                className="bg-slate-50/70 border border-slate-200 rounded-2xl p-5 hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-200/60 text-slate-700 text-3xs font-extrabold uppercase">
                      {car.type}
                    </span>
                    <span className="text-3xs text-slate-500 font-semibold flex items-center gap-1">
                      <i className="fas fa-user-group text-slate-400"></i> {car.seats} Seats
                    </span>
                  </div>

                  <h3 className="font-black text-slate-900 text-base">{car.type}</h3>
                  <p className="text-3xs text-slate-500 mt-0.5">{car.models}</p>

                  <div className="my-5">
                    <span className="text-3xs text-slate-400 uppercase font-bold block">Estimated Fare</span>
                    <span className="text-2xl font-black text-slate-900">₹{car.fare.toLocaleString('en-IN')}</span>
                    <span className="text-3xs text-slate-400 ml-1">all inclusive</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleBookNow(car.type)}
                  className="w-full py-2.5 rounded-xl bg-[#1E3A8A] group-hover:bg-[#172554] text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5"
                >
                  <span>Select {car.type}</span>
                  <i className="fas fa-chevron-right text-3xs"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. ROUTE OVERVIEW & TRAVEL GUIDE */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-4">
              About the {route.fromShort} to {route.toShort} Journey
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed font-normal">
              {route.overview}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center text-sm shrink-0">
                  <i className="fas fa-road"></i>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Road Quality</h4>
                  <p className="text-3xs text-slate-500 mt-0.5">Smooth 4-to-6 lane highways with convenient food plazas.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center text-sm shrink-0">
                  <i className="fas fa-clock"></i>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Punctuality</h4>
                  <p className="text-3xs text-slate-500 mt-0.5">Drivers arrive 15 minutes before scheduled pickup.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center text-sm shrink-0">
                  <i className="fas fa-wallet"></i>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Zero Surge Pricing</h4>
                  <p className="text-3xs text-slate-500 mt-0.5">Lock in your fare upfront without dynamic surge charges.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Why Book with Rentox */}
          <div className="lg:col-span-4 bg-[#1C1F26] text-white rounded-3xl p-6 sm:p-7 shadow-sm">
            <h3 className="text-base font-black text-white tracking-tight mb-4 flex items-center gap-2">
              <i className="fas fa-shield-heart text-amber-400"></i>
              Why Choose Rentox?
            </h3>
            
            <ul className="space-y-4 text-xs">
              <li className="flex items-start gap-3">
                <i className="fas fa-circle-check text-emerald-400 mt-0.5"></i>
                <div>
                  <strong className="text-white block">Dedicated One-Way Fares:</strong>
                  <span className="text-slate-400 text-3xs">Pay only for one-way distance without forced round-trip rates.</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <i className="fas fa-circle-check text-emerald-400 mt-0.5"></i>
                <div>
                  <strong className="text-white block">Verified Highway Drivers:</strong>
                  <span className="text-slate-400 text-3xs">Police-verified drivers with extensive intercity experience.</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <i className="fas fa-circle-check text-emerald-400 mt-0.5"></i>
                <div>
                  <strong className="text-white block">Clean, Sanitized Fleet:</strong>
                  <span className="text-slate-400 text-3xs">Daily sanitized AC vehicles with generous luggage space.</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <i className="fas fa-circle-check text-emerald-400 mt-0.5"></i>
                <div>
                  <strong className="text-white block">24/7 Live Assistance:</strong>
                  <span className="text-slate-400 text-3xs">Customer helpline and live trip tracking for family safety.</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 4. SEO FAQS ACCORDION */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-3xs font-black uppercase tracking-wider text-amber-500">Got Questions?</span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
              Frequently Asked Questions ({route.fromShort} to {route.toShort})
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {route.faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="border border-slate-200 rounded-2xl overflow-hidden transition"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between bg-slate-50/50 hover:bg-slate-100/60 transition"
                  >
                    <span className="font-bold text-xs sm:text-sm text-slate-900 pr-4">{faq.q}</span>
                    <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'} text-slate-400 text-xs shrink-0`}></i>
                  </button>
                  {isOpen && (
                    <div className="px-5 py-4 bg-white text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. EXPLORE OTHER POPULAR ROUTES (INTERNAL LINKING FOR GOOGLE BOT) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="text-center mb-6">
          <h3 className="text-lg font-black text-slate-900 tracking-tight">Explore More Popular Intercity Routes</h3>
          <p className="text-xs text-slate-500 mt-1">Click any route to check live cab availability and transparent prices</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {POPULAR_ROUTES.filter(r => r.slug !== route.slug).map((r, i) => (
            <Link
              key={i}
              to={`/cabs/${r.slug}`}
              className="bg-white p-3.5 rounded-2xl border border-slate-200 hover:border-amber-400 hover:shadow-xs transition group block text-left"
            >
              <div className="text-xs font-black text-slate-900 group-hover:text-amber-600 transition flex items-center justify-between">
                <span>{r.fromShort} → {r.toShort}</span>
                <i className="fas fa-arrow-right text-3xs text-slate-300 group-hover:text-amber-500"></i>
              </div>
              <div className="text-3xs text-slate-500 mt-1">
                From <strong className="text-slate-800">₹{r.startingFare}</strong> · {r.distanceKm} km
              </div>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
};

export default RoutePage;
