import { z } from "zod";

export const createCommunitySchema = z.object({
  name: z.string().trim().min(1, "Community name is required"),

  description: z.string().trim().min(1, "Description is required"),

  emailContact: z
    .string()
    .trim()
    .min(1, "Email contact is required")
    .email("Invalid email format"),

  phoneContact: z.string().trim().min(1, "Phone contact is required"),

  waContact: z.string().trim().min(1, "WhatsApp contact is required"),
});

export type CreateCommunityInput = z.infer<typeof createCommunitySchema>;
