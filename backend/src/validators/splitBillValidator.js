const { z } = require('zod');

const splitBillMemberSchema = z.object({
  friendName: z.string().min(2, 'Friend name must be at least 2 characters').max(100, 'Friend name is too long'),
  amount: z.number().int().positive('Amount must be positive').optional(),
});

const createSplitBillSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(120, 'Title is too long'),
  description: z.string().max(255, 'Description is too long').optional().or(z.literal('')),
  totalAmount: z.number().int().positive('Total amount must be positive'),
  members: z.array(splitBillMemberSchema).min(1, 'At least one friend is required'),
});

const updateSplitBillSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(120, 'Title is too long').optional(),
  description: z.string().max(255, 'Description is too long').optional().or(z.literal('')),
  totalAmount: z.number().int().positive('Total amount must be positive').optional(),
  members: z.array(splitBillMemberSchema).min(1, 'At least one friend is required').optional(),
});

const updateMemberStatusSchema = z.object({
  status: z.enum(['PAID', 'UNPAID']),
});

module.exports = {
  createSplitBillSchema,
  updateSplitBillSchema,
  updateMemberStatusSchema,
};
