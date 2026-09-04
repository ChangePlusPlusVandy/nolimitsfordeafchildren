"use client";

import { FamilyRestroom as FamilyIcon, Refresh as RefreshIcon } from "@mui/icons-material";
import {
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getSiblingParticipationReport } from "@/client/attendance";
import EmptyState from "@/client/components/EmptyState";
import ErrorAlert from "@/client/components/ErrorAlert";
import PageContainer from "@/client/components/PageContainer";
import PageHeader from "@/client/components/PageHeader";
import SectionCard from "@/client/components/SectionCard";
import TableSkeleton from "@/client/components/skeletons/TableSkeleton";
import { listAllLocations } from "@/client/locations";

interface SiblingParticipationReportItem {
  sibling_id: string;
  sibling_name: string;
  student_id: string;
  student_initials: string;
  site_id: string;
  site_name: string;
  total_sessions: number;
  present_sessions: number;
}

export default function SiblingParticipationReportPage() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [siteId, setSiteId] = useState("");

  const { data: locationOptions = [] } = useQuery({
    queryKey: ["locations", "all", "sibling-participation-report"],
    queryFn: () => listAllLocations(),
  });

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-sibling-participation-report", dateFrom, dateTo, siteId],
    queryFn: () =>
      getSiblingParticipationReport({
        ...(dateFrom ? { date_from: dateFrom } : {}),
        ...(dateTo ? { date_to: dateTo } : {}),
        ...(siteId ? { site_id: siteId } : {}),
      }),
  });

  const items: SiblingParticipationReportItem[] = data?.items ?? [];
  const totalSessions = items.reduce((sum, item) => sum + item.total_sessions, 0);
  const presentSessions = items.reduce((sum, item) => sum + item.present_sessions, 0);
  const attendanceRate =
    totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;

  return (
    <PageContainer>
      <PageHeader title="Sibling Participation Report" />

      <Stack spacing={3}>
        {/* Filters */}
        <SectionCard>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{ alignItems: { md: "center" } }}
          >
            <TextField
              label="Date from"
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
            <TextField
              label="Date to"
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Location</InputLabel>
              <Select
                value={siteId}
                label="Location"
                onChange={(event) => setSiteId(event.target.value)}
              >
                <MenuItem value="">All locations</MenuItem>
                {locationOptions.map((location) => (
                  <MenuItem key={location.id} value={location.id}>
                    {location.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={() => refetch()}
              disabled={isFetching}
              sx={{ minWidth: 110 }}
            >
              Refresh
            </Button>
          </Stack>
        </SectionCard>

        {/* Summary chips */}
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Chip label={`${items.length} sibling entries`} variant="outlined" />
          <Chip label={`${presentSessions}/${totalSessions} present sessions`} variant="outlined" />
          <Chip
            label={`${attendanceRate}% attendance rate`}
            color={attendanceRate >= 80 ? "success" : "default"}
          />
        </Stack>

        {/* Content */}
        {isLoading ? (
          <TableSkeleton />
        ) : error ? (
          <ErrorAlert
            message="Failed to load sibling participation report."
            onRetry={() => refetch()}
          />
        ) : items.length === 0 ? (
          <SectionCard>
            <EmptyState
              icon={<FamilyIcon sx={{ fontSize: 48 }} />}
              title="No Records Found"
              description="No sibling participation records found for the selected filters."
            />
          </SectionCard>
        ) : (
          <SectionCard noPadding>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Location</TableCell>
                    <TableCell>Student</TableCell>
                    <TableCell>Sibling</TableCell>
                    <TableCell align="right">Present</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="right">Rate</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => {
                    const rowRate =
                      item.total_sessions > 0
                        ? Math.round((item.present_sessions / item.total_sessions) * 100)
                        : 0;

                    return (
                      <TableRow key={`${item.sibling_id}-${item.student_id}-${item.site_id}`}>
                        <TableCell>{item.site_name}</TableCell>
                        <TableCell>{item.student_initials}</TableCell>
                        <TableCell>{item.sibling_name}</TableCell>
                        <TableCell align="right">{item.present_sessions}</TableCell>
                        <TableCell align="right">{item.total_sessions}</TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            color={rowRate >= 80 ? "success.main" : "text.primary"}
                            sx={{ fontWeight: rowRate >= 80 ? 600 : 400 }}
                          >
                            {rowRate}%
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </SectionCard>
        )}
      </Stack>
    </PageContainer>
  );
}
