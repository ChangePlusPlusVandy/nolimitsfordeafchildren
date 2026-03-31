import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Tab,
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
  const { showToast } = useToast();

  const [channel, setChannel] = useState<ChatChannel>("community");
  const [message, setMessage] = useState("");
  const [markAsAnnouncement, setMarkAsAnnouncement] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["chat-messages", channel],
    queryFn: async () => {
      const response = await httpClient.get("/v1/chat/messages", {
        params: { channel, limit: 100 },
      });
      return response.data as { items: ChatMessage[] };
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
    },
    onError: (err: any) => {
      showToast({
        message: err.response?.data?.message || "Failed to send message",
        severity: "error",
      });
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
      showToast({
        message: err.response?.data?.message || "Failed to update announcement",
        severity: "error",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await httpClient.delete(`/v1/chat/messages/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
    },
  });

  const items = data?.items ?? [];
  const isAdmin = user?.role === "administrator";

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" spacing={1} alignItems="center" mb={2}>
        <ChatIcon color="action" />
        <Typography variant="h4">Staff Chat</Typography>
      </Stack>

      <Tabs value={channel} onChange={(_, next) => setChannel(next)} sx={{ mb: 2 }}>
        <Tab value="community" label="Community" />
        <Tab value="teacher" label="Teacher Channel" />
      </Tabs>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack spacing={1.5}>
            <TextField
              multiline
              rows={3}
              label="Share update"
              value={message}
              onChange={(event) =>
                setMessage((event.target as unknown as { value: string }).value)
              }
              placeholder="Share announcements, reminders, or coordination notes..."
            />
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Button
                variant={markAsAnnouncement ? "contained" : "outlined"}
                color="warning"
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
        </CardContent>
      </Card>

      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load chat messages.
        </Alert>
      )}

      {!isLoading && !error && items.length === 0 && (
        <Alert severity="info">No messages yet. Start the conversation.</Alert>
      )}

      <Stack spacing={1.5}>
        {items.map((item) => {
          const canToggleAnnouncement = isAdmin || item.created_by_user.id === user?.id;

          return (
            <Card key={item.id} variant="outlined" sx={{ borderColor: item.is_announcement ? "warning.main" : undefined }}>
              <CardContent>
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="subtitle2">{item.created_by_user.name}</Typography>
                      <Chip size="small" label={item.created_by_user.role} variant="outlined" />
                      {item.is_announcement && (
                        <Chip size="small" color="warning" label="Announcement" icon={<PinIcon />} />
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
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => deleteMutation.mutate(item.id)}
                        disabled={deleteMutation.isPending}
                      >
                        Delete
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Box>
  );
}
