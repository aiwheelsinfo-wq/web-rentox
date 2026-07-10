import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Font loading system matches Profile & History
const useTicketFonts = () => {
  useEffect(() => {
    if (document.getElementById('trip-ticket-fonts')) return;
    const link = document.createElement('link');
    link.id = 'trip-ticket-fonts';
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=IBM+Plex+Mono:wght@500;600&family=Inter:wght@400;600;700&display=swap';
    document.head.appendChild(link);
  }, []);
};

// Map route background pattern matches visuals
const routeMapBg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='340' height='150'%3E%3Cpath d='M-10,100 C50,25 100,25 160,75 C220,125 270,125 320,50 C350,6 380,6 380,6' fill='none' stroke='%23F5A623' stroke-width='3' stroke-dasharray='2 14' stroke-linecap='round' opacity='0.65'/%3E%3Ccircle cx='50' cy='42' r='4.5' fill='%23F5A623' opacity='0.9'/%3E%3Ccircle cx='200' cy='105' r='4.5' fill='%23F5A623' opacity='0.9'/%3E%3Ccircle cx='320' cy='50' r='5.5' fill='%23F5A623' opacity='0.9'/%3E%3C/svg%3E")`;
const glowBg =
  'radial-gradient(circle at 12% -15%, rgba(245,166,35,0.22), transparent 55%), radial-gradient(circle at 92% 130%, rgba(15,118,110,0.22), transparent 50%)';
const heroBgStyle = {
  backgroundColor: '#1C1F26',
  backgroundImage: `${glowBg}, ${routeMapBg}`,
  backgroundRepeat: 'no-repeat, repeat-x',
  backgroundPosition: 'center, center 70%',
  backgroundSize: 'cover, auto',
};

const pageBg = {
  backgroundColor: '#F7F4EE',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='340' height='150'%3E%3Cpath d='M-10,100 C50,25 100,25 160,75 C220,125 270,125 320,50 C350,6 380,6 380,6' fill='none' stroke='%23CBB98A' stroke-width='3' stroke-dasharray='2 14' stroke-linecap='round' opacity='0.35'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'repeat',
  backgroundAttachment: 'fixed',
  fontFamily: "'Inter', sans-serif"
};

const FAQ_DATA = [
  {
    category: 'Booking & Fares',
    icon: 'fa-calendar-check',
    items: [
      {
        q: 'How do I book a One-Way or Round-Trip cab?',
        a: 'Enter your pickup and drop locations on the home page, choose your travel date and pickup time, select your preferred cab (Hatchback, Sedan, SUV), fill in your personal details, and pay the 25% advance + 5% GST to secure your booking.'
      },
      {
        q: 'What is included in the Total Trip Fare for One-Way trips?',
        a: 'The One-Way fare is inclusive of the base travel charges, driver allowance (TA), toll charges, and GST. .'
      },
      {
        q: 'Why does Round-Trip only charge an advance amount?',
        a: 'Since round-trip final charges are calculated on the actual distance (km) traveled during the trip, we only charge a minimum daily limit advance (e.g. 250 km/day equivalent) at the time of booking. The rest is paid directly to the driver based on the final reading.'
      }
    ]
  },
  {
    category: 'Payments & Refunds',
    icon: 'fa-credit-card',
    items: [
      {
        q: 'What payment modes are accepted?',
        a: 'We accept all major debit cards, credit cards, UPI (Google Pay, PhonePe, Paytm), Netbanking, and mobile wallets processed securely via Razorpay.'
      },
      {
        q: 'How long does a refund take after cancellation?',
        a: 'Once a refund is approved, it is processed and credited to the original payment method within 3 to 7 business days depending on your bank.'
      }
    ]
  },
  {
    category: 'Cancellations',
    icon: 'fa-ban',
    items: [
      {
        q: 'Can I cancel my trip after booking?',
        a: 'Yes, you can cancel your trip directly from the "Trip Tracking" page. Free cancellations apply to Local Taxi rides. Outstation cancellations are subject to our tiered refund policy based on hours remaining before pickup.'
      },
      {
        q: 'What is the refund policy for outstation cancellations?',
        a: '• More than 48 Hours before pickup: 100% Refund\n• 24 to 48 Hours: 75% Refund\n• 12 to 24 Hours: 50% Refund\n• 6 to 12 Hours: 25% Refund\n• Less than 6 Hours: No Refund'
      }
    ]
  }
];

