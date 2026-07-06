import axios from 'axios';

// Centralized API configuration pointing to legacy 2025 PHP APIs
export const API_BASE_URL = 'https://agnicarrental.com/2025';

export const RAZORPAY_KEY = 'rzp_test_GIqSfPJk12gAgz'; // Test Key matching the Flutter customer app configuration

export const endpoints = {
  checkPhoneStatus: `${API_BASE_URL}/check_phone_status.php`,
  sendOtp: `${API_BASE_URL}/send_otp.php`,
  savePhone: `${API_BASE_URL}/savePhone.php`,
  selectCarCostList: `${API_BASE_URL}/selectCarCostList.php`,
  getInvoiceData: `${API_BASE_URL}/get_invoice_data.php`,
  saveBooking: `${API_BASE_URL}/saveBooking.php`,
  updatePayment: `${API_BASE_URL}/updatePayment.php`,
  bookingStatus: `${API_BASE_URL}/bookingStatus.php`,
  cancelBooking: `${API_BASE_URL}/cancel_booking.php`,
  driverDetails: `${API_BASE_URL}/driverDetails.php`,
  specialLocation: `${API_BASE_URL}/special_location.php`,
  saveOneWayTemp: `${API_BASE_URL}/saveOneWayTemp.php`,
  customerReferral: `${API_BASE_URL}/customer_referral.php`,
  customerReg: `${API_BASE_URL}/customer_reg.php`,
  getCustomerData: `${API_BASE_URL}/get_customer_data.php`,
  tripLiveMapping: `${API_BASE_URL}/driver2025_src/trip_live_mapping_backend.php`,
};

// Create axios instance with default configurations
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
});

export default apiClient;
