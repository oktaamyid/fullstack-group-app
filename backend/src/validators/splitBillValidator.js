const { z } = require('zod');

const splitBillMemberSchema = z.object({
  friendName: z.string().min(2, 'Friend name must be at least 2 characters').max(100, 'Friend name is too long'),
  amount: z.number().int().positive('Amount must be positive').optional(),
});

const splitBillItemSchema = z.object({
  itemName: z.string().min(2, 'Item name must be at least 2 characters').max(100, 'Item name is too long'),
  price: z.number().int().positive('Price must be positive'),
  quantity: z.number().int().positive('Quantity must be positive').default(1),
  assignedTo: z.array(z.number().int()).optional(),
});

const createSplitBillSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(120, 'Title is too long'),
  description: z.string().max(255, 'Description is too long').optional().or(z.literal('')),
  totalAmount: z.number().int().positive('Total amount must be positive'),
  members: z.array(splitBillMemberSchema).min(1, 'At least one friend is required'),
  items: z.array(splitBillItemSchema).optional(),
  divisionMethod: z.enum(['EQUAL', 'CUSTOM', 'ITEM_BASED']).optional().default('CUSTOM'),
});

const updateSplitBillSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(120, 'Title is too long').optional(),
  description: z.string().max(255, 'Description is too long').optional().or(z.literal('')),
  totalAmount: z.number().int().positive('Total amount must be positive').optional(),
  members: z.array(splitBillMemberSchema).min(1, 'At least one friend is required').optional(),
  items: z.array(splitBillItemSchema).optional(),
  divisionMethod: z.enum(['EQUAL', 'CUSTOM', 'ITEM_BASED']).optional(),
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
