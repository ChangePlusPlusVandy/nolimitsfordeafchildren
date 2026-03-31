import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { useParentHttpService } from "../services/ParentHttpService";

function roleLabel(role: "administrator" | "teacher") {
  return role === "administrator" ? "Administrator" : "Teacher";
}

function roleColor(role: "administrator" | "teacher") {
  return role === "administrator" ? "primary" : "secondary";
}

export default function ParentDirectoryPage() {
  const parentHttpService = useParentHttpService();

  const { data, isLoading, error } = useQuery({
    queryKey: [parentHttpService.key, "directory"],
    queryFn: () => parentHttpService.queries.directory(),
  });

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Failed to load directory.</Alert>;
  }

  const items = data?.items ?? [];

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Staff Directory
      </Typography>

      {items.length === 0 ? (
        <Alert severity="info">No directory members are available for your linked locations.</Alert>
      ) : (
        <Stack spacing={2}>
          {items.map((person) => (
            <Card key={person.id} variant="outlined">
              <CardContent>
                <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                  <Avatar src={person.photo_url || undefined} sx={{ width: 56, height: 56 }}>
                    {person.name.charAt(0)}
                  </Avatar>

                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                      <Typography variant="h6">{person.name}</Typography>
                      <Chip
                        label={roleLabel(person.role)}
                        size="small"
                        color={roleColor(person.role)}
                        variant="outlined"
                      />
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {person.email}
                    </Typography>

                    <Divider sx={{ my: 1.5 }} />

                    {person.bio ? (
                      <Typography variant="body2">{person.bio}</Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary" fontStyle="italic">
                        Bio not available.
                      </Typography>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
}
