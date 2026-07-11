import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import { endpoints } from '../config/api';

// One-time font injection — purely presentational, matches History and Profile.
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

// Winding route + waypoint-dot pattern — same one used on History and Profile — reused
// here on dark UI blocks (trip summary header, OTP bar) for visual continuity.
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

// A faint version of the same route pattern for the page backdrop — barely-there, so it
// reads as texture behind the cards rather than competing with the content.
const pageBg = {
  backgroundColor: '#F5F6FA',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='340' height='150'%3E%3Cpath d='M-10,100 C50,25 100,25 160,75 C220,125 270,125 320,50 C350,6 380,6 380,6' fill='none' stroke='%23CBB98A' stroke-width='3' stroke-dasharray='2 14' stroke-linecap='round' opacity='0.35'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'repeat',
  backgroundAttachment: 'fixed',
};

const BookingStatus = () => {
  useTicketFonts();
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
    setLoading(prev => prev); // don't re-show spinner on refresh
    setErrorMsg('');
    try {
      const response = await axios.get(`${endpoints.getInvoiceData}?bookingId=${id}`);
      if (response.data && !response.data.error) {
        setBooking(response.data);
        // Fetch OTP via trip_live_mapping_backend
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

  const getStatusBadgeClass = (status) => {
    const s = status.toLowerCase();
    if (s.includes('cancel') || s.includes('fail')) return 'bg-[#FDECEA] text-[#C4432F] border-[#F3C9C1]';
    if (s.includes('complet')) return 'bg-[#E8F3F0] text-[#0F766E] border-[#BFE1D8]';
    if (s.includes('start') || s.includes('accept') || s.includes('assign')) return 'bg-[#EAF1FB] text-[#2854A6] border-[#C7D9F2]';
    return 'bg-[#FDF3E1] text-[#B4750C] border-[#F2DDA9]';
  };

  const getStepProgress = (status) => {
    const s = status.toLowerCase();
    if (s.includes('cancel') || s.includes('fail')) return 0;
    if (s.includes('complet')) return 4;
    if (s.includes('start')) return 3;
    if (s.includes('accept') || s.includes('assign')) return 2;
    return 1; // Pending / confirmed deposit
  };

  const handleDownloadInvoice = () => {
    const printWindow = window.open('', '_blank');
    const isOneWay = (booking.trip_type || '').toLowerCase().includes('one-way') || (booking.trip_type || '').toLowerCase().includes('oneway');
    const isLocalDuty = (booking.trip_type || '').toLowerCase().includes('local-duty');
    const isLocalTaxi = (booking.trip_type || '').toLowerCase().includes('local-taxi');

    // —— Shared values ——
    const invoiceDate = booking.invoice_date || booking.date || new Date().toISOString().split('T')[0];
    const startingKm  = parseFloat(booking.starting_km || 0);
    const closingKm   = parseFloat(booking.closing_km  || 0);
    const totalKm     = closingKm - startingKm;
    const kmRate      = parseFloat(booking.kmRate || 0);
    const dailyLimit  = parseFloat(booking.daily_limit || 250);
    const gstPercent  = parseFloat(booking.gstPercent || 5);
    const parkingCharge  = parseFloat(booking.parking_charge || 0);
    const tollCharge     = parseFloat(booking.toll_charge     || 0);
    const permitCharge   = parseFloat(booking.permit_charge   || 0);
    const driverAllowance = parseFloat(booking.driver_allowance || 0);
    const advancedAmount  = parseFloat(booking.paid_amount || 0);
    const agent_commission = parseFloat(booking.agent_commission || 0);

    const startingDate = booking.starting_date || booking.date || '0000-00-00';
    const startingTime = booking.starting_time || booking.time || '00:00:00';
    const closingDate = booking.closing_date || booking.return_date || '0000-00-00';
    const closingTime = booking.closing_time || booking.return_time || '00:00:00';

    const formattedStartDate = `${startingDate} ${startingTime}`;
    const formattedEndDate = `${closingDate} ${closingTime}`;

    // —— Round-Trip specific calculations ——
    let days = 1;
    if (isRoundTrip) {
      try {
        const startStr  = booking.booked_start_date  || booking.date || '';
        const returnStr = booking.booked_return_date || booking.return_date || '';
        if (startStr && returnStr) {
          const s = new Date(startStr);
          const r = new Date(returnStr);
          const d = Math.round((r - s) / (1000 * 60 * 60 * 24)) + 1;
          if (d > 0) days = d;
        }
      } catch (_) {}
    }

    let maxKm = 0;
    let baseAmount = 0;
    let driverTotal = 0;
    let gstAmount = 0;
    let netTotal = 0;
    let baseChargeVal = 0;

    let packageBaseWithCommission = 0;
    let extraKm = 0;
    let extrakmAmount = 0;
    let extraHours = 0;
    let extraHoursAmount = 0;
    let driverAllowanceLD = 0;

    if (isLocalDuty) {
      const packageKm = parseFloat(booking.packageKm || 0);
      const packageHours = parseFloat(booking.packageHours || 0);
      const extraKmPrice = parseFloat(booking.extra_km_price || 0);
      const extraHoursPrice = parseFloat(booking.extra_hours_price || 0);
      const packageBaseFare = parseFloat(booking.packageBaseFare || booking.baseAmount || 0);

      extraKm = totalKm > packageKm ? totalKm - packageKm : 0;
      extrakmAmount = extraKm * extraKmPrice;

      let durationHours = 0;
      try {
        const startDT = new Date(`${startingDate}T${startingTime}`);
        const endDT = new Date(`${closingDate}T${closingTime}`);
        const diffMs = endDT - startDT;
        if (!isNaN(diffMs)) {
          const diffMins = Math.floor(diffMs / (1000 * 60));
          durationHours = Math.floor(diffMins / 60);
          const remMins = diffMins % 60;
          if (remMins > 30) {
            durationHours += 1;
          }
        }
      } catch (_) {}

      extraHours = durationHours > packageHours ? durationHours - packageHours : 0;
      extraHoursAmount = extraHours * extraHoursPrice;

      try {
        const startHour = parseInt(startingTime.split(':')[0], 10);
        const endHour = parseInt(closingTime.split(':')[0], 10);
        const endMin = parseInt(closingTime.split(':')[1], 10);
        if (startHour < 5 || endHour > 23 || (endHour === 23 && endMin > 30)) {
          driverAllowanceLD = driverAllowance;
        }
      } catch (_) {}

      const totalBeforeGst = packageBaseFare + extrakmAmount + extraHoursAmount + agent_commission;
      gstAmount = totalBeforeGst * gstPercent / 100;
      netTotal = totalBeforeGst + gstAmount + parkingCharge + tollCharge + permitCharge + driverAllowanceLD;

      packageBaseWithCommission = packageBaseFare + agent_commission;
      baseAmount = packageBaseFare;
      driverTotal = driverAllowanceLD;
    } 
    else if (isRoundTrip) {
      maxKm = Math.max(totalKm, dailyLimit * days);
      const driverAllowanceXdays = driverAllowance * days;
      driverTotal = driverAllowanceXdays;

      let commissionRateVal = 0;
      if (agent_commission > 0 && days > 0 && dailyLimit > 0) {
        commissionRateVal = Math.round(agent_commission / (dailyLimit * days));
      }
      const baseKmCharge = maxKm * kmRate;
      const agentCommissionAmount = maxKm * commissionRateVal;
      baseAmount = baseKmCharge + agentCommissionAmount;

      gstAmount = baseAmount * gstPercent / 100;
      netTotal = baseAmount + gstAmount + parkingCharge + tollCharge + permitCharge + driverAllowanceXdays;
    } 
    else if (isOneWay) {
      const distance = parseFloat(booking.distance || 0);
      const driverAllowanceVal = distance < 200 ? 300 : 400;
      driverTotal = driverAllowanceVal;

      baseAmount = parseFloat(booking.total_amount || 0);
      if (baseAmount === 0) {
        baseAmount = (distance * kmRate) + driverAllowanceVal;
      }

      gstAmount = baseAmount * gstPercent / 100;
      netTotal = baseAmount + gstAmount + parkingCharge;

      baseChargeVal = parseFloat(booking.base_charge || 0);
      if (baseChargeVal === 0) {
        baseChargeVal = baseAmount - agent_commission;
      }
    } 
    else if (isLocalTaxi) {
      netTotal = parseFloat(booking.total_amount || 0);
      gstAmount = 0;
    }

    const balanceAmount = Math.max(0, netTotal - advancedAmount);

    // Helper to format a table row
    const tr = (label, detail, amount) => `
      <tr>
        <td style="padding:8px 10px; border:1px solid #ddd; font-size:13px;">${label}</td>
        <td style="padding:8px 10px; border:1px solid #ddd; font-size:13px; color:#1a56db;">${detail || ''}</td>
        <td style="padding:8px 10px; border:1px solid #ddd; font-size:13px; text-align:right;">${amount !== '' && amount != null ? amount : ''}</td>
      </tr>`;

    const htmlContent = `
      <html>
      <head>
        <title>CAR INVOICE #${booking.id}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #222; padding: 30px; margin: 0; font-size: 13px; }
          h2.title { text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 20px; letter-spacing: 1px; }
          .company-block { margin-bottom: 6px; }
          .company-block strong { font-size: 15px; }
          .company-block p { margin: 2px 0; font-size: 12px; color: #333; }
          .meta-table { width: 100%; border-collapse: collapse; margin: 18px 0 10px 0; }
          .meta-table td { padding: 4px 0; font-size: 13px; vertical-align: top; }
          .meta-table td:first-child { width: 110px; font-weight: bold; color: #444; }
          .invoice-table { width: 100%; border-collapse: collapse; margin: 18px 0; }
          .invoice-table th { background: #f5f5f5; padding: 8px 10px; border: 1px solid #ddd; font-size: 12px; text-align: left; font-weight: bold; }
          .total-row td { font-weight: bold; background: #f5f5f5; font-size: 14px; }
          .advance-row td { color: #1a56db; font-weight: bold; }
          .balance-row td { font-weight: bold; }
          .bank-section { margin-top: 30px; }
          .bank-section h3 { font-size: 14px; margin-bottom: 5px; }
          .bank-section p { margin: 2px 0; font-size: 12px; }
          .sign-section { margin-top: 30px; font-size: 13px; font-weight: bold; }
          .footer-note { margin-top: 20px; font-size: 11px; color: #1a56db; font-style: italic; }
          .print-btn { background: #1a56db; color: white; border: none; padding: 10px 24px; border-radius: 6px; font-weight: bold; cursor: pointer; margin-bottom: 20px; font-size: 14px; }
          .date-right { text-align: right; font-size: 13px; margin-bottom: 10px; }
          @media print { .print-btn { display: none; } body { padding: 10px; } }
        </style>
      </head>
      <body>
        <button class="print-btn" onclick="window.print()">ðŸ–¨ï¸ Print / Save as PDF</button>

        <h2 class="title">CAR INVOICE</h2>

        <div class="company-block">
          <strong>RENTOX CAR</strong>
          <p>7, Jalaram Niwas, Ganesh Gawde Road,</p>
          <p>Mulund (W), Mumbai - 400080</p>
          <p>Tel: 9619936999 | Email: agnicarrental@gmail.com</p>
          <p>Website: www.agnicarrental.com</p>
          <p>GST No: 27AABPG5706A3ZB</p>
        </div>

        <div class="date-right">Date: ${invoiceDate}</div>

        <table class="meta-table">
          <tr><td>Bill No:</td><td>${booking.invoice_no || booking.id}</td></tr>
          <tr><td>Passenger:</td><td>${booking.name || 'Valued Customer'}</td></tr>
          <tr><td>Trip Type:</td><td>${booking.trip_type}</td></tr>
          <tr><td>Vehicle:</td><td>${booking.car_type}${booking.vehicle_number ? ' - ' + booking.vehicle_number : ''}</td></tr>
          <tr><td>From</td><td>${booking.from_address}</td></tr>
          ${isLocalDuty ? '' : `<tr><td>To</td><td>${booking.to_address}</td></tr>`}
          <tr><td>Date:</td><td>${booking.date}</td></tr>
          ${booking.gst_number ? `<tr><td>GSTIN:</td><td>${booking.gst_number}</td></tr>` : ''}
          ${booking.business_name ? `<tr><td>Business:</td><td>${booking.business_name}</td></tr>` : ''}
        </table>

        <table class="invoice-table">
          <thead>
            <tr>
              <th style="width:40%;">Description</th>
              <th style="width:35%;">Details</th>
              <th style="width:25%; text-align:right;">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${tr('Starting Date', formattedStartDate, '')}
            ${tr('Ending Date',   formattedEndDate, '')}

            ${(isLocalDuty || isRoundTrip) ? `
              ${tr('Starting Km', startingKm || '', '')}
              ${tr('Ending Km',   closingKm  || '', '')}
              ${tr('Total Km',    totalKm.toFixed(2), '')}
            ` : ''}

            ${isLocalDuty ? `
              ${tr('Package', `${booking.packageHours || 0} Hours - ${booking.packageKm || 0} Km`, packageBaseWithCommission.toFixed(2))}
              ${tr('Extra Km', `Rs ${booking.extra_km_price || 0} * ${extraKm.toFixed(1)} Km`, extrakmAmount.toFixed(2))}
              ${tr('Extra Hrs', `Rs ${booking.extra_hours_price || 0} * ${extraHours} Hrs`, extraHoursAmount.toFixed(2))}
            ` : ''}

            ${isRoundTrip ? `
              ${tr('Total Km charge', `${maxKm.toFixed(1)} x ${(kmRate + (agent_commission > 0 && days > 0 && dailyLimit > 0 ? (agent_commission / (dailyLimit * days)) : 0)).toFixed(1)}`, baseAmount.toFixed(2))}
              ${tr('Total Days', days, '')}
            ` : ''}

            ${(!isLocalTaxi) ? `
              ${tr('Parking',        '', parkingCharge > 0 ? parkingCharge.toFixed(2) : '0.00')}
              ${tr('Toll',           '', tollCharge   > 0 ? tollCharge.toFixed(2)    : '0.00')}
              ${tr('Permit Charge',  '', permitCharge > 0 ? permitCharge.toFixed(2)  : '0.00')}
              ${tr('Driver Allowance', '', driverTotal > 0 ? driverTotal.toFixed(2) : '0.00')}
            ` : ''}

            ${isOneWay ? `
              ${tr('Base Amount', '', baseChargeVal.toFixed(2))}
              ${tr('Agent Commission', '', agent_commission.toFixed(2))}
              ${tr('Total Charge', '', baseAmount.toFixed(2))}
            ` : ''}

            ${(!isLocalTaxi) ? `
              ${tr('GSTIN', '27AABPG5706A3ZB', '')}
              ${tr(`GST ${gstPercent.toFixed(1)}%`, '', gstAmount.toFixed(2))}
            ` : ''}

            <tr class="total-row">
              <td colspan="2" style="padding:8px 10px; border:1px solid #ddd; font-size:14px; font-weight:bold;">TOTAL</td>
              <td style="padding:8px 10px; border:1px solid #ddd; font-size:14px; font-weight:bold; text-align:right;">${netTotal.toFixed(2)}</td>
            </tr>
            <tr class="advance-row">
              <td colspan="2" style="padding:8px 10px; border:1px solid #ddd;">Advanced Amount</td>
              <td style="padding:8px 10px; border:1px solid #ddd; text-align:right;">${advancedAmount.toFixed(2)}</td>
            </tr>
            <tr class="balance-row">
              <td colspan="2" style="padding:8px 10px; border:1px solid #ddd;">Balance Amount</td>
              <td style="padding:8px 10px; border:1px solid #ddd; text-align:right;">${balanceAmount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <p style="font-size:11px; color:#1a56db;">Agent Commission is included in the above amount</p>

        <div class="bank-section">
          <h3>Bank Details:</h3>
          <p>Federal Bank</p>
          <p>RENTOX CAR</p>
          <p>A/c No.: 15390200008421</p>
          <p>IFSC CODE: FDRL0001539</p>
        </div>

        <div class="sign-section">
          <br/>
          Authorized Sign.
        </div>

        <div class="footer-note">
          Kindly issue a crossed cheque in favour of AGNI CAR RENTAL "Subject To Mumbai Jurisdiction"
        </div>

        <script>
          window.onload = function() { setTimeout(function() { window.print(); }, 600); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };




  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ ...pageBg, fontFamily: "'Inter', sans-serif" }}>
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-full border-2 border-[#E8E4DA] border-t-[#F5A623] animate-spin" />
          <p
            className="text-[#6B7280] font-semibold text-xs mt-5 uppercase tracking-wider"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Loading trip status...
          </p>
        </div>
      </div>
    );
  }

  if (errorMsg && !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ ...pageBg, fontFamily: "'Inter', sans-serif" }}>
        <div className="max-w-md w-full bg-white text-center rounded-2xl p-10 border border-[#F3C9C1] shadow-sm">
          <div className="w-14 h-14 rounded-full bg-[#FDECEA] flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-circle text-[#C4432F] text-xl"></i>
          </div>
          <p className="text-sm font-semibold text-[#1C1F26]">{errorMsg}</p>
          <button
            onClick={() => navigate('/history')}
            className="mt-6 bg-[#1C1F26] text-white px-6 py-2.5 rounded-xl text-xs font-bold tracking-wide hover:bg-[#2C303A] transition-colors"
          >
            BACK TO BOOKINGS
          </button>
        </div>
      </div>
    );
  }

  const isCancellable = booking.booking_status.toLowerCase() === 'pending' || booking.booking_status.toLowerCase() === 'temp';
  const progress = getStepProgress(booking.booking_status);
  const isLocalTaxi = (booking.trip_type || '').toLowerCase().includes('local');

  // Purely presentational — derives each tracker row's status pill from the existing `progress` value.
  const stepStatusLabel = (stepIndex) => {
    if (progress === 0) return 'Cancelled';
    if (progress > stepIndex) return 'Completed';
    if (progress === stepIndex) return 'Pending';
    return 'Upcoming';
  };
  const stepPillClass = (stepIndex) => {
    const label = stepStatusLabel(stepIndex);
    if (label === 'Completed') return 'bg-[#E8F3F0] text-[#0F766E]';
    if (label === 'Pending') return 'bg-[#FDF3E1] text-[#B4750C]';
    if (label === 'Cancelled') return 'bg-[#FDECEA] text-[#C4432F]';
    return 'bg-[#F1EFE9] text-[#9B9484]';
  };

  return (
    <div className="min-h-screen" style={{ ...pageBg, fontFamily: "'Inter', sans-serif" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/history')}
            className="text-[#6B7280] hover:text-[#1C1F26] font-semibold text-sm transition-colors"
          >
            <i className="fas fa-chevron-left mr-2"></i> Back to My Bookings
          </button>
          <span
            className="bg-white border border-[#E8E4DA] rounded-full px-4 py-1.5 text-xs font-bold text-[#6B7280]"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Booking ID: #{booking.id}
          </span>
        </div>

        {successMsg && (
          <div className="mb-6 bg-[#E8F3F0] border border-[#BFE1D8] text-[#0F766E] rounded-xl p-4 text-sm font-semibold flex items-center gap-2">
            <i className="fas fa-check-circle"></i>
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 bg-[#FDECEA] border border-[#F3C9C1] text-[#C4432F] rounded-xl p-4 text-sm font-semibold flex items-center gap-2">
            <i className="fas fa-exclamation-circle"></i>
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left 2 Cols: Details & Tracking */}
          <div className="md:col-span-2 flex flex-col gap-6">
            {/* Status Tracker */}
            <div className="bg-white rounded-2xl p-7 shadow-sm border border-[#E8E4DA]">
              <h2
                className="text-lg font-bold text-[#1C1F26] uppercase tracking-wider"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Trip Tracking
              </h2>
              <p className="text-xs text-[#9B9484] mb-6 mt-1">Stay updated with your trip progress</p>

              {progress > 0 ? (
                <div className="relative pl-9 flex flex-col gap-4">
                  {/* Visual Line */}
                  <div className="absolute left-[13px] top-6 bottom-6 w-0.5 bg-[#E8E4DA]"></div>

                  {[
                    { icon: 'fa-calendar-check', title: 'Booking Confirmed', desc: 'Payment received successfully.' },
                    {
                      icon: 'fa-user',
                      title: 'Cab Assigned',
                      desc: driver ? `Driver ${driver.full_name} is assigned to your trip.` : 'Assigning best driver soon...',
                    },
                    { icon: 'fa-car', title: 'On Ride', desc: 'Your journey has commenced.' },
                    { icon: 'fa-flag-checkered', title: 'Trip Completed', desc: 'Hope you had a safe and pleasant ride!' },
                  ].map((step, i) => {
                    const stepNum = i + 1;
                    return (
                      <div className="relative flex gap-4 items-center" key={step.title}>
                        <div className={`absolute -left-[31px] w-6 h-6 rounded-full border-2 flex items-center justify-center text-[11px] bg-white ${
                          progress >= stepNum ? 'border-[#1C1F26] text-[#1C1F26] font-bold' : 'border-[#E8E4DA] text-[#9B9484] font-bold'
                        }`}>
                          {progress >= stepNum ? <i className="fas fa-check text-[10px]"></i> : stepNum}
                        </div>
                        <div className="flex-1 flex items-center justify-between gap-4 rounded-xl bg-[#F7F4EE] px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              progress >= stepNum ? 'bg-[#FDF3E1] text-[#F5A623]' : 'bg-white text-[#C9C2B2] border border-[#E8E4DA]'
                            }`}>
                              <i className={`fas ${step.icon} text-sm`}></i>
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-[#1C1F26]">{step.title}</h4>
                              <p className="text-xs text-[#9B9484] mt-0.5">{step.desc}</p>
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${stepPillClass(stepNum)}`}>
                            {stepStatusLabel(stepNum)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-[#FDECEA] text-[#C4432F] rounded-xl p-4 text-sm font-semibold flex items-center gap-2 border border-[#F3C9C1]">
                  <i className="fas fa-ban"></i> This booking is Cancelled.
                </div>
              )}
            </div>

            {/* OTP Card — shown when driver is assigned */}
            {otp && (
              <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6 flex items-center gap-4 shadow-sm" style={heroBgStyle}>
                <div className="relative w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-key text-[#F5A623] text-lg"></i>
                </div>
                <div className="relative flex-1 min-w-0">
                  <div
                    className="text-[10px] font-bold text-[#D8D2C4] tracking-widest uppercase"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    Trip Start OTP
                  </div>
                  <div
                    className="text-3xl font-bold text-[#F5A623] tracking-[0.2em] leading-tight"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {otp}
                  </div>
                </div>
                <div className="relative hidden sm:block text-xs text-[#D8D2C4] max-w-[220px]">
                  Share this OTP only when the trip starts, for security purposes.
                </div>
                <button
                  onClick={handleCopyOtp}
                  className="relative flex-shrink-0 flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all whitespace-nowrap"
                >
                  <i className={`fas ${copiedOtp ? 'fa-check' : 'fa-copy'}`}></i>
                  {copiedOtp ? 'Copied' : 'Copy OTP'}
                </button>
              </div>
            )}

            {/* Driver & Cab details */}
            {driver && (
              <div className="bg-white rounded-2xl p-7 shadow-sm border border-[#E8E4DA]">
                <h2
                  className="text-base font-bold text-[#1C1F26] border-b border-dashed border-[#E8E4DA] pb-4 mb-6 uppercase tracking-wider"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  <i className="fas fa-id-card text-[#F5A623] mr-2"></i> Driver & Vehicle Details
                </h2>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-[52px] h-[52px] bg-[#FDF3E1] border border-[#F2DDA9] rounded-full flex items-center justify-center">
                      <i className="fas fa-user-tie text-[#F5A623] text-xl"></i>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#9B9484] uppercase tracking-widest">YOUR DRIVER</span>
                      <h4 className="text-sm font-bold text-[#1C1F26] mt-0.5">{driver.full_name}</h4>
                      <p className="text-xs text-[#6B7280] font-semibold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{driver.phone_number}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-[#9B9484] uppercase tracking-widest">VEHICLE DETAILS</span>
                    <h4 className="text-sm font-bold text-[#1C1F26] mt-0.5">{driver.vehicle_name}</h4>
                    <span
                      className="inline-block bg-[#1C1F26] text-white text-[11px] px-2.5 py-1 rounded font-bold uppercase tracking-wider mt-1.5"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      {driver.vehicle_id}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Col: Trip Card Summary & Actions */}
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-[#E8E4DA] overflow-hidden">
              <div className="relative p-5 overflow-hidden" style={heroBgStyle}>
                <div className="relative flex justify-between items-center text-white">
                  <div>
                    <span className="text-[10px] font-bold text-[#F5A623] uppercase tracking-widest">{booking.trip_type}</span>
                    <h3 className="text-base font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{booking.car_type}</h3>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(booking.booking_status)}`}>
                    {booking.booking_status}
                  </span>
                </div>
              </div>

              <div className="p-6 flex flex-col gap-4 text-xs">
                <div className="flex gap-2.5">
                  <i className="fas fa-location-dot text-[#F5A623] text-xs mt-0.5"></i>
                  <div>
                    <span className="text-[#9B9484] text-[10px] uppercase font-bold tracking-widest">PICKUP ADDRESS</span>
                    <p className="font-semibold text-[#1C1F26] mt-0.5 text-sm">{booking.from_address}</p>
                  </div>
                </div>
                {booking.to_address && booking.to_address.trim() !== '' && (
                  <div className="flex gap-2.5">
                    <i className="fas fa-location-dot text-[#E85D4C] text-xs mt-0.5"></i>
                    <div>
                      <span className="text-[#9B9484] text-[10px] uppercase font-bold tracking-widest">DESTINATION ADDRESS</span>
                      <p className="font-semibold text-[#1C1F26] mt-0.5 text-sm">{booking.to_address}</p>
                    </div>
                  </div>
                )}
                <hr className="border-[#E8E4DA]" />
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[#9B9484] uppercase"><i className="fas fa-calendar-alt text-[#C9C2B2] mr-1.5"></i>Travel Date</span>
                  <span className="text-[#1C1F26]">{booking.date}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[#9B9484] uppercase"><i className="fas fa-clock text-[#C9C2B2] mr-1.5"></i>Pickup Time</span>
                  <span className="text-[#1C1F26]">{booking.time}</span>
                </div>
                <hr className="border-[#E8E4DA]" />
                <div className="flex justify-between font-bold text-base" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  <span className="text-[#1C1F26]">Total Fare</span>
                  <span className="text-[#1C1F26]">{"\u20B9"}{Math.round(booking.total_amount)}</span>
                </div>
                {booking.payment_id && (
                  <div className="flex justify-between text-[11px] text-[#6B7280] font-semibold -mt-2">
                    <span>Advance Deposit Paid</span>
                    <span className="text-[#0F766E] font-bold">{"\u20B9"}{Math.round(booking.paid_amount)}</span>
                  </div>
                )}

                <div className="mt-1 rounded-xl bg-[#EAF1FB] border border-[#C7D9F2] p-3.5 flex items-start gap-2.5">
                  <i className="fas fa-shield-halved text-[#2854A6] mt-0.5"></i>
                  <div>
                    <p className="text-xs font-bold text-[#1C1F26]">Secure & Safe Booking</p>
                    <p className="text-[11px] text-[#6B7280] mt-0.5">Your booking is protected with 100% secure payment.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cancellation Option */}
            {isCancellable && (
              <button
                onClick={() => setShowCancelModal(true)}
                disabled={actionLoading}
                className="text-left border border-[#F3C9C1] hover:bg-[#FDECEA] rounded-2xl p-5 transition-all w-full flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-full bg-[#FDECEA] flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-times text-[#C4432F] text-sm"></i>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#C4432F]">Cancel Booking</p>
                  <p className="text-[11px] text-[#9B9484] mt-1">You can cancel your booking before the driver is assigned.</p>
                </div>
              </button>
            )}

            {/* Completed Invoice Download Option */}
            {booking.booking_status.toLowerCase().includes('complet') && (
              <button
                onClick={handleDownloadInvoice}
                className="bg-[#0F766E] hover:bg-[#0C5F58] text-white font-bold text-xs py-4 rounded-2xl transition-all shadow-sm w-full flex items-center justify-center gap-2"
              >
                <i className="fas fa-file-pdf text-sm"></i> DOWNLOAD INVOICE PDF
              </button>
            )}
          </div>
        </div>

        {/* Trust strip */}
        <div className="mt-6 bg-white rounded-2xl border border-[#E8E4DA] shadow-sm px-6 py-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: 'fa-shield-halved', color: '#2854A6', bg: '#EAF1FB', title: '24/7 Support', text: "We're here to help you anytime, anywhere." },
            { icon: 'fa-user-check', color: '#0F766E', bg: '#E8F3F0', title: 'Verified Drivers', text: 'All our drivers are verified & background checked.' },
            { icon: 'fa-clock', color: '#B4750C', bg: '#FDF3E1', title: 'On-Time Guarantee', text: 'Punctual rides, every single time.' },
            { icon: 'fa-lock', color: '#7C4DBD', bg: '#F1E9FB', title: 'Secure Payments', text: '100% secure payments with multiple options.' },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: item.bg }}>
                <i className={`fas ${item.icon}`} style={{ color: item.color }}></i>
              </div>
              <div>
                <p className="text-sm font-bold text-[#1C1F26]">{item.title}</p>
                <p className="text-[11px] text-[#9B9484] mt-0.5 leading-snug">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cancellation Dialog modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#1C1F26]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-7 shadow-xl border border-[#E8E4DA] flex flex-col gap-4 text-center">
            <div className="w-12 h-12 bg-[#FDECEA] rounded-full flex items-center justify-center mx-auto border border-[#F3C9C1]">
              <i className="fas fa-trash-alt text-[#C4432F] text-lg"></i>
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1C1F26]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Cancel Booking?</h3>
              <p className="text-xs text-[#6B7280] mt-2">
                Are you sure you want to cancel this cab booking? Refunds will be calculated based on the cancellation policy.
              </p>
            </div>
            <div className="text-left mt-2">
              <label className="block text-[10px] font-bold text-[#9B9484] uppercase tracking-widest mb-2">REASON FOR CANCELLATION</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full bg-[#F7F4EE] border border-[#E8E4DA] rounded-xl py-2.5 px-3 text-xs font-semibold text-[#1C1F26] outline-none"
              >
                <option value="Change of plans">Change of plans</option>
                <option value="Booked another cab">Booked another cab</option>
                <option value="Delay in driver matching">Delay in driver matching</option>
                <option value="Incorrect booking details">Incorrect booking details</option>
              </select>
            </div>

            {/* Cancellation Policy Block */}
            <div className="text-left bg-[#F7F4EE] border border-[#E8E4DA] rounded-xl p-3.5 mt-2">
              <div className="flex items-center gap-2 mb-2 text-[#B4750C]">
                <i className="fas fa-info-circle text-sm"></i>
                <span className="text-[10px] font-bold uppercase tracking-wider">Cancellation Policy</span>
              </div>
              {isLocalTaxi ? (
                <p className="text-xs text-[#0F766E] font-semibold leading-relaxed">
                  <strong>Free Cancellation:</strong> You can cancel your Local Taxi booking anytime before the trip starts with no cancellation fee.
                </p>
              ) : (
                <div className="space-y-1.5 text-xs text-[#6B7280]">
                  <div className="flex justify-between font-semibold text-[#0F766E]">
                    <span>More than 48 Hours</span>
                    <span>100% Refund</span>
                  </div>
                  <div className="flex justify-between">
                    <span>24–48 Hours</span>
                    <span>75% Refund</span>
                  </div>
                  <div className="flex justify-between">
                    <span>12–24 Hours</span>
                    <span>50% Refund</span>
                  </div>
                  <div className="flex justify-between">
                    <span>6–12 Hours</span>
                    <span>25% Refund</span>
                  </div>
                  <div className="flex justify-between font-semibold text-[#C4432F]">
                    <span>Less than 6 Hours</span>
                    <span>No Refund</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 border border-[#E8E4DA] hover:bg-[#F7F4EE] text-[#6B7280] text-xs font-bold py-3 rounded-xl transition-all"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancelBooking}
                className="flex-1 bg-[#E85D4C] text-white hover:bg-[#D64D3C] text-xs font-bold py-3 rounded-xl transition-all shadow-sm"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingStatus;