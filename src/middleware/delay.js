function delayMiddleware(req, res, next) {
  const delay = Math.random() * 500 + 300;
  setTimeout(next, delay);
}

module.exports = { delayMiddleware };
