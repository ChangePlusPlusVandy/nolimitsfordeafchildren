"use client";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import {
  Avatar,
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
} from "@mui/material";

import SectionCard from "@/client/components/SectionCard";
import SiblingAvatars from "@/client/components/students/SiblingAvatars";
import type { Sibling } from "@/client/students";

interface SiblingsSectionProps {
  siblings: Sibling[];
  canManage: boolean;
  onAdd: () => void;
  onEdit: (sibling: Sibling) => void;
  onRemove: (siblingId: string) => void;
}

export default function SiblingsSection({
  siblings,
  canManage,
  onAdd,
  onEdit,
  onRemove,
}: SiblingsSectionProps) {
  return (
    <SectionCard
      title="Siblings"
      icon={<FamilyRestroomIcon />}
      actions={
        canManage ? (
          <Button size="small" startIcon={<PersonAddIcon />} onClick={onAdd}>
            Add Sibling
          </Button>
        ) : undefined
      }
    >
      {siblings.length > 0 ? (
        <>
          <SiblingAvatars
            siblings={siblings}
            onEdit={canManage ? onEdit : undefined}
            onDelete={canManage ? onRemove : undefined}
          />
          <List dense>
            {siblings.map((sibling) => (
              <ListItem
                key={sibling.id}
                secondaryAction={
                  canManage && (
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => onEdit(sibling)}
                        aria-label={`Edit sibling ${sibling.name}`}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onRemove(sibling.id)}
                        aria-label={`Remove sibling ${sibling.name}`}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )
                }
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: "secondary.main" }}>{sibling.name.charAt(0)}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={sibling.name}
                  secondary={`${sibling.relationship}${sibling.age ? `, Age ${sibling.age}` : ""} • ${sibling.is_participant ? "Participant" : "Not participant"} • ${sibling.has_hearing_loss ? "Has hearing loss" : "No hearing loss"}`}
                />
              </ListItem>
            ))}
          </List>
        </>
      ) : (
        <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
          No siblings recorded
        </Typography>
      )}
    </SectionCard>
  );
}
