require('dotenv').config();
const { sendOtp } = require('./utils/msg91');

(async () => {
  try {
    const res = await sendOtp({ email: 'sonic16t@gmail.com', name: 'Sonic' });
    console.log("Success:", res);
  } catch (err) {
    console.error("Error:", err.message);
    if (err.msg91) {
      console.error("Msg91 Details:", err.msg91);
    }
  }
})();
