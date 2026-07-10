import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { AppContext } from '../context/AppContext';
import { endpoints } from '../config/api';

// One-time font injection — purely presentational, matches the History page's type system.
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

// Same winding route + waypoint-dot pattern used on the History header, reused here for
// visual continuity across the app. Inline SVG data-uri, no external asset dependency.
const routeMapBg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='120'%3E%3Cpath d='M-10,80 C40,20 80,20 130,60 C180,100 220,100 270,40 C300,4 320,4 320,4' fill='none' stroke='%23F5A623' stroke-width='3' stroke-dasharray='2 14' stroke-linecap='round' opacity='0.65'/%3E%3Ccircle cx='40' cy='34' r='4' fill='%23F5A623' opacity='0.9'/%3E%3Ccircle cx='170' cy='84' r='4' fill='%23F5A623' opacity='0.9'/%3E%3Ccircle cx='270' cy='40' r='5' fill='%23F5A623' opacity='0.9'/%3E%3C/svg%3E")`;
const glowBg =
  'radial-gradient(circle at 15% -10%, rgba(245,166,35,0.22), transparent 55%), radial-gradient(circle at 90% 120%, rgba(15,118,110,0.22), transparent 50%)';
const heroBgStyle = {
  backgroundColor: '#1C1F26',
  backgroundImage: `${glowBg}, ${routeMapBg}`,
  backgroundRepeat: 'no-repeat, repeat-x',
  backgroundPosition: 'center, center 65%',
  backgroundSize: 'cover, auto',
};

