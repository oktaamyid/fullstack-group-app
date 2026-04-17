const { sendError, sendSuccess } = require('../utils/apiResponse');
const { contactSchema } = require('../validators/contactValidator');

function buildContactReference() {
  const stamp = Date.now().toString(36).toUpperCase();
  const nonce = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `CNT-${stamp}-${nonce}`;
}

async function submitContact(req, res) {
  const validation = contactSchema.safeParse(req.body);
  if (!validation.success) {
    return sendError(res, 'Validation failed', 422, {
      errors: validation.error.flatten().fieldErrors,
    });
  }

  const { name, email, subject, message } = validation.data;

  try {
    const contact = {
      reference: buildContactReference(),
      name,
      email,
      subject,
      message,
      createdAt: new Date().toISOString(),
    };

    return sendSuccess(
      res,
      { contact },
      'Contact message received successfully',
      201
    );
  } catch (error) {
    return sendError(res, 'Failed to process contact message', 500, {
      error: error.message,
    });
  }
}

module.exports = {
  submitContact,
};
