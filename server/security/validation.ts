import { z } from "zod";

export const contactFormSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters.")
    .max(100, "Name must be at most 100 characters.")
    .trim(),
  email: z.string().email("Please enter a valid email address.").max(254).toLowerCase().trim(),
  subject: z
    .string()
    .min(3, "Subject must be at least 3 characters.")
    .max(200, "Subject must be at most 200 characters.")
    .trim(),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters.")
    .max(5000, "Message must be at most 5000 characters.")
    .trim(),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

export const adminLoginSchema = z.object({
  username: z.string().min(1).max(100).trim(),
  password: z.string().min(8).max(256),
});

export type AdminLoginData = z.infer<typeof adminLoginSchema>;

export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}
