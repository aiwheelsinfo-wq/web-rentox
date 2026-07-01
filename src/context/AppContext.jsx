import React, { createContext, useState, useEffect } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Search parameters
  const [tripType, setTripType] = useState('One-way'); // One-way, Round-Trip, Local-Duty
  const [fromAddress, setFromAddress] = useState('Pune, Maharashtra, India');
  const [toAddress, setToAddress] = useState('Mumbai, Maharashtra, India');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('10:00 AM');
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState('10:00 AM');
  
  // Lat/Lng coordinates for location estimation (similar to customer app)
  const [fromLat, setFromLat] = useState(18.52043);
  const [fromLng, setFromLng] = useState(73.856743);
  const [toLat, setToLat] = useState(19.07609);
  const [toLng, setToLng] = useState(72.877707);

  // Active selections
  const [selectedCar, setSelectedCar] = useState(null);
  const [tempBookingId, setTempBookingId] = useState('');

  // Persist authentication state
  useEffect(() => {
    const savedPhone = localStorage.getItem('cust_phone_number');
    if (savedPhone) {
      setPhoneNumber(savedPhone);
      setIsLoggedIn(true);
    }
  }, []);

  const loginUser = (phone) => {
    localStorage.setItem('cust_phone_number', phone);
    setPhoneNumber(phone);
    setIsLoggedIn(true);
  };

  const logoutUser = () => {
    localStorage.removeItem('cust_phone_number');
    setPhoneNumber('');
    setIsLoggedIn(false);
  };

  return (
    <AppContext.Provider value={{
      phoneNumber,
      isLoggedIn,
      loginUser,
      logoutUser,
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
