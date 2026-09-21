"use client";

import AddIcon from "@mui/icons-material/Add";
import DescriptionIcon from "@mui/icons-material/Description";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { Button, Stack, Typography } from "@mui/material";

import SectionCard from "@/client/components/SectionCard";
import DocumentList from "@/client/components/students/DocumentList";

interface DocumentsSectionProps {
  studentId: string;
  mode: "admin" | "teacher";
  onUpload: (type?: "pre_report" | "graduation_speech") => void;
}

export default function DocumentsSection({ studentId, mode, onUpload }: DocumentsSectionProps) {
  if (mode === "teacher") {
    return (
      <SectionCard
        title="Documents"
        icon={<DescriptionIcon />}
        actions={
          <Stack direction="row" spacing={1}>
            <Button size="small" startIcon={<AddIcon />} onClick={() => onUpload("pre_report")}>
              Pre-Report
            </Button>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => onUpload("graduation_speech")}
            >
              Speech
            </Button>
          </Stack>
        }
      >
        <DocumentList studentId={studentId} reviewStatusFilter="approved" />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
          Pre-reports and graduation speeches appear here after admin approval.
        </Typography>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Documents"
      icon={<DescriptionIcon />}
      actions={
        <Button size="small" startIcon={<PersonAddIcon />} onClick={() => onUpload()}>
          Upload
        </Button>
      }
    >
      <DocumentList studentId={studentId} canDelete onUploadClick={() => onUpload()} />
    </SectionCard>
  );
}
