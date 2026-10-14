"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getSession } from "@/server/auth/session";
import { getProjectService } from "@/server/services";
import { notifySearchEngines } from "@/server/seo/searchEngineNotifier";

const createProjectSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(200),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required.")
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug may only contain lowercase letters, numbers, and hyphens."),
  summary: z.string().trim().max(300).default(""),
  description: z.string().trim().max(10000).default(""),
  technologies: z.array(z.string().trim().min(1).max(50)).max(30).default([]),
  features: z.array(z.string().trim().min(1).max(200)).max(30).default([]),
  coverImage: z.union([z.literal(""), z.string().trim().url()]).default(""),
  liveUrl: z.union([z.literal(""), z.string().trim().url()]).default(""),
  githubUrl: z.union([z.literal(""), z.string().trim().url()]).default(""),
  featured: z.boolean().default(false),
});

export type CreateProjectActionInput = z.input<typeof createProjectSchema>;
export type UpdateProjectActionInput = z.input<typeof createProjectSchema>;

export interface ActionResult {
  ok: boolean;
  error?: string;
}

async function requireAdmin(): Promise<boolean> {
  // Server Functions are public HTTP endpoints — never rely on the proxy alone.
  const session = await getSession();
  return session.isAdmin === true;
}

/** Current slug of a project, or null when it can't be read (notification is best effort). */
async function getProjectSlug(id: string): Promise<string | null> {
  const result = await getProjectService().getById(id);
  return result.ok && result.value ? result.value.slug : null;
}

export async function createProjectAction(input: CreateProjectActionInput): Promise<ActionResult> {
  if (!(await requireAdmin())) {
    return { ok: false, error: "Unauthorized." };
  }

  const parsed = createProjectSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { liveUrl, githubUrl, ...rest } = parsed.data;
  const result = await getProjectService().create({
    ...rest,
    gallery: [],
    liveUrl: liveUrl || undefined,
    githubUrl: githubUrl || undefined,
    featuredOrder: undefined,
  });

  if (!result.ok) {
    return { ok: false, error: result.error.message };
  }

  revalidatePath("/projects");
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
  notifySearchEngines([`/projects/${result.value.slug}`, "/projects", "/"]);
  return { ok: true };
}

export async function updateProjectAction(id: string, input: UpdateProjectActionInput): Promise<ActionResult> {
  if (!(await requireAdmin())) {
    return { ok: false, error: "Unauthorized." };
  }

  const parsed = createProjectSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { liveUrl, githubUrl, ...rest } = parsed.data;
  // Read before writing so a renamed slug can be announced as gone.
  const previousSlug = await getProjectSlug(id);
  const result = await getProjectService().update(id, {
    ...rest,
    liveUrl: liveUrl || undefined,
    githubUrl: githubUrl || undefined,
  });

  if (!result.ok) {
    return { ok: false, error: result.error.message };
  }
  if (!result.value) {
    return { ok: false, error: "Project not found." };
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${parsed.data.slug}`);
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
  const changed = [`/projects/${result.value.slug}`, "/projects", "/"];
  if (previousSlug && previousSlug !== result.value.slug) {
    revalidatePath(`/projects/${previousSlug}`);
    changed.push(`/projects/${previousSlug}`);
  }
  notifySearchEngines(changed);
  return { ok: true };
}

export async function deleteProjectAction(id: string): Promise<ActionResult> {
  if (!(await requireAdmin())) {
    return { ok: false, error: "Unauthorized." };
  }

  const slug = await getProjectSlug(id);
  const result = await getProjectService().delete(id);
  if (!result.ok) {
    return { ok: false, error: result.error.message };
  }
  if (!result.value) {
    return { ok: false, error: "Project not found." };
  }

  revalidatePath("/projects");
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
  if (slug) revalidatePath(`/projects/${slug}`);
  notifySearchEngines([...(slug ? [`/projects/${slug}`] : []), "/projects", "/"]);
  return { ok: true };
}
