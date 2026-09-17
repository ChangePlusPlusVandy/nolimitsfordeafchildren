"use client";

import {
  Campaign as AnnouncementIcon,
  Forum as ChatIcon,
  DeleteOutlined as DeleteIcon,
  PushPin as PinIcon,
} from "@mui/icons-material";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { useAuth } from "@/client/auth";
import {
  type ChatMessage,
  createChatMessage,
  deleteChatMessage,
  listChatMessages,
  updateChatAnnouncement,
} from "@/client/chat";
import ConfirmDialog from "@/client/components/ConfirmDialog";
import EmptyState from "@/client/components/EmptyState";
import ErrorAlert from "@/client/components/ErrorAlert";
import PageContainer from "@/client/components/PageContainer";
import PageHeader from "@/client/components/PageHeader";
import SectionCard from "@/client/components/SectionCard";
import { useToast } from "@/client/components/ToastProvider";
import { useServerTable } from "@/client/hooks/useServerTable";

type ChatChannel = "community" | "teacher";

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function StaffChatPage() {
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
    queryFn: () => listChatMessages(channel, { page: table.page, limit: table.limit }),
    refetchInterval: 15000,
  });

  const postMutation = useMutation({
    mutationFn: () => createChatMessage({ channel, message, is_announcement: markAsAnnouncement }),
    onSuccess: () => {
      setMessage("");
      setMarkAsAnnouncement(false);
      queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
      toast.success("Message posted");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to send message");
    },
  });

  const toggleAnnouncementMutation = useMutation({
    mutationFn: ({ id, isAnnouncement }: { id: string; isAnnouncement: boolean }) =>
      updateChatAnnouncement({ id, is_announcement: isAnnouncement }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update announcement");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteChatMessage(id),
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
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
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
            {Array.from({ length: 3 }, (_, i) => i).map((i) => (
              <Card key={`skeleton-${i}`} variant="outlined">
                <CardContent>
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
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
          {items.map((item: ChatMessage) => {
            const canToggleAnnouncement = isAdmin || item.created_by_user.id === user?.id;

            return (
              <Card
                key={item.id}
                variant="outlined"
                sx={{ borderColor: item.is_announcement ? "info.main" : undefined }}
              >
                <CardContent>
                  <Stack spacing={1}>
                    <Stack
                      direction="row"
                      sx={{ justifyContent: "space-between", alignItems: "center" }}
                    >
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
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

                    <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
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

export default function ChatPage() {
  // useServerTable reads the URL search params, which requires a Suspense
  // boundary during static/prerender rendering in Next.js.
  return (
    <Suspense fallback={<Skeleton variant="rectangular" height={200} />}>
      <StaffChatPage />
    </Suspense>
  );
}
