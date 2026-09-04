"use client";

import {
  CheckCircle as ApproveIcon,
  Campaign as BulletinIcon,
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
import { Suspense, useState } from "react";
import { type Bulletin, getModerationPending, reviewBulletin } from "@/client/bulletins";
import EmptyState from "@/client/components/EmptyState";
import ErrorAlert from "@/client/components/ErrorAlert";
import PageContainer from "@/client/components/PageContainer";
import PageHeader from "@/client/components/PageHeader";
import SectionCard from "@/client/components/SectionCard";
import CardGridSkeleton from "@/client/components/skeletons/CardGridSkeleton";
import { useToast } from "@/client/components/ToastProvider";
import { useServerTable } from "@/client/hooks/useServerTable";

function BulletinModerationPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const table = useServerTable({ defaultLimit: 20 });

  const [selectedBulletin, setSelectedBulletin] = useState<Bulletin | null>(null);
  const [action, setAction] = useState<"approved" | "rejected" | null>(null);
  const [notes, setNotes] = useState("");

  const closeDialog = () => {
    setSelectedBulletin(null);
    setAction(null);
    setNotes("");
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["bulletins", "pending", table.queryParams],
    queryFn: () => getModerationPending({ page: table.page, limit: table.limit }),
  });

  const reviewMutation = useMutation({
    mutationFn: (payload: {
      bulletinId: string;
      status: "approved" | "rejected";
      notes?: string;
    }) =>
      reviewBulletin(payload.bulletinId, {
        status: payload.status,
        notes: payload.notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bulletins"] });
      toast.success("Bulletin review saved");
      closeDialog();
    },
    onError: () => {
      toast.error("Failed to review bulletin");
    },
  });

  const pendingItems = data?.items ?? [];

  return (
    <PageContainer>
      <PageHeader title="Bulletin Moderation" />

      {isLoading ? (
        <CardGridSkeleton />
      ) : error ? (
        <ErrorAlert message="Failed to load pending bulletins." onRetry={() => refetch()} />
      ) : pendingItems.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={<BulletinIcon sx={{ fontSize: 48 }} />}
            title="All Caught Up"
            description="No bulletins awaiting approval."
          />
        </SectionCard>
      ) : (
        <>
          <Stack spacing={2}>
            {pendingItems.map((bulletin) => (
              <SectionCard key={bulletin.id}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 2,
                    flexDirection: { xs: "column", sm: "row" },
                  }}
                >
                  <Box>
                    <Typography variant="h6">{bulletin.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      By {bulletin.created_by_name || "Unknown"}
                      {bulletin.site_name ? ` • ${bulletin.site_name}` : ""}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Audience: {bulletin.role_target}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
                      {bulletin.body || "No content"}
                    </Typography>
                    {bulletin.attachments.length > 0 && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Attachments: {bulletin.attachments.length}
                      </Typography>
                    )}
                  </Box>

                  <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
                    <Chip label="Pending" color="warning" size="small" />
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ApproveIcon />}
                      aria-label={`Approve ${bulletin.title}`}
                      onClick={() => {
                        setSelectedBulletin(bulletin);
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
                      aria-label={`Reject ${bulletin.title}`}
                      onClick={() => {
                        setSelectedBulletin(bulletin);
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
      <Dialog open={!!selectedBulletin && !!action} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{action === "approved" ? "Approve" : "Reject"} Bulletin</DialogTitle>
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
              if (!selectedBulletin || !action) return;
              reviewMutation.mutate({
                bulletinId: selectedBulletin.id,
                status: action,
                notes: notes.trim() || undefined,
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

export default function BulletinModerationPageWrapper() {
  // useServerTable reads the URL search params, which requires a Suspense
  // boundary during static/prerender rendering in Next.js.
  return (
    <Suspense fallback={<CardGridSkeleton />}>
      <BulletinModerationPage />
    </Suspense>
  );
}
