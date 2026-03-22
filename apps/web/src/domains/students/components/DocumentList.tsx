import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Tooltip,
  Paper,
} from "@mui/material";
import {
  Description as DescriptionIcon,
  Hearing as HearingIcon,
  Assignment as AssignmentIcon,
  School as SchoolIcon,
  InsertDriveFile as FileIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  CloudUpload as CloudUploadIcon,
} from "@mui/icons-material";
import {
  useDocumentHttpService,
  type Document,
  type DocumentType,
} from "../../documents/services/DocumentHttpService";
import { useToast } from "../../global/components/ToastProvider";

interface DocumentListProps {
  studentId: string;
  canDelete?: boolean;
  onUploadClick?: () => void;
}

const DOCUMENT_TYPE_CONFIG: Record<
  DocumentType,
  { label: string; icon: React.ReactNode; color: string }
> = {
  audiogram: { label: "Audiogram", icon: <HearingIcon />, color: "#7c4dff" },
  iep: { label: "IEP", icon: <AssignmentIcon />, color: "#00bcd4" },
  cv: { label: "CV", icon: <DescriptionIcon />, color: "#4caf50" },
  annual_test_result: { label: "Annual Test", icon: <SchoolIcon />, color: "#ff9800" },
  other: { label: "Other", icon: <FileIcon />, color: "#9e9e9e" },
};

function formatFileSize(bytes: number | null): string {
  if (bytes === null) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getDaysOverdue(nextDueDate: string | null): number | null {
  if (!nextDueDate) return null;
  const dueDate = new Date(nextDueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  const diffTime = today.getTime() - dueDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export default function DocumentList({
  studentId,
  canDelete = false,
  onUploadClick,
}: DocumentListProps) {
  const documentService = useDocumentHttpService();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Fetch documents
  const {
    data: documents,
    isLoading,
    error,
  } = useQuery({
    queryKey: [documentService.key, "student", studentId],
    queryFn: () => documentService.queries.listForStudent(studentId),
    enabled: !!studentId,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (documentId: string) => documentService.mutations.delete(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [documentService.key, "student", studentId] });
      toast.success("Document deleted successfully");
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    },
    onError: () => {
      toast.error("Failed to delete document. Please try again.");
    },
  });

  const handleDownload = async (doc: Document) => {
    setDownloadingId(doc.id);
    try {
      const { download_url, file_name } = await documentService.queries.getDownloadUrl(doc.id);

      // Force download by fetching and creating a blob
      const response = await fetch(download_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = file_name || doc.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Download started");
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Failed to download document. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDeleteClick = (doc: Document) => {
    setDocumentToDelete(doc);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (documentToDelete) {
      deleteMutation.mutate(documentToDelete.id);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDocumentToDelete(null);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" sx={{ py: 2, textAlign: "center" }}>
        Failed to load documents
      </Typography>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <Box sx={{ py: 3, textAlign: "center" }}>
        <CloudUploadIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
        <Typography color="text.secondary" gutterBottom>
          No documents uploaded yet
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Click Upload to add audiograms, IEPs, or other documents.
        </Typography>
        {onUploadClick && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<CloudUploadIcon />}
            onClick={onUploadClick}
          >
            Upload Document
          </Button>
        )}
      </Box>
    );
  }

  return (
    <>
      <List disablePadding>
        {documents.map((doc) => {
          const config = DOCUMENT_TYPE_CONFIG[doc.document_type] || DOCUMENT_TYPE_CONFIG.other;
          const daysOverdue = getDaysOverdue(doc.next_due_date);
          const isOverdue = daysOverdue !== null && daysOverdue > 0;
          const isDueSoon = daysOverdue !== null && daysOverdue <= 0 && daysOverdue > -30;

          return (
            <Paper
              key={doc.id}
              variant="outlined"
              sx={{
                mb: 1.5,
                borderColor: isOverdue ? "error.main" : "divider",
                borderWidth: isOverdue ? 2 : 1,
              }}
            >
              <ListItem
                sx={{
                  py: 1.5,
                  px: 2,
                  bgcolor: isOverdue ? "error.50" : "transparent",
                }}
                secondaryAction={
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <Tooltip title="Download">
                      <IconButton
                        size="small"
                        onClick={() => handleDownload(doc)}
                        disabled={downloadingId === doc.id}
                      >
                        {downloadingId === doc.id ? (
                          <CircularProgress size={18} />
                        ) : (
                          <DownloadIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>
                    {canDelete && (
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(doc)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                }
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Box sx={{ color: config.color }}>{config.icon}</Box>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                      <Typography variant="body2" fontWeight={500}>
                        {config.label}
                      </Typography>
                      {isOverdue && (
                        <Chip
                          icon={<WarningIcon sx={{ fontSize: 14 }} />}
                          label={`${daysOverdue} days overdue`}
                          size="small"
                          color="error"
                          sx={{ height: 22, fontSize: "0.7rem" }}
                        />
                      )}
                      {isDueSoon && !isOverdue && (
                        <Chip
                          label={`Due in ${Math.abs(daysOverdue!)} days`}
                          size="small"
                          color="warning"
                          sx={{ height: 22, fontSize: "0.7rem" }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box
                      component="span"
                      sx={{ display: "flex", flexDirection: "column", gap: 0.25, mt: 0.5 }}
                    >
                      <Typography variant="caption" color="text.secondary" component="span">
                        {doc.file_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" component="span">
                        Uploaded: {formatDate(doc.created_at)} &bull;{" "}
                        {formatFileSize(doc.file_size)}
                        {doc.next_due_date && (
                          <> &bull; Next due: {formatDate(doc.next_due_date)}</>
                        )}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            </Paper>
          );
        })}
      </List>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Document</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{documentToDelete?.file_name}"? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleteMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
