const authService = require('../services/authService');
const { isEmail, isNonEmptyString } = require('../utils/validators');

async function register(req, res, next) {
  try {
    const { email, password, name, role } = req.body;
    if (!isEmail(email)) return res.status(400).json({ error: 'Invalid email' });
    if (!isNonEmptyString(password) || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    if (!isNonEmptyString(name)) return res.status(400).json({ error: 'Name required' });
    const result = await authService.register({ email, password, name, role });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!isEmail(email) || !isNonEmptyString(password)) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const result = await authService.login({ email, password });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

function me(req, res) {
  res.json({ user: req.user });
}

function logout(req, res) {
  res.json({ ok: true });
}

module.exports = { register, login, me, logout };
