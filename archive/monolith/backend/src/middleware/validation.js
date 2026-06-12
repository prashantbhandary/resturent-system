function validateBody(schema) {
  return (req, res, next) => {
    const errors = [];
    for (const [key, check] of Object.entries(schema)) {
      const value = req.body[key];
      const result = check(value, req.body);
      if (result !== true) errors.push(`${key}: ${result}`);
    }
    if (errors.length) return res.status(400).json({ error: errors.join('; ') });
    next();
  };
}

module.exports = { validateBody };
