const { z } = require('zod');

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  email: z.string().email('Invalid email format').toLowerCase(),
  subject: z.string().min(3, 'Subject must be at least 3 characters').max(120, 'Subject is too long'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(1000, 'Message is too long'),
});

module.exports = {
  contactSchema,
};
