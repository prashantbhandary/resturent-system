// Service layer (service layer pattern): business rules live here, with no
// knowledge of HTTP or SQL. Single Responsibility: this file decides WHO may
// log in and what a valid token is — nothing else.
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const users = require('../repositories/userRepository');

const JWT_SECRET = process.env.JWT_SECRET || 'lab-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const ROLES = ['admin', 'chef', 'billing', 'waiter'];

async function seedDefaultUsers() {
  const demo = [
    { email: 'admin@restaurant.local', password: 'admin123', name: 'Admin', role: 'admin' },
    { email: 'chef@restaurant.local', password: 'chef123', name: 'Chef', role: 'chef' },
    { email: 'billing@restaurant.local', password: 'billing123', name: 'Billing', role: 'billing' },
    { email: 'waiter@restaurant.local', password: 'waiter123', name: 'Waiter', role: 'waiter' },
  ];
  for (const u of demo) {
    if (await users.findByEmail(u.email)) continue;
    const hash = await bcrypt.hash(u.password, 10);
    await users.create({ email: u.email, password_hash: hash, name: u.name, role: u.role });
  }
}

const publicUser = (u) => ({ id: u.id, email: u.email, name: u.name, role: u.role });
const signToken = (u) => jwt.sign({ id: u.id, role: u.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

async function login({ email, password }) {
  const user = email ? await users.findByEmail(email) : null;
  if (!user || !user.active || !(await bcrypt.compare(password || '', user.password_hash))) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }
  return { user: publicUser(user), token: signToken(user) };
}

async function register({ email, password, name, role = 'waiter' }) {
  if (!email || !password || password.length < 6 || !name) {
    const err = new Error('email, name and a password of 6+ characters required');
    err.status = 400;
    throw err;
  }
  if (!ROLES.includes(role)) {
    const err = new Error(`role must be one of ${ROLES.join(', ')}`);
    err.status = 400;
    throw err;
  }
  if (await users.findByEmail(email)) {
    const err = new Error('Email already registered');
    err.status = 409;
    throw err;
  }
  const password_hash = await bcrypt.hash(password, 10);
  const user = await users.create({ email, password_hash, name, role });
  return { user, token: signToken(user) };
}

// Used by the API gateway to authorize protected routes (service-to-service).
async function verify(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await users.findById(payload.id);
    if (!user || !user.active) throw new Error('gone');
    return publicUser(user);
  } catch {
    const err = new Error('Invalid token');
    err.status = 401;
    throw err;
  }
}

module.exports = { seedDefaultUsers, login, register, verify, ROLES };
