const { z } = require('zod');

const splitBillMemberSchema = z.object({
  friendName: z.string().min(2, 'Friend name must be at least 2 characters').max(100, 'Friend name is too long'),
  clientId: z.string().optional(),
  amount: z.number().int().nonnegative('Amount must be positive or 0').optional(),
  isUser: z.boolean().optional(),
});

const splitBillItemSchema = z.object({
  itemName: z.string().min(2, 'Item name must be at least 2 characters').max(100, 'Item name is too long'),
  price: z.number().int().nonnegative('Price must be positive or 0'),
  quantity: z.number().int().nonnegative('Quantity must be positive or 0').default(1),
  assignedTo: z.array(z.union([z.string(), z.number().int()])).optional(),
});

const createSplitBillSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(120, 'Title is too long'),
  description: z.string().max(2000, 'Description is too long').optional().or(z.literal('')),
  totalAmount: z.number().int().nonnegative('Total amount must be positive or 0'),
  members: z.array(splitBillMemberSchema).min(1, 'At least one friend is required'),
  items: z.array(splitBillItemSchema).optional(),
  divisionMethod: z.enum(['EQUAL', 'CUSTOM', 'ITEM_BASED']).optional().default('CUSTOM'),
  syncToPersonal: z.boolean().optional().default(false),
  walletId: z.coerce.number().int().positive('Invalid walletId').optional(),
});

const updateSplitBillSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(120, 'Title is too long').optional(),
  description: z.string().max(2000, 'Description is too long').optional().or(z.literal('')),
  totalAmount: z.number().int().nonnegative('Total amount must be positive or 0').optional(),
  members: z.array(splitBillMemberSchema).min(1, 'At least one friend is required').optional(),
  items: z.array(splitBillItemSchema).optional(),
  divisionMethod: z.enum(['EQUAL', 'CUSTOM', 'ITEM_BASED']).optional(),
  syncToPersonal: z.boolean().optional(),
  walletId: z.coerce.number().int().positive('Invalid walletId').optional(),
});

const updateMemberStatusSchema = z.object({
  status: z.enum(['PAID', 'UNPAID']),
});

module.exports = {
  createSplitBillSchema,
  updateSplitBillSchema,
  updateMemberStatusSchema,
  splitBillItemSchema,
};
