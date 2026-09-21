import { PhotoCamera as PhotoCameraIcon } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import SectionCard from "@/client/components/SectionCard";

import type { SessionPhoto, SiteOption, StudentPhotoOption } from "./types";

interface SessionPhotoUploadProps {
  view: "day" | "week";
  photoLocationId: string;
  photoStudentId: string;
  photoCaption: string;
  photoFile: File | null;
  photoItems: SessionPhoto[];
  siteOptions: SiteOption[];
  studentOptions: StudentPhotoOption[];
  isUploading: boolean;
  onLocationChange: (locationId: string) => void;
  onStudentChange: (studentId: string) => void;
  onCaptionChange: (caption: string) => void;
  onFileChange: (file: File | null) => void;
  onUpload: () => void;
}

export default function SessionPhotoUpload({
  view,
  photoLocationId,
  photoStudentId,
  photoCaption,
  photoFile,
  photoItems,
  siteOptions,
  studentOptions,
  isUploading,
  onLocationChange,
  onStudentChange,
  onCaptionChange,
  onFileChange,
  onUpload,
}: SessionPhotoUploadProps) {
  return (
    <SectionCard title="Session Photos" icon={<PhotoCameraIcon />}>
      {view === "week" && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Photo uploads are available in Day view only.
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 2,
          mb: 2,
        }}
      >
        <FormControl fullWidth>
          <InputLabel>Location</InputLabel>
          <Select
            value={photoLocationId}
            label="Location"
            onChange={(event) => {
              onLocationChange((event.target as unknown as { value: string }).value);
              onStudentChange("");
            }}
          >
            {siteOptions.map((site) => (
              <MenuItem key={site.id} value={site.id}>
                {site.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Student (optional)</InputLabel>
          <Select
            value={photoStudentId}
            label="Student (optional)"
            onChange={(event) =>
              onStudentChange((event.target as unknown as { value: string }).value)
            }
          >
            <MenuItem value="">All students at location</MenuItem>
            {studentOptions.map((student) => (
              <MenuItem key={student.id} value={student.id}>
                {student.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Caption (optional)"
          value={photoCaption}
          onChange={(event) =>
            onCaptionChange((event.target as unknown as { value: string }).value)
          }
          placeholder="Group speech practice at library"
        />

        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Button component="label" variant="outlined">
            Choose Photo
            <input
              hidden
              type="file"
              accept="image/*"
              onChange={(event) => onFileChange(event.target.files?.[0] || null)}
            />
          </Button>
          <Typography variant="body2" color="text.secondary">
            {photoFile?.name || "No file selected"}
          </Typography>
        </Stack>
      </Box>

      <Stack direction="row" sx={{ mb: 2, justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          onClick={onUpload}
          disabled={view !== "day" || !photoLocationId || !photoFile || isUploading}
        >
          {isUploading ? "Uploading..." : "Upload Photo"}
        </Button>
      </Stack>

      {photoItems.length > 0 ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" },
            gap: 2,
          }}
        >
          {photoItems.map((photo) => (
            <Card key={photo.id} variant="outlined">
              <Box
                component="img"
                src={photo.file_url}
                alt={photo.caption || photo.file_name}
                sx={{ width: "100%", height: 160, objectFit: "cover" }}
              />
              <CardContent>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {photo.location.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                  {photo.student ? `Student ${photo.student.initials}` : "Group photo"}
                </Typography>
                {photo.caption && (
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {photo.caption}
                  </Typography>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <Typography color="text.secondary">No photos uploaded for this date yet.</Typography>
      )}
    </SectionCard>
  );
}
