import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  TablePagination,
  Typography,
} from "@mui/material";
import { PhotoLibrary as PhotoLibraryIcon } from "@mui/icons-material";
import { useHttpClient } from "../../../plugins/axios";
import { useServerTable } from "../../global/hooks/useServerTable";
import { useLocationHttpService } from "../../locations/services/LocationHttpService";

interface GalleryPhoto {
  id: string;
  session_date: string;
  caption: string | null;
  file_url: string;
  file_name: string;
  location: {
    id: string;
    name: string;
  };
  student: {
    id: string;
    initials: string;
  } | null;
  uploaded_by_user: {
    id: string;
    name: string;
  };
}

export default function PhotoGalleryPage() {
  const httpClient = useHttpClient();
  const locationHttpService = useLocationHttpService();
  const table = useServerTable({ defaultLimit: 18 });
  const locationFilter = table.getFilter("location_id");
  const dateFilter = table.getFilter("session_date");

  const { data: locationOptions = [] } = useQuery({
    queryKey: [locationHttpService.key, "index", "photo-gallery-filter"],
    queryFn: locationHttpService.queries.index,
  });

  const { data, isLoading, error } = useQuery<{
    items: GalleryPhoto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>({
    queryKey: ["admin-photo-gallery", table.queryParams],
    queryFn: async () => {
      const response = await httpClient.get("/v1/photos", {
        params: {
          page: table.page,
          limit: table.limit,
          ...(locationFilter ? { location_id: locationFilter } : {}),
          ...(dateFilter ? { session_date: dateFilter } : {}),
        },
      });
      return response.data;
    },
  });

  const photos = data?.items ?? [];

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        <PhotoLibraryIcon sx={{ mr: 1, verticalAlign: "middle" }} />
        Photo Gallery
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <FormControl fullWidth>
            <InputLabel>Filter by location</InputLabel>
            <Select
              label="Filter by location"
              value={locationFilter}
              onChange={(event) => table.setFilter("location_id", event.target.value)}
            >
              <MenuItem value="">All locations</MenuItem>
              {locationOptions.map((location) => (
                <MenuItem key={location.id} value={location.id}>
                  {location.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Filter by session date"
            type="date"
            value={dateFilter}
            onChange={(event) => table.setFilter("session_date", event.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Stack>
      </Paper>

      {error ? (
        <Alert severity="error">Failed to load photo gallery.</Alert>
      ) : isLoading ? (
        <Typography color="text.secondary">Loading photos...</Typography>
      ) : photos.length === 0 ? (
        <Typography color="text.secondary">No photos found for current filters.</Typography>
      ) : (
        <>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" },
              gap: 2,
            }}
          >
            {photos.map((photo) => (
              <Card key={photo.id} variant="outlined">
                <Box
                  component="img"
                  src={photo.file_url}
                  alt={photo.caption || photo.file_name}
                  sx={{ width: "100%", height: 190, objectFit: "cover" }}
                />
                <CardContent>
                  <Typography variant="body2" fontWeight={600}>
                    {photo.location.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {new Date(photo.session_date).toLocaleDateString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {photo.student ? `Student ${photo.student.initials}` : "Group photo"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                    Uploaded by {photo.uploaded_by_user.name}
                  </Typography>
                  {photo.caption && <Typography variant="body2">{photo.caption}</Typography>}
                </CardContent>
              </Card>
            ))}
          </Box>
          <TablePagination
            rowsPerPageOptions={[9, 18, 36]}
            component="div"
            count={data?.total ?? 0}
            rowsPerPage={table.limit}
            page={Math.max(table.page - 1, 0)}
            onPageChange={(_event, nextPage) => table.setPage(nextPage + 1)}
            onRowsPerPageChange={(event) => table.setLimit(Number(event.target.value))}
          />
        </>
      )}
    </Box>
  );
}