const Help = () => {
  useTicketFonts();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeAccordion, setActiveAccordion] = useState(null);

  const toggleAccordion = (index) => {
    setActiveAccordion(activeAccordion === index ? null : index);
  };

  // Flattened items for search filtering
  const allFaqs = FAQ_DATA.flatMap((cat, catIdx) => 
    cat.items.map((item, itemIdx) => ({
      ...item,
      category: cat.category,
      globalIndex: `${catIdx}-${itemIdx}`
    }))
  );

  const filteredFaqs = searchQuery.trim() === '' 
    ? allFaqs 
    : allFaqs.filter(faq => 
        faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
        faq.a.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <div className="min-h-screen" style={pageBg}>
      {/* Header band */}
      <div className="relative overflow-hidden px-4 sm:px-8 py-12" style={heroBgStyle}>
        <div className="max-w-4xl mx-auto relative text-center">
          <span
            className="inline-block text-[#F5A623] text-[10px] font-semibold tracking-[0.25em] uppercase mb-2"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            SUPPORT HUB
          </span>
          <h1
            className="text-3xl sm:text-4xl font-bold text-white tracking-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            How can we help you?
          </h1>
          <p className="text-[#9CA3AF] text-xs mt-2 max-w-md mx-auto">
            Find answers to commonly asked questions or contact our support team.
          </p>

          {/* Search bar inside header */}
          <div className="max-w-md mx-auto mt-6 relative">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input
              type="text"
              placeholder="Search for topics or questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white text-gray-800 rounded-2xl py-3.5 pl-11 pr-4 text-xs font-semibold outline-none shadow-md focus:ring-4 focus:ring-[#FDF3E1]"
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* FAQ Column */}
          <div className="md:col-span-2 space-y-6">
            <h2 className="text-lg font-bold text-[#1C1F26] uppercase tracking-wider" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Frequently Asked Questions
            </h2>

            {filteredFaqs.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-[#E8E4DA]">
                <i className="fas fa-search-minus text-gray-300 text-3xl mb-3"></i>
                <p className="text-sm font-semibold text-gray-500">No results found for "{searchQuery}"</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFaqs.map((faq) => {
                  const isOpen = activeAccordion === faq.globalIndex;
                  return (
                    <div 
                      key={faq.globalIndex}
                      className="bg-white rounded-2xl border border-[#E8E4DA] overflow-hidden shadow-2xs hover:shadow-xs transition-all"
                    >
                      <button
                        onClick={() => toggleAccordion(faq.globalIndex)}
                        className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 font-bold text-xs text-[#1C1F26]"
                      >
                        <span>{faq.q}</span>
                        <i className={`fas ${isOpen ? 'fa-chevron-up' : 'fa-chevron-down'} text-gray-400 text-3xs transition-transform`}></i>
                      </button>
                      
                      {isOpen && (
                        <div className="px-5 pb-4 text-xs text-[#6B7280] leading-relaxed border-t border-dashed border-[#E8E4DA] pt-3 whitespace-pre-line">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar Contact Column */}
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-[#1C1F26] uppercase tracking-wider" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Contact Us
            </h2>

            <div className="bg-white rounded-2xl border border-[#E8E4DA] p-5 shadow-sm space-y-4">
              <p className="text-xs text-[#6B7280]">
                If you have other queries or require support on a current booking, reach us directly.
              </p>

              <a
                href="mailto:support@agnicarrental.com"
                className="flex items-center gap-3.5 rounded-xl border border-[#E8E4DA] bg-white p-3 hover:shadow-md transition-all text-left text-xs font-bold text-[#1C1F26] decoration-none"
              >
                <div className="w-9 h-9 rounded-lg bg-[#EAF1FB] text-[#2854A6] flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-envelope"></i>
                </div>
                <div>
                  <p className="text-[10px] text-[#9B9484] uppercase font-bold tracking-wider">EMAIL SUPPORT</p>
                  <p className="mt-0.5">rentoxcar@gmail.com</p>
                </div>
              </a>

              <a
                href="tel:+91 8591836955"
                className="flex items-center gap-3.5 rounded-xl border border-[#E8E4DA] bg-white p-3 hover:shadow-md transition-all text-left text-xs font-bold text-[#1C1F26] decoration-none"
              >
                <div className="w-9 h-9 rounded-lg bg-[#FDF3E1] text-[#B4750C] flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-phone-alt"></i>
                </div>
                <div>
                  <p className="text-[10px] text-[#9B9484] uppercase font-bold tracking-wider">CALL CUSTOMER CARE</p>
                  <p className="mt-0.5">+91  8591836955</p>
                </div>
              </a>

              <div className="rounded-xl bg-[#E8F3F0] border border-[#BFE1D8] p-3.5 flex items-start gap-2.5">
                <i className="fab fa-whatsapp text-[#0F766E] text-base mt-0.5"></i>
                <div>
                  <p className="text-xs font-bold text-[#1C1F26]">WhatsApp Support</p>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">Chat directly with a support agent on WhatsApp for instant assistance.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;
