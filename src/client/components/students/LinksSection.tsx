"use client";

import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import LinkIcon from "@mui/icons-material/Link";
import SchoolIcon from "@mui/icons-material/School";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import ErrorAlert from "@/client/components/ErrorAlert";
import SectionCard from "@/client/components/SectionCard";
import { getStudentTeachers, type LinkedParent } from "@/client/students";

interface LinksSectionProps {
  studentId: string;
  parents: LinkedParent[];
  onLinkTeacher: () => void;
  onLinkParent: () => void;
}

export default function LinksSection({
  studentId,
  parents,
  onLinkTeacher,
  onLinkParent,
}: LinksSectionProps) {
  const {
    data: teachersData,
    isLoading: teachersLoading,
    error: teachersError,
    refetch: refetchTeachers,
  } = useQuery({
    queryKey: ["studentTeachers", studentId],
    queryFn: () => getStudentTeachers(studentId, { page: 1, limit: 100 }),
  });

  const teachers = teachersData?.items ?? [];

  return (
    <>
      <SectionCard
        title="Linked Teachers"
        icon={<SchoolIcon />}
        actions={
          <Button size="small" startIcon={<LinkIcon />} onClick={onLinkTeacher}>
            Link Teacher
          </Button>
        }
      >
        {teachersLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : teachersError ? (
          <ErrorAlert message="Failed to load linked teachers." onRetry={() => refetchTeachers()} />
        ) : teachers.length > 0 ? (
          <List dense>
            {teachers.map((teacher) => (
              <ListItem key={teacher.link_id}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: "info.main" }}>{teacher.name.charAt(0)}</Avatar>
                </ListItemAvatar>
                <ListItemText primary={teacher.name} secondary={teacher.email} />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
            No teachers linked
          </Typography>
        )}
      </SectionCard>

      <SectionCard
        title="Linked Parents"
        icon={<FamilyRestroomIcon />}
        actions={
          <Button size="small" startIcon={<LinkIcon />} onClick={onLinkParent}>
            Link Parent
          </Button>
        }
      >
        {parents.length > 0 ? (
          <List dense>
            {parents.map((parent) => (
              <ListItem key={parent.link_id}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: "warning.main" }}>{parent.name.charAt(0)}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {parent.name}
                      {parent.is_primary && <Chip label="Primary" size="small" color="primary" />}
                    </Box>
                  }
                  secondary={
                    <>
                      {parent.relationship && `${parent.relationship} - `}
                      {parent.email}
                      {parent.phone && ` - ${parent.phone}`}
                    </>
                  }
                  slotProps={{ secondary: { component: "div" } }}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
            No parents linked
          </Typography>
        )}
      </SectionCard>
    </>
  );
}
