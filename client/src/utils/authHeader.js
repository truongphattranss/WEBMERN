/**
 * Tạo header xác thực để gửi kèm trong các request API
 * @returns {Object} Header xác thực với token
 */
export default function authHeader() {
  const token = localStorage.getItem('token');
  
  if (token) {
    // Log để debug
    console.log('Token found:', token.substring(0, 15) + '...');
    return { Authorization: `Bearer ${token}` };
  } else {
    console.log('No token found in localStorage');
    return {};
  }
} 