// Email validation
const isValidEmail = (email) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

// Password validation (at least 6 characters)
const isValidPassword = (password) => {
  return password && password.length >= 6;
};

// Phone number validation
const isValidPhoneNumber = (phone) => {
  const phoneRegex = /^[0-9]{10,}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

module.exports = {
  isValidEmail,
  isValidPassword,
  isValidPhoneNumber,
};
