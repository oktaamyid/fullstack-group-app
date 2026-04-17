const AppError = require('../utils/AppError');

function notFoundHandler(_req, _res, next) {
  next(new AppError('Route not found', 404));
}

function jsonParseErrorHandler(error, _req, res, next) {
  if (error && (error.type === 'entity.parse.failed' || (error instanceof SyntaxError && error.status === 400 && 'body' in error))) {
    return res.status(400).json({
      success: false,
      data: {
        detail: 'Request body must be valid JSON',
      },
      message: 'Invalid JSON payload',
    });
  }

  return next(error);
}

function globalErrorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || error.status || 500;
  const isValidationError = error.name === 'ZodError';
  const isAppError = error.isOperational === true;

  if (isValidationError) {
    return res.status(422).json({
      success: false,
      data: {
        detail: 'Invalid request payload',
      },
      message: 'Validation failed',
    });
  }

  if (isAppError) {
    return res.status(statusCode).json({
      success: false,
      data: error.data || {},
      message: error.message || 'Request failed',
    });
  }

  if (statusCode < 500) {
    return res.status(statusCode).json({
      success: false,
      data: error.data || {},
      message: error.message || 'Request failed',
    });
  }

  console.error('Unhandled application error:', error);

  return res.status(statusCode).json({
    success: false,
    data: {},
    message: 'Internal server error',
  });
}

module.exports = {
  notFoundHandler,
  jsonParseErrorHandler,
  globalErrorHandler,
};
