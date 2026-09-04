import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";

export default function HomePage() {
  return (
    <Container maxWidth="md">
      <Box sx={{ py: 8, textAlign: "center" }}>
        <Typography variant="h3" component="h1" gutterBottom>
          No Limits for Deaf Children
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Help deaf children speak, learn, and dream.
        </Typography>
      </Box>
    </Container>
  );
}
