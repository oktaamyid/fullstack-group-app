const { z } = require("zod");

const transactionTypeSchema = z.enum(["INCOME", "EXPENSE"]);

const createTransactionSchema = z.object({
  type: transactionTypeSchema,
  amount: z.number().int().positive("Amount must be positive"),
  category: z
    .string()
    .min(2, "Category must be at least 2 characters")
    .max(80, "Category is too long")
    .optional()
    .or(z.literal("")),
  note: z.string().max(255, "Note is too long").optional().or(z.literal("")),
  receiptImage: z.string().optional().or(z.literal("")),
  receiptImageName: z
    .string()
    .max(255, "Receipt image name is too long")
    .optional()
    .or(z.literal("")),
  createdAt: z.string().datetime().optional(),
});

const updateTransactionSchema = z.object({
  type: transactionTypeSchema.optional(),
  amount: z.number().int().positive("Amount must be positive").optional(),
  category: z
    .string()
    .min(2, "Category must be at least 2 characters")
    .max(80, "Category is too long")
    .optional()
    .or(z.literal("")),
  note: z.string().max(255, "Note is too long").optional().or(z.literal("")),
  receiptImage: z.string().optional().or(z.literal("")),
  receiptImageName: z
    .string()
    .max(255, "Receipt image name is too long")
    .optional()
    .or(z.literal("")),
  createdAt: z.string().datetime().optional(),
});

module.exports = {
  createTransactionSchema,
  updateTransactionSchema,
};
