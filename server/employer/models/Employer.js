const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const EmployerSchema = new mongoose.Schema({
  mobile: {
    type: String,
    default: ''
  },
  accountType: {
    type: String,
    enum: ['company', 'individual'],
    default: 'company'
  },
  fullName: {
    type: String,
    required: [true, 'Please add full name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    minlength: 6,
    select: false
  },
  
  // Company details (Step 3)
  hiringFor: {
    type: String,
    enum: ['your_company', 'consultant'],
    default: 'your_company'
  },
  companyName: {
    type: String,
    default: ''
  },
  industry: {
    type: String,
    default: ''
  },
  employees: {
    type: String,
    default: ''
  },
  designation: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  aboutCompany: {
    type: String,
    default: ''
  },
  website: {
    type: String,
    default: ''
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password using bcrypt
EmployerSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
EmployerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Employer', EmployerSchema);
