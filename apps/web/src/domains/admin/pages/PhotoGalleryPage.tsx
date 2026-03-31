import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { PhotoLibrary as PhotoLibraryIcon } from "@mui/icons-material";
import { useHttpClient } from "../../../plugins/axios";

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
  const [locationFilter, setLocationFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const { data, isLoading, error } = useQuery<{ items: GalleryPhoto[] }>({
    queryKey: ["admin-photo-gallery"],
    queryFn: async () => {
      const response = await httpClient.get("/v1/photos", {
        params: { limit: 100 },
      });
      return response.data;
    },
  });

  const filteredPhotos = (data?.items || []).filter((photo) => {
    const locationMatches = locationFilter
      ? photo.location.name.toLowerCase().includes(locationFilter.toLowerCase())
      : true;
    const dateMatches = dateFilter ? photo.session_date === dateFilter : true;
    return locationMatches && dateMatches;
  });

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        <PhotoLibraryIcon sx={{ mr: 1, verticalAlign: "middle" }} />
        Photo Gallery
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            label="Filter by location"
            value={locationFilter}
            onChange={(event) => setLocationFilter(event.target.value)}
            fullWidth
          />
          <TextField
            label="Filter by session date"
            type="date"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Stack>
      </Paper>

      {error ? (
        <Alert severity="error">Failed to load photo gallery.</Alert>
      ) : isLoading ? (
        <Typography color="text.secondary">Loading photos...</Typography>
      ) : filteredPhotos.length === 0 ? (
        <Typography color="text.secondary">No photos found for current filters.</Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" },
            gap: 2,
          }}
        >
          {filteredPhotos.map((photo) => (
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
      )}
    </Box>
  );
}
