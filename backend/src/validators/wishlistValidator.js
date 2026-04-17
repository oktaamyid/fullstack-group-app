const { z } = require('zod');

const priorityScoreSchema = z.coerce
  .number()
  .int('Priority score must be an integer')
  .min(1, 'Priority score must be at least 1')
  .max(5, 'Priority score must be at most 5');

const createWishlistSchema = z.object({
  item: z.string().trim().min(2, 'Item must be at least 2 characters').max(120, 'Item is too long'),
  price: z.number().int().positive('Price must be positive'),
  priorityScore: priorityScoreSchema.default(3),
});

const updateWishlistSchema = z
  .object({
    item: z.string().trim().min(2, 'Item must be at least 2 characters').max(120, 'Item is too long').optional(),
    price: z.number().int().positive('Price must be positive').optional(),
    priorityScore: priorityScoreSchema.optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one field is required',
  });

module.exports = {
  createWishlistSchema,
  updateWishlistSchema,
};
