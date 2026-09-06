"use client";

import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  LinearProgress,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useId, useState } from "react";
import {
  addAttachment,
  type BulletinRoleTarget,
  type BulletinScope,
  createBulletin,
  getAttachmentUploadUrl,
} from "@/client/bulletins";
import { useToast } from "@/client/components/ToastProvider";
import { listAllLocations } from "@/client/locations";

interface CreateBulletinModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface PendingAttachment {
  localId: string;
  file_url: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
}

export default function CreateBulletinModal({
  open,
  onClose,
  onSuccess,
}: CreateBulletinModalProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const fileInputId = useId();

  // Form state
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [scope, setScope] = useState<BulletinScope>("global");
  const [siteId, setSiteId] = useState<string>("");
  const [roleTarget, setRoleTarget] = useState<BulletinRoleTarget>("all");
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [requiresInitials, setRequiresInitials] = useState(false);
  const [publishAt, setPublishAt] = useState<string>("");
  const [expireAt, setExpireAt] = useState<string>("");
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const [attachmentUploadProgress, setAttachmentUploadProgress] = useState(0);

  // Fetch locations for site dropdown
  const { data: locations } = useQuery({
    queryKey: ["locations", "all"],
    queryFn: () => listAllLocations(),
  });

  // Create bulletin mutation
  const createMutation = useMutation({
    mutationFn: async (data: Parameters<typeof createBulletin>[0]) => {
      const bulletin = await createBulletin(data);

      // Add attachments if any
      let completed = 0;
      setUploadingAttachments(true);
      setAttachmentUploadProgress(0);
      for (const attachment of pendingAttachments) {
        await addAttachment(bulletin.id, {
          file_url: attachment.file_url,
          file_name: attachment.file_name,
          file_size: attachment.file_size,
          mime_type: attachment.mime_type,
        });
        completed += 1;
        setAttachmentUploadProgress(Math.floor((completed / pendingAttachments.length) * 100));
      }

      return bulletin;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bulletins"] });
      toast.success("Bulletin created successfully");
      resetForm();
      onSuccess?.();
      onClose();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create bulletin");
      setUploadingAttachments(false);
      setAttachmentUploadProgress(0);
    },
    onSettled: () => {
      setUploadingAttachments(false);
      setAttachmentUploadProgress(0);
    },
  });

  const resetForm = () => {
    setTitle("");
    setBody("");
    setScope("global");
    setSiteId("");
    setRoleTarget("all");
    setRequiresApproval(false);
    setRequiresInitials(false);
    setPublishAt("");
    setExpireAt("");
    setPendingAttachments([]);
    setUploadingAttachments(false);
    setAttachmentUploadProgress(0);
  };

  const handleClose = () => {
    if (!createMutation.isPending) {
      resetForm();
      onClose();
    }
  };

  const handleFilesSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const target = event.target as unknown as {
      files?: ArrayLike<File> | null;
      value: string;
    };
    const files: File[] = Array.from(target.files ?? []);
    if (files.length === 0) {
      return;
    }

    setUploadingAttachments(true);
    setAttachmentUploadProgress(0);

    try {
      const uploaded: PendingAttachment[] = [];

      for (const [index, file] of files.entries()) {
        const uploadUrlResult = await getAttachmentUploadUrl({
          file_name: file.name,
          content_type: file.type || "application/octet-stream",
        });

        const attachmentFormData = new FormData();
        attachmentFormData.append("file", file);
        const uploadResponse = await fetch(uploadUrlResult.upload_url, {
          method: "POST",
          body: attachmentFormData,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        uploaded.push({
          localId: `${Date.now()}-${index}-${file.name}`,
          file_url: uploadUrlResult.file_url,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type || "application/octet-stream",
        });

        setAttachmentUploadProgress(Math.floor(((index + 1) / files.length) * 100));
      }

      setPendingAttachments((prev) => [...prev, ...uploaded]);
      toast.success(`${uploaded.length} attachment${uploaded.length === 1 ? "" : "s"} uploaded`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload attachments");
    } finally {
      setUploadingAttachments(false);
      setAttachmentUploadProgress(0);
      target.value = "";
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setPendingAttachments(pendingAttachments.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: Parameters<typeof createBulletin>[0] = {
      title: title.trim(),
      body: body.trim() || undefined,
      scope,
      site_id: scope === "site" ? siteId : null,
      role_target: roleTarget,
      requires_approval: requiresApproval,
      requires_initials: requiresInitials,
      publish_at: publishAt || null,
      expire_at: expireAt || null,
    };

    createMutation.mutate(payload);
  };

  const isValid = title.trim() && (scope !== "site" || siteId);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Create Bulletin</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Title"
              value={title}
              onChange={(e) => setTitle((e.target as unknown as { value: string }).value)}
              required
              fullWidth
              autoFocus
              placeholder="Enter bulletin title"
            />

            <TextField
              label="Body"
              value={body}
              onChange={(e) => setBody((e.target as unknown as { value: string }).value)}
              multiline
              rows={4}
              fullWidth
              placeholder="Enter bulletin content (supports plain text)"
            />

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Scope</InputLabel>
                <Select
                  value={scope}
                  label="Scope"
                  onChange={(e) => {
                    setScope((e.target as { value: BulletinScope }).value);
                    if ((e.target as { value: BulletinScope }).value === "global") {
                      setSiteId("");
                    }
                  }}
                >
                  <MenuItem value="global">Global (All Sites)</MenuItem>
                  <MenuItem value="site">Site-specific</MenuItem>
                </Select>
              </FormControl>

              {scope === "site" && (
                <FormControl sx={{ minWidth: 200, flex: 1 }}>
                  <InputLabel>Site</InputLabel>
                  <Select
                    value={siteId}
                    label="Site"
                    onChange={(e) => setSiteId((e.target as { value: string }).value)}
                    required
                  >
                    {(locations ?? []).map((location) => (
                      <MenuItem key={location.id} value={location.id}>
                        {location.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>

            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Target Audience</InputLabel>
              <Select
                value={roleTarget}
                label="Target Audience"
                onChange={(e) => setRoleTarget((e.target as { value: BulletinRoleTarget }).value)}
              >
                <MenuItem value="all">All Users</MenuItem>
                <MenuItem value="administrator">Administrators Only</MenuItem>
                <MenuItem value="teacher">Teachers Only</MenuItem>
                <MenuItem value="parent">Parents Only</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 220 }}>
              <InputLabel>Moderation</InputLabel>
              <Select
                value={requiresApproval ? "approval" : "direct"}
                label="Moderation"
                onChange={(e) => setRequiresApproval(e.target.value === "approval")}
              >
                <MenuItem value="direct">Publish Directly</MenuItem>
                <MenuItem value="approval">Require Admin Approval</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Checkbox
                  checked={requiresInitials}
                  onChange={(event) => setRequiresInitials(event.target.checked)}
                />
              }
              label="Require parent initials acknowledgement"
            />

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <TextField
                label="Publish Date (optional)"
                type="datetime-local"
                value={publishAt}
                onChange={(e) => setPublishAt((e.target as unknown as { value: string }).value)}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ minWidth: 220 }}
                helperText="Leave empty to publish immediately"
              />

              <TextField
                label="Expire Date (optional)"
                type="datetime-local"
                value={expireAt}
                onChange={(e) => setExpireAt((e.target as unknown as { value: string }).value)}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ minWidth: 220 }}
                helperText="Leave empty for no expiration"
              />
            </Box>

            {/* Attachments Section */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Attachments
              </Typography>

              {pendingAttachments.length > 0 && (
                <List dense sx={{ mb: 2 }}>
                  {pendingAttachments.map((attachment, index) => (
                    <ListItem key={attachment.localId}>
                      <ListItemText
                        primary={attachment.file_name}
                        secondary={attachment.mime_type || attachment.file_url}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleRemoveAttachment(index)}
                          size="small"
                          aria-label={`Remove ${attachment.file_name}`}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}

              <input
                id={fileInputId}
                type="file"
                multiple
                style={{ display: "none" }}
                onChange={handleFilesSelected}
              />
              <label htmlFor={fileInputId}>
                <Button variant="outlined" component="span" startIcon={<CloudUploadIcon />}>
                  Upload Attachment Files
                </Button>
              </label>
              {uploadingAttachments && (
                <Box sx={{ mt: 1 }}>
                  <LinearProgress variant="determinate" value={attachmentUploadProgress} />
                </Box>
              )}
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: "block" }}
              >
                Upload one or more files. They will be attached when bulletin is created.
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={createMutation.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!isValid || createMutation.isPending}
            startIcon={createMutation.isPending ? <CircularProgress size={20} /> : undefined}
          >
            Create Bulletin
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
