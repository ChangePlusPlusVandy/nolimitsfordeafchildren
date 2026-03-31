ALTER TABLE "siblings"
  ADD COLUMN "is_participant" boolean NOT NULL DEFAULT true,
  ADD COLUMN "has_hearing_loss" boolean NOT NULL DEFAULT false;
