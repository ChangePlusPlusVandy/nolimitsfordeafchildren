import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { useDocumentHttpService, type Document } from "../../documents/services/DocumentHttpService";
import { useToast } from "../../global/components/ToastProvider";
import { useStudentHttpService } from "../../students/services/StudentHttpService";

export default function DocumentReviewPage() {
  const documentService = useDocumentHttpService();
  const studentService = useStudentHttpService();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [action, setAction] = useState<"approved" | "rejected" | null>(null);
  const [notes, setNotes] = useState("");

  const { data: studentsResponse } = useQuery({
    queryKey: [studentService.key, "index", "review-map"],
    queryFn: () => studentService.queries.index({ limit: 500 }),
  });

  const studentNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const student of studentsResponse?.items ?? []) {
      if (!map.has(student.id)) {
        map.set(student.id, student.initials);
      }
    }
    return map;
  }, [studentsResponse]);

  const { data, isLoading, error } = useQuery({
    queryKey: [documentService.key, "pending-review"],
    queryFn: () =>
      documentService.queries.index({
        entity_type: "student",
        review_status: "pending",
        page: 1,
        limit: 100,
      }),
  });

  const pendingDocuments = useMemo(() => {
    const items = (data?.items ?? []) as Document[];
    return items.filter(
      (doc) => doc.review_status === "pending" && doc.entity_type === "student",
    );
  }, [data]);

  const reviewMutation = useMutation({
    mutationFn: (payload: { id: string; status: "approved" | "rejected"; review_notes?: string }) =>
      documentService.mutations.review(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [documentService.key] });
      toast.success("Document review saved");
      setSelectedDocument(null);
      setAction(null);
      setNotes("");
    },
    onError: () => {
      toast.error("Failed to review document");
    },
  });

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Failed to load pending document reviews.</Alert>;
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Document Reviews
      </Typography>

      {pendingDocuments.length === 0 ? (
        <Alert severity="info">No pending pre-reports or graduation speeches.</Alert>
      ) : (
        <Stack spacing={2}>
          {pendingDocuments.map((doc) => (
            <Card key={doc.id} variant="outlined">
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                  <Box>
                    <Typography variant="h6">{doc.file_name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Type: {doc.document_type.replace(/_/g, " ")}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Student: {studentNameById.get(doc.entity_id) || doc.entity_id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Uploaded: {new Date(doc.created_at).toLocaleString()}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <Chip label={doc.review_status} size="small" color="warning" />
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setSelectedDocument(doc);
                        setAction("approved");
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => {
                        setSelectedDocument(doc);
                        setAction("rejected");
                      }}
                    >
                      Reject
                    </Button>
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <Dialog open={!!selectedDocument && !!action} onClose={() => setSelectedDocument(null)}>
        <DialogTitle>{action === "approved" ? "Approve" : "Reject"} document</DialogTitle>
        <DialogContent>
          <TextField
            label="Review notes"
            value={notes}
            onChange={(event) => setNotes((event.target as unknown as { value: string }).value)}
            multiline
            minRows={3}
            fullWidth
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedDocument(null)}>Cancel</Button>
          <Button
            variant="contained"
            color={action === "approved" ? "primary" : "error"}
            onClick={() => {
              if (!selectedDocument || !action) return;
              reviewMutation.mutate({
                id: selectedDocument.id,
                status: action,
                review_notes: notes.trim() || undefined,
              });
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
