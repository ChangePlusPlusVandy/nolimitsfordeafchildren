"use client";

import AttachFileIcon from "@mui/icons-material/AttachFile";
import BlockIcon from "@mui/icons-material/Block";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PublicIcon from "@mui/icons-material/Public";
import ScheduleIcon from "@mui/icons-material/Schedule";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Box, CardActionArea, CardContent, Chip, Paper, Stack, Typography } from "@mui/material";
import type { Bulletin, BulletinRoleTarget, BulletinScope } from "@/client/bulletins";
import { formatDate } from "@/client/utils/formatDate";

interface BulletinCardProps {
  bulletin: Bulletin;
  onClick?: (bulletin: Bulletin) => void;
}

function getScopeChip(scope: BulletinScope, siteName?: string) {
  if (scope === "global") {
    return <Chip icon={<PublicIcon />} label="Global" size="small" variant="outlined" />;
  }
  return (
    <Chip
      icon={<LocationOnIcon />}
      label={siteName || "Site-specific"}
      size="small"
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

  return <Chip label={labels[roleTarget]} size="small" variant="outlined" />;
}

function truncateText(text: string | null, maxLength: number): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength).trim()}...`;
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
    <Paper sx={{ mb: 2 }}>
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
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
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
              {bulletin.approval_status === "pending" && (
                <Chip
                  icon={<HourglassEmptyIcon />}
                  label="Pending Approval"
                  size="small"
                  color="warning"
                  variant="outlined"
                />
              )}
              {bulletin.approval_status === "rejected" && (
                <Chip
                  icon={<BlockIcon />}
                  label="Rejected"
                  size="small"
                  color="error"
                  variant="outlined"
                />
              )}
              {bulletin.requires_initials && (
                <Chip
                  icon={<HowToRegIcon />}
                  label="Initials Required"
                  size="small"
                  color="info"
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
            {typeof bulletin.view_count === "number" && (
              <Chip
                icon={<VisibilityIcon />}
                label={bulletin.view_count}
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </CardContent>
      </CardActionArea>
    </Paper>
  );
}
