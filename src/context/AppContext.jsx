import React, { createContext, useState, useEffect } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [phoneNumber, setPhoneNumber] = useState(() => localStorage.getItem('cust_phone_number') || '');
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('cust_phone_number'));

  // Search parameters persisted to localStorage to prevent refresh data loss
  const [tripType, setTripType] = useState(() => localStorage.getItem('search_tripType') || 'One-way');
  const [fromAddress, setFromAddress] = useState(() => localStorage.getItem('search_fromAddress') || 'Pune, Maharashtra, India');
  const [toAddress, setToAddress] = useState(() => localStorage.getItem('search_toAddress') || 'Mumbai, Maharashtra, India');
  const [pickupDate, setPickupDate] = useState(() => localStorage.getItem('search_pickupDate') || '');
  const [pickupTime, setPickupTime] = useState(() => localStorage.getItem('search_pickupTime') || '10:00 AM');
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
  const [tempBookingId, setTempBookingId] = useState(() => localStorage.getItem('search_tempBookingId') || '');

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
    localStorage.setItem('search_tempBookingId', tempBookingId);
  }, [tempBookingId]);

  const [userRole, setUserRole] = useState(() => localStorage.getItem('user_role') || 'customer');
  const [agentCommission, setAgentCommission] = useState(() => parseFloat(localStorage.getItem('agent_commission') || '0'));

  useEffect(() => {
    localStorage.setItem('user_role', userRole);
  }, [userRole]);

  useEffect(() => {
    localStorage.setItem('agent_commission', String(agentCommission));
  }, [agentCommission]);

  const loginUser = (phone, role = 'customer') => {
    localStorage.setItem('cust_phone_number', phone);
    localStorage.setItem('user_role', role);
    setPhoneNumber(phone);
    setUserRole(role);
    setIsLoggedIn(true);
  };

  const logoutUser = () => {
    localStorage.removeItem('cust_phone_number');
    localStorage.removeItem('user_role');
    localStorage.removeItem('agent_commission');
    setPhoneNumber('');
    setUserRole('customer');
    setAgentCommission(0);
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
