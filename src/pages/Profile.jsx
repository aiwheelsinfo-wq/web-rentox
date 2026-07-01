import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import { endpoints } from '../config/api';

const Profile = () => {
  const navigate = useNavigate();
  const { isLoggedIn, phoneNumber, loginUser, logoutUser } = useContext(AppContext);

  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [typedOtp, setTypedOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Customer Profile Information from DB (if logged in)
  const [profileData, setProfileData] = useState(null);
  const [fetchingProfile, setFetchingProfile] = useState(false);

  // Registration Form States (if new user)
  const [showRegForm, setShowRegForm] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [referralCode, setReferralCode] = useState('');

  useEffect(() => {
    if (isLoggedIn) {
      fetchProfile();
    }
  }, [isLoggedIn]);

  const fetchProfile = async () => {
    setFetchingProfile(true);
    try {
      const response = await axios.post(endpoints.getCustomerData, {
        phone_number: phoneNumber
      });
      if (response.data && response.data.status === 'success') {
        setProfileData(response.data.user);
      }
    } catch (e) {
      console.error('Error fetching customer data:', e);
    } finally {
      setFetchingProfile(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!phone || phone.trim().length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    const otpVal = Math.floor(1000 + Math.random() * 9000).toString(); // Generate 4-digit OTP
    setGeneratedOtp(otpVal);

    try {
      // 1. Send OTP using client-side generated method forwarding to Fast2SMS & UltraMsg
      const fast2smsKey = 'p9J1ofaxrnDXePcsUTdlRu630Vg7KQiWMC24OEmjwFSByh8AH5R5n6sSBzCuvQATbf2g87hV9mtqd0GD';
      const url = `${endpoints.sendOtp}?authorization=${fast2smsKey}&route=dlt&sender_id=agni&message=170275&variables_values=${otpVal}&flash=0&numbers=${phone}`;
      
      const response = await axios.get(url);
      if (response.data) {
        setOtpSent(true);
        setSuccessMsg('OTP sent successfully to your mobile number via SMS and WhatsApp.');
      } else {
        setErrorMsg('Failed to send OTP. Please try again.');
      }
    } catch (e) {
      setErrorMsg('Failed to communicate with OTP service.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (typedOtp !== generatedOtp) {
      setErrorMsg('Incorrect OTP. Please enter the correct code.');
      return;
    }

    setLoading(true);

    try {
      // 2. Check if number is already registered
      const statusResponse = await axios.get(`${endpoints.checkPhoneStatus}?phone_number=${phone}`);
      
      if (statusResponse.data && statusResponse.data.status === 'success') {
        // User exists, login
        loginUser(phone);
        setSuccessMsg('Logged in successfully!');
      } else {
        // New user, show registration form
        setShowRegForm(true);
      }
    } catch (e) {
      setErrorMsg('Error checking user registration state.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regName.trim()) return setErrorMsg('Please enter your full name.');
    if (!regEmail.trim()) return setErrorMsg('Please enter your email.');

    setLoading(true);

    try {
      // 3. Register customer in users table
      const regBody = new URLSearchParams();
      regBody.append('name', regName);
      regBody.append('email', regEmail);
      regBody.append('phone_number', phone);
      regBody.append('agent_id', 'Not Filled');
      regBody.append('city', 'Not Filled');
      regBody.append('pincode', '0');

      const response = await axios.post(endpoints.customerReg, regBody, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      if (response.data && response.data.status === 'success') {
        // Handle referral code if entered
        if (referralCode.trim()) {
          const refBody = new URLSearchParams();
          refBody.append('customer_number', phone);
          refBody.append('referred_by', referralCode);
          await axios.post(endpoints.customerReferral, refBody, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
          });
        }

        // Login
        loginUser(phone);
        setSuccessMsg('Account registered and logged in successfully!');
      } else {
        setErrorMsg(response.data.message || 'Failed to complete registration.');
      }
    } catch (e) {
      setErrorMsg('Error registering profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      {isLoggedIn ? (
        /* Profile Info Card (when logged in) */
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 flex flex-col gap-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-brandBlue/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-brandBlue/20">
              <i className="fas fa-user-circle text-brandBlue text-4xl"></i>
            </div>
            <h2 className="text-lg font-black text-brandCharcoal uppercase">My Profile</h2>
            <p className="text-brandBlue font-bold text-xs mt-1">{phoneNumber}</p>
          </div>

          <hr className="border-gray-100" />

          {fetchingProfile ? (
            <div className="text-center py-4">
              <i className="fas fa-spinner fa-spin text-brandBlue"></i>
            </div>
          ) : profileData ? (
            <div className="flex flex-col gap-4 text-xs font-semibold">
              <div className="flex justify-between">
                <span className="text-gray-400">Name</span>
                <span className="text-brandCharcoal">{profileData.name || 'Not Filled'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Email</span>
                <span className="text-brandCharcoal">{profileData.email || 'Not Filled'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">City</span>
                <span className="text-brandCharcoal">{profileData.city || 'Not Filled'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Pincode</span>
                <span className="text-brandCharcoal">{profileData.pincode || 'Not Filled'}</span>
              </div>
              {profileData.reward_point !== undefined && (
                <div className="flex justify-between items-center bg-brandBgLight px-3 py-2 rounded-xl border border-brandAmber/20">
                  <span className="text-brandAmber font-bold"><i className="fas fa-coins mr-1"></i> Reward Points</span>
                  <span className="text-brandCharcoal font-extrabold text-sm">{profileData.reward_point} pts</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-xs text-gray-400">No additional profile details found.</p>
          )}

          <button
            onClick={() => {
              logoutUser();
              navigate('/');
            }}
            className="w-full bg-red-500 text-white hover:bg-red-600 transition-all font-extrabold text-xs py-3 rounded-xl shadow-sm"
          >
            LOGOUT ACCOUNT
          </button>
        </div>
      ) : showRegForm ? (
        /* Registration Form (For new users) */
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
          <div className="text-center mb-6">
            <h2 className="text-lg font-black text-brandCharcoal">Create Account</h2>
            <p className="text-3xs text-gray-400 mt-1">Complete your registration to start booking cabs.</p>
          </div>

          {errorMsg && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-xs font-semibold flex items-center gap-2">
              <i className="fas fa-exclamation-circle text-sm"></i>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div>
              <label className="block text-3xs font-extrabold text-gray-400 uppercase mb-2">FULL NAME</label>
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
                placeholder="Enter full name"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-xs font-semibold text-brandCharcoal outline-none focus:border-brandBlue focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-3xs font-extrabold text-gray-400 uppercase mb-2">EMAIL ADDRESS</label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
                placeholder="name@email.com"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-xs font-semibold text-brandCharcoal outline-none focus:border-brandBlue focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-3xs font-extrabold text-gray-400 uppercase mb-2">REFERRAL CODE (OPTIONAL)</label>
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                placeholder="Referral phone number"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-xs font-semibold text-brandCharcoal outline-none focus:border-brandBlue focus:bg-white transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 bg-brandBlue text-white hover:bg-blue-600 transition-all font-extrabold text-xs py-3.5 rounded-xl shadow-lg w-full flex items-center justify-center gap-2"
            >
              {loading ? <i className="fas fa-circle-notch fa-spin"></i> : 'CREATE ACCOUNT'}
            </button>
          </form>
        </div>
      ) : (
        /* OTP Login / Sign Up Form */
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
          <div className="text-center mb-6">
            <h2 className="text-lg font-black text-brandCharcoal">Login / Sign Up</h2>
            <p className="text-3xs text-gray-400 mt-1">Access your bookings and exclusive outstation fares.</p>
          </div>

          {errorMsg && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-xs font-semibold flex items-center gap-2">
              <i className="fas fa-exclamation-circle text-sm"></i>
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-xs font-semibold flex items-center gap-2">
              <i className="fas fa-check-circle text-sm"></i>
              {successMsg}
            </div>
          )}

          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
              <div>
                <label className="block text-3xs font-extrabold text-gray-400 uppercase mb-2">MOBILE NUMBER</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-brandCharcoal border-r border-gray-200 pr-3">+91</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={10}
                    required
                    placeholder="10-digit number"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-16 pr-4 text-xs font-semibold text-brandCharcoal outline-none focus:border-brandBlue focus:bg-white transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 bg-brandBlue text-white hover:bg-blue-600 transition-all font-extrabold text-xs py-3.5 rounded-xl shadow-lg w-full flex items-center justify-center gap-2"
              >
                {loading ? <i className="fas fa-circle-notch fa-spin"></i> : 'SEND OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
              <div>
                <label className="block text-3xs font-extrabold text-gray-400 uppercase mb-2">ENTER OTP</label>
                <input
                  type="text"
                  value={typedOtp}
                  onChange={(e) => setTypedOtp(e.target.value)}
                  maxLength={4}
                  required
                  placeholder="Enter 4-digit OTP"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 px-4 text-xs font-semibold text-brandCharcoal outline-none focus:border-brandBlue focus:bg-white transition-all text-center tracking-widest text-lg"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 bg-brandBlue text-white hover:bg-blue-600 transition-all font-extrabold text-xs py-3.5 rounded-xl shadow-lg w-full flex items-center justify-center gap-2"
              >
                {loading ? <i className="fas fa-circle-notch fa-spin"></i> : 'VERIFY OTP'}
              </button>

              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="text-3xs text-brandBlue hover:text-blue-700 font-bold transition-all text-center"
              >
                Change Phone Number
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;
