import React, { useState } from 'react';
import axios from 'axios';
import { endpoints } from '../config/api';

const INCIDENT_CATEGORIES = [
  { id: 'Reckless Driving / Overspeeding', label: '🚗 Reckless Driving / Overspeeding', severity: 'High' },
  { id: 'Unprofessional or Abusive Behavior', label: '🗣️ Unprofessional / Rude Behavior', severity: 'High' },
  { id: 'Overcharging / Demanding Extra Cash', label: '💵 Demanding Extra Cash / Overcharging', severity: 'Medium' },
  { id: 'AC Refused / Poor Car Condition', label: '❄️ Refused AC / Dirty Cab Condition', severity: 'Low' },
  { id: 'Route Deviation / Unauthorized Stops', label: '🗺️ Unauthorized Route Detour / Stop', severity: 'Medium' },
  { id: 'Safety or Harassment Concern', label: '🚨 Safety Hazard / Harassment', severity: 'Critical' },
  { id: 'Other Concern', label: '⚠️ Other Trip Disturbance', severity: 'Medium' }
];

const ReportDriverModal = ({ isOpen, onClose, booking, driver, onReportSubmitted }) => {
  const [incidentType, setIncidentType] = useState('Reckless Driving / Overspeeding');
  const [severity, setSeverity] = useState('High');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ticketNo, setTicketNo] = useState('');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSelectCategory = (cat) => {
    setIncidentType(cat.id);
    setSeverity(cat.severity);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!booking) return;

    if (!description.trim()) {
      setErrorMessage('Please describe what occurred during the trip.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        booking_id: booking.id || booking.booking_id,
        customer_phone: booking.customer_number || booking.mobile || '',
        driver_id: driver?.phone_number || driver?.driver_id || booking.driver_id || '',
        driver_name: driver?.full_name || booking.driver_name || '',
        incident_type: incidentType,
        severity: severity,
        description: description.trim()
      };

      const res = await axios.post(endpoints.submitIncidentReport, payload, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.data && res.data.success) {
        setTicketNo(res.data.ticket_no);
        setSubmittedSuccess(true);
        if (onReportSubmitted) {
          onReportSubmitted(res.data.data);
        }
      } else {
        setErrorMessage(res.data?.message || 'Failed to submit report. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting incident report:', err);
      setErrorMessage('Network error while reaching server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto border border-slate-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
        >
          ✕
        </button>

        {submittedSuccess ? (
          /* Success Screen */
          <div className="p-8 text-center flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-1">
              <i className="fas fa-shield-check text-2xl"></i>
            </div>
            <h3 className="text-xl font-black text-slate-900">Incident Reported</h3>
            <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-xs font-mono font-bold text-amber-700">
              Ticket #{ticketNo}
            </div>
            <p className="text-xs text-slate-600 max-w-sm leading-relaxed mt-1">
              Your safety complaint has been submitted directly to the <strong>Rentox Fleet Safety & Compliance Team</strong>.
              Our support manager will investigate the incident and take disciplinary action against the driver.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
            >
              Done & Close
            </button>
          </div>
        ) : (
          /* Form Content */
          <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-2xs">
                <i className="fas fa-triangle-exclamation text-lg"></i>
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Report Driver or Incident
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Trip #{booking.id || booking.booking_id} {driver?.full_name ? `· Driver: ${driver.full_name}` : ''}
                </p>
              </div>
            </div>

            {/* Emergency Notice */}
            <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-3 text-[11px] text-rose-900 flex items-start gap-2 leading-snug">
              <i className="fas fa-circle-exclamation text-rose-600 mt-0.5"></i>
              <span>
                <strong>Immediate Danger?</strong> If you are experiencing an urgent safety threat, please dial <strong>112</strong> immediately.
              </span>
            </div>

            {/* Incident Type Chips */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                What issue did you experience?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {INCIDENT_CATEGORIES.map((cat) => {
                  const isSelected = incidentType === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectCategory(cat)}
                      className={`text-left p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'border-rose-500 bg-rose-50/70 text-rose-900 shadow-2xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Severity Indicator */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Severity Level
              </label>
              <div className="flex items-center gap-2">
                {['Low', 'Medium', 'High', 'Critical'].map((lvl) => {
                  const isSelected = severity === lvl;
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setSeverity(lvl)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        isSelected
                          ? lvl === 'Critical'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                            : lvl === 'High'
                            ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                            : 'bg-slate-800 text-white border-slate-800 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {lvl}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description Textarea */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Incident Details
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please describe what happened (e.g. driver asked for extra ₹500 cash, driver drove recklessly on the highway, refused to switch on AC)..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-400 focus:bg-white transition-all font-medium"
              />
            </div>

            {errorMessage && (
              <div className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-center">
                {errorMessage}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Submitting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-flag"></i> Submit Incident Report
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReportDriverModal;
