"use server";

import { z } from "zod";

import { requireRole } from "@/_platform/auth/guard";
import { NotFoundError } from "@/_shared/server/errors";

import type { UpdateLocationDto } from "../_domain/types";
import { updateLocation as update } from "./service";

const updateLocationSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    type: z.enum(["education_center", "pop_up", "remote"]).optional(),
    address_line1: z.string().max(200).optional(),
    address_line2: z.string().max(200).nullable().optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    postal_code: z.string().max(20).optional(),
    country: z.string().max(100).optional(),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
    timezone: z.string().max(100).optional(),
    zoom_link: z.string().max(500).nullable().optional(),
    is_active: z.boolean().optional(),
  })
  .passthrough();

export async function updateLocation(siteId: string, input: UpdateLocationDto) {
  await requireRole("administrator");
  const parsed = updateLocationSchema.parse(input) as UpdateLocationDto;
  const location = await update(siteId, parsed);
  if (!location) {
    throw new NotFoundError("Location not found");
  }
  return location;
}
