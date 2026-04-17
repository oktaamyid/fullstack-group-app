const AppError = require('../utils/AppError');

function validateRequest(schema) {
  return (req, _res, next) => {
    const validation = schema.safeParse(req.body);

    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      const firstError = Object.values(fieldErrors).find((errors) => Array.isArray(errors) && errors.length)?.[0];

      return next(
        new AppError('Validation failed', 422, {
          errors: fieldErrors,
          detail: firstError || 'Invalid request payload',
        })
      );
    }

    req.body = validation.data;
    return next();
  };
}

module.exports = validateRequest;
