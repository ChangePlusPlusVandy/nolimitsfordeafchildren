"use server";

import { z } from "zod";

import { requireRole } from "@/_platform/auth/guard";

import type { CreateLocationDto } from "../_domain/types";
import { createLocation as create } from "./service";

const createLocationSchema = z
  .object({
    name: z.string().min(1).max(200),
    type: z.enum(["education_center", "pop_up", "remote"]),
    address_line1: z.string().max(200),
    address_line2: z.string().max(200).nullable().optional(),
    city: z.string().max(100),
    state: z.string().max(100),
    postal_code: z.string().max(20),
    country: z.string().max(100).optional(),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
    timezone: z.string().max(100).optional(),
    zoom_link: z.string().max(500).nullable().optional(),
    is_active: z.boolean().optional(),
  })
  .passthrough();

export async function createLocation(input: CreateLocationDto) {
  await requireRole("administrator");
  const parsed = createLocationSchema.parse(input) as CreateLocationDto;
  return await create(parsed);
}
