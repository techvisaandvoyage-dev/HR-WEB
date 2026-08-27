const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const EmployeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
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
  mobile: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  preferredLocation: {
    type: String,
    default: ''
  },
  // Profile Fields
  designation: {
    type: String,
    default: ''
  },
  industry: {
    type: String,
    default: ''
  },
  totalExperience: {
    type: String,
    default: ''
  },
  brief: {
    type: String,
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  resume: {
    type: String,
    default: ''
  },
  coverLetter: {
    type: String,
    default: ''
  },
  isFresher: {
    type: Boolean,
    default: true
  },
  qualifications: {
    type: Array,
    default: []
  },
  experience: {
    type: Array,
    default: []
  },
  professionalDetails: {
    type: Object,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password using bcrypt
EmployeeSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
EmployeeSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Employee', EmployeeSchema);
