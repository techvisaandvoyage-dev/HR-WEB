const https = require('https');
const express = require('express');
const dotenv = require('dotenv');

// Load env vars before requiring local modules that might depend on them
dotenv.config();

const cors = require('cors');
const connectDB = require('./config/db');
const employeeAuthRoutes = require('./employee/routes/authRoutes');
const employeeProfileRoutes = require('./employee/routes/profileRoutes');
const employerAuthRoutes = require('./employer/routes/authRoutes');
// Connect to database
connectDB();

const app = express();

// Transparent proxy for Firebase Auth Handler on custom domain (sahijob.com/__/auth/*)
app.use('/__/auth', (req, res) => {
  const targetUrl = `https://hr-website-6c387.firebaseapp.com/__/auth${req.url}`;
  https.get(targetUrl, (firebaseRes) => {
    res.writeHead(firebaseRes.statusCode, firebaseRes.headers);
    firebaseRes.pipe(res);
  }).on('error', (err) => {
    console.error('Firebase Auth proxy error:', err);
    res.status(500).send('Auth proxy error');
  });
});

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Mount routers
app.use('/api/employee/auth', employeeAuthRoutes);
app.use('/api/employee/profile', employeeProfileRoutes);
app.use('/api/employee/jobs', require('./employee/routes/jobRoutes'));
app.use('/api/employee/messages', require('./employee/routes/messageRoutes'));
app.use('/api/employer/auth', employerAuthRoutes);
app.use('/api/employer/jobs', require('./employer/routes/jobRoutes'));
app.use('/api/employer/employees', require('./employer/routes/employeeRoutes'));
app.use('/api/employer/messages', require('./employer/routes/messageRoutes'));
app.use('/api/pages', require('./routes/pageRoutes'));
app.use('/api/homepage', require('./routes/homepageRoutes'));
app.use('/api/footer', require('./routes/footerRoutes'));
app.use('/api/mux', require('./routes/muxRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Root health check endpoint
app.get('/', (req, res) => {
  res.status(200).send('API Server is running');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
