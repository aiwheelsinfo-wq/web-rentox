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
  const {
    isLoggedIn,
    phoneNumber,
    loginUser,
    logoutUser,
    userRole,
    setUserRole,
    agentStatus,
    setAgentStatus,
    agentProfile,
    fetchAgentStatus
  } = useContext(AppContext);

  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [typedOtp, setTypedOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [pendingLoginPhone, setPendingLoginPhone] = useState('');

  // Agent State Controls
  const [checkingAgent, setCheckingAgent] = useState(false);
  const [showAgentRegModal, setShowAgentRegModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showRejectedModal, setShowRejectedModal] = useState(false);
  const [rejectedReason, setRejectedReason] = useState('');

  // Agent Registration Form Fields
  const [agentFullName, setAgentFullName] = useState('');
  const [agentAgencyName, setAgentAgencyName] = useState('');
  const [agentAddress, setAgentAddress] = useState('');
  const [agentGst, setAgentGst] = useState('');
  const [agentPanFile, setAgentPanFile] = useState(null);
  const [agentPanName, setAgentPanName] = useState('');
  const [agentPhotoFile, setAgentPhotoFile] = useState(null);
  const [agentPhotoPreview, setAgentPhotoPreview] = useState(null);
  const [agentSubmitting, setAgentSubmitting] = useState(false);
  const [agentFormError, setAgentFormError] = useState('');

  const [profileData, setProfileData] = useState(null);
  const [fetchingProfile, setFetchingProfile] = useState(false);

  const [showRegForm, setShowRegForm] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [referralCode, setReferralCode] = useState('');

  useEffect(() => {
    if (isLoggedIn) {
      fetchProfile();
      if (phoneNumber) {
        fetchAgentStatus(phoneNumber);
      }
    }
  }, [isLoggedIn, phoneNumber, fetchAgentStatus]);

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

  // Handle User Clicking "Agent Mode" (Verification Guard)
  const handleChooseAgentMode = async () => {
    const targetPhone = pendingLoginPhone || phone || phoneNumber;
    if (!targetPhone) return;
    setCheckingAgent(true);
    try {
      const res = await fetchAgentStatus(targetPhone);
      if (res.registered && res.status === 'approved') {
        loginUser(targetPhone, 'agent');
        setShowRoleModal(false);
        setSuccessMsg(`Welcome back! Logged in as Verified Agent (${res.agent?.agency_name || ''})`);
      } else if (res.registered && res.status === 'pending') {
        setUserRole('customer');
        setShowRoleModal(false);
        setShowPendingModal(true);
      } else if (res.registered && res.status === 'rejected') {
        setUserRole('customer');
        setShowRoleModal(false);
        setRejectedReason(res.agent?.rejection_reason || 'Incomplete or unverified documentation.');
        setShowRejectedModal(true);
      } else {
        setUserRole('customer');
        // Not registered as agent yet
        setShowRoleModal(false);
        setAgentFullName(profileData?.name || regName || '');
        setAgentAgencyName('');
        setAgentAddress(profileData?.city ? `${profileData.city}, PIN: ${profileData.pincode || ''}` : '');
        setAgentGst('');
        setAgentPanFile(null);
        setAgentPanName('');
        setAgentPhotoFile(null);
        setAgentPhotoPreview(null);
        setAgentFormError('');
        setShowAgentRegModal(true);
      }
    } catch (e) {
      console.error('Error checking agent mode:', e);
    } finally {
      setCheckingAgent(false);
    }
  };

  // Handle Submitting Agent Registration Application
  const handleSubmitAgentRegistration = async (e) => {
    e.preventDefault();
    setAgentFormError('');
    const targetPhone = pendingLoginPhone || phone || phoneNumber;

    if (!agentFullName.trim()) return setAgentFormError('Please enter your full name.');
    if (!agentAgencyName.trim()) return setAgentFormError('Please enter your company/agency name.');
    if (!agentAddress.trim()) return setAgentFormError('Please enter your complete business address.');

    setAgentSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('phone_number', targetPhone);
      formData.append('full_name', agentFullName.trim());
      formData.append('agency_name', agentAgencyName.trim());
      formData.append('address', agentAddress.trim());
      formData.append('gst_number', agentGst.trim());
      if (agentPanFile) {
        formData.append('pan_doc', agentPanFile);
      }
      if (agentPhotoFile) {
        formData.append('profile_photo', agentPhotoFile);
      }

      const response = await axios.post(`${endpoints.agentApi}?action=register_agent`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data && response.data.status === 'success') {
        setShowAgentRegModal(false);
        await fetchAgentStatus(targetPhone);
        setShowPendingModal(true);
      } else {
        setAgentFormError(response.data?.message || 'Failed to submit agent application.');
      }
    } catch (err) {
      setAgentFormError(err.response?.data?.message || 'Server connection error during upload.');
    } finally {
      setAgentSubmitting(false);
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

    if (!/^\d+$/.test(phone)) {
      setErrorMsg('Mobile number must contain only numeric digits.');
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
        setPendingLoginPhone(phone);
        setShowRoleModal(true);
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
      const response = await axios.post(endpoints.customerReg, {
        name: regName,
        email: regEmail,
        phone_number: phone,
        agent_id: 'Not Filled',
        city: 'Not Filled',
        pincode: '0'
      }, {
        headers: { 'Content-Type': 'application/json' }
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

        setPendingLoginPhone(phone);
        setShowRoleModal(true);
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
    <div className="min-h-screen bg-[#F7F8FA] text-brandCharcoal font-sans">
      {/* 2. PROFILE HERO BANNER */}
      <div className="bg-[#1C1F26] text-white px-4 sm:px-8 py-8 shadow-sm">
        <div className={`mx-auto flex items-center justify-between ${isLoggedIn ? 'max-w-6xl' : 'max-w-md'}`}>
          <div>
            <span className="text-amber-400 text-3xs font-extrabold uppercase tracking-widest block mb-1">
              {isLoggedIn ? 'RIDER PROFILE' : 'ACCOUNT GATEWAY'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {isLoggedIn ? (profileData?.name || 'My Profile') : 'My Account'}
            </h1>
            <p className="text-gray-400 text-xs mt-1">
              {isLoggedIn 
                ? `+91 ${phoneNumber}`
                : 'Access your bookings, rewards, and exclusive ride offers.'
              }
            </p>
          </div>

          {isLoggedIn && (
            <div className="hidden sm:flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl text-xs font-bold text-gray-200 border border-white/10 backdrop-blur-sm">
              <i className="fas fa-circle-check text-teal-400 text-sm"></i>
              Verified Rider
            </div>
          )}
        </div>
      </div>

      {/* 3. MAIN PROFILE CONTENT AREA */}
      <div className={`mx-auto px-4 sm:px-6 lg:px-8 py-8 ${isLoggedIn ? 'max-w-6xl' : 'max-w-md'}`}>
        {isLoggedIn ? (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN: Profile Summary + Personal Information + Logout */}
            <div className="xl:col-span-4 flex flex-col gap-6">
              
              {/* 4. PROFILE SUMMARY CARD */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 text-2xl font-extrabold mb-3 shadow-inner">
                  <i className="fas fa-user"></i>
                </div>
                <h2 className="text-lg font-extrabold text-brandCharcoal tracking-tight">
                  {profileData?.name || 'Rider'}
                </h2>
                <p className="text-xs font-semibold text-gray-500 mt-0.5">
                  +91 {phoneNumber}
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/60 text-teal-700 text-3xs font-extrabold">
                  <i className="fas fa-check-circle text-teal-600"></i>
                  Verified Rider
                </div>

                <div className="w-full mt-5 pt-4 border-t border-gray-100 flex items-center justify-between px-2 text-xs">
                  <span className="text-gray-500 font-medium flex items-center gap-1.5">
                    <i className="fas fa-coins text-amber-500"></i> Reward Balance
                  </span>
                  <span className="font-extrabold text-brandCharcoal">
                    {profileData?.reward_point ?? 0} pts <span className="text-teal-600 font-bold text-4xs">Active</span>
                  </span>
                </div>
              </div>

              {/* 5. PERSONAL INFORMATION CARD */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Personal Information
                  </h3>
                </div>

                {fetchingProfile ? (
                  <div className="py-6 text-center">
                    <div className="w-6 h-6 mx-auto rounded-full border-2 border-gray-200 border-t-amber-500 animate-spin" />
                  </div>
                ) : isEditing ? (
                  <form onSubmit={handleUpdateProfile} className="space-y-3.5">
                    <div>
                      <label className="mb-1 block text-3xs font-bold uppercase tracking-wider text-gray-400">Full Name</label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-bold text-brandCharcoal outline-none focus:border-amber-400 focus:bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-3xs font-bold uppercase tracking-wider text-gray-400">Email Address</label>
                      <input
                        type="email"
                        required
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-bold text-brandCharcoal outline-none focus:border-amber-400 focus:bg-white transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-3xs font-bold uppercase tracking-wider text-gray-400">City</label>
                        <input
                          type="text"
                          value={editCity}
                          onChange={(e) => setEditCity(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-bold text-brandCharcoal outline-none focus:border-amber-400 focus:bg-white transition-all"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-3xs font-bold uppercase tracking-wider text-gray-400">Pincode</label>
                        <input
                          type="text"
                          maxLength={6}
                          value={editPincode}
                          onChange={(e) => setEditPincode(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-bold text-brandCharcoal outline-none focus:border-amber-400 focus:bg-white transition-all"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={updatingProfile}
                        className="flex-1 rounded-xl bg-brandCharcoal py-2.5 text-xs font-bold text-white hover:bg-gray-800 transition-all"
                      >
                        {updatingProfile ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                ) : profileData ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="block text-4xs font-bold uppercase tracking-wider text-gray-400">FULL NAME</span>
                        <p className="text-xs font-bold text-brandCharcoal truncate mt-0.5">{profileData.name || 'Not Filled'}</p>
                      </div>
                      <div>
                        <span className="block text-4xs font-bold uppercase tracking-wider text-gray-400">EMAIL</span>
                        <p className="text-xs font-bold text-brandCharcoal truncate mt-0.5">{profileData.email || 'Not Filled'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                      <div>
                        <span className="block text-4xs font-bold uppercase tracking-wider text-gray-400">CITY</span>
                        <p className="text-xs font-bold text-brandCharcoal truncate mt-0.5">{profileData.city || 'Not Filled'}</p>
                      </div>
                      <div>
                        <span className="block text-4xs font-bold uppercase tracking-wider text-gray-400">PINCODE</span>
                        <p className="text-xs font-bold text-brandCharcoal truncate mt-0.5">{profileData.pincode || 'Not Filled'}</p>
                      </div>
                    </div>

                    <button
                      onClick={startEditing}
                      className="w-full mt-2 rounded-xl border border-gray-200 hover:bg-gray-50 py-2.5 text-xs font-bold text-brandCharcoal transition-all flex items-center justify-center gap-1.5"
                    >
                      <i className="fas fa-pen-to-square text-gray-400 text-xs"></i> Edit Profile
                    </button>
                  </div>
                ) : (
                  <p className="py-4 text-center text-xs text-gray-400">No profile details found.</p>
                )}
              </div>

              {/* 10. LOGOUT BUTTON */}
              <button
                onClick={() => {
                  Swal.fire({
                    title: 'Are you sure?',
                    text: 'You will be logged out of your account!',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#EF4444',
                    cancelButtonColor: '#6B7280',
                    confirmButtonText: 'Yes, logout!',
                    cancelButtonText: 'Cancel'
                  }).then((result) => {
                    if (result.isConfirmed) {
                      logoutUser();
                      navigate('/');
                    }
                  });
                }}
                className="w-full flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50/50 hover:bg-red-100/60 py-3 text-xs font-bold text-red-600 transition-all shadow-2xs"
              >
                <i className="fas fa-arrow-right-from-bracket text-xs"></i>
                Logout Account
              </button>
            </div>

            {/* RIGHT COLUMN: Statistics + Agent Mode + Quick Actions + Recent Bookings */}
            <div className="xl:col-span-8 space-y-6">
              
              {/* 6 & 7. STATS CARDS & AGENT MODE CARD */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Reward Points Card */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 text-base font-bold mb-3">
                    <i className="fas fa-coins"></i>
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-brandCharcoal tracking-tight">
                      {profileData?.reward_point ?? 0}
                    </p>
                    <p className="text-4xs font-bold uppercase tracking-wider text-gray-400 mt-1">Reward Points</p>
                  </div>
                </div>

                {/* Account Status Card */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 text-base font-bold mb-3">
                    <i className="fas fa-check"></i>
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-brandCharcoal tracking-tight">Verified</p>
                    <p className="text-4xs font-bold uppercase tracking-wider text-gray-400 mt-1">Account Status</p>
                  </div>
                </div>

                {/* 7. AGENT ACCOUNT CARD (Guarded) */}
                <div className={`rounded-2xl border p-5 shadow-sm flex flex-col justify-between ${
                  agentStatus === 'rejected'
                    ? 'bg-red-50/40 border-red-200'
                    : 'bg-white border-gray-100'
                }`}>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${
                        agentStatus === 'rejected'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-amber-50 border border-amber-100 text-amber-600'
                      }`}>
                        <i className={agentStatus === 'rejected' ? 'fas fa-ban' : 'fas fa-user-shield'}></i>
                      </div>
                      <span className={`text-4xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                        userRole === 'agent' && agentStatus === 'approved'
                          ? 'bg-amber-50 text-amber-800 border-amber-200/70 font-extrabold'
                          : agentStatus === 'rejected'
                          ? 'bg-red-100 text-red-800 border-red-300 font-extrabold'
                          : agentStatus === 'pending'
                          ? 'bg-amber-50 text-amber-800 border-amber-200 font-extrabold'
                          : 'bg-gray-50 text-gray-500 border-gray-200/60'
                      }`}>
                        {userRole === 'agent' && agentStatus === 'approved'
                          ? 'Agent Mode'
                          : agentStatus === 'rejected'
                          ? 'Approval Revoked'
                          : agentStatus === 'pending'
                          ? 'Under Review'
                          : 'Customer'}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-brandCharcoal">Agent Account</h4>
                    <p className="text-4xs text-gray-500 mt-1 leading-snug">
                      {userRole === 'agent' && agentStatus === 'approved'
                        ? (agentProfile?.agency_name ? `${agentProfile.agency_name} (Approved)` : 'Verified Agent Mode')
                        : agentStatus === 'rejected'
                        ? (agentProfile?.rejection_reason ? `Revoked: ${agentProfile.rejection_reason}` : 'Approval has been revoked by admin')
                        : agentStatus === 'pending'
                        ? 'Application under admin review'
                        : 'Custom commission & B2B bookings'
                      }
                    </p>
                  </div>

                  <button
                    disabled={checkingAgent}
                    onClick={() => {
                      if (userRole === 'agent' && agentStatus === 'approved') {
                        setUserRole('customer');
                      } else {
                        handleChooseAgentMode();
                      }
                    }}
                    className={`mt-4 w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs h-9 disabled:opacity-60 ${
                      agentStatus === 'rejected'
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {checkingAgent ? (
                      <i className="fas fa-circle-notch fa-spin text-amber-400"></i>
                    ) : (
                      <>
                        <i className="fas fa-arrows-rotate text-3xs text-amber-400"></i>
                        {userRole === 'agent' && agentStatus === 'approved'
                          ? 'Switch to Customer'
                          : agentStatus === 'rejected'
                          ? 'View Rejection / Re-apply'
                          : agentStatus === 'pending'
                          ? 'Check Review Status'
                          : 'Switch to Agent'}
                      </>
                    )}
                  </button>
                </div>

              </div>

              {/* AGENT COMPANY BANNER (Visible ONLY when in Agent Mode AND Approved) */}
              {userRole === 'agent' && agentStatus === 'approved' && (
                <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 rounded-3xl p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-amber-400 text-brandCharcoal font-extrabold flex items-center justify-center text-2xl shadow-md overflow-hidden flex-shrink-0 border-2 border-white">
                        {agentProfile?.profile_photo ? (
                          <img src={agentProfile.profile_photo.startsWith('http') ? agentProfile.profile_photo : `https://agnicarrental.com/2025/${agentProfile.profile_photo}`} alt="Agent" className="w-full h-full object-cover" />
                        ) : (
                          <i className="fas fa-briefcase"></i>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-extrabold text-brandCharcoal tracking-tight">
                            {agentProfile?.agency_name || 'Rentox Partner Agency'}
                          </h3>
                          <span className="bg-amber-400 text-brandCharcoal text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                            <i className="fas fa-certificate text-3xs"></i> Verified Partner
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5 font-medium">
                          {agentProfile?.full_name ? `Proprietor: ${agentProfile.full_name}` : ''} {agentProfile?.gst_number ? `• GSTIN: ${agentProfile.gst_number}` : ''}
                        </p>
                        <p className="text-3xs text-gray-400 mt-1 max-w-md">
                          <i className="fas fa-map-marker-alt text-amber-500 mr-1"></i> {agentProfile?.address}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto bg-white/80 border border-amber-200 rounded-2xl px-4 py-2.5 shadow-2xs">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      <div className="text-left">
                        <span className="text-3xs font-extrabold uppercase tracking-wider text-gray-400 block">Agent Access</span>
                        <span className="text-xs font-black text-brandCharcoal">Commission Booking Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 8. QUICK ACTIONS */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-sm font-extrabold text-brandCharcoal tracking-tight">Quick Actions</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Everything you need for your next ride.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Book a Cab - Highlighted Primary */}
                  <button
                    onClick={() => navigate('/')}
                    className="group rounded-2xl p-5 bg-[#1C1F26] text-white shadow-sm transition-all hover:bg-gray-800 text-left flex items-start gap-4"
                  >
                    <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-amber-400 text-lg">
                      <i className="fas fa-car"></i>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Book a Cab</h4>
                      <p className="text-xs text-gray-300 mt-0.5">Plan your next outstation or local trip instantly.</p>
                    </div>
                  </button>

                  {/* My Bookings */}
                  <button
                    onClick={() => navigate('/history')}
                    className="group rounded-2xl p-5 bg-white border border-gray-100 shadow-2xs hover:border-gray-200 transition-all text-left flex items-start gap-4"
                  >
                    <div className="w-11 h-11 rounded-xl bg-blue-50 text-brandBlue flex items-center justify-center text-lg group-hover:bg-brandBlue group-hover:text-white transition-colors">
                      <i className="fas fa-receipt"></i>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-brandCharcoal">My Bookings</h4>
                      <p className="text-xs text-gray-400 mt-0.5">Track status and details of your trips.</p>
                    </div>
                  </button>

                  {/* Help & Support */}
                  <button
                    onClick={() => navigate('/help')}
                    className="group rounded-2xl p-5 bg-white border border-gray-100 shadow-2xs hover:border-gray-200 transition-all text-left flex items-start gap-4"
                  >
                    <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg group-hover:bg-amber-500 group-hover:text-white transition-colors">
                      <i className="fas fa-headset"></i>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-brandCharcoal">Help & Support</h4>
                      <p className="text-xs text-gray-400 mt-0.5">Connect with 24/7 customer assistance.</p>
                    </div>
                  </button>

                  {/* Refer & Earn */}
                  <div className="rounded-2xl p-5 bg-gray-50/70 border border-dashed border-gray-200 opacity-80 text-left flex items-start gap-4 relative">
                    <span className="absolute right-4 top-4 text-4xs font-bold uppercase tracking-wider text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                      SOON
                    </span>
                    <div className="w-11 h-11 rounded-xl bg-white text-gray-400 flex items-center justify-center text-lg shadow-2xs">
                      <i className="fas fa-gift"></i>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-500">Refer & Earn</h4>
                      <p className="text-xs text-gray-400 mt-0.5">Feature will be available shortly.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 9. RECENT BOOKINGS */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-sm font-extrabold text-brandCharcoal tracking-tight">Recent Bookings</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Your latest trips and ride activity will appear here.</p>
                </div>

                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 p-8 text-center flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-amber-500 text-lg shadow-2xs mb-3">
                    <i className="fas fa-route"></i>
                  </div>
                  <h4 className="text-sm font-bold text-brandCharcoal">No rides yet</h4>
                  <p className="text-xs text-gray-400 max-w-sm mt-1">
                    Your trip history will appear here after your first booking.
                  </p>
                  <button
                    onClick={() => navigate('/')}
                    className="mt-4 rounded-xl bg-brandCharcoal px-5 py-2.5 text-xs font-bold text-white hover:bg-gray-800 transition-all"
                  >
                    Book Your First Ride
                  </button>
                </div>
              </div>

            </div>

          </div>
        ) : showRegForm ? (
          /* REGISTRATION FORM (Logged Out State) */
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-[#1C1F26] p-6 text-center text-white">
              <div className="w-12 h-12 mx-auto rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-lg mb-2">
                <i className="fas fa-user-plus text-amber-400"></i>
              </div>
              <h2 className="text-xl font-bold">Create Your Account</h2>
              <p className="text-xs text-gray-400 mt-1">Complete your profile to unlock seamless cab booking.</p>
            </div>

            <div className="p-6 sm:p-8">
              {errorMsg && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-600 flex items-center gap-2">
                  <i className="fas fa-exclamation-circle"></i>
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="mb-1 block text-3xs font-bold uppercase tracking-wider text-gray-400">Full Name</label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                    placeholder="Enter full name"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs font-semibold text-brandCharcoal outline-none focus:border-amber-400 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-3xs font-bold uppercase tracking-wider text-gray-400">Email Address</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    placeholder="name@email.com"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs font-semibold text-brandCharcoal outline-none focus:border-amber-400 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-3xs font-bold uppercase tracking-wider text-gray-400">Referral Code (Optional)</label>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    placeholder="Referral phone number"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs font-semibold text-brandCharcoal outline-none focus:border-amber-400 focus:bg-white transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-brandCharcoal py-3 text-xs font-bold text-white hover:bg-gray-800 transition-all mt-2"
                >
                  {loading ? <i className="fas fa-circle-notch fa-spin"></i> : 'CREATE ACCOUNT'}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* LOGIN / OTP FORM (Logged Out State) */
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-[#1C1F26] p-6 text-center text-white">
              <div className="w-12 h-12 mx-auto rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-lg mb-2">
                <i className={`fas ${otpSent ? 'fa-shield-halved text-amber-400' : 'fa-mobile-screen-button text-amber-400'}`}></i>
              </div>
              <h2 className="text-xl font-bold">Login / Sign Up</h2>
              <p className="text-xs text-gray-400 mt-1">Access your bookings, rewards, and exclusive ride offers.</p>
            </div>

            <div className="p-6 sm:p-8">
              <StepDots step={otpSent ? 2 : 1} />

              {errorMsg && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-600 flex items-center gap-2">
                  <i className="fas fa-exclamation-circle"></i>
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="mb-4 rounded-xl border border-teal-200 bg-teal-50 p-3.5 text-xs font-semibold text-teal-700 flex items-center gap-2">
                  <i className="fas fa-check-circle"></i>
                  {successMsg}
                </div>
              )}

              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-3xs font-bold uppercase tracking-wider text-gray-400">Mobile Number</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-xs font-bold text-brandCharcoal pr-2 border-r border-gray-200">
                        +91
                      </span>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPhone(val);
                          if (val && !/^\d+$/.test(val)) {
                            setErrorMsg('Only numbers are allowed.');
                          } else {
                            setErrorMsg('');
                          }
                        }}
                        maxLength={10}
                        required
                        placeholder="Enter 10-digit mobile number"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-14 pr-4 text-xs font-bold text-brandCharcoal outline-none focus:border-amber-400 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-brandCharcoal py-3 text-xs font-bold text-white hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <i className="fas fa-circle-notch fa-spin"></i> : <>SEND OTP <i className="fas fa-paper-plane text-3xs"></i></>}
                  </button>

                  <p className="text-4xs text-center text-gray-400 mt-2 font-medium">
                    Your number is used only for secure OTP verification and booking access.
                  </p>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-3xs font-bold uppercase tracking-wider text-gray-400">Enter OTP</label>
                    <input
                      type="text"
                      value={typedOtp}
                      onChange={(e) => setTypedOtp(e.target.value)}
                      maxLength={4}
                      required
                      placeholder="0000"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 px-4 text-center text-xl font-bold tracking-[0.4em] text-brandCharcoal outline-none focus:border-amber-400 focus:bg-white transition-all"
                    />
                    <p className="mt-2 text-center text-xs text-gray-400">Code sent to +91 {phone}</p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-brandCharcoal py-3 text-xs font-bold text-white hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <i className="fas fa-circle-notch fa-spin"></i> : <>VERIFY OTP <i className="fas fa-check text-3xs"></i></>}
                  </button>

                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="w-full text-center text-xs font-bold text-amber-600 hover:underline pt-1"
                  >
                    Change Phone Number
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* FOOTER BADGES */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          {[
            { icon: 'fa-shield-halved', label: 'Secure Login' },
            { icon: 'fa-headset', label: '24/7 Support' },
            { icon: 'fa-star', label: 'Trusted Rides' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 rounded-full border border-gray-200/80 bg-white px-4 py-2 shadow-2xs">
              <i className={`fas ${item.icon} text-amber-500 text-xs`}></i>
              <span className="text-xs font-bold text-gray-600">{item.label}</span>
            </div>
          ))}
        </div>

        {/* ROLE SELECTION MODAL OVERLAY */}
        {showRoleModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-gray-100 animate-fadeIn text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-600 text-2xl shadow-inner">
                <i className="fas fa-user-shield"></i>
              </div>
              <h3 className="text-xl font-black text-brandCharcoal uppercase tracking-tight mb-2">
                Select Your Account Mode
              </h3>
              <p className="text-xs text-gray-500 mb-6 font-medium">
                Choose how you want to use Rentox today:
              </p>

              <div className="grid grid-cols-1 gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => {
                    loginUser(pendingLoginPhone || phone, 'customer');
                    setShowRoleModal(false);
                    setSuccessMsg('Logged in as Customer successfully!');
                  }}
                  className="p-4 bg-gray-50 hover:bg-brandBlue/5 border-2 border-gray-200 hover:border-brandBlue rounded-2xl flex items-center justify-between text-left transition-all group"
                >
                  <div>
                    <div className="font-extrabold text-sm text-brandCharcoal group-hover:text-brandBlue">
                      👤 Customer Mode
                    </div>
                    <div className="text-3xs text-gray-400 font-semibold mt-0.5">
                      Book cabs directly for personal rides
                    </div>
                  </div>
                  <i className="fas fa-chevron-right text-gray-300 group-hover:text-brandBlue text-xs"></i>
                </button>

                <button
                  type="button"
                  disabled={checkingAgent}
                  onClick={handleChooseAgentMode}
                  className="p-4 bg-amber-50 hover:bg-amber-100/60 border-2 border-amber-300 hover:border-amber-500 rounded-2xl flex items-center justify-between text-left transition-all group disabled:opacity-60"
                >
                  <div>
                    <div className="font-extrabold text-sm text-amber-900 flex items-center gap-2">
                      💼 Agent Mode
                      {checkingAgent && <i className="fas fa-circle-notch fa-spin text-xs text-amber-600"></i>}
                    </div>
                    <div className="text-3xs text-amber-700 font-semibold mt-0.5">
                      Book rides with customizable agent commission
                    </div>
                  </div>
                  <i className="fas fa-chevron-right text-amber-500 text-xs"></i>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 1. AGENT REGISTRATION FORM MODAL */}
        {showAgentRegModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden my-8 animate-fadeIn">
              <div className="bg-[#1C1F26] p-6 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400 text-brandCharcoal flex items-center justify-center text-lg font-bold">
                    <i className="fas fa-building"></i>
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">Agent & Agency Registration</h3>
                    <p className="text-3xs text-gray-400">Complete business details for admin verification</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAgentRegModal(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 flex items-center justify-center text-sm transition-all"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <form onSubmit={handleSubmitAgentRegistration} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                {agentFormError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <i className="fas fa-exclamation-circle text-sm"></i>
                    {agentFormError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-3xs font-extrabold uppercase tracking-wider text-gray-500 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Agency Owner / Contact"
                      value={agentFullName}
                      onChange={(e) => setAgentFullName(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold text-brandCharcoal outline-none focus:border-amber-400 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-3xs font-extrabold uppercase tracking-wider text-gray-500 mb-1">
                      Mobile Number (Verified)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={pendingLoginPhone || phone || phoneNumber}
                      className="w-full rounded-xl border border-gray-200 bg-gray-100 px-3.5 py-2.5 text-xs font-bold text-gray-600 cursor-not-allowed outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-3xs font-extrabold uppercase tracking-wider text-gray-500 mb-1">
                    Company / Agency Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Tours & Travels"
                    value={agentAgencyName}
                    onChange={(e) => setAgentAgencyName(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold text-brandCharcoal outline-none focus:border-amber-400 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-3xs font-extrabold uppercase tracking-wider text-gray-500 mb-1">
                    Complete Business Address *
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Shop/Office number, Street, Landmark, City, State, PIN"
                    value={agentAddress}
                    onChange={(e) => setAgentAddress(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold text-brandCharcoal outline-none focus:border-amber-400 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-3xs font-extrabold uppercase tracking-wider text-gray-500 mb-1">
                    GST Number (Optional / If Applicable)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 27AAAAA0000A1Z5"
                    value={agentGst}
                    onChange={(e) => setAgentGst(e.target.value.toUpperCase())}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold uppercase text-brandCharcoal outline-none focus:border-amber-400 focus:bg-white transition-all"
                  />
                </div>

                {/* File Uploads: PAN / Business Doc & Profile Photo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                  {/* PAN Document Upload */}
                  <div>
                    <label className="block text-3xs font-extrabold uppercase tracking-wider text-gray-500 mb-1">
                      PAN / Business Document
                    </label>
                    <div className="relative border-2 border-dashed border-gray-300 hover:border-amber-400 rounded-2xl p-3 text-center transition-all bg-gray-50/50">
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf,.webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setAgentPanFile(file);
                            setAgentPanName(file.name);
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <i className="fas fa-file-invoice text-amber-500 text-lg mb-1 block"></i>
                      <span className="text-3xs font-bold text-gray-600 block truncate">
                        {agentPanName || 'Upload PAN / Reg Doc'}
                      </span>
                      <span className="text-4xs text-gray-400">PDF, JPG, PNG (Max 5MB)</span>
                    </div>
                  </div>

                  {/* Profile Photo Upload */}
                  <div>
                    <label className="block text-3xs font-extrabold uppercase tracking-wider text-gray-500 mb-1">
                      Profile Photo
                    </label>
                    <div className="relative border-2 border-dashed border-gray-300 hover:border-amber-400 rounded-2xl p-3 text-center transition-all bg-gray-50/50 flex flex-col items-center justify-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setAgentPhotoFile(file);
                            const reader = new FileReader();
                            reader.onload = () => setAgentPhotoPreview(reader.result);
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      {agentPhotoPreview ? (
                        <img src={agentPhotoPreview} alt="Preview" className="w-10 h-10 rounded-full object-cover mb-1 border border-amber-400" />
                      ) : (
                        <i className="fas fa-camera text-amber-500 text-lg mb-1 block"></i>
                      )}
                      <span className="text-3xs font-bold text-gray-600 block truncate">
                        {agentPhotoFile ? agentPhotoFile.name : 'Upload Photo'}
                      </span>
                      <span className="text-4xs text-gray-400">JPG, PNG</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={agentSubmitting}
                    className="w-full py-3 bg-brandCharcoal hover:bg-gray-800 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    {agentSubmitting ? (
                      <>
                        <i className="fas fa-circle-notch fa-spin text-amber-400"></i> Submitting Documents...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane text-3xs text-amber-400"></i> Submit for Admin Approval
                      </>
                    )}
                  </button>
                  <p className="text-center text-4xs text-gray-400 mt-2">
                    Our team reviews agent credentials within 2-4 hours. Once verified, partner access and commissions will activate.
                  </p>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 2. PENDING APPROVAL MODAL */}
        {showPendingModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 text-center shadow-2xl border border-gray-100">
              <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center text-2xl mx-auto mb-4 shadow-inner">
                <i className="fas fa-clock-rotate-left"></i>
              </div>
              <h3 className="text-lg font-black text-brandCharcoal uppercase tracking-tight">
                Application Under Review
              </h3>
              <p className="text-xs text-gray-500 mt-2 font-medium leading-relaxed">
                Your agent application for <span className="font-bold text-brandCharcoal">{agentProfile?.agency_name || 'your agency'}</span> has been received and is currently being verified by the Rentox Admin.
              </p>
              <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 my-5 text-left text-xs space-y-1.5">
                <div className="flex items-center gap-2 text-amber-900 font-bold">
                  <i className="fas fa-shield-halved text-amber-600"></i> Verification Steps:
                </div>
                <div className="text-3xs text-amber-800 font-medium pl-5 space-y-1">
                  <div>• Document & PAN check by compliance team</div>
                  <div>• Agency partner account activation</div>
                  <div>• Instant activation upon admin approval</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPendingModal(false);
                  loginUser(pendingLoginPhone || phone || phoneNumber, 'customer');
                }}
                className="w-full py-3 rounded-xl bg-brandCharcoal hover:bg-gray-800 text-white font-extrabold text-xs transition-all"
              >
                Continue in Customer Mode
              </button>
            </div>
          </div>
        )}

        {/* 3. APPLICATION REJECTED MODAL */}
        {showRejectedModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 text-center shadow-2xl border border-gray-100">
              <div className="w-16 h-16 rounded-3xl bg-red-100 text-red-600 flex items-center justify-center text-2xl mx-auto mb-4 shadow-inner">
                <i className="fas fa-triangle-exclamation"></i>
              </div>
              <h3 className="text-lg font-black text-brandCharcoal uppercase tracking-tight">
                Application Not Approved
              </h3>
              <p className="text-xs text-gray-500 mt-2 font-medium">
                Admin review notes:
              </p>
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 my-4 text-xs font-semibold text-red-700 text-left">
                <i className="fas fa-info-circle mr-1.5"></i>
                {rejectedReason || 'Submitted documentation was incomplete or unclear.'}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowRejectedModal(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-600 transition-all"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectedModal(false);
                    setShowAgentRegModal(true);
                  }}
                  className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-brandCharcoal font-extrabold text-xs transition-all shadow-sm"
                >
                  Resubmit Documents
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Profile;