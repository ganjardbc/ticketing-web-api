function formatResponse(success, data, message = '') {
  const response = { success, data };
  if (message) response.message = message;
  return response;
}

module.exports = { formatResponse };
