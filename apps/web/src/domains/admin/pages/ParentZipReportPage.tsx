import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { useParentHttpService } from "../../parents/services/ParentHttpService";

export default function ParentZipReportPage() {
  const parentService = useParentHttpService();

  const { data, isLoading, error } = useQuery({
    queryKey: [parentService.key, "zip-report"],
    queryFn: parentService.queries.zipReport,
  });

  const totals = useMemo(() => {
    const groups = data?.items ?? [];
    return {
      zips: groups.length,
      parents: groups.reduce((sum, group) => sum + group.parent_count, 0),
      students: groups.reduce((sum, group) => sum + group.student_count, 0),
    };
  }, [data]);

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Failed to load parent zip report.</Alert>;
  }

  const groups = data?.items ?? [];

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Parent ZIP Report
      </Typography>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 3 }}>
        <Chip label={`${totals.zips} ZIP codes`} color="primary" />
        <Chip label={`${totals.parents} parents`} color="secondary" />
        <Chip label={`${totals.students} linked students`} color="success" />
      </Stack>

      {groups.length === 0 ? (
        <Alert severity="info">No parent ZIP data available yet.</Alert>
      ) : (
        <Stack spacing={2}>
          {groups.map((group) => (
            <Card key={group.postal_code} variant="outlined">
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                  <Typography variant="h6">ZIP {group.postal_code}</Typography>
                  <Stack direction="row" spacing={1}>
                    <Chip size="small" label={`${group.parent_count} parents`} />
                    <Chip size="small" label={`${group.student_count} students`} />
                  </Stack>
                </Box>

                <Divider sx={{ my: 1.5 }} />

                <Stack spacing={1}>
                  {group.parents.map((parent) => (
                    <Box key={parent.parent_user_id}>
                      <Typography variant="body1" fontWeight={500}>
                        {parent.parent_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {parent.parent_email}
                        {parent.city || parent.state
                          ? ` • ${[parent.city, parent.state].filter(Boolean).join(", ")}`
                          : ""}
                        {` • ${parent.linked_students} linked student${parent.linked_students === 1 ? "" : "s"}`}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
}
