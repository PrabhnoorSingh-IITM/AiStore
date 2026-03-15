import { z } from 'zod';

const slugRegex = /^[a-z0-9-]+$/;
const PricingModelEnum = z.enum(['Free', 'Freemium', 'Paid', 'Usage_Based']);

export const createToolSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(255)
    .regex(slugRegex, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  website_url: z.string().url('Must be a valid URL format').optional().or(z.literal('')),
  pricing_model: PricingModelEnum.default('Free'),
  capability_score: z.number().min(0).max(10).optional(),
  speed_score: z.number().min(0).max(10).optional(),
  cost_efficiency_score: z.number().min(0).max(10).optional(),
  usefulness_score: z.number().min(0).max(10).optional(),
  category_ids: z.array(z.string().uuid('Invalid category ID format')).optional(),
});

export type CreateToolInput = z.infer<typeof createToolSchema>;

export const updateToolSchema = createToolSchema.partial().extend({
  overall_score: z.number().min(0).max(10).optional(),
});

export type UpdateToolInput = z.infer<typeof updateToolSchema>;

export const createTutorialSchema = z.object({
  tool_id: z.string().uuid('A valid Tool ID (UUID) is required'),
  title: z.string().min(3, 'Title must be at least 3 characters').max(255),
  content: z.string().min(10, 'Content cannot be empty').optional(),
  prompt_strategies: z.string().optional(),
  token_optimization_tips: z.string().optional(),
});

export type CreateTutorialInput = z.infer<typeof createTutorialSchema>;

export const updateTutorialSchema = createTutorialSchema.partial();
export type UpdateTutorialInput = z.infer<typeof updateTutorialSchema>;
