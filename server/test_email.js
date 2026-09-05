require('dotenv').config();
const { sendOtp } = require('./utils/email');

(async () => {
  try {
    const res = await sendOtp({ email: 'sonic16t@gmail.com', name: 'Sonic' });
    console.log("Success:", res);
  } catch (err) {
    console.error("Error:", err.message);
  }
})();
