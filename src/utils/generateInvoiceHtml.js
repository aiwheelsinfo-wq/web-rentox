/**
 * Exact 1-to-1 Flutter Mobile App Invoice Generator for Web Rentox
 * Matches `flutterdriverapp/lib/booking_invoice.dart` styling, color palette, and business rules.
 */

export const generateInvoiceHtml = (booking) => {
  const isRoundTrip = (booking.trip_type || '').toLowerCase().includes('round');
  const isOneWay = (booking.trip_type || '').toLowerCase().includes('one-way') || (booking.trip_type || '').toLowerCase().includes('oneway');
  const isLocalDuty = (booking.trip_type || '').toLowerCase().includes('local-duty');
  const isLocalTaxi = (booking.trip_type || '').toLowerCase().includes('local-taxi');

  const invoiceNo = booking.invoice_no || booking.invoiceNumber || `INV-${booking.id || '2026'}`;
  const invoiceDate = booking.invoice_date || booking.invoieceDate || booking.date || new Date().toISOString().split('T')[0];

  const startingKm = parseFloat(booking.starting_km || 0);
  const closingKm = parseFloat(booking.closing_km || 0);
  const totalKm = closingKm > startingKm ? (closingKm - startingKm) : parseFloat(booking.distance || 0);
  const kmRate = parseFloat(booking.kmRate || 13);
  const dailyLimit = parseFloat(booking.daily_limit || 250);
  const gstPercent = parseFloat(booking.gstPercent || 5);
  const parkingCharge = parseFloat(booking.parking_charge || 0);
  const tollCharge = parseFloat(booking.toll_charge || 0);
  const permitCharge = parseFloat(booking.permit_charge || 0);
  const driverAllowance = parseFloat(booking.driver_allowance || 0);
  const advancedAmount = parseFloat(booking.paid_amount || booking.advance_amount || 0);
  const agent_commission = parseFloat(booking.agent_commission || 0);

  const startingDate = booking.starting_date || booking.date || '';
  const startingTime = booking.starting_time || booking.time || '';
  const closingDate = booking.closing_date || booking.return_date || startingDate;
  const closingTime = booking.closing_time || booking.return_time || startingTime;

  const isAgentInvoice = Boolean(booking.business_name && booking.business_name !== 'Not Generated' && booking.business_name.trim() !== '');
  const agentHeaderName = booking.business_name || '';
  const agentHeaderAddress = booking.business_address && booking.business_address !== 'Not Generated' ? booking.business_address : '';
  const agentHeaderGst = booking.gst_number && booking.gst_number !== 'Not Generated' ? booking.gst_number : '';

  // Calculate days for round trip
  let days = 1;
  try {
    const startStr = booking.booked_start_date || booking.date || '';
    const returnStr = booking.booked_return_date || booking.return_date || '';
    if (startStr && returnStr) {
      const s = new Date(startStr);
      const r = new Date(returnStr);
      const d = Math.round((r - s) / (1000 * 60 * 60 * 24)) + 1;
      if (d > 0) days = d;
    }
  } catch (_) {}

  let baseAmount = 0;
  let driverTotal = 0;
  let gstAmount = 0;
  let netTotal = 0;
  let baseChargeVal = 0;
  let rows = [];

  // Currency Formatter
  const formatINR = (num) => {
    if (num === null || num === undefined || isNaN(num)) return '₹0';
    const val = Number(num);
    const formatted = val.toLocaleString('en-IN', {
      maximumFractionDigits: val % 1 === 0 ? 0 : 2,
      minimumFractionDigits: val % 1 === 0 ? 0 : 2,
    });
    return `₹${formatted}`;
  };

  if (isLocalDuty) {
    const packageKm = parseFloat(booking.packageKm || 0);
    const packageHours = parseFloat(booking.packageHours || 0);
    const extraKmPrice = parseFloat(booking.extra_km_price || 0);
    const extraHoursPrice = parseFloat(booking.extra_hours_price || 0);
    const packageBaseFare = parseFloat(booking.packageBaseFare || booking.baseAmount || 0);

    const extraKm = totalKm > packageKm ? totalKm - packageKm : 0;
    const extrakmAmount = extraKm * extraKmPrice;

    let durationHours = 0;
    try {
      const startDT = new Date(`${startingDate}T${startingTime}`);
      const endDT = new Date(`${closingDate}T${closingTime}`);
      const diffMs = endDT - startDT;
      if (!isNaN(diffMs)) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        durationHours = Math.floor(diffMins / 60);
        if (diffMins % 60 > 30) durationHours += 1;
      }
    } catch (_) {}

    const extraHours = durationHours > packageHours ? durationHours - packageHours : 0;
    const extraHoursAmount = extraHours * extraHoursPrice;

    let driverAllowanceLD = 0;
    try {
      const startHour = parseInt(startingTime.split(':')[0], 10);
      const endHour = parseInt(closingTime.split(':')[0], 10);
      const endMin = parseInt(closingTime.split(':')[1], 10);
      if (startHour < 5 || endHour > 23 || (endHour === 23 && endMin > 30)) {
        driverAllowanceLD = driverAllowance;
      }
    } catch (_) {}

    const totalBeforeGst = packageBaseFare + extrakmAmount + extraHoursAmount + agent_commission;
    gstAmount = (totalBeforeGst * gstPercent) / 100;
    netTotal = totalBeforeGst + gstAmount + parkingCharge + tollCharge + permitCharge + driverAllowanceLD;

    rows.push({ desc: 'Package Base Fare', details: `${packageHours} Hours - ${packageKm} KM`, amt: formatINR(packageBaseFare + agent_commission) });
    if (extraKm > 0) rows.push({ desc: 'Extra KM Charge', details: `${extraKm.toFixed(1)} KM @ ₹${extraKmPrice}/KM`, amt: formatINR(extrakmAmount) });
    if (extraHours > 0) rows.push({ desc: 'Extra Hours Charge', details: `${extraHours} Hours @ ₹${extraHoursPrice}/Hr`, amt: formatINR(extraHoursAmount) });
    if (driverAllowanceLD > 0) rows.push({ desc: 'Night / Early Driver Allowance', details: 'Applicable before 5 AM / after 11 PM', amt: formatINR(driverAllowanceLD) });
    if (tollCharge > 0) rows.push({ desc: 'Toll Charges', details: 'Actual Toll', amt: formatINR(tollCharge) });
    if (parkingCharge > 0) rows.push({ desc: 'Parking Charges', details: 'Parking Surcharge', amt: formatINR(parkingCharge) });
    if (permitCharge > 0) rows.push({ desc: 'State Permit Charges', details: 'Border Permit', amt: formatINR(permitCharge) });
    if (gstAmount > 0) {
      rows.push({ desc: 'CGST (2.5%)', details: 'Central GST', amt: formatINR(gstAmount / 2) });
      rows.push({ desc: 'SGST (2.5%)', details: 'State GST', amt: formatINR(gstAmount / 2) });
    }
  } 
  else if (isRoundTrip) {
    const maxKm = Math.max(totalKm, dailyLimit * days);
    const driverAllowanceXdays = driverAllowance * days;
    driverTotal = driverAllowanceXdays;

    let commissionRateVal = 0;
    if (agent_commission > 0 && days > 0 && dailyLimit > 0) {
      commissionRateVal = Math.round(agent_commission / (dailyLimit * days));
    }
    const baseKmCharge = maxKm * kmRate;
    const agentCommissionAmount = maxKm * commissionRateVal;
    baseAmount = baseKmCharge + agentCommissionAmount;

    gstAmount = (baseAmount * gstPercent) / 100;
    netTotal = baseAmount + gstAmount + parkingCharge + tollCharge + permitCharge + driverAllowanceXdays;

    rows.push({ desc: 'Round Trip Base KM Charge', details: `${maxKm.toFixed(1)} KM (${days} Days @ ${dailyLimit} KM/day)`, amt: formatINR(baseAmount) });
    if (driverTotal > 0) rows.push({ desc: 'Driver Allowance', details: `${days} Days @ ₹${driverAllowance}/Day`, amt: formatINR(driverTotal) });
    if (tollCharge > 0) rows.push({ desc: 'Toll Charges', details: 'Estimated / Actual Toll', amt: formatINR(tollCharge) });
    if (parkingCharge > 0) rows.push({ desc: 'Parking Charges', details: 'Parking Surcharge', amt: formatINR(parkingCharge) });
    if (permitCharge > 0) rows.push({ desc: 'State Permit Charges', details: 'Inter-State Permit', amt: formatINR(permitCharge) });
    if (gstAmount > 0) {
      rows.push({ desc: 'CGST (2.5%)', details: 'Central GST', amt: formatINR(gstAmount / 2) });
      rows.push({ desc: 'SGST (2.5%)', details: 'State GST', amt: formatINR(gstAmount / 2) });
    }
  } 
  else if (isOneWay) {
    // ONE-WAY BUSINESS RULE: NO Driver Allowance row, NO Details column in the invoice table!
    const distance = parseFloat(booking.distance || totalKm || 100);
    baseAmount = parseFloat(booking.total_amount || (distance * kmRate));
    gstAmount = (baseAmount * gstPercent) / 100;
    netTotal = baseAmount + gstAmount + parkingCharge + tollCharge;

    rows.push({ desc: 'One-Way Base Trip Fare', details: '', amt: formatINR(baseAmount) });
    if (tollCharge > 0) rows.push({ desc: 'Estimated Toll Charges', details: '', amt: formatINR(tollCharge) });
    if (parkingCharge > 0) rows.push({ desc: 'Parking Surcharge', details: '', amt: formatINR(parkingCharge) });
    if (permitCharge > 0) rows.push({ desc: 'State Permit Charges', details: '', amt: formatINR(permitCharge) });
    if (gstAmount > 0) {
      const halfRate = (gstPercent / 2).toFixed(1).replace('.0', '');
      rows.push({ desc: `CGST (${halfRate}%)`, details: '', amt: formatINR(gstAmount / 2) });
      rows.push({ desc: `SGST (${halfRate}%)`, details: '', amt: formatINR(gstAmount / 2) });
    }
  } 
  else {
    netTotal = parseFloat(booking.total_amount || 0);
    rows.push({ desc: `${booking.trip_type || 'Taxi'} Service Charge`, details: '', amt: formatINR(netTotal) });
  }

  const balanceAmount = Math.max(0, netTotal - advancedAmount);
  const showDetailsColumn = !isOneWay && rows.some(r => r.details && r.details.trim() !== '');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>CAR INVOICE #${invoiceNo}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          background-color: #F8FAFC;
          color: #0F172A;
          padding: 24px 16px;
          font-size: 12px;
          line-height: 1.5;
        }
        .invoice-wrapper {
          max-width: 800px;
          margin: 0 auto;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 4px 16px -2px rgba(0, 0, 0, 0.04);
        }

        /* Top Action Bar */
        .action-bar {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 16px;
        }
        .btn-print {
          background: #1E3A8A;
          color: #FFFFFF;
          border: none;
          padding: 8px 18px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: background 0.2s;
        }
        .btn-print:hover { background: #172554; }

        /* Badges */
        .badge-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }
        .badge-pill {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .badge-blue { background: #EFF6FF; color: #1E3A8A; border: 1px solid #BFDBFE; }
        .badge-gray { background: #F1F5F9; color: #0F172A; }

        /* Company Header */
        .company-header {
          border-bottom: 1px solid #E2E8F0;
          padding-bottom: 14px;
          margin-bottom: 16px;
        }
        .company-header h2 {
          font-size: 20px;
          font-weight: 800;
          color: #0F172A;
          margin-bottom: 2px;
        }
        .company-header p {
          color: #475569;
          font-size: 11.5px;
          line-height: 1.4;
        }
        .company-header .gstin {
          font-weight: 700;
          color: #1E3A8A;
          margin-top: 2px;
        }
        .date-line {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
          font-size: 12px;
          font-weight: 600;
          color: #334155;
        }

        /* Customer & Duty Meta Grid */
        .duty-card {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          padding: 12px 14px;
          margin-bottom: 18px;
        }
        .duty-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 8px 16px;
        }
        .meta-field .label {
          font-size: 9.5px;
          text-transform: uppercase;
          font-weight: 700;
          color: #64748B;
          letter-spacing: 0.03em;
        }
        .meta-field .val {
          font-size: 11.5px;
          font-weight: 600;
          color: #0F172A;
        }

        /* Table */
        .fare-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 18px;
          border-radius: 8px;
          overflow: hidden;
        }
        .fare-table th {
          background: #1E3A8A;
          color: #FFFFFF;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 8px 12px;
          text-align: left;
        }
        .fare-table th:last-child { text-align: right; }
        .fare-table td {
          padding: 8px 12px;
          border-bottom: 1px solid #E2E8F0;
          font-size: 11.5px;
        }
        .fare-table tr:nth-child(even) { background-color: #F8FAFC; }
        .fare-table td:last-child {
          text-align: right;
          font-weight: 600;
          font-family: 'JetBrains Mono', monospace;
          color: #0F172A;
        }

        /* Payment Summary Box */
        .summary-card {
          border: 1px solid #CBD5E1;
          border-radius: 10px;
          padding: 14px;
          background: #FFFFFF;
          margin-bottom: 16px;
        }
        .total-banner {
          background: #1E3A8A;
          color: #FFFFFF;
          padding: 10px 14px;
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 800;
          font-size: 14px;
          margin-bottom: 12px;
        }
        .total-banner .amount {
          font-size: 16px;
          font-family: 'JetBrains Mono', monospace;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          font-size: 12px;
          color: #475569;
        }
        .summary-row.advance .amt {
          color: #059669;
          font-weight: 700;
          font-family: 'JetBrains Mono', monospace;
        }
        .summary-row.balance {
          border-top: 1px solid #E2E8F0;
          margin-top: 6px;
          padding-top: 8px;
          font-size: 13px;
          font-weight: 800;
          color: #0F172A;
        }
        .summary-row.balance .amt {
          color: ${balanceAmount > 0 ? '#DC2626' : '#0F172A'};
          font-family: 'JetBrains Mono', monospace;
        }

        /* Agent Info & Bank Details */
        .alert-box {
          background: #EFF6FF;
          border: 1px solid #BFDBFE;
          border-radius: 8px;
          padding: 8px 12px;
          color: #1E3A8A;
          font-size: 11px;
          font-weight: 600;
          margin-bottom: 14px;
        }
        .bank-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 10px 14px;
          margin-bottom: 16px;
        }
        .bank-card h4 {
          font-size: 11px;
          font-weight: 700;
          color: #1E3A8A;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .bank-card p {
          color: #334155;
          font-size: 11px;
        }

        /* Footer & Signatory */
        .footer-grid {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding-top: 12px;
          border-top: 1px solid #E2E8F0;
          margin-top: 16px;
        }
        .legal-note {
          font-size: 10px;
          color: #64748B;
          max-width: 480px;
        }
        .sign-block {
          text-align: center;
        }
        .sign-line {
          width: 110px;
          height: 1px;
          background: #94A3B8;
          margin-bottom: 4px;
        }
        .sign-text {
          font-size: 10px;
          font-weight: 600;
          color: #334155;
        }

        @media print {
          body { background: #FFFFFF; padding: 0; }
          .invoice-wrapper { border: none; box-shadow: none; padding: 10px; }
          .action-bar { display: none; }
        }
      </style>
    </head>
    <body>

      <div class="invoice-wrapper">
        
        <!-- Print Button -->
        <div class="action-bar">
          <button class="btn-print" onclick="window.print()">
            🖨️ Print / Save as PDF
          </button>
        </div>

        <!-- Badges -->
        <div class="badge-row">
          <span class="badge-pill badge-blue">CAR RENTAL INVOICE</span>
          <span class="badge-pill badge-gray">Bill #${invoiceNo}</span>
        </div>

        <!-- Header -->
        <div class="company-header">
          ${isAgentInvoice ? `
            <h2>${agentHeaderName}</h2>
            ${agentHeaderAddress ? `<p>${agentHeaderAddress}</p>` : ''}
            ${agentHeaderGst ? `<p class="gstin">GSTIN: ${agentHeaderGst}</p>` : ''}
          ` : `
            <h2>RENTOX CAR</h2>
            <p>7, Jalaram Niwas, Ganesh Gawde Road, Mulund (W), Mumbai - 400080</p>
            <p>Tel: 9619936999 | Email: agnicarrental@gmail.com | Web: www.agnicarrental.com</p>
            <p class="gstin">GSTIN: 27AABPG5706A3ZB</p>
          `}
          <div class="date-line">
            <span><strong>Trip Type:</strong> ${booking.trip_type || 'One-Way Trip'}</span>
            <span><strong>Invoice Date:</strong> ${invoiceDate}</span>
          </div>
        </div>

        <!-- Customer & Duty Info -->
        <div class="duty-card">
          <div class="duty-grid">
            <div class="meta-field">
              <div class="label">Customer Details</div>
              <div class="val">${booking.name || 'Valued Customer'} ${booking.phoneNumber || booking.mobile ? `(${booking.phoneNumber || booking.mobile})` : ''}</div>
            </div>
            <div class="meta-field">
              <div class="label">Vehicle Model</div>
              <div class="val">${booking.car_type || 'Sedan'} ${booking.vehicle_id || booking.vehicle_number ? `(${booking.vehicle_id || booking.vehicle_number})` : ''}</div>
            </div>
            <div class="meta-field">
              <div class="label">Driver Assigned</div>
              <div class="val">${booking.driver_name || 'Will be assigned'} ${booking.driver_phone ? `(${booking.driver_phone})` : ''}</div>
            </div>
            <div class="meta-field">
              <div class="label">Pickup & Drop Route</div>
              <div class="val">${booking.from_address || 'Pickup'} ➔ ${booking.to_address || 'Drop'}</div>
            </div>
            <div class="meta-field">
              <div class="label">Journey Timing</div>
              <div class="val">${startingDate} ${startingTime} ${closingDate && closingDate !== startingDate ? `to ${closingDate} ${closingTime}` : ''}</div>
            </div>
            <div class="meta-field">
              <div class="label">Odometer / Run KM</div>
              <div class="val">${closingKm > startingKm ? `Start: ${startingKm} | End: ${closingKm} (${totalKm} KM)` : `Distance: ${totalKm} KM`}</div>
            </div>
          </div>
        </div>

        <!-- Itemized Fare Table -->
        <table class="fare-table">
          <thead>
            <tr>
              ${showDetailsColumn ? `
                <th style="width: 45%;">Description</th>
                <th style="width: 30%;">Details</th>
                <th style="width: 25%; text-align: right;">Amount</th>
              ` : `
                <th style="width: 70%;">Description</th>
                <th style="width: 30%; text-align: right;">Amount</th>
              `}
            </tr>
          </thead>
          <tbody>
            ${rows.map(r => `
              <tr>
                <td><strong>${r.desc}</strong></td>
                ${showDetailsColumn ? `<td style="color: #475569;">${r.details || ''}</td>` : ''}
                <td>${r.amt}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Total & Payment Summary -->
        <div class="summary-card">
          <div class="total-banner">
            <span>TOTAL FARE</span>
            <span class="amount">${formatINR(netTotal)}</span>
          </div>
          <div class="summary-row advance">
            <span>Advance Amount (Paid via Razorpay)</span>
            <span class="amt">${formatINR(advancedAmount)}</span>
          </div>
          <div class="summary-row balance">
            <span>Balance Amount (Payable to Driver)</span>
            <span class="amt">${formatINR(balanceAmount)}</span>
          </div>
        </div>

        <!-- Agent Commission Note -->
        ${isAgentInvoice ? `
          <div class="alert-box">
            ℹ️ Agent Commission is included in the above total fare.
          </div>
        ` : ''}

        <!-- Bank Details Card -->
        ${!isAgentInvoice ? `
          <div class="bank-card">
            <h4>Bank Payment Details</h4>
            <p><strong>Bank:</strong> Federal Bank &nbsp;|&nbsp; <strong>A/c Name:</strong> RENTOX CAR</p>
            <p><strong>A/c No:</strong> 15390200008421 &nbsp;|&nbsp; <strong>IFSC:</strong> FDRL0001539</p>
          </div>
        ` : ''}

        <!-- Signatory & Legal Footer -->
        <div class="footer-grid">
          <div class="legal-note">
            ${!isAgentInvoice 
              ? 'Kindly issue a crossed cheque in favour of AGNI CAR RENTAL "Subject To Mumbai Jurisdiction"'
              : `Thank you for choosing ${agentHeaderName}`
            }
          </div>
          <div class="sign-block">
            <div class="sign-line"></div>
            <div class="sign-text">Authorized Sign.</div>
          </div>
        </div>

      </div>

      <script>
        window.onload = function() {
          setTimeout(function() { window.print(); }, 600);
        };
      </script>
    </body>
    </html>
  `;
};
