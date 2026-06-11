// Service layer (service layer pattern): business rules live here, with no
// knowledge of HTTP or SQL. Single Responsibility: this file decides WHO may
// log in and what a valid token is — nothing else.
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const users = require('../repositories/userRepository');

const JWT_SECRET = process.env.JWT_SECRET || 'lab-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

async function seedDefaultUsers() {
  if (await users.findByEmail('admin@restaurant.local')) return;
  const demo = [
    { email: 'admin@restaurant.local', password: 'admin123', name: 'Admin', role: 'admin' },
    { email: 'chef@restaurant.local', password: 'chef123', name: 'Chef', role: 'chef' },
    { email: 'billing@restaurant.local', password: 'billing123', name: 'Billing', role: 'billing' },
  ];
  for (const u of demo) {
    const hash = await bcrypt.hash(u.password, 10);
    await users.create({ email: u.email, password_hash: hash, name: u.name, role: u.role });
  }
}

async function login({ email, password }) {
  const user = email ? await users.findByEmail(email) : null;
  if (!user || !(await bcrypt.compare(password || '', user.password_hash))) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  return { user: { id: user.id, email: user.email, name: user.name, role: user.role }, token };
}

// Used by the API gateway to authorize protected routes (service-to-service).
async function verify(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await users.findById(payload.id);
    if (!user) throw new Error('gone');
    return user;
  } catch {
    const err = new Error('Invalid token');
    err.status = 401;
    throw err;
  }
}

module.exports = { seedDefaultUsers, login, verify };
