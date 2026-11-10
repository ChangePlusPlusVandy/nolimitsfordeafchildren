"use client";

import {
  CheckCircle as ApproveIcon,
  Description as DocIcon,
  Cancel as RejectIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TablePagination,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Suspense, useMemo, useState } from "react";

import { listStudents } from "@/(dashboard)/(students)/_domain/client";
import { useServerTable } from "@/_shared/hooks/useServerTable";
import EmptyState from "@/_shared/ui/EmptyState";
import ErrorAlert from "@/_shared/ui/ErrorAlert";
import PageContainer from "@/_shared/ui/PageContainer";
import PageHeader from "@/_shared/ui/PageHeader";
import SectionCard from "@/_shared/ui/SectionCard";
import CardGridSkeleton from "@/_shared/ui/skeletons/CardGridSkeleton";
import { useToast } from "@/_shared/ui/ToastProvider";
import { formatDateTime } from "@/_shared/utils/formatDate";

import { type Document, listDocuments, reviewDocument } from "../_domain/client";

function DocumentReviewPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const table = useServerTable({ defaultLimit: 20 });

  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [action, setAction] = useState<"approved" | "rejected" | null>(null);
  const [notes, setNotes] = useState("");

  const closeDialog = () => {
    setSelectedDocument(null);
    setAction(null);
    setNotes("");
  };

  const { data: studentsResponse } = useQuery({
    queryKey: ["students", "index", "review-map"],
    queryFn: () => listStudents({ limit: 500 }),
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

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["documents", "pending-review", table.queryParams],
    queryFn: () =>
      listDocuments({
        entity_type: "student",
        review_status: "pending",
        page: table.page,
        limit: table.limit,
      }),
  });

  const pendingDocuments = useMemo(() => data?.items ?? [], [data]);

  const reviewMutation = useMutation({
    mutationFn: (payload: { id: string; status: "approved" | "rejected"; review_notes?: string }) =>
      reviewDocument(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document review saved");
      closeDialog();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to review document");
    },
  });

  return (
    <PageContainer>
      <PageHeader title="Document Reviews" />

      {isLoading ? (
        <CardGridSkeleton />
      ) : error ? (
        <ErrorAlert message="Failed to load pending document reviews." onRetry={() => refetch()} />
      ) : pendingDocuments.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={<DocIcon sx={{ fontSize: 48 }} />}
            title="All Caught Up"
            description="No pending pre-reports or graduation speeches to review."
          />
        </SectionCard>
      ) : (
        <>
          <Stack spacing={2}>
            {pendingDocuments.map((doc) => (
              <SectionCard key={doc.id}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 2,
                    flexDirection: { xs: "column", sm: "row" },
                  }}
                >
                  <Box>
                    <Typography variant="h6">{doc.file_name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Type: {doc.document_type.replace(/_/g, " ")}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Student: {studentNameById.get(doc.entity_id) || doc.entity_id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Uploaded: {formatDateTime(doc.created_at)}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
                    <Chip label={doc.review_status} size="small" color="warning" />
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ApproveIcon />}
                      aria-label={`Approve ${doc.file_name}`}
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
                      startIcon={<RejectIcon />}
                      aria-label={`Reject ${doc.file_name}`}
                      onClick={() => {
                        setSelectedDocument(doc);
                        setAction("rejected");
                      }}
                    >
                      Reject
                    </Button>
                  </Stack>
                </Box>
              </SectionCard>
            ))}
          </Stack>

          <TablePagination
            rowsPerPageOptions={[10, 20, 50]}
            component="div"
            count={data?.total ?? 0}
            rowsPerPage={table.limit}
            page={Math.max(table.page - 1, 0)}
            onPageChange={(_event, nextPage) => table.setPage(nextPage + 1)}
            onRowsPerPageChange={(event) => table.setLimit(Number(event.target.value))}
          />
        </>
      )}

      {/* Review Dialog */}
      <Dialog open={!!selectedDocument && !!action} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{action === "approved" ? "Approve" : "Reject"} Document</DialogTitle>
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
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDialog} disabled={reviewMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={action === "approved" ? "primary" : "error"}
            disabled={reviewMutation.isPending}
            onClick={() => {
              if (!selectedDocument || !action) return;
              reviewMutation.mutate({
                id: selectedDocument.id,
                status: action,
                review_notes: notes.trim() || undefined,
              });
            }}
          >
            {reviewMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}

export default function DocumentReviewPageWrapper() {
  // useServerTable reads the URL search params, which requires a Suspense
  // boundary during static/prerender rendering in Next.js.
  return (
    <Suspense fallback={<CardGridSkeleton />}>
      <DocumentReviewPage />
    </Suspense>
  );
}
