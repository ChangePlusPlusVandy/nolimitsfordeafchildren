import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  CircularProgress,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  useBulletinHttpService,
  type CreateBulletinInput,
  type BulletinScope,
  type BulletinRoleTarget,
} from "../services/BulletinHttpService";
import { useLocationHttpService } from "../../locations/services/LocationHttpService";
import { useToast } from "../../global/components/ToastProvider";

interface CreateBulletinModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface PendingAttachment {
  file_url: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
}

export default function CreateBulletinModal({ open, onClose, onSuccess }: CreateBulletinModalProps) {
  const queryClient = useQueryClient();
  const bulletinHttpService = useBulletinHttpService();
  const locationHttpService = useLocationHttpService();
  const toast = useToast();

  // Form state
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [scope, setScope] = useState<BulletinScope>("global");
  const [siteId, setSiteId] = useState<string>("");
  const [roleTarget, setRoleTarget] = useState<BulletinRoleTarget>("all");
  const [publishAt, setPublishAt] = useState<string>("");
  const [expireAt, setExpireAt] = useState<string>("");
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentName, setAttachmentName] = useState("");

  // Fetch locations for site dropdown
  const { data: locations } = useQuery({
    queryKey: [locationHttpService.key, "index"],
    queryFn: locationHttpService.queries.index,
  });

  // Create bulletin mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateBulletinInput) => {
      const bulletin = await bulletinHttpService.mutations.create(data);
      
      // Add attachments if any
      for (const attachment of pendingAttachments) {
        await bulletinHttpService.mutations.addAttachment(bulletin.id, attachment);
      }
      
      return bulletin;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [bulletinHttpService.key] });
      toast.success("Bulletin created successfully");
      resetForm();
      onSuccess?.();
      onClose();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create bulletin");
    },
  });

  const resetForm = () => {
    setTitle("");
    setBody("");
    setScope("global");
    setSiteId("");
    setRoleTarget("all");
    setPublishAt("");
    setExpireAt("");
    setPendingAttachments([]);
    setAttachmentUrl("");
    setAttachmentName("");
  };

  const handleClose = () => {
    if (!createMutation.isPending) {
      resetForm();
      onClose();
    }
  };

  const handleAddAttachment = () => {
    if (attachmentUrl.trim() && attachmentName.trim()) {
      setPendingAttachments([
        ...pendingAttachments,
        {
          file_url: attachmentUrl.trim(),
          file_name: attachmentName.trim(),
        },
      ]);
      setAttachmentUrl("");
      setAttachmentName("");
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setPendingAttachments(pendingAttachments.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: CreateBulletinInput = {
      title: title.trim(),
      body: body.trim() || undefined,
      scope,
      site_id: scope === "site" ? siteId : null,
      role_target: roleTarget,
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
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}>
            <TextField
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              fullWidth
              autoFocus
              placeholder="Enter bulletin title"
            />

            <TextField
              label="Body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
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
                    setScope(e.target.value as BulletinScope);
                    if (e.target.value === "global") {
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
                    onChange={(e) => setSiteId(e.target.value)}
                    required
                  >
                    {(locations ?? []).map((location: any) => (
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
                onChange={(e) => setRoleTarget(e.target.value as BulletinRoleTarget)}
              >
                <MenuItem value="all">All Users</MenuItem>
                <MenuItem value="administrator">Administrators Only</MenuItem>
                <MenuItem value="teacher">Teachers Only</MenuItem>
                <MenuItem value="parent">Parents Only</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <TextField
                label="Publish Date (optional)"
                type="datetime-local"
                value={publishAt}
                onChange={(e) => setPublishAt(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 220 }}
                helperText="Leave empty to publish immediately"
              />

              <TextField
                label="Expire Date (optional)"
                type="datetime-local"
                value={expireAt}
                onChange={(e) => setExpireAt(e.target.value)}
                InputLabelProps={{ shrink: true }}
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
                    <ListItem key={index}>
                      <ListItemText
                        primary={attachment.file_name}
                        secondary={attachment.file_url}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleRemoveAttachment(index)}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}

              <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
                <TextField
                  label="File URL"
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  size="small"
                  sx={{ flex: 2 }}
                  placeholder="https://..."
                />
                <TextField
                  label="File Name"
                  value={attachmentName}
                  onChange={(e) => setAttachmentName(e.target.value)}
                  size="small"
                  sx={{ flex: 1 }}
                  placeholder="document.pdf"
                />
                <Button
                  variant="outlined"
                  onClick={handleAddAttachment}
                  disabled={!attachmentUrl.trim() || !attachmentName.trim()}
                  startIcon={<AddIcon />}
                >
                  Add
                </Button>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                Enter the URL and display name for each attachment
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
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
