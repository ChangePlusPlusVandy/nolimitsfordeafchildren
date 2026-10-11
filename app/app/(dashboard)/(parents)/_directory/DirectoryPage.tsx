"use client";

import { Contacts as ContactsIcon } from "@mui/icons-material";
import { Avatar, Box, Chip, Divider, Stack, TablePagination, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Suspense } from "react";

import { useServerTable } from "@/_shared/hooks/useServerTable";
import EmptyState from "@/_shared/ui/EmptyState";
import ErrorAlert from "@/_shared/ui/ErrorAlert";
import PageContainer from "@/_shared/ui/PageContainer";
import PageHeader from "@/_shared/ui/PageHeader";
import SectionCard from "@/_shared/ui/SectionCard";
import ListSkeleton from "@/_shared/ui/skeletons/ListSkeleton";

import { getDirectory } from "./client";

function roleLabel(role: "administrator" | "teacher") {
  return role === "administrator" ? "Administrator" : "Teacher";
}

function ParentDirectoryPage() {
  const table = useServerTable({ defaultLimit: 20 });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["parents", "directory", table.page, table.limit],
    queryFn: () => getDirectory({ page: table.page, limit: table.limit }),
  });

  const items = data?.items ?? [];

  return (
    <PageContainer>
      <PageHeader title="Staff Directory" />

      {isLoading ? (
        <ListSkeleton />
      ) : error ? (
        <ErrorAlert
          message="Failed to load directory. Please try again."
          onRetry={() => refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<ContactsIcon sx={{ fontSize: 48 }} />}
          title="No Directory Members"
          description="No directory members are available for your linked locations."
        />
      ) : (
        <SectionCard noPadding>
          <Stack divider={<Divider />}>
            {items.map((person) => (
              <Box
                key={person.id}
                sx={{ display: "flex", gap: 2, alignItems: "flex-start", p: 2.5 }}
              >
                <Avatar src={person.photo_url || undefined} sx={{ width: 56, height: 56 }}>
                  {person.name.charAt(0)}
                </Avatar>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                    <Typography variant="h6">{person.name}</Typography>
                    <Chip label={roleLabel(person.role)} size="small" variant="outlined" />
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {person.email}
                  </Typography>

                  {person.bio ? (
                    <Typography variant="body2">{person.bio}</Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                      Bio not available.
                    </Typography>
                  )}
                </Box>
              </Box>
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
        </SectionCard>
      )}
    </PageContainer>
  );
}

export default function ParentDirectoryPageWrapper() {
  // useServerTable reads the URL search params, which requires a Suspense
  // boundary during static/prerender rendering in Next.js.
  return (
    <Suspense fallback={<ListSkeleton />}>
      <ParentDirectoryPage />
    </Suspense>
  );
}
