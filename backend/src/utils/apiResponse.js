function sendSuccess(res, data = {}, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  });
}

function sendError(res, message = 'Request failed', statusCode = 400, data = {}) {
  return res.status(statusCode).json({
    success: false,
    data,
    message,
  });
}

module.exports = {
  sendSuccess,
  sendError,
};
