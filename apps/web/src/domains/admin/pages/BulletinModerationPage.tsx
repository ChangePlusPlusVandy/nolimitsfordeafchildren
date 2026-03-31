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
import { useState } from "react";
import { useBulletinHttpService, type Bulletin } from "../../bulletin/services/BulletinHttpService";
import { useToast } from "../../global/components/ToastProvider";

export default function BulletinModerationPage() {
  const bulletinService = useBulletinHttpService();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [selectedBulletin, setSelectedBulletin] = useState<Bulletin | null>(null);
  const [action, setAction] = useState<"approved" | "rejected" | null>(null);
  const [notes, setNotes] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: [bulletinService.key, "pending"],
    queryFn: bulletinService.queries.pending,
  });

  const reviewMutation = useMutation({
    mutationFn: async (payload: { bulletinId: string; status: "approved" | "rejected"; notes?: string }) => {
      return await bulletinService.mutations.review(payload.bulletinId, {
        status: payload.status,
        notes: payload.notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [bulletinService.key] });
      toast.success("Bulletin review saved");
      setSelectedBulletin(null);
      setAction(null);
      setNotes("");
    },
    onError: () => {
      toast.error("Failed to review bulletin");
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
    return <Alert severity="error">Failed to load pending bulletins.</Alert>;
  }

  const pendingItems = data?.items ?? [];

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Bulletin Moderation
      </Typography>

      {pendingItems.length === 0 ? (
        <Alert severity="info">No bulletins awaiting approval.</Alert>
      ) : (
        <Stack spacing={2}>
          {pendingItems.map((bulletin) => (
            <Card key={bulletin.id} variant="outlined">
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
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

                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <Chip label="Pending" color="warning" size="small" />
                    <Button
                      size="small"
                      variant="outlined"
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
                      onClick={() => {
                        setSelectedBulletin(bulletin);
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

        <Dialog
          open={!!selectedBulletin && !!action}
          onClose={() => {
            setSelectedBulletin(null);
            setAction(null);
            setNotes("");
          }}
        >
        <DialogTitle>{action === "approved" ? "Approve" : "Reject"} bulletin</DialogTitle>
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
            <Button
              onClick={() => {
                setSelectedBulletin(null);
                setAction(null);
                setNotes("");
              }}
            >
              Cancel
            </Button>
          <Button
            variant="contained"
            color={action === "approved" ? "primary" : "error"}
            onClick={() => {
              if (!selectedBulletin || !action) return;
              reviewMutation.mutate({
                bulletinId: selectedBulletin.id,
                status: action,
                notes: notes.trim() || undefined,
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
