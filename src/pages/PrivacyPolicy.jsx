import React, { useEffect, useState } from 'react';

// Font injection matches cross-app visual system
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

// Background visuals matching branding
const routeMapBg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='340' height='150'%3E%3Cpath d='M-10,100 C50,25 100,25 160,75 C220,125 270,125 320,50 C350,6 380,6 380,6' fill='none' stroke='%23F5A623' stroke-width='3' stroke-dasharray='2 14' stroke-linecap='round' opacity='0.65'/%3E%3C/svg%3E")`;
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

const PrivacyPolicy = () => {
  useTicketFonts();

  return (
    <div className="min-h-screen" style={pageBg}>
      {/* Header Banner */}
      <div className="relative overflow-hidden px-4 sm:px-8 py-12" style={heroBgStyle}>
        <div className="max-w-4xl mx-auto relative text-center">
          <span
            className="inline-block text-[#F5A623] text-[10px] font-semibold tracking-[0.25em] uppercase mb-2"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            LEGAL HUB
          </span>
          <h1
            className="text-3xl sm:text-4xl font-bold text-white tracking-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Privacy & Policies
          </h1>
          <p className="text-[#9CA3AF] text-xs mt-2 max-w-md mx-auto">
            Please read our cancellation rules, privacy terms, and service conditions carefully.
          </p>
        </div>
      </div>

      {/* Main content document */}
      <div className="max-w-[960px] mx-auto px-6 py-10">
        <div className="bg-white rounded-2xl border border-[#E8E4DA] p-6 sm:p-10 shadow-sm space-y-12">
          
          {/* Section 1: Cancellation & Refund Policy */}
          <section className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#1C1F26] uppercase tracking-wide flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                <i className="fas fa-ban text-[#F5A623] text-sm"></i>
                1. Cancellation & Refund Policy
              </h2>
              <p className="mt-2 text-xs text-[#6B7280]">
                Our cancellation rules are designed to balance rider flexibility with commitment guidelines for our driver partners.
              </p>
            </div>

            <hr className="border-[#E8E4DA]" />

            {/* Outstation Policy */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#1C1F26] uppercase tracking-wider flex items-center gap-2">
                <i className="fas fa-route text-brandBlue text-xs"></i>
                One-Way & Round-Trip bookings
              </h3>
              <p className="text-xs text-[#6B7280]">
                Cancellations of outstation trips are calculated under a tiered refund schedule based on hours remaining before the scheduled pickup time:
              </p>
              <div className="rounded-xl border border-[#E8E4DA] bg-[#F7F4EE]/45 p-4 space-y-2 text-xs text-[#1C1F26] max-w-xl">
                <div className="flex justify-between font-bold text-[#0F766E]">
                  <span>More than 48 Hours before pickup</span>
                  <span>100% Refund</span>
                </div>
                <div className="flex justify-between">
                  <span>24 to 48 Hours before pickup</span>
                  <span>75% Refund</span>
                </div>
                <div className="flex justify-between">
                  <span>12 to 24 Hours before pickup</span>
                  <span>50% Refund</span>
                </div>
                <div className="flex justify-between">
                  <span>6 to 12 Hours before pickup</span>
                  <span>25% Refund</span>
                </div>
                <div className="flex justify-between font-bold text-[#C4432F]">
                  <span>Less than 6 Hours before pickup</span>
                  <span>No Refund</span>
                </div>
              </div>
            </div>

            {/* Local Duty Policy */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-[#1C1F26] uppercase tracking-wider flex items-center gap-2">
                <i className="fas fa-car text-brandBlue text-xs"></i>
                Local Taxi / Local Duty bookings
              </h3>
              <div className="rounded-xl border border-[#BFE1D8] bg-[#E8F3F0] p-4 text-xs text-[#0F766E] font-semibold leading-relaxed max-w-xl">
                <strong>Free Cancellation:</strong> You can cancel your Local Taxi / Local Duty bookings at any point before the driver starts the trip with 100% free cancellation. No cancellation fee will apply.
              </div>
            </div>

            {/* Refund processing details */}
            <div className="space-y-2 text-xs text-[#6B7280] leading-relaxed">
              <h4 className="font-bold text-[#1C1F26]">How Refunds are Processed</h4>
              <p>
                Refunds are automatically calculated and credited back to your original source of payment (Credit/Debit Card, UPI, or Netbanking).
              </p>
              <p>
                The standard turnaround time for refunds to reflect in your account balance is <strong>3 to 7 business days</strong>.
              </p>
            </div>
          </section>

          <hr className="border-t-2 border-dashed border-[#E8E4DA]" />

          {/* Section 2: Privacy Policy */}
          <section className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#1C1F26] uppercase tracking-wide flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                <i className="fas fa-shield-alt text-[#F5A623] text-sm"></i>
                2. Privacy Policy
              </h2>
              <p className="mt-2 text-xs text-[#6B7280]">
                Your privacy is of utmost importance to Rentox Car Rental. Here is how we collect, protect, and use your data.
              </p>
            </div>

            <hr className="border-[#E8E4DA]" />

            <div className="space-y-5 text-xs text-[#6B7280] leading-relaxed">
              <div className="space-y-1.5">
                <h4 className="font-bold text-[#1C1F26]">2.1 Information We Collect</h4>
                <p>
                  We collect personal details such as your Full Name, Email Address, Contact Number, City, and Pincode to register your account. We also collect pickup coordinates, destination addresses, and travel dates to process booking requests.
                </p>
                <p className="bg-[#F7F4EE]/50 p-2.5 rounded-xl border border-[#E8E4DA] text-2xs mt-1">
                  <strong>Live GPS Location Data:</strong> Our application tracks real-time location data of your active trip to ensure passenger safety, support live routing updates, and allow driver matching algorithms to locate your position.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-[#1C1F26]">2.2 How We Use Your Information</h4>
                <p>
                  Your information is used solely to facilitate your cab bookings, calculate routes, process payments securely, verify user identity, coordinate dispatch details with driver partners, prevent fraud, and send SMS or email status updates.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-[#1C1F26]">2.3 Data Sharing with Third Parties</h4>
                <p>
                  We do not sell, rent, or lease your private data. To carry out bookings, your details are shared with:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-2xs">
                  <li><strong>Assigned Drivers:</strong> Shared pickup contact details, name, and address routes.</li>
                  <li><strong>Payment Processors:</strong> Transaction parameters passed securely to Razorpay compliance layers.</li>
                  <li><strong>Regulatory Entities:</strong> Compliance sharing when demanded by law enforcement directives.</li>
                </ul>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-[#1C1F26]">2.4 Data Retention & Deletion Rights</h4>
                <p>
                  We keep transaction logs and account profile data as long as your account is active. Users possess full rights to request deletion of their profile records. If you wish to delete your account data, please write to our support desk.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-[#1C1F26]">2.5 Cookies & Tracking Technologies</h4>
                <p>
                  We use technical browser cookies and local storage tokens to maintain your authentication state and remember search addresses. You can adjust your browser properties to block cookies, which may cause sign-in state losses.
                </p>
              </div>
            </div>
          </section>

          <hr className="border-t-2 border-dashed border-[#E8E4DA]" />

          {/* Section 3: Terms & Conditions */}
          <section className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#1C1F26] uppercase tracking-wide flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                <i className="fas fa-file-contract text-[#F5A623] text-sm"></i>
                3. Terms & Conditions
              </h2>
              <p className="mt-2 text-xs text-[#6B7280]">
                Operating terms and service agreements for riders booking cabs via the Rentox portal.
              </p>
            </div>

            <hr className="border-[#E8E4DA]" />

            <div className="space-y-5 text-xs text-[#6B7280] leading-relaxed">
              <div className="space-y-1.5">
                <h4 className="font-bold text-[#1C1F26]">3.1 User Eligibility & Account Accuracy</h4>
                <p>
                  Riders must be at least 18 years of age. You agree that all phone numbers, names, and contact credentials submitted to our profile dashboard are accurate, active, and belong to you.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-[#1C1F26]">3.2 Booking & Vehicle Availability</h4>
                <p>
                  Rentox acts as a booking connector platform matching users with vehicle partners. Vehicle allocation is subject to live availability. We reserve the right to cancel bookings or upgrade vehicles if selected cabs undergo unexpected mechanical failures.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-[#1C1F26]">3.3 Fares, Tolls, State Taxes, and Parking</h4>
                <p>
                  The fare presented at booking confirmation covers the vehicle rental, basic fuel costs, and driver allowance. Riders are separately liable for:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-2xs">
                  <li><strong>National Toll Booth Fees:</strong> Paid directly by the rider or added to the final invoice.</li>
                  <li><strong>State Permits & Entry Taxes:</strong> Paid at state border checkpoints for inter-state outstation travel.</li>
                  <li><strong>Parking Fees:</strong> Charged directly to the passenger at airport or tourist parking facilities.</li>
                  <li><strong>Extra Distance charges:</strong> Applicable if actual mileage exceeds package kilometers.</li>
                </ul>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-[#1C1F26]">3.4 Code of Conduct & Safety Guidelines</h4>
                <p>
                  Riders must treat assigned driver partners with respect. Hazardous materials, illegal items, and smoking are strictly forbidden inside the vehicles. Pet transport policies are subject to advance driver approval. High-volume luggage that compromises driver visibility cannot be accommodated.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-[#1C1F26]">3.5 Limitation of Liability & Force Majeure</h4>
                <p>
                  Rentox Car Rental is not liable for delayed arrivals, missed flights, or booking cancellations caused by traffic jams, road construction, weather anomalies (floods, storms), strikes, or mechanical breakdown hazards en route. Our maximum liability is capped at the advance deposit received for the trip.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-[#1C1F26]">3.6 Local Jurisdictions</h4>
                <p>
                  Any legal actions, arbitration disputes, or claims originating from these service conditions shall be governed by and settled exclusively within the jurisdiction of our local corporate registry courts.
                </p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
