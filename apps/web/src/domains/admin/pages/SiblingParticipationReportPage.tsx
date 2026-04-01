import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
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
import { useHttpClient } from "../../../plugins/axios";
import { useLocationHttpService } from "../../locations/services/LocationHttpService";

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
  const httpClient = useHttpClient();
  const locationHttpService = useLocationHttpService();

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [siteId, setSiteId] = useState("");

  const { data: locationOptions = [] } = useQuery({
    queryKey: [locationHttpService.key, "index", "sibling-participation-report"],
    queryFn: locationHttpService.queries.index,
  });

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-sibling-participation-report", dateFrom, dateTo, siteId],
    queryFn: async () => {
      const response = await httpClient.get("/v1/attendance/sibling-participation-report", {
        params: {
          ...(dateFrom ? { date_from: dateFrom } : {}),
          ...(dateTo ? { date_to: dateTo } : {}),
          ...(siteId ? { site_id: siteId } : {}),
        },
      });

      return response.data as { items: SiblingParticipationReportItem[]; total: number };
    },
  });

  const items = data?.items ?? [];
  const totalSessions = items.reduce((sum, item) => sum + item.total_sessions, 0);
  const presentSessions = items.reduce((sum, item) => sum + item.present_sessions, 0);
  const attendanceRate = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Sibling Participation Report
      </Typography>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
            <TextField
              label="Date from"
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Date to"
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Location</InputLabel>
              <Select value={siteId} label="Location" onChange={(event) => setSiteId(event.target.value)}>
                <MenuItem value="">All locations</MenuItem>
                {locationOptions.map((location) => (
                  <MenuItem key={location.id} value={location.id}>
                    {location.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="contained" onClick={() => refetch()} disabled={isFetching}>
              Refresh
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
        <Chip label={`${items.length} sibling entries`} variant="outlined" />
        <Chip label={`${presentSessions}/${totalSessions} present sessions`} variant="outlined" />
        <Chip label={`${attendanceRate}% attendance rate`} color={attendanceRate >= 80 ? "success" : "default"} />
      </Stack>

      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={28} />
        </Box>
      )}

      {error && <Alert severity="error">Failed to load sibling participation report.</Alert>}

      {!isLoading && !error && items.length === 0 && (
        <Alert severity="info">No sibling participation records found for the selected filters.</Alert>
      )}

      {!isLoading && !error && items.length > 0 && (
        <TableContainer component={Card} variant="outlined">
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
                const rowRate = item.total_sessions > 0 ? Math.round((item.present_sessions / item.total_sessions) * 100) : 0;

                return (
                  <TableRow key={`${item.sibling_id}-${item.student_id}-${item.site_id}`}>
                    <TableCell>{item.site_name}</TableCell>
                    <TableCell>{item.student_initials}</TableCell>
                    <TableCell>{item.sibling_name}</TableCell>
                    <TableCell align="right">{item.present_sessions}</TableCell>
                    <TableCell align="right">{item.total_sessions}</TableCell>
                    <TableCell align="right">{rowRate}%</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
