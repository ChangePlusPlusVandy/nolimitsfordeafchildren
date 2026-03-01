import { Card, CardContent, CardActionArea, Typography, Box, Chip, Stack } from "@mui/material";
import PublicIcon from "@mui/icons-material/Public";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import ScheduleIcon from "@mui/icons-material/Schedule";
import type { Bulletin, BulletinScope, BulletinRoleTarget } from "../services/BulletinHttpService";

interface BulletinCardProps {
  bulletin: Bulletin;
  onClick?: (bulletin: Bulletin) => void;
}

function getScopeChip(scope: BulletinScope, siteName?: string) {
  if (scope === "global") {
    return (
      <Chip icon={<PublicIcon />} label="Global" size="small" color="primary" variant="outlined" />
    );
  }
  return (
    <Chip
      icon={<LocationOnIcon />}
      label={siteName || "Site-specific"}
      size="small"
      color="secondary"
      variant="outlined"
    />
  );
}

function getRoleTargetChip(roleTarget: BulletinRoleTarget) {
  const labels: Record<BulletinRoleTarget, string> = {
    all: "All Users",
    administrator: "Admins",
    teacher: "Teachers",
    parent: "Parents",
  };

  const colors: Record<BulletinRoleTarget, "default" | "primary" | "secondary" | "success"> = {
    all: "default",
    administrator: "primary",
    teacher: "secondary",
    parent: "success",
  };

  return (
    <Chip label={labels[roleTarget]} size="small" color={colors[roleTarget]} variant="filled" />
  );
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function truncateText(text: string | null, maxLength: number): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
}

export default function BulletinCard({ bulletin, onClick }: BulletinCardProps) {
  const publishDate = bulletin.publish_at || bulletin.created_at;
  const isScheduled = bulletin.publish_at && new Date(bulletin.publish_at) > new Date();

  const handleClick = () => {
    if (onClick) {
      onClick(bulletin);
    }
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardActionArea onClick={handleClick} disabled={!onClick}>
        <CardContent>
          {/* Header with badges */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 1,
            }}
          >
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {getScopeChip(bulletin.scope, bulletin.site_name)}
              {getRoleTargetChip(bulletin.role_target)}
              {isScheduled && (
                <Chip
                  icon={<ScheduleIcon />}
                  label="Scheduled"
                  size="small"
                  color="warning"
                  variant="outlined"
                />
              )}
            </Stack>
            {bulletin.attachments.length > 0 && (
              <Chip
                icon={<AttachFileIcon />}
                label={bulletin.attachments.length}
                size="small"
                variant="outlined"
              />
            )}
          </Box>

          {/* Title */}
          <Typography variant="h6" component="h2" gutterBottom>
            {bulletin.title}
          </Typography>

          {/* Body preview */}
          {bulletin.body && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {truncateText(bulletin.body, 200)}
            </Typography>
          )}

          {/* Footer with date and author */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="caption" color="text.secondary">
              {formatDate(publishDate)}
              {bulletin.created_by_name && ` by ${bulletin.created_by_name}`}
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
