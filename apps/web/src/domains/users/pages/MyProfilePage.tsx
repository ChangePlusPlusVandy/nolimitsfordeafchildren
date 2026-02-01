import { useUserHttpService } from "../services/UserHttpService"
import { Button, Avatar, Box, Stack, Typography, TextField } from "@mui/material"
import Grid from '@mui/material/Grid2';
import { useState } from "react"


export default function MyProfilePage() {
  useUserHttpService()
  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('Liza Peretti');
  const [email, setEmail] = useState('lizaperetti@gmail.com')
  const [title] = useState("Teacher");
  const [phoneNumber, setPhoneNumber] = useState('(312) 404-8082')
  const [address, setAddress] = useState('Baldwin Park, CA')

  const handleEditClick = () => {
    setIsEditing(!isEditing)
  }

  return (
    <Box sx={{ p: 4 }}>
      {/* Page title */}
      <Typography variant="h4" gutterBottom>
        My Profile
      </Typography>

      {/* Main content */}
      <Grid container spacing={4} sx={{ mt: 4 }} alignItems="flex-start">
        {/* Avatar */}
        <Grid>
          <Avatar
            src="/profile.jpg"
            sx={{ width: 96, height: 96 }}
          />
        </Grid>

        {/* Profile details */}
        <Grid>
          <Stack>
            {/* Name */}
            {isEditing ? (
              <>
                <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
              </>
            ) : (
              <>
                <Typography variant="h5">Elizabeth Peretti</Typography>
              </>
            )}

            {/* Info rows */}
            <Grid container spacing={12}>
              <Grid>
                {isEditing ? (
                  <>
                    <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth sx={{ mt: 2 }}/>
                    <Typography mt={4}>{title}</Typography>
                  </>
                ) : (
                  <>
                    <Typography>{email}</Typography>
                    <Typography>{title}</Typography>
                  </>
                )}
              </Grid>

              <Grid>
                {isEditing ? (
                  <>
                    <TextField label="Phone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} fullWidth sx={{ mt: 2 }}/>
                    <TextField label="Address" value={address} onChange={(e) => setAddress(e.target.value)} fullWidth sx={{ mt: 2 }} />
                  </>
                ) : (
                  <>
                    <Typography>{phoneNumber}</Typography>
                    <Typography>{address}</Typography>
                  </>
                )}
              </Grid>
            </Grid>

            {/* Buttons */}
            <Stack spacing={2} mt={4} alignItems="flex-start">

                <Button variant="contained" onClick={handleEditClick}>
                  {isEditing ? 'Save Changes' : 'Edit Profile'}
                </Button>
              <Button variant="contained" color="secondary">
                Change Password
              </Button>
            </Stack>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  )
}
