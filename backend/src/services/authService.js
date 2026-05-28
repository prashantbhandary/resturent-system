const bcrypt = require('bcryptjs');
const User = require('../models/user');
const { sign } = require('../utils/jwt');

async function register({ email, password, name, role = 'admin' }) {
  const existing = await User.findByEmail(email);
  if (existing) {
    const err = new Error('Email already registered');
    err.status = 409;
    throw err;
  }
  const password_hash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, password_hash, name, role });
  const token = sign({ id: user.id, role: user.role });
  return { user, token };
}

async function login({ email, password }) {
  const user = await User.findByEmail(email);
  if (!user || !user.active) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }
  const token = sign({ id: user.id, role: user.role });
  delete user.password_hash;
  return { user, token };
}

module.exports = { register, login };
