const http = require('http');
const https = require('https');
const express = require('express');
const dotenv = require('dotenv');

// Load env vars before requiring local modules that might depend on them
dotenv.config();

const cors = require('cors');
const connectDB = require('./config/db');
const { initSocket } = require('./socket');
const employeeAuthRoutes = require('./employee/routes/authRoutes');
const employeeProfileRoutes = require('./employee/routes/profileRoutes');
const employerAuthRoutes = require('./employer/routes/authRoutes');
// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

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

// Body parser with 10mb limit for uploads and settings
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
app.use('/api/employer/sheets', require('./employer/routes/googleSheetRoutes'));
app.use('/api/pages', require('./routes/pageRoutes'));
app.use('/api/homepage', require('./routes/homepageRoutes'));
app.use('/api/footer', require('./routes/footerRoutes'));
app.use('/api/mux', require('./routes/muxRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/admin/backup', require('./routes/backupRoutes'));
app.use('/api/education', require('./routes/educationRoutes'));
app.use('/api/institutions', require('./routes/institutionRoutes'));
app.use('/api/occupations', require('./routes/occupationRoutes'));
app.use('/api/companies', require('./routes/companyRoutes'));

// SEO, Sitemap & Robots
const seoRoutes = require('./routes/seoRoutes');
app.get('/sitemap.xml', async (req, res, next) => {
  const { generateSitemapXml } = require('./services/seoService');
  try {
    const { xml } = await generateSitemapXml();
    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=3600');
    return res.send(xml);
  } catch (err) {
    next(err);
  }
});
app.get('/robots.txt', async (req, res, next) => {
  const { generateRobotsTxt } = require('./services/seoService');
  try {
    const txt = await generateRobotsTxt();
    res.header('Content-Type', 'text/plain');
    res.header('Cache-Control', 'public, max-age=3600');
    return res.send(txt);
  } catch (err) {
    next(err);
  }
});
app.use('/api/seo', seoRoutes);

// Root health check endpoint
app.get('/', (req, res) => {
  res.status(200).send('API Server is running');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

const PORT = process.env.PORT || 5000;
const { initBackupScheduler } = require('./services/backupSchedulerService');

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Initialize automated 15-day database backup scheduler
  initBackupScheduler();
});

