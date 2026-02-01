import { Box, Avatar, Tooltip, IconButton, Paper, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import type { Sibling } from "../services/StudentHttpService";

interface SiblingAvatarsProps {
  siblings: Sibling[];
  onEdit?: (sibling: Sibling) => void;
  onDelete?: (siblingId: string) => void;
}

export default function SiblingAvatars({ siblings, onEdit, onDelete }: SiblingAvatarsProps) {
  if (siblings.length === 0) return null;

  return (
    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
      {siblings.map((sibling) => (
        <Tooltip
          key={sibling.id}
          title={
            <Paper sx={{ p: 1.5, maxWidth: 200 }}>
              <Typography variant="subtitle2" fontWeight="bold">
                {sibling.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {sibling.relationship}
                {sibling.age && `, Age ${sibling.age}`}
              </Typography>
              {sibling.notes && (
                <Typography variant="body2" sx={{ mt: 1, fontStyle: "italic" }}>
                  {sibling.notes}
                </Typography>
              )}
              {(onEdit || onDelete) && (
                <Box sx={{ display: "flex", gap: 0.5, mt: 1 }}>
                  {onEdit && (
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(sibling);
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  )}
                  {onDelete && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(sibling.id);
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              )}
            </Paper>
          }
          arrow
          placement="top"
          componentsProps={{
            tooltip: {
              sx: {
                bgcolor: "transparent",
                p: 0,
              },
            },
          }}
        >
          <Avatar
            src={sibling.photo_url || undefined}
            sx={{
              bgcolor: "secondary.main",
              cursor: "pointer",
              width: 48,
              height: 48,
              "&:hover": {
                boxShadow: 2,
              },
            }}
          >
            {sibling.name.charAt(0).toUpperCase()}
          </Avatar>
        </Tooltip>
      ))}
    </Box>
  );
}
