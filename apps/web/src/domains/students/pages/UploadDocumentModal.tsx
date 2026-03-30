import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Typography,
  LinearProgress,
  Alert,
  Stack,
} from "@mui/material";
import { CloudUpload as CloudUploadIcon } from "@mui/icons-material";
import { useHttpClient } from "../../../plugins/axios";
import { useToast } from "../../global/components/ToastProvider";

type DocumentType = "audiogram" | "iep" | "cv" | "annual_test_result" | "other";

interface UploadDocumentModalProps {
  open: boolean;
  onClose: () => void;
  studentId: string;
  studentName?: string;
}

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: "audiogram", label: "Audiogram" },
  { value: "iep", label: "IEP (Individualized Education Program)" },
  { value: "annual_test_result", label: "Annual Test Result" },
  { value: "other", label: "Other" },
];

export default function UploadDocumentModal({
  open,
  onClose,
  studentId,
  studentName,
}: UploadDocumentModalProps) {
  const httpClient = useHttpClient();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [documentType, setDocumentType] = useState<DocumentType | "">("");
  const [documentDate, setDocumentDate] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const getUploadUrlMutation = useMutation({
    mutationFn: async (data: {
      entity_type: string;
      entity_id: string;
      document_type: string;
      file_name: string;
      content_type: string;
    }) => {
      const response = await httpClient.post("/v1/documents/upload-url", data);
      return response.data as { upload_url: string; file_key: string; file_url: string };
    },
  });

  const confirmUploadMutation = useMutation({
    mutationFn: async (data: {
      entity_type: string;
      entity_id: string;
      document_type: string;
      file_url: string;
      file_name: string;
      file_size: number;
      mime_type: string;
      document_date?: string;
    }) => {
      const response = await httpClient.post("/v1/documents", data);
      return response.data;
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(
      (event.target as unknown as { files?: ArrayLike<File> | null }).files ?? [],
    ) as File[];
    if (files.length > 0) {
      setSelectedFiles(files);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !documentType) return;

    setError(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      const totalFiles = selectedFiles.length;

      for (const [index, file] of selectedFiles.entries()) {
        const stepStart = Math.floor((index / totalFiles) * 100);
        const stepMid = Math.floor(((index + 0.5) / totalFiles) * 100);
        const stepEnd = Math.floor(((index + 1) / totalFiles) * 100);

        // Step 1: Get presigned upload URL
        setUploadProgress(stepStart);
        const { upload_url, file_url } = await getUploadUrlMutation.mutateAsync({
          entity_type: "student",
          entity_id: studentId,
          document_type: documentType,
          file_name: file.name,
          content_type: file.type || "application/octet-stream",
        });

        // Step 2: Upload file directly to S3
        setUploadProgress(stepMid);
        const uploadResponse = await fetch(upload_url, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type || "application/octet-stream",
          },
        });

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload ${file.name} to storage`);
        }

        // Step 3: Confirm upload and create document record
        await confirmUploadMutation.mutateAsync({
          entity_type: "student",
          entity_id: studentId,
          document_type: documentType,
          file_url,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type || "application/octet-stream",
          document_date: documentDate || undefined,
        });

        setUploadProgress(stepEnd);
      }

      queryClient.invalidateQueries({ queryKey: ["documents", "student", studentId] });
      setUploadProgress(100);
      toast.success(
        `${selectedFiles.length} document${selectedFiles.length === 1 ? "" : "s"} uploaded successfully`,
      );
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
      setSelectedFiles([]);
      setUploadProgress(0);
      setError(null);
      onClose();
    }
  };

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
                setDocumentType((event.target as unknown as { value: DocumentType }).value)
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
              InputLabelProps={{ shrink: true }}
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
              InputLabelProps={{ shrink: true }}
              disabled={uploading}
              fullWidth
            />
          )}

          <Box>
            <input
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              style={{ display: "none" }}
              id="document-file-input"
              type="file"
              multiple
              onChange={handleFileSelect}
              disabled={uploading}
            />
            <label htmlFor="document-file-input">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUploadIcon />}
                disabled={uploading}
                fullWidth
                sx={{ py: 2 }}
              >
                {selectedFiles.length > 0
                  ? `${selectedFiles.length} file${selectedFiles.length === 1 ? "" : "s"} selected`
                  : "Select File(s)"}
              </Button>
            </label>
            {selectedFiles.length > 0 && (
              <Stack spacing={0.5} sx={{ mt: 1 }}>
                {selectedFiles.slice(0, 5).map((file) => (
                  <Typography key={`${file.name}-${file.size}`} variant="caption" color="text.secondary">
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </Typography>
                ))}
                {selectedFiles.length > 5 && (
                  <Typography variant="caption" color="text.secondary">
                    +{selectedFiles.length - 5} more files
                  </Typography>
                )}
              </Stack>
            )}
          </Box>

          {uploading && (
            <Box>
              <LinearProgress variant="determinate" value={uploadProgress} />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                {uploadProgress < 30
                  ? "Preparing upload..."
                  : uploadProgress < 70
                    ? "Uploading file..."
                    : uploadProgress < 100
                      ? "Saving document records..."
                      : "Complete!"}
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={uploading}>
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          disabled={
            selectedFiles.length === 0 || !documentType || (isAudiogram && !documentDate) || uploading
          }
        >
          {uploading ? "Uploading..." : "Upload"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
