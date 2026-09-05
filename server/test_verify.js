require('dotenv').config();
const { sendOtp, verifyOtp } = require('./utils/email');

(async () => {
  try {
    const res = await sendOtp({ email: 'test@gmail.com', name: 'Test' });
    console.log("Send Result:", res);
    
    // We need a way to get the generated OTP from the store for testing
    // We can't access it directly, but let's assume we can mock it or we just look at the store
    // Let's modify email.js temporarily to return the OTP in the test environment if needed,
    // or just let it fail to see what error it throws.
  } catch (err) {
    console.error("Error:", err.message);
  }
})();
