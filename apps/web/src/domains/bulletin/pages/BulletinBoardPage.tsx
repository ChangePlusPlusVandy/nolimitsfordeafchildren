import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Stack,
  Link,
  Divider,
  List,
  ListItem,
  ListItemText,
  FormHelperText,
} from "@mui/material";
import { CardGridSkeleton } from "../../global/components/skeletons";
import AddIcon from "@mui/icons-material/Add";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import VisibilityIcon from "@mui/icons-material/Visibility";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import { useAuth } from "../../../auth";
import {
  useBulletinHttpService,
  type Bulletin,
  type ListBulletinsParams,
  type BulletinScope,
  type BulletinRoleTarget,
} from "../services/BulletinHttpService";
import { useLocationHttpService } from "../../locations/services/LocationHttpService";
import BulletinCard from "../components/BulletinCard";
import CreateBulletinModal from "../components/CreateBulletinModal";

export default function BulletinBoardPage() {
  const { isAdmin, isTeacher, isParent } = useAuth();
  const bulletinHttpService = useBulletinHttpService();
  const locationHttpService = useLocationHttpService();
  const queryClient = useQueryClient();

  const [ackInitials, setAckInitials] = useState("");

  // Filter state (admin only)
  const [siteFilter, setSiteFilter] = useState<string>("");
  const [scopeFilter, setScopeFilter] = useState<BulletinScope | "">("");
  const [roleTargetFilter, setRoleTargetFilter] = useState<BulletinRoleTarget | "">("");
  const [includeExpired, setIncludeExpired] = useState(false);
  const [includeScheduled, setIncludeScheduled] = useState(false);

  // Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedBulletin, setSelectedBulletin] = useState<Bulletin | null>(null);

  const selectedBulletinId = selectedBulletin?.id ?? null;

  const { data: viewStats } = useQuery({
    queryKey: [bulletinHttpService.key, "view-stats", selectedBulletinId],
    queryFn: () => bulletinHttpService.queries.viewStats(selectedBulletinId!),
    enabled: isAdmin && !!selectedBulletinId,
  });

  const { data: acknowledgementStats } = useQuery({
    queryKey: [bulletinHttpService.key, "ack-stats", selectedBulletinId],
    queryFn: () => bulletinHttpService.queries.acknowledgementStats(selectedBulletinId!),
    enabled: isAdmin && !!selectedBulletinId,
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async ({ bulletinId, initials }: { bulletinId: string; initials: string }) => {
      return await bulletinHttpService.mutations.acknowledge(bulletinId, { initials });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [bulletinHttpService.key] });
    },
  });

  const viewerRows = useMemo(() => {
    if (!viewStats) {
      return [] as string[];
    }

    return viewStats.viewers.map((viewer) => {
      const seenAt = new Date(viewer.last_viewed_at).toLocaleString();
      return `${viewer.user.name} (${viewer.user.role}) - ${seenAt}`;
    });
  }, [viewStats]);

  // Build query params
  const queryParams: ListBulletinsParams = {
    ...(siteFilter && { siteId: siteFilter }),
    ...(scopeFilter && { scope: scopeFilter }),
    ...(roleTargetFilter && { roleTarget: roleTargetFilter }),
    ...(includeExpired && { includeExpired: true }),
    ...(includeScheduled && { includeScheduled: true }),
    limit: 50,
  };

  // Fetch bulletins
  const { data, isLoading, error } = useQuery({
    queryKey: [bulletinHttpService.key, "index", queryParams],
    queryFn: () => bulletinHttpService.queries.index(queryParams),
  });

  // Fetch locations for filter dropdown (admin only)
  const { data: locations } = useQuery({
    queryKey: [locationHttpService.key, "index"],
    queryFn: locationHttpService.queries.index,
    enabled: isAdmin,
  });

  const handleBulletinClick = async (bulletin: Bulletin) => {
    try {
      const latest = await bulletinHttpService.queries.show(bulletin.id);
      setSelectedBulletin(latest);
      setAckInitials(latest.acknowledged_initials || "");
    } catch {
      setSelectedBulletin(bulletin);
      setAckInitials(bulletin.acknowledged_initials || "");
    }
  };

  const handleCloseDetail = () => {
    setSelectedBulletin(null);
    setAckInitials("");
  };

  const handleAcknowledge = async () => {
    if (!selectedBulletin || !ackInitials.trim()) {
      return;
    }

    await acknowledgeMutation.mutateAsync({
      bulletinId: selectedBulletin.id,
      initials: ackInitials.trim(),
    });

    const latest = await bulletinHttpService.queries.show(selectedBulletin.id);
    setSelectedBulletin(latest);
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" component="h1">
          Bulletin Board
        </Typography>
        {(isAdmin || isTeacher) && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateModalOpen(true)}
          >
            Create Bulletin
          </Button>
        )}
      </Box>

      {/* Admin Filters */}
      {isAdmin && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Filters (Admin View)
          </Typography>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Site</InputLabel>
                <Select
                  value={siteFilter}
                  label="Site"
                  onChange={(event) =>
                    setSiteFilter((event.target as unknown as { value: string }).value)
                  }
                >
                <MenuItem value="">All Sites</MenuItem>
                {(locations ?? []).map((location: any) => (
                  <MenuItem key={location.id} value={location.id}>
                    {location.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Scope</InputLabel>
                <Select
                  value={scopeFilter}
                  label="Scope"
                  onChange={(event) =>
                    setScopeFilter((event.target as unknown as { value: BulletinScope | "" }).value)
                  }
                >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="global">Global</MenuItem>
                <MenuItem value="site">Site-specific</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Audience</InputLabel>
                <Select
                  value={roleTargetFilter}
                  label="Audience"
                  onChange={(event) =>
                    setRoleTargetFilter(
                      (event.target as unknown as { value: BulletinRoleTarget | "" }).value,
                    )
                  }
                >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="all">All Users</MenuItem>
                <MenuItem value="administrator">Admins</MenuItem>
                <MenuItem value="teacher">Teachers</MenuItem>
                <MenuItem value="parent">Parents</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small">
              <Button
                variant={includeExpired ? "contained" : "outlined"}
                size="small"
                onClick={() => setIncludeExpired(!includeExpired)}
              >
                {includeExpired ? "Showing Expired" : "Hide Expired"}
              </Button>
            </FormControl>

            <FormControl size="small">
              <Button
                variant={includeScheduled ? "contained" : "outlined"}
                size="small"
                onClick={() => setIncludeScheduled(!includeScheduled)}
              >
                {includeScheduled ? "Showing Scheduled" : "Hide Scheduled"}
              </Button>
            </FormControl>
          </Box>
        </Paper>
      )}

      {/* Error state */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load bulletins. Please try again.
        </Alert>
      )}

      {/* Loading state */}
      {isLoading && <CardGridSkeleton count={6} showAvatar={false} />}

      {/* Empty state */}
      {data && data.items.length === 0 && (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">No bulletins to display.</Typography>
        </Paper>
      )}

      {/* Bulletin Feed */}
      {data && data.items.length > 0 && (
        <Box>
          {data.items.map((bulletin) => (
            <BulletinCard key={bulletin.id} bulletin={bulletin} onClick={handleBulletinClick} />
          ))}
        </Box>
      )}

      {/* Create Bulletin Modal */}
      <CreateBulletinModal open={createModalOpen} onClose={() => setCreateModalOpen(false)} />

      {/* Bulletin Detail Dialog */}
      <Dialog open={!!selectedBulletin} onClose={handleCloseDetail} maxWidth="md" fullWidth>
        {selectedBulletin && (
          <>
            <DialogTitle>{selectedBulletin.title}</DialogTitle>
            <DialogContent>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Chip
                  label={
                    selectedBulletin.scope === "global"
                      ? "Global"
                      : selectedBulletin.site_name || "Site-specific"
                  }
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={
                    selectedBulletin.role_target === "all"
                      ? "All Users"
                      : selectedBulletin.role_target === "administrator"
                        ? "Admins"
                        : selectedBulletin.role_target === "teacher"
                          ? "Teachers"
                          : "Parents"
                  }
                  size="small"
                  variant="outlined"
                />
                {selectedBulletin.requires_initials && (
                  <Chip
                    icon={<HowToRegIcon />}
                    label="Initials Required"
                    size="small"
                    color="info"
                    variant="outlined"
                  />
                )}
              </Stack>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Published: {formatDate(selectedBulletin.publish_at || selectedBulletin.created_at)}
                {selectedBulletin.created_by_name && ` by ${selectedBulletin.created_by_name}`}
              </Typography>

              {selectedBulletin.expire_at && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Expires: {formatDate(selectedBulletin.expire_at)}
                </Typography>
              )}

              <Divider sx={{ my: 2 }} />

              {selectedBulletin.body ? (
                <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                  {selectedBulletin.body}
                </Typography>
              ) : (
                <Typography variant="body1" color="text.secondary" fontStyle="italic">
                  No content
                </Typography>
              )}

              {selectedBulletin.attachments.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    <AttachFileIcon sx={{ fontSize: 16, verticalAlign: "middle", mr: 0.5 }} />
                    Attachments ({selectedBulletin.attachments.length})
                  </Typography>
                  <Stack spacing={1}>
                    {selectedBulletin.attachments.map((attachment) => (
                      <Link
                        key={attachment.id}
                        href={attachment.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {attachment.file_name}
                      </Link>
                    ))}
                  </Stack>
                </Box>
              )}

              {isAdmin && (
                <Box sx={{ mt: 3 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    <VisibilityIcon sx={{ fontSize: 16, verticalAlign: "middle", mr: 0.5 }} />
                    Views ({viewStats?.count ?? selectedBulletin.view_count ?? 0})
                  </Typography>

                  {viewerRows.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No views recorded yet.
                    </Typography>
                  ) : (
                    <List dense sx={{ p: 0 }}>
                      {viewerRows.map((row) => (
                        <ListItem key={row} sx={{ px: 0 }}>
                          <ListItemText primary={row} />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              )}

              {isAdmin && (
                <Box sx={{ mt: 3 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Acknowledgements ({acknowledgementStats?.count ?? selectedBulletin.acknowledgement_count ?? 0})
                  </Typography>

                  {(acknowledgementStats?.acknowledgements ?? []).length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No acknowledgements yet.
                    </Typography>
                  ) : (
                    <List dense sx={{ p: 0 }}>
                      {(acknowledgementStats?.acknowledgements ?? []).map((ack) => (
                        <ListItem key={ack.id} sx={{ px: 0 }}>
                          <ListItemText
                            primary={`${ack.user.name} (${ack.initials})`}
                            secondary={new Date(ack.acknowledged_at).toLocaleString()}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              )}

              {isParent && selectedBulletin.requires_initials && (
                <Box sx={{ mt: 3 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Parent Acknowledgement
                  </Typography>
                  {selectedBulletin.acknowledged ? (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      Acknowledged as {selectedBulletin.acknowledged_initials} on{" "}
                      {selectedBulletin.acknowledged_at
                        ? new Date(selectedBulletin.acknowledged_at).toLocaleString()
                        : ""}
                    </Alert>
                  ) : (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Enter your initials to confirm you reviewed this announcement.
                    </Alert>
                  )}

                  <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    <TextField
                      size="small"
                      label="Initials"
                      value={ackInitials}
                      onChange={(event) =>
                        setAckInitials((event.target as unknown as { value: string }).value.toUpperCase())
                      }
                      inputProps={{ maxLength: 8 }}
                      sx={{ width: 140 }}
                    />
                    <Button
                      variant="contained"
                      disabled={!ackInitials.trim() || acknowledgeMutation.isPending}
                      onClick={handleAcknowledge}
                    >
                      {selectedBulletin.acknowledged ? "Update" : "Acknowledge"}
                    </Button>
                  </Box>
                  <FormHelperText>
                    This announcement can only be acknowledged with initials.
                  </FormHelperText>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDetail}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
