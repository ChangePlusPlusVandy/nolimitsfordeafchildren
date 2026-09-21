"use client";

import { CloudUpload as CloudUploadIcon } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useId, useState } from "react";

import { useToast } from "@/client/components/ToastProvider";
import {
  confirmChildDocumentUpload,
  getChildDocumentUploadUrl,
  type ParentDocumentType,
} from "@/client/parents";

interface UploadChildDocumentModalProps {
  open: boolean;
  onClose: () => void;
  studentId: string;
  studentName?: string;
  defaultDocumentType?: ParentDocumentType;
}

const DOCUMENT_TYPES: { value: ParentDocumentType; label: string }[] = [
  { value: "audiogram", label: "Audiogram" },
  { value: "iep", label: "IEP (Individualized Education Program)" },
  { value: "annual_test_result", label: "Annual Test Result" },
  { value: "other", label: "Other" },
];

export default function UploadChildDocumentModal({
  open,
  onClose,
  studentId,
  studentName,
  defaultDocumentType,
}: UploadChildDocumentModalProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const fileInputId = useId();

  const [documentType, setDocumentType] = useState<ParentDocumentType | "">("");
  const [documentDate, setDocumentDate] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const getUploadUrlMutation = useMutation({
    mutationFn: (input: {
      document_type: ParentDocumentType;
      file_name: string;
      content_type: string;
    }) => getChildDocumentUploadUrl(studentId, input),
  });

  const confirmUploadMutation = useMutation({
    mutationFn: (input: {
      document_type: ParentDocumentType;
      file_url: string;
      file_name: string;
      file_size: number;
      mime_type: string;
      document_date?: string;
    }) => confirmChildDocumentUpload(studentId, input),
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentType) return;

    if (documentType === "audiogram" && !documentDate) {
      setError("Audiogram date is required.");
      return;
    }

    setError(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      setUploadProgress(10);
      const { upload_url, file_url } = await getUploadUrlMutation.mutateAsync({
        document_type: documentType,
        file_name: selectedFile.name,
        content_type: selectedFile.type || "application/octet-stream",
      });

      setUploadProgress(40);
      const formData = new FormData();
      formData.append("file", selectedFile);
      const uploadResponse = await fetch(upload_url, {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload ${selectedFile.name} to storage`);
      }

      setUploadProgress(75);
      await confirmUploadMutation.mutateAsync({
        document_type: documentType,
        file_url,
        file_name: selectedFile.name,
        file_size: selectedFile.size,
        mime_type: selectedFile.type || "application/octet-stream",
        document_date: documentDate || undefined,
      });

      setUploadProgress(100);
      queryClient.invalidateQueries({ queryKey: ["parents", "childDetails", studentId] });
      queryClient.invalidateQueries({ queryKey: ["parents", "myChildren"] });
      toast.success("Document uploaded successfully");
      handleClose();
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setDocumentType("");
      setDocumentDate("");
      setSelectedFile(null);
      setUploadProgress(0);
      setError(null);
      onClose();
    }
  };

  useEffect(() => {
    if (open && defaultDocumentType) {
      setDocumentType(defaultDocumentType);
    }
  }, [open, defaultDocumentType]);

  const isAudiogram = documentType === "audiogram";

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Upload Document
        {studentName && (
          <Typography variant="body2" color="text.secondary">
            for {studentName}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <FormControl fullWidth required>
            <InputLabel>Document Type</InputLabel>
            <Select
              value={documentType}
              label="Document Type"
              onChange={(event) =>
                setDocumentType((event.target as unknown as { value: ParentDocumentType }).value)
              }
              disabled={uploading}
            >
              {DOCUMENT_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {isAudiogram && (
            <TextField
              label="Audiogram Date"
              type="date"
              value={documentDate}
              onChange={(event) =>
                setDocumentDate((event.target as unknown as { value: string }).value)
              }
              slotProps={{ inputLabel: { shrink: true } }}
              helperText="Required for audiograms. Next due date will be set to 6 months from this date."
              required
              disabled={uploading}
              fullWidth
            />
          )}

          {!isAudiogram && (
            <TextField
              label="Document Date (Optional)"
              type="date"
              value={documentDate}
              onChange={(event) =>
                setDocumentDate((event.target as unknown as { value: string }).value)
              }
              slotProps={{ inputLabel: { shrink: true } }}
              disabled={uploading}
              fullWidth
            />
          )}

          <Box>
            <input
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              style={{ display: "none" }}
              id={fileInputId}
              type="file"
              onChange={handleFileSelect}
              disabled={uploading}
            />
            <label htmlFor={fileInputId}>
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUploadIcon />}
                disabled={uploading}
                fullWidth
                sx={{ py: 2 }}
              >
                {selectedFile ? selectedFile.name : "Select File"}
              </Button>
            </label>
            {selectedFile && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </Typography>
            )}
          </Box>

          {uploading && (
            <Box>
              <LinearProgress variant="determinate" value={uploadProgress} />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                {uploadProgress < 40
                  ? "Preparing upload..."
                  : uploadProgress < 75
                    ? "Uploading file..."
                    : uploadProgress < 100
                      ? "Saving document record..."
                      : "Complete!"}
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={uploading}>
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          disabled={!selectedFile || !documentType || (isAudiogram && !documentDate) || uploading}
        >
          {uploading ? "Uploading..." : "Upload"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
