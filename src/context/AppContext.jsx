import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { endpoints } from '../config/api';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [phoneNumber, setPhoneNumber] = useState(() => localStorage.getItem('cust_phone_number') || '');
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('cust_phone_number'));

  // Agent Status & Profile states
  const [agentStatus, setAgentStatus] = useState(() => localStorage.getItem('rentox_agent_status') || 'not_checked');
  const [agentProfile, setAgentProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('rentox_agent_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const fetchAgentStatus = useCallback(async (phoneToQuery) => {
    const targetPhone = phoneToQuery || phoneNumber;
    if (!targetPhone) return { registered: false, status: 'not_checked' };
    try {
      const res = await axios.get(`${endpoints.agentApi}?action=check_status&phone_number=${targetPhone}`);
      if (res.data && res.data.status === 'success') {
        if (res.data.registered && res.data.agent) {
          const ag = res.data.agent;
          setAgentStatus(ag.status);
          setAgentProfile(ag);
          localStorage.setItem('rentox_agent_status', ag.status);
          localStorage.setItem('rentox_agent_profile', JSON.stringify(ag));

          // If agent is NOT approved (e.g. rejected, revoked, pending), revoke agent mode immediately!
          if (ag.status !== 'approved') {
            setUserRole('customer');
            localStorage.setItem('user_role', 'customer');
          }

          return { registered: true, status: ag.status, agent: ag };
        } else {
          setAgentStatus('not_registered');
          setAgentProfile(null);
          setUserRole('customer');
          localStorage.setItem('rentox_agent_status', 'not_registered');
          localStorage.setItem('user_role', 'customer');
          localStorage.removeItem('rentox_agent_profile');
          return { registered: false, status: 'not_registered' };
        }
      }
    } catch (e) {
      console.warn('Error fetching agent status:', e);
    }
    return { registered: false, status: 'error' };
  }, [phoneNumber]);

  useEffect(() => {
    if (phoneNumber) {
      fetchAgentStatus(phoneNumber);
    }
  }, [phoneNumber, fetchAgentStatus]);

  // Re-verify agent status whenever tab regains focus
  useEffect(() => {
    const handleFocus = () => {
      if (phoneNumber) {
        fetchAgentStatus(phoneNumber);
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [phoneNumber, fetchAgentStatus]);

  // Search parameters persisted to localStorage to prevent refresh data loss
  const [tripType, setTripType] = useState(() => localStorage.getItem('search_tripType') || 'One-way');
  const [fromAddress, setFromAddress] = useState(() => localStorage.getItem('search_fromAddress') || 'Pune, Maharashtra, India');
  const [toAddress, setToAddress] = useState(() => localStorage.getItem('search_toAddress') || 'Mumbai, Maharashtra, India');
  const getInitialPickupDate = () => {
    const today = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem('search_pickupDate');
    if (saved && saved >= today) return saved;
    return today;
  };

  const getInitialPickupTime = () => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const [pickupDate, setPickupDate] = useState(getInitialPickupDate);
  const [pickupTime, setPickupTime] = useState(getInitialPickupTime);
  const [returnDate, setReturnDate] = useState(() => localStorage.getItem('search_returnDate') || '');
  const [returnTime, setReturnTime] = useState(() => localStorage.getItem('search_returnTime') || '10:00 AM');

  // Lat/Lng coordinates for location estimation (persisted)
  const [fromLat, setFromLat] = useState(() => {
    const saved = localStorage.getItem('search_fromLat');
    return saved ? parseFloat(saved) : 18.52043;
  });
  const [fromLng, setFromLng] = useState(() => {
    const saved = localStorage.getItem('search_fromLng');
    return saved ? parseFloat(saved) : 73.856743;
  });
  const [toLat, setToLat] = useState(() => {
    const saved = localStorage.getItem('search_toLat');
    return saved ? parseFloat(saved) : 19.07609;
  });
  const [toLng, setToLng] = useState(() => {
    const saved = localStorage.getItem('search_toLng');
    return saved ? parseFloat(saved) : 72.877707;
  });

  // Active selections
  const [selectedCar, setSelectedCar] = useState(() => {
    const saved = localStorage.getItem('search_selectedCar');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch (_) {
      return null;
    }
  });

  const [tempBookingId, setTempBookingId] = useState(() => {
    const saved = localStorage.getItem('search_tempBookingId');
    if (saved === '347') {
      localStorage.removeItem('search_tempBookingId');
      return '';
    }
    return saved || '';
  });

  // Sync state values back to localStorage on change
  useEffect(() => {
    localStorage.setItem('search_tripType', tripType);
  }, [tripType]);

  useEffect(() => {
    localStorage.setItem('search_fromAddress', fromAddress);
  }, [fromAddress]);

  useEffect(() => {
    localStorage.setItem('search_toAddress', toAddress);
  }, [toAddress]);

  useEffect(() => {
    localStorage.setItem('search_pickupDate', pickupDate);
  }, [pickupDate]);

  useEffect(() => {
    localStorage.setItem('search_pickupTime', pickupTime);
  }, [pickupTime]);

  useEffect(() => {
    localStorage.setItem('search_returnDate', returnDate);
  }, [returnDate]);

  useEffect(() => {
    localStorage.setItem('search_returnTime', returnTime);
  }, [returnTime]);

  useEffect(() => {
    localStorage.setItem('search_fromLat', String(fromLat));
  }, [fromLat]);

  useEffect(() => {
    localStorage.setItem('search_fromLng', String(fromLng));
  }, [fromLng]);

  useEffect(() => {
    localStorage.setItem('search_toLat', String(toLat));
  }, [toLat]);

  useEffect(() => {
    localStorage.setItem('search_toLng', String(toLng));
  }, [toLng]);

  useEffect(() => {
    if (selectedCar) {
      localStorage.setItem('search_selectedCar', JSON.stringify(selectedCar));
    } else {
      localStorage.removeItem('search_selectedCar');
    }
  }, [selectedCar]);

  useEffect(() => {
    if (tempBookingId && tempBookingId !== '347') {
      localStorage.setItem('search_tempBookingId', tempBookingId);
    } else {
      localStorage.removeItem('search_tempBookingId');
    }
  }, [tempBookingId]);

  const [userRole, setUserRole] = useState(() => {
    const savedRole = localStorage.getItem('user_role') || 'customer';
    const savedStatus = localStorage.getItem('rentox_agent_status');
    if (savedRole === 'agent' && savedStatus !== 'approved') {
      localStorage.setItem('user_role', 'customer');
      return 'customer';
    }
    return savedRole;
  });
  const [agentCommission, setAgentCommission] = useState(() => parseFloat(localStorage.getItem('agent_commission') || '0'));

  // Auto-enforce: never allow userRole === 'agent' unless agentStatus === 'approved'
  useEffect(() => {
    if (userRole === 'agent' && agentStatus !== 'approved' && agentStatus !== 'not_checked') {
      setUserRole('customer');
      localStorage.setItem('user_role', 'customer');
    }
  }, [userRole, agentStatus]);

  useEffect(() => {
    localStorage.setItem('user_role', userRole);
  }, [userRole]);

  useEffect(() => {
    localStorage.setItem('agent_commission', String(agentCommission));
  }, [agentCommission]);

  const loginUser = (phone, role = 'customer') => {
    const savedStatus = localStorage.getItem('rentox_agent_status');
    const effectiveRole = (role === 'agent' && savedStatus !== 'approved') ? 'customer' : role;
    localStorage.setItem('cust_phone_number', phone);
    localStorage.setItem('user_role', effectiveRole);
    setPhoneNumber(phone);
    setUserRole(effectiveRole);
    setIsLoggedIn(true);
  };

  const logoutUser = () => {
    localStorage.removeItem('cust_phone_number');
    localStorage.removeItem('user_role');
    localStorage.removeItem('agent_commission');
    localStorage.removeItem('rentox_agent_status');
    localStorage.removeItem('rentox_agent_profile');
    localStorage.removeItem('rentox_agent_wallet');
    setPhoneNumber('');
    setUserRole('customer');
    setAgentCommission(0);
    setAgentStatus('not_checked');
    setAgentProfile(null);
    setIsLoggedIn(false);
  };

  return (
    <AppContext.Provider value={{
      phoneNumber,
      isLoggedIn,
      loginUser,
      logoutUser,
      userRole,
      setUserRole,
      agentStatus,
      setAgentStatus,
      agentProfile,
      setAgentProfile,
      fetchAgentStatus,
      agentCommission,
      setAgentCommission,
      tripType,
      setTripType,
      fromAddress,
      setFromAddress,
      toAddress,
      setToAddress,
      pickupDate,
      setPickupDate,
      pickupTime,
      setPickupTime,
      returnDate,
      setReturnDate,
      returnTime,
      setReturnTime,
      fromLat,
      setFromLat,
      fromLng,
      setFromLng,
      toLat,
      setToLat,
      toLng,
      setToLng,
      selectedCar,
      setSelectedCar,
      tempBookingId,
      setTempBookingId
    }}>
      {children}
    </AppContext.Provider>
  );
};
