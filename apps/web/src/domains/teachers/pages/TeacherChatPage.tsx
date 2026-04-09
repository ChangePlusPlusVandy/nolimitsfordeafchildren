import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Skeleton,
  Stack,
  Tab,
  TablePagination,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import {
  Campaign as AnnouncementIcon,
  DeleteOutline as DeleteIcon,
  Forum as ChatIcon,
  PushPin as PinIcon,
} from "@mui/icons-material";
import { useHttpClient } from "../../../plugins/axios";
import { useAuth } from "../../../auth";
import { useToast } from "../../global/components/ToastProvider";
import { useServerTable } from "../../global/hooks/useServerTable";
import PageContainer from "../../global/components/PageContainer";
import PageHeader from "../../global/components/PageHeader";
import SectionCard from "../../global/components/SectionCard";
import ErrorAlert from "../../global/components/ErrorAlert";
import EmptyState from "../../global/components/EmptyState";
import ConfirmDialog from "../../global/components/ConfirmDialog";

type ChatChannel = "community" | "teacher";

interface ChatMessage {
  id: string;
  channel: ChatChannel;
  message: string;
  is_announcement: boolean;
  created_at: string;
  created_by_user: {
    id: string;
    name: string;
    role: "administrator" | "teacher" | "parent" | "unassigned";
  };
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function TeacherChatPage() {
  const httpClient = useHttpClient();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const toast = useToast();

  const [channel, setChannel] = useState<ChatChannel>("community");
  const [message, setMessage] = useState("");
  const [markAsAnnouncement, setMarkAsAnnouncement] = useState(false);
  const [deleteMessageTarget, setDeleteMessageTarget] = useState<string | null>(null);
  const table = useServerTable({ defaultLimit: 50 });

  const { data, isLoading, error } = useQuery({
    queryKey: ["chat-messages", channel, table.page, table.limit],
    queryFn: async () => {
      const response = await httpClient.get("/v1/chat/messages", {
        params: { channel, page: table.page, limit: table.limit },
      });
      return response.data as {
        items: ChatMessage[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    },
    refetchInterval: 15000,
  });

  const postMutation = useMutation({
    mutationFn: async () => {
      const response = await httpClient.post("/v1/chat/messages", {
        channel,
        message,
        is_announcement: markAsAnnouncement,
      });
      return response.data;
    },
    onSuccess: () => {
      setMessage("");
      setMarkAsAnnouncement(false);
      queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
      toast.success("Message posted");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to send message");
    },
  });

  const toggleAnnouncementMutation = useMutation({
    mutationFn: async ({ id, isAnnouncement }: { id: string; isAnnouncement: boolean }) => {
      const response = await httpClient.patch(`/v1/chat/messages/${id}/announcement`, {
        is_announcement: isAnnouncement,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update announcement");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await httpClient.delete(`/v1/chat/messages/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
      setDeleteMessageTarget(null);
      toast.success("Message deleted");
    },
    onError: () => {
      toast.error("Failed to delete message");
    },
  });

  const items = data?.items ?? [];
  const isAdmin = user?.role === "administrator";

  return (
    <PageContainer>
      <PageHeader title="Staff Chat" breadcrumbs={[{ label: "Staff Chat" }]} />

      <Stack spacing={3}>
        <Tabs
          value={channel}
          onChange={(_, next) => {
            setChannel(next);
            table.setPage(1);
          }}
        >
          <Tab value="community" label="Community" />
          <Tab value="teacher" label="Teacher Channel" />
        </Tabs>

        <SectionCard title="Compose" icon={<ChatIcon />}>
          <Stack spacing={1.5}>
            <TextField
              multiline
              rows={3}
              label="Share update"
              value={message}
              onChange={(event) => setMessage((event.target as unknown as { value: string }).value)}
              placeholder="Share announcements, reminders, or coordination notes..."
            />
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Button
                variant={markAsAnnouncement ? "contained" : "outlined"}
                color="info"
                startIcon={<AnnouncementIcon />}
                onClick={() => setMarkAsAnnouncement((prev) => !prev)}
              >
                {markAsAnnouncement ? "Announcement" : "Mark as Announcement"}
              </Button>

              <Button
                variant="contained"
                onClick={() => postMutation.mutate()}
                disabled={!message.trim() || postMutation.isPending}
              >
                {postMutation.isPending ? "Posting..." : "Post"}
              </Button>
            </Stack>
          </Stack>
        </SectionCard>

        {isLoading && (
          <Stack spacing={2}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} variant="outlined">
                <CardContent>
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Skeleton variant="circular" width={36} height={36} />
                      <Skeleton variant="text" width="30%" />
                    </Stack>
                    <Skeleton variant="text" width="80%" />
                    <Skeleton variant="text" width="50%" />
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}

        {error && (
          <ErrorAlert
            message="Failed to load chat messages."
            onRetry={() =>
              queryClient.invalidateQueries({
                queryKey: ["chat-messages", channel, table.page, table.limit],
              })
            }
          />
        )}

        {!isLoading && !error && items.length === 0 && (
          <EmptyState title="No Messages Yet" description="Start the conversation." />
        )}

        <Stack spacing={1.5}>
          {items.map((item) => {
            const canToggleAnnouncement = isAdmin || item.created_by_user.id === user?.id;

            return (
              <Card
                key={item.id}
                variant="outlined"
                sx={{ borderColor: item.is_announcement ? "info.main" : undefined }}
              >
                <CardContent>
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="subtitle2">{item.created_by_user.name}</Typography>
                        <Chip size="small" label={item.created_by_user.role} variant="outlined" />
                        {item.is_announcement && (
                          <Chip size="small" color="info" label="Announcement" icon={<PinIcon />} />
                        )}
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {formatTimestamp(item.created_at)}
                      </Typography>
                    </Stack>

                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                      {item.message}
                    </Typography>

                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      {canToggleAnnouncement && (
                        <Button
                          size="small"
                          onClick={() =>
                            toggleAnnouncementMutation.mutate({
                              id: item.id,
                              isAnnouncement: !item.is_announcement,
                            })
                          }
                          disabled={toggleAnnouncementMutation.isPending}
                        >
                          {item.is_announcement ? "Unpin" : "Pin as announcement"}
                        </Button>
                      )}

                      {isAdmin && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteMessageTarget(item.id)}
                          disabled={deleteMutation.isPending}
                          aria-label="Delete message"
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Stack>

        <TablePagination
          rowsPerPageOptions={[25, 50, 100]}
          component="div"
          count={data?.total ?? 0}
          rowsPerPage={table.limit}
          page={Math.max(table.page - 1, 0)}
          onPageChange={(_event, nextPage) => table.setPage(nextPage + 1)}
          onRowsPerPageChange={(event) => table.setLimit(Number(event.target.value))}
        />
      </Stack>

      <ConfirmDialog
        open={deleteMessageTarget !== null}
        title="Delete Message"
        message="Are you sure you want to delete this message? This action cannot be undone."
        confirmLabel="Delete"
        confirmColor="error"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteMessageTarget) deleteMutation.mutate(deleteMessageTarget);
        }}
        onCancel={() => setDeleteMessageTarget(null)}
      />
    </PageContainer>
  );
}
