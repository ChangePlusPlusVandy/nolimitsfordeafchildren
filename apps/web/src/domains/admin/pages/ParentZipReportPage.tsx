import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Chip,
  Divider,
  Stack,
  TablePagination,
  Typography,
} from "@mui/material";
import { LocationOn as LocationIcon } from "@mui/icons-material";
import { useParentHttpService } from "../../parents/services/ParentHttpService";
import { useServerTable } from "../../global/hooks/useServerTable";
import PageContainer from "../../global/components/PageContainer";
import PageHeader from "../../global/components/PageHeader";
import SectionCard from "../../global/components/SectionCard";
import ErrorAlert from "../../global/components/ErrorAlert";
import EmptyState from "../../global/components/EmptyState";
import CardGridSkeleton from "../../global/components/skeletons/CardGridSkeleton";

export default function ParentZipReportPage() {
  const parentService = useParentHttpService();
  const table = useServerTable({ defaultLimit: 20 });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [parentService.key, "zip-report", table.page, table.limit],
    queryFn: () => parentService.queries.zipReport({ page: table.page, limit: table.limit }),
  });

  const totals = useMemo(() => {
    const groups = data?.items ?? [];
    return {
      zips: groups.length,
      parents: groups.reduce((sum, group) => sum + group.parent_count, 0),
      students: groups.reduce((sum, group) => sum + group.student_count, 0),
    };
  }, [data]);

  const groups = data?.items ?? [];

  return (
    <PageContainer>
      <PageHeader title="Parent ZIP Report" />

      {isLoading ? (
        <CardGridSkeleton />
      ) : error ? (
        <ErrorAlert
          message="Failed to load parent zip report."
          onRetry={() => refetch()}
        />
      ) : (
        <Stack spacing={3}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <Chip label={`${totals.zips} ZIP codes`} variant="outlined" />
            <Chip label={`${totals.parents} parents`} variant="outlined" />
            <Chip label={`${totals.students} linked students`} variant="outlined" />
          </Stack>

          {groups.length === 0 ? (
            <SectionCard>
              <EmptyState
                icon={<LocationIcon sx={{ fontSize: 48 }} />}
                title="No ZIP Data"
                description="No parent ZIP data available yet."
              />
            </SectionCard>
          ) : (
            <>
              <Stack spacing={2}>
                {groups.map((group) => (
                  <SectionCard key={group.postal_code}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 1,
                      }}
                    >
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
                  </SectionCard>
                ))}
              </Stack>
              <TablePagination
                rowsPerPageOptions={[10, 20, 50]}
                component="div"
                count={data?.total ?? 0}
                rowsPerPage={table.limit}
                page={Math.max(table.page - 1, 0)}
                onPageChange={(_event, nextPage) => table.setPage(nextPage + 1)}
                onRowsPerPageChange={(event) => table.setLimit(Number(event.target.value))}
              />
            </>
          )}
        </Stack>
      )}
    </PageContainer>
  );
}
