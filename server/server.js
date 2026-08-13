const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const employeeAuthRoutes = require('./employee/routes/authRoutes');
const employeeProfileRoutes = require('./employee/routes/profileRoutes');
const employerAuthRoutes = require('./employer/routes/authRoutes');

// Load env vars
dotenv.config();

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
app.use('/api/employer/auth', employerAuthRoutes);
app.use('/api/employer/jobs', require('./employer/routes/jobRoutes'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
