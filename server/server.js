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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
