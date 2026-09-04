"use server";

import { z } from "zod";
import {
  type CreateLocationDto,
  LocationsService,
  type UpdateLocationDto,
} from "@/server/locations/service";
import { requireRole } from "@/server/shared/auth-guard";
import { NotFoundError } from "@/server/shared/errors";

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

/**
 * POST /v1/locations — create a location (admin only).
 */
export async function createLocation(input: CreateLocationDto) {
  await requireRole("administrator");
  const parsed = createLocationSchema.parse(input) as CreateLocationDto;
  return await new LocationsService().create(parsed);
}

/**
 * PATCH /v1/locations/:siteId — update a location (admin only).
 */
export async function updateLocation(siteId: string, input: UpdateLocationDto) {
  await requireRole("administrator");
  const parsed = updateLocationSchema.parse(input) as UpdateLocationDto;
  const location = await new LocationsService().update(siteId, parsed);
  if (!location) {
    throw new NotFoundError("Location not found");
  }
  return location;
}
