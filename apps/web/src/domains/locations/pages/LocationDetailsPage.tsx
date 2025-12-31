import { useMutation } from "@tanstack/react-query"
import { useLocationHttpService } from "../services/LocationHttpService"
import { Button, Avatar, Box, Stack, Typography, TextField, IconButton, Card } from "@mui/material"
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { ThemeProvider } from '@mui/material/styles';
import React, { useState } from 'react'

export default function LocationDetailsPage() {
  const locationHttpService = useLocationHttpService()

  const { mutate: _mutate } = useMutation({
    mutationKey: [locationHttpService.key, 'show'],
    mutationFn: locationHttpService.mutations.show,
    onSuccess: (data) => {
      console.log(data)
    },
    onError: (error) => {
      console.error(error)
    }
  })

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('Smith Public Library');
  const [email, setEmail] = useState('lizaperetti@gmail.com')
  const [title] = useState('Teacher');
  const [phoneNumber, setPhoneNumber] = useState('(312) 404-8082')
  const [address, setAddress] = useState('4181 Baldwin Park Blvd Baldwin Park, CA 91706')
  const teachers = ["Alex Rodriguez", "Sarah Jones", "Cecily Greene"]
  
  

  return (
    <Box sx={{ display: "flex", flexDirection: "column", mb: 3, gap: 2 }}>
        
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <IconButton>
          <ArrowBackIcon />
        </IconButton>
      </Box>
      
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Title + location on the left */}
        <Box sx={{ ml: 12 }}>
          <Typography variant="h4">Smith Public Library</Typography>
          <Typography color="text.secondary">
            Baldwin Park, CA
          </Typography>
        </Box>
        <Box>
          {/* Button floats to the right */}
          <Button
            variant="contained"
            color="error"
            sx={{ borderRadius: 3 }}
          >
            Edit Details
          </Button>
          <Box sx={{ maxWidth: 200, mt: 1, alignSelf: "flex-start" }}> 
            <Typography sx={{ whiteSpace: "normal", wordBreak: "break-word", textAlign: "left" }}>
              {address}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 4 ,justifyContent: "space-between", ml: 12 }}>
        {/* Left side: Teachers */}
        <Box>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {teachers.length} Teachers Registered
          </Typography>

          <Stack spacing={2}>
            {teachers.map((teacher) => (
              <Card
                key={teacher}
                sx={{
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  borderRadius: 4,
                  backgroundColor: "#e0e0e0",
                  maxWidth: 1200,
                  minWidth: 400,
                  width: "100%",
                  mx: "auto",
                }}
              >
                <Avatar
                  src="profile.jpg"
                  sx={{ width: 56, height: 56, mr: 2 }}
                />

                <Box>
                  <Typography variant="h6">{teacher}</Typography>
                </Box>
              </Card>
            ))}
          </Stack>
        </Box>
        <Box sx={{ backgroundColor: "#e0e0e0", borderRadius: 3, p: 2,  }}>
          <Typography variant="h5">Today's Schedule</Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
              {new Date().toLocaleDateString()}
          </Typography>
          <Box sx={{ display: "flex", gap: 2, mt: 4}}>
            {/* Left: Time scale */}
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", pr: 1 }}>
              {Array.from({ length: 12 }, (_, i) => (
                <Typography key={i} sx={{ mb: 3, fontSize: 12 }}>
                  {i + 8}:00
                </Typography>
              ))}
            </Box>

            {/* Right: Schedule block */}
            <Box sx={{ flexGrow: 1, border: "1px solid #ccc", borderRadius: 2, p: 2 }}>

              {/* Example schedule items but add the for loop part when there are events */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Card sx={{ p: 1, backgroundColor: "#ff0000" }}>
                  <Typography color="#ffffff">9:00 - 10:00 AM: Staff Meeting</Typography>
                </Card>
                <Card sx={{ p: 1, backgroundColor: "#00ff00" }}>
                  <Typography color="#ffffff">10:00 - 12:00 PM: Library Open</Typography>
                </Card>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}


