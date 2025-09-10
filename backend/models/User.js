const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = [
  'admin',
  'director_rrhh',
  'gerente_rrhh',
  'colaborador_rrhh',
  'director',
  'gerente',
  'colaborador'
];

const PERMISSIONS = {
  capacitacion: ['view', 'createRequest', 'approve', 'manageCourses', 'viewAllRequests', 'configurePolicies', 'generateReports'],
  vacantes: ['view', 'apply', 'refer', 'createJob', 'manageJobs', 'manageSelection', 'viewAllApplications', 'approveJobs', 'generateReports', 'configurePolicies', 'manageReferrals']
};

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre es obligatorio']
  },
  email: {
    type: String,
    required: [true, 'El correo es obligatorio'],
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria']
  },
  role: {
    type: String,
    enum: ROLES,
    default: 'colaborador'
  },
  permissions: {
    type: Object,
    default: PERMISSIONS
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encriptar contraseña antes de guardar
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Método para comparar contraseña
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
