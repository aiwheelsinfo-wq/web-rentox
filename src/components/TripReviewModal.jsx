import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { endpoints } from '../config/api';

const POSITIVE_TAGS = [
  '✨ Clean Vehicle',
  '👔 Professional Driver',
  '⏱️ On-Time Pickup',
  '❄️ Great AC',
  '🛣️ Smooth Driving',
  '💬 Polite & Helpful'
];

const CRITICAL_TAGS = [
  '⚠️ Rash Driving',
  '⏱️ Late Arrival',
  '🧹 Unclean Vehicle',
  '❄️ AC Not Cooling',
  '🗣️ Rude Behavior',
  '💰 Billing / Route Issue'
];

const RATING_DESCRIPTIONS = {
  1: { label: 'Poor Experience', color: 'text-rose-500', emoji: '😞' },
  2: { label: 'Below Expectations', color: 'text-orange-500', emoji: '😕' },
  3: { label: 'Average Ride', color: 'text-amber-500', emoji: '🙂' },
  4: { label: 'Very Good!', color: 'text-emerald-500', emoji: '👍' },
  5: { label: 'Exceptional & Perfect!', color: 'text-amber-500', emoji: '🌟' }
};

const TripReviewModal = ({ isOpen, onClose, booking, driver, onReviewSubmitted, existingReview = null }) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating || 5);
      const parsedTags = existingReview.tags
        ? existingReview.tags.split(',').map(t => t.trim()).filter(Boolean)
        : [];
      setSelectedTags(parsedTags);
      setComment(existingReview.review_text || '');
    } else {
      setRating(5);
      setSelectedTags([]);
      setComment('');
    }
    setSubmittedSuccess(false);
    setErrorMessage('');
  }, [existingReview, isOpen]);

  if (!isOpen) return null;

  const currentDisplayRating = hoverRating || rating;
  const ratingInfo = RATING_DESCRIPTIONS[currentDisplayRating] || RATING_DESCRIPTIONS[5];
  const activeTagsList = currentDisplayRating >= 4 ? POSITIVE_TAGS : CRITICAL_TAGS;

  const handleToggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!booking) return;

    setSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        booking_id: booking.id || booking.booking_id,
        rating: rating,
        tags: selectedTags.join(', '),
        comment: comment.trim(),
        customer_number: booking.customer_number || booking.mobile || ''
      };

      const res = await axios.post(endpoints.submitTripReview, payload);

      if (res.data && res.data.success) {
        setSubmittedSuccess(true);
        if (onReviewSubmitted) {
          onReviewSubmitted({
            rating,
            tags: selectedTags.join(', '),
            review_text: comment.trim()
          });
        }
        setTimeout(() => {
          onClose();
        }, 1600);
      } else {
        setErrorMessage(res.data?.message || 'Failed to submit review.');
      }
    } catch (err) {
      console.error('Review submit error:', err);
      setErrorMessage('Could not connect to the review service. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-[#1C1F26] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center text-sm font-bold border border-amber-400/30">
              <i className="fas fa-star text-amber-400"></i>
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                {existingReview ? 'Update Trip Review' : 'Rate Your Trip Experience'}
              </h3>
              <p className="text-[11px] text-gray-300">
                Booking #{booking?.id || booking?.booking_id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
          >
            <i className="fas fa-times text-xs"></i>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {submittedSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl shadow-inner animate-bounce">
                <i className="fas fa-check"></i>
              </div>
              <h4 className="text-lg font-black text-slate-900">Thank You for Your Feedback!</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Your rating helps Rentox maintain high ride quality and helps our driver partners excel.
              </p>
            </div>
          ) : (
            <>
              {/* Driver and Vehicle Summary Card */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-sm border border-amber-200">
                    <i className="fas fa-user"></i>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">
                      {driver?.full_name || 'Assigned Driver Partner'}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {booking?.car_type || 'Rentox Cab'} • {booking?.trip_type || 'Ride'}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Completed
                </span>
              </div>

              {/* Star Rating Selection */}
              <div className="text-center py-2 space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  How would you rate your journey?
                </p>

                <div className="flex justify-center items-center gap-2 sm:gap-3 py-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = star <= currentDisplayRating;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="transition-transform hover:scale-125 active:scale-95 focus:outline-hidden p-1 cursor-pointer"
                        title={`${star} Star`}
                      >
                        <i
                          className={`text-3xl sm:text-4xl transition-colors ${
                            isFilled
                              ? 'fas fa-star text-amber-400 drop-shadow-sm'
                              : 'far fa-star text-slate-300'
                          }`}
                        ></i>
                      </button>
                    );
                  })}
                </div>

                {/* Rating Emotion Label */}
                <div className="flex items-center justify-center gap-1.5 text-xs font-black mt-1">
                  <span>{ratingInfo.emoji}</span>
                  <span className={ratingInfo.color}>{ratingInfo.label}</span>
                </div>
              </div>

              {/* Quick Tags Pills */}
              <div className="space-y-2">
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  {currentDisplayRating >= 4 ? 'What did you like the most?' : 'What could be improved?'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {activeTagsList.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleTag(tag)}
                        className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Text Review Box */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  Write a Review (Optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share details of your trip experience to help us improve..."
                  rows={3}
                  maxLength={500}
                  className="w-full text-xs text-slate-800 p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 placeholder-slate-400 resize-none transition-all"
                />
                <div className="flex justify-end text-[10px] text-slate-400 font-medium">
                  {comment.length}/500
                </div>
              </div>

              {/* Error Notification */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <i className="fas fa-exclamation-circle flex-shrink-0"></i>
                  <span>{errorMessage}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!submittedSuccess && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="text-xs font-bold text-slate-600 hover:text-slate-800 py-2.5 px-4 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              Skip for now
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold text-xs px-6 py-3 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane text-xs"></i>
                  {existingReview ? 'Update Review' : 'Submit Review'}
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default TripReviewModal;
