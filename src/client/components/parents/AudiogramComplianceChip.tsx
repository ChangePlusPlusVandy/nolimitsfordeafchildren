"use client";

import { CheckCircle as CheckCircleIcon, Warning as WarningIcon } from "@mui/icons-material";
import { Chip } from "@mui/material";
import type { AudiogramCompliance } from "@/client/parents";
import { formatDateOnly } from "@/client/utils/date";

interface AudiogramComplianceChipProps {
  compliance: AudiogramCompliance;
  size?: "small" | "medium";
}

export default function AudiogramComplianceChip({
  compliance,
  size = "small",
}: AudiogramComplianceChipProps) {
  const dueLabel = compliance.next_due_date
    ? ` (due ${formatDateOnly(compliance.next_due_date)})`
    : "";

  switch (compliance.status) {
    case "overdue":
      return (
        <Chip
          icon={<WarningIcon />}
          label={`Audiogram Overdue${dueLabel}`}
          color="error"
          size={size}
          variant="outlined"
        />
      );
    case "due_soon":
      return (
        <Chip
          icon={<WarningIcon />}
          label={`Audiogram Due Soon${dueLabel}`}
          color="warning"
          size={size}
          variant="outlined"
        />
      );
    case "up_to_date":
      return (
        <Chip
          icon={<CheckCircleIcon />}
          label={`Audiogram Up to Date${dueLabel}`}
          color="success"
          size={size}
          variant="outlined"
        />
      );
    default:
      return (
        <Chip
          icon={<WarningIcon />}
          label="Audiogram Required"
          color="warning"
          size={size}
          variant="outlined"
        />
      );
  }
}