const Profile = () => {
  useTicketFonts();
  const navigate = useNavigate();
  const { isLoggedIn, phoneNumber, loginUser, logoutUser } = useContext(AppContext);

  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [typedOtp, setTypedOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [profileData, setProfileData] = useState(null);
  const [fetchingProfile, setFetchingProfile] = useState(false);

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

  // Profile Edit States
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editPincode, setEditPincode] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const startEditing = () => {
    setEditName(profileData?.name || '');
    setEditEmail(profileData?.email || '');
    setEditCity(profileData?.city || '');
    setEditPincode(profileData?.pincode || '');
    setIsEditing(true);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return Swal.fire('Error', 'Please enter your name.', 'error');
    if (!editEmail.trim()) return Swal.fire('Error', 'Please enter your email.', 'error');

    setUpdatingProfile(true);
    try {
      const response = await axios.post(endpoints.customerReg, {
        phone_number: phoneNumber,
        name: editName,
        email: editEmail,
        city: editCity,
        pincode: editPincode
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data && response.data.status === 'success') {
        Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'Profile updated successfully.',
          timer: 1500,
          showConfirmButton: false
        });
        setProfileData({
          ...profileData,
          name: editName,
          email: editEmail,
          city: editCity,
          pincode: editPincode
        });
        setIsEditing(false);
      } else {
        Swal.fire('Error', response.data.message || 'Failed to update profile.', 'error');
      }
    } catch (err) {
      console.error('Update profile error:', err);
      Swal.fire('Error', 'An error occurred while updating profile.', 'error');
    } finally {
      setUpdatingProfile(false);
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
    const otpVal = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(otpVal);

    try {
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
      const statusResponse = await axios.get(`${endpoints.checkPhoneStatus}?phone_number=${phone}`);

      if (statusResponse.data && statusResponse.data.status === 'success') {
        loginUser(phone);
        setSuccessMsg('Logged in successfully!');
      } else {
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
        if (referralCode.trim()) {
          const refBody = new URLSearchParams();
          refBody.append('customer_number', phone);
          refBody.append('referred_by', referralCode);
          await axios.post(endpoints.customerReferral, refBody, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
          });
        }

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

  const StepDots = ({ step }) => (
    <div className="flex items-center justify-center gap-2 mb-6">
      <div className={`h-2 rounded-full transition-all duration-300 ${step >= 1 ? 'w-10 bg-[#F5A623]' : 'w-4 bg-white/20'}`}></div>
      <div className={`h-2 rounded-full transition-all duration-300 ${step >= 2 ? 'w-10 bg-[#F5A623]' : 'w-4 bg-white/20'}`}></div>
    </div>
  );

  const pageBg = {
    backgroundColor: '#F7F4EE',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='340' height='150'%3E%3Cpath d='M-10,100 C50,25 100,25 160,75 C220,125 270,125 320,50 C350,6 380,6 380,6' fill='none' stroke='%23CBB98A' stroke-width='3' stroke-dasharray='2 14' stroke-linecap='round' opacity='0.35'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'repeat',
    backgroundAttachment: 'fixed',
    fontFamily: "'Inter', sans-serif"
  };

  return (
    <div className="min-h-screen" style={pageBg}>
      {/* Themed dark header banner component */}
      <div
        className="relative overflow-hidden px-4 sm:px-8 py-10"
        style={heroBgStyle}
      >
        <div className={`mx-auto relative ${isLoggedIn ? 'max-w-7xl' : 'max-w-lg'}`}>
          <span
            className="inline-block text-[#F5A623] text-[10px] font-semibold tracking-[0.25em] uppercase mb-2"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            {isLoggedIn ? 'Rider Profile' : 'Account Gateway'}
          </span>
          <h1
            className="text-3xl sm:text-4xl font-bold text-white tracking-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {isLoggedIn ? (profileData?.name || 'My Profile') : 'My Account'}
          </h1>
          <p className="text-[#9CA3AF] text-xs mt-2 max-w-md">
            {isLoggedIn 
              ? `Logged in as +91 ${phoneNumber}`
              : 'Access your bookings, rewards, and exclusive ride offers.'
            }
          </p>
        </div>
      </div>

      <div className={`mx-auto px-4 sm:px-6 lg:px-8 py-8 ${isLoggedIn ? 'max-w-7xl' : 'max-w-lg'}`}>
        {isLoggedIn ? (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-4">
              <div className="overflow-hidden rounded-2xl border border-[#E8E4DA] bg-white shadow-sm">
                <div className="relative px-6 pt-8 pb-20 text-white" style={heroBgStyle}>
                  <div className="relative flex flex-col items-center text-center">
                    <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-white/25 bg-white/10 backdrop-blur">
                      <i className="fas fa-user text-3xl text-white"></i>
                    </div>
                    <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest backdrop-blur">
                      <i className="fas fa-circle-check text-[#0F766E]"></i>
                      Verified Rider
                    </span>
                    <h2 className="text-xl font-bold uppercase tracking-wide" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {profileData?.name || 'My Profile'}
                    </h2>
                    <p className="mt-2 text-sm font-semibold text-[#F5A623]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                      +91 {phoneNumber}
                    </p>
                  </div>
                </div>

                <div className="-mt-12 px-6 pb-6 relative z-10">
                  <div className="mb-5 rounded-2xl border border-[#F2DDA9] bg-white shadow-lg">
                    <div className="flex items-center justify-between px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FDF3E1]">
                          <i className="fas fa-coins text-[#F5A623]"></i>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-[#9B9484]">Reward Balance</p>
                          <p className="text-lg font-bold text-[#1C1F26]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                            {profileData?.reward_point ?? 0} pts
                          </p>
                        </div>
                      </div>
                      <div className="rounded-full bg-[#E8F3F0] px-3 py-1 text-[10px] font-bold text-[#0F766E]">
                        Active
                      </div>
                    </div>
                  </div>                   <div className="rounded-2xl border border-[#E8E4DA] bg-[#F7F4EE]/60 p-3">
                    {fetchingProfile ? (
                      <div className="py-8 text-center">
                        <div className="w-6 h-6 mx-auto rounded-full border-2 border-[#E8E4DA] border-t-[#F5A623] animate-spin" />
                      </div>
                    ) : isEditing ? (
                      <form onSubmit={handleUpdateProfile} className="space-y-3.5">
                        <div>
                          <label className="mb-1.5 block text-[9px] font-extrabold uppercase tracking-wider text-[#9B9484]">Full Name</label>
                          <input
                            type="text"
                            required
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full rounded-xl border border-[#E8E4DA] bg-white px-3.5 py-2.5 text-xs font-bold text-[#1C1F26] outline-none focus:border-[#F5A623]"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-[9px] font-extrabold uppercase tracking-wider text-[#9B9484]">Email Address</label>
                          <input
                            type="email"
                            required
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            className="w-full rounded-xl border border-[#E8E4DA] bg-white px-3.5 py-2.5 text-xs font-bold text-[#1C1F26] outline-none focus:border-[#F5A623]"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-[9px] font-extrabold uppercase tracking-wider text-[#9B9484]">City</label>
                          <input
                            type="text"
                            value={editCity}
                            onChange={(e) => setEditCity(e.target.value)}
                            className="w-full rounded-xl border border-[#E8E4DA] bg-white px-3.5 py-2.5 text-xs font-bold text-[#1C1F26] outline-none focus:border-[#F5A623]"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-[9px] font-extrabold uppercase tracking-wider text-[#9B9484]">Pincode</label>
                          <input
                            type="text"
                            maxLength={6}
                            value={editPincode}
                            onChange={(e) => setEditPincode(e.target.value)}
                            className="w-full rounded-xl border border-[#E8E4DA] bg-white px-3.5 py-2.5 text-xs font-bold text-[#1C1F26] outline-none focus:border-[#F5A623]"
                          />
                        </div>
                        <div className="flex gap-2.5 pt-2">
                          <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="flex-1 rounded-xl border border-[#E8E4DA] bg-white py-2.5 text-xs font-extrabold text-[#6B7280]"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={updatingProfile}
                            className="flex-1 rounded-xl bg-[#1C1F26] py-2.5 text-xs font-extrabold text-white"
                          >
                            {updatingProfile ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </form>
                    ) : profileData ? (
                      <div className="space-y-3">
                        {[
                          { icon: 'fa-user', label: 'Name', value: profileData.name || 'Not Filled' },
                          { icon: 'fa-envelope', label: 'Email', value: profileData.email || 'Not Filled' },
                          { icon: 'fa-city', label: 'City', value: profileData.city || 'Not Filled' },
                          { icon: 'fa-map-pin', label: 'Pincode', value: profileData.pincode || 'Not Filled' },
                        ].map((row, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between rounded-2xl border border-[#E8E4DA] bg-white px-4 py-3 shadow-sm transition-all hover:shadow-md"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF1FB]">
                                <i className={`fas ${row.icon} text-[#2854A6] text-sm`}></i>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wide text-[#9B9484]">{row.label}</p>
                                <p className="text-sm font-bold text-[#1C1F26]">{row.value}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={startEditing}
                          className="w-full mt-2 rounded-xl border border-[#E8E4DA] hover:bg-[#F7F4EE] py-2.5 text-xs font-extrabold text-[#1C1F26] transition-colors flex items-center justify-center gap-1.5"
                        >
                          <i className="fas fa-user-pen text-xs"></i> EDIT PROFILE
                        </button>
                      </div>
                    ) : (
                      <p className="py-6 text-center text-sm text-[#9B9484]">No additional profile details found.</p>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      Swal.fire({
                        title: 'Are you sure?',
                        text: 'You will be logged out of your account!',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#E85D4C',
                        cancelButtonColor: '#6B7280',
                        confirmButtonText: 'Yes, logout!',
                        cancelButtonText: 'No, keep'
                      }).then((result) => {
                        if (result.isConfirmed) {
                          logoutUser();
                          navigate('/');
                        }
                      });
                    }}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#E85D4C] py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#D64D3C]"
                  >
                    <i className="fas fa-arrow-right-from-bracket"></i>
                    LOGOUT ACCOUNT
                  </button>
                </div>
              </div>
            </div>

            <div className="xl:col-span-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-[#E8E4DA] bg-white p-5 shadow-sm">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FDF3E1]">
                    <i className="fas fa-coins text-[#F5A623] text-lg"></i>
                  </div>
                  <p className="text-3xl font-bold text-[#1C1F26]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {profileData?.reward_point ?? 0}
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-[#9B9484]">Reward Points</p>
                </div>

                <div className="rounded-2xl border border-[#E8E4DA] bg-white p-5 shadow-sm">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F3F0]">
                    <i className="fas fa-badge-check text-[#0F766E] text-lg"></i>
                  </div>
                  <p className="text-2xl font-bold text-[#1C1F26]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Verified</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-[#9B9484]">Account Status</p>
                </div>

                <div className="rounded-2xl border border-[#E8E4DA] p-5 text-white shadow-sm relative overflow-hidden" style={heroBgStyle}>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 relative z-10">
                    <i className="fas fa-car-side text-white text-lg"></i>
                  </div>
                  <p className="text-2xl font-bold relative z-10" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Ready to Ride</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-[#F5A623] relative z-10">Fast booking access</p>
                </div>
              </div>

              <div className="rounded-2xl border border-[#E8E4DA] bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-[#1C1F26]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Quick Actions</h3>
                    <p className="mt-1 text-sm text-[#9B9484]">Everything you need for your next ride.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => navigate('/')}
                    className="group relative overflow-hidden rounded-2xl p-5 text-left text-white shadow-sm transition-all hover:-translate-y-0.5"
                    style={heroBgStyle}
                  >
                    <div className="relative flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
                        <i className="fas fa-car text-white text-lg"></i>
                      </div>
                      <div>
                        <p className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Book a Cab</p>
                        <p className="mt-1 text-sm text-[#D8D2C4]">Plan your next outstation or local trip instantly.</p>
                      </div>
                    </div>
                  </button>

                  {/* My Bookings */}
                  <button
                    onClick={() => navigate('/history')}
                    className="group relative rounded-2xl border border-[#E8E4DA] bg-white p-5 text-left shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF1FB] text-[#2854A6] transition-colors group-hover:bg-[#2854A6] group-hover:text-white">
                        <i className="fas fa-receipt text-lg"></i>
                      </div>
                      <div>
                        <p className="text-base font-bold text-[#1C1F26]">My Bookings</p>
                        <p className="mt-1 text-sm text-[#9B9484]">Track status and details of your outstation & local trips.</p>
                      </div>
                    </div>
                  </button>

                  {/* Help & Support */}
                  <button
                    onClick={() => navigate('/help')}
                    className="group relative rounded-2xl border border-[#E8E4DA] bg-white p-5 text-left shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FDF3E1] text-[#B4750C] transition-colors group-hover:bg-[#B4750C] group-hover:text-white">
                        <i className="fas fa-headset text-lg"></i>
                      </div>
                      <div>
                        <p className="text-base font-bold text-[#1C1F26]">Help & Support</p>
                        <p className="mt-1 text-sm text-[#9B9484]">Find answers to FAQs or connect with customer care.</p>
                      </div>
                    </div>
                  </button>

                  {/* Refer & Earn */}
                  <div className="relative rounded-2xl border border-dashed border-[#E8E4DA] bg-[#F7F4EE] p-5 opacity-90">
                    <span className="absolute right-4 top-4 rounded-full border border-[#E8E4DA] bg-white px-2 py-1 text-[9px] font-bold text-[#9B9484] tracking-wide">
                      SOON
                    </span>
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                        <i className="fas fa-gift text-[#9B9484] text-lg"></i>
                      </div>
                      <div>
                        <p className="text-base font-bold text-[#6B7280]">Refer & Earn</p>
                        <p className="mt-1 text-sm text-[#9B9484]">Feature will be available shortly.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#E8E4DA] bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-[#1C1F26]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Recent Bookings</h3>
                    <p className="mt-1 text-sm text-[#9B9484]">Your latest trips and ride activity will appear here.</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-dashed border-[#E8E4DA] bg-[#F7F4EE] px-6 py-12 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm border border-[#E8E4DA]">
                    <i className="fas fa-route text-[#F5A623] text-xl"></i>
                  </div>
                  <h4 className="text-lg font-bold text-[#1C1F26]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>No rides yet</h4>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-[#6B7280]">
                    Your trip history will appear here after your first booking. Start with a local ride or an outstation cab.
                  </p>
                  <button
                    onClick={() => navigate('/')}
                    className="mt-6 rounded-2xl bg-[#1C1F26] px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#2C303A]"
                  >
                    BOOK YOUR FIRST RIDE
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { icon: 'fa-shield-halved', title: 'Secure Account', text: 'OTP-based login for safe access.' },
                  { icon: 'fa-headset', title: '24/7 Support', text: 'Assistance whenever your trip needs help.' },
                  { icon: 'fa-star', title: 'Trusted Service', text: 'Built for smooth and reliable travel.' },
                ].map((item, i) => (
                  <div key={i} className="rounded-2xl border border-[#E8E4DA] bg-white p-5 shadow-sm">
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF1FB]">
                      <i className={`fas ${item.icon} text-[#2854A6]`}></i>
                    </div>
                    <p className="text-sm font-bold text-[#1C1F26]">{item.title}</p>
                    <p className="mt-1 text-sm text-[#9B9484]">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : showRegForm ? (
          <div className="overflow-hidden rounded-2xl border border-[#E8E4DA] bg-white shadow-sm">
            <div className="px-6 py-8 text-center text-white" style={heroBgStyle}>
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 border border-white/20">
                <i className="fas fa-user-plus text-xl"></i>
              </div>
              <h2 className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Create Your Account</h2>
              <p className="mt-2 text-sm text-[#D8D2C4]">Complete your profile to unlock seamless cab booking.</p>
            </div>

            <div className="p-6 sm:p-8">
              {errorMsg && (
                <div className="mb-4 rounded-2xl border border-[#F3C9C1] bg-[#FDECEA] p-4 text-sm font-semibold text-[#C4432F] flex items-center gap-2">
                  <i className="fas fa-exclamation-circle"></i>
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-[#9B9484]">Full Name</label>
                  <div className="relative">
                    <i className="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-[#C9C2B2] text-sm"></i>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      required
                      placeholder="Enter full name"
                      className="w-full rounded-2xl border border-[#E8E4DA] bg-[#F7F4EE] py-3.5 pl-11 pr-4 text-sm font-semibold text-[#1C1F26] outline-none transition-all focus:border-[#F5A623] focus:bg-white focus:ring-4 focus:ring-[#FDF3E1]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-[#9B9484]">Email Address</label>
                  <div className="relative">
                    <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-[#C9C2B2] text-sm"></i>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                      placeholder="name@email.com"
                      className="w-full rounded-2xl border border-[#E8E4DA] bg-[#F7F4EE] py-3.5 pl-11 pr-4 text-sm font-semibold text-[#1C1F26] outline-none transition-all focus:border-[#F5A623] focus:bg-white focus:ring-4 focus:ring-[#FDF3E1]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-[#9B9484]">Referral Code (Optional)</label>
                  <div className="relative">
                    <i className="fas fa-gift absolute left-4 top-1/2 -translate-y-1/2 text-[#C9C2B2] text-sm"></i>
                    <input
                      type="text"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      placeholder="Referral phone number"
                      className="w-full rounded-2xl border border-[#E8E4DA] bg-[#F7F4EE] py-3.5 pl-11 pr-4 text-sm font-semibold text-[#1C1F26] outline-none transition-all focus:border-[#F5A623] focus:bg-white focus:ring-4 focus:ring-[#FDF3E1]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1C1F26] py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#2C303A]"
                >
                  {loading ? <i className="fas fa-circle-notch fa-spin"></i> : 'CREATE ACCOUNT'}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[#E8E4DA] bg-white shadow-sm">
            <div className="px-6 py-8 text-center text-white" style={heroBgStyle}>
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 border border-white/20">
                <i className={`fas ${otpSent ? 'fa-shield-halved' : 'fa-mobile-screen-button'} text-xl`}></i>
              </div>
              <h2 className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Login / Sign Up</h2>
              <p className="mt-2 text-sm text-[#D8D2C4]">Access your bookings, rewards, and exclusive ride offers.</p>
            </div>

            <div className="p-6 sm:p-8">
              <StepDots step={otpSent ? 2 : 1} />

              {errorMsg && (
                <div className="mb-4 rounded-2xl border border-[#F3C9C1] bg-[#FDECEA] p-4 text-sm font-semibold text-[#C4432F] flex items-center gap-2">
                  <i className="fas fa-exclamation-circle"></i>
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="mb-4 rounded-2xl border border-[#BFE1D8] bg-[#E8F3F0] p-4 text-sm font-semibold text-[#0F766E] flex items-center gap-2">
                  <i className="fas fa-check-circle"></i>
                  {successMsg}
                </div>
              )}

              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-5">
                  <div>
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-[#9B9484]">Mobile Number</label>
                    <div className="relative">
                      <span
                        className="absolute left-4 top-1/2 -translate-y-1/2 border-r border-[#E8E4DA] pr-3 text-sm font-bold text-[#1C1F26]"
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                      >
                        +91
                      </span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                          const onlyNums = e.target.value.replace(/[^0-9]/g, '');
                          setPhone(onlyNums);
                        }}
                        maxLength={10}
                        required
                        placeholder="Enter 10-digit mobile number"
                        className="w-full rounded-2xl border border-[#E8E4DA] bg-[#F7F4EE] py-4 pl-16 pr-4 text-sm font-semibold text-[#1C1F26] outline-none transition-all focus:border-[#F5A623] focus:bg-white focus:ring-4 focus:ring-[#FDF3E1]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1C1F26] py-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#2C303A]"
                  >
                    {loading ? <i className="fas fa-circle-notch fa-spin"></i> : <>SEND OTP <i className="fas fa-paper-plane text-xs"></i></>}
                  </button>

                  <div className="rounded-2xl border border-[#E8E4DA] bg-[#F7F4EE] px-4 py-3 text-center text-xs font-medium text-[#6B7280]">
                    Your number is used only for secure OTP verification and booking access.
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div>
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-[#9B9484]">Enter OTP</label>
                    <input
                      type="text"
                      value={typedOtp}
                      onChange={(e) => setTypedOtp(e.target.value)}
                      maxLength={4}
                      required
                      placeholder="0000"
                      className="w-full rounded-2xl border border-[#E8E4DA] bg-[#F7F4EE] py-4 px-4 text-center text-2xl font-bold tracking-[0.45em] text-[#1C1F26] outline-none transition-all focus:border-[#F5A623] focus:bg-white focus:ring-4 focus:ring-[#FDF3E1]"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    />
                    <p className="mt-3 text-center text-sm text-[#9B9484]">Code sent to +91 {phone}</p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1C1F26] py-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#2C303A]"
                  >
                    {loading ? <i className="fas fa-circle-notch fa-spin"></i> : <>VERIFY OTP <i className="fas fa-check text-xs"></i></>}
                  </button>

                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="flex w-full items-center justify-center gap-2 text-sm font-bold text-[#B4750C] transition-all hover:text-[#8F5C09]"
                  >
                    <i className="fas fa-arrow-left text-xs"></i>
                    Change Phone Number
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          {[
            { icon: 'fa-shield-halved', label: 'Secure Login' },
            { icon: 'fa-headset', label: '24/7 Support' },
            { icon: 'fa-star', label: 'Trusted Rides' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 rounded-full border border-[#E8E4DA] bg-white px-4 py-2 shadow-sm">
              <i className={`fas ${item.icon} text-[#F5A623] text-xs`}></i>
              <span className="text-xs font-bold text-[#6B7280]">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Profile;