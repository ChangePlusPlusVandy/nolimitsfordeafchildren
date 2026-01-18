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
  
  const [isInSession, setIsInSession] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('Smith Public Library');
  const [email, setEmail] = useState('lizaperetti@gmail.com');
  const [title] = useState('Teacher');
  const [phoneNumber, setPhoneNumber] = useState('(312) 404-8082');
  const [address, setAddress] = useState('4181 Baldwin Park Blvd Baldwin Park, CA 91706');
  const teachers = [
  { name: "Alex Rodriguez", type: "Preschool"},
  { name: "Sarah Jones", type: "Teen"},
  { name: "Cecily Greene", type: "Teen"},
  ];
  

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

      <Box sx={{ display: "flex", gap: 4, ml: 12, mr: 12, mt: 4, alignItems: "flex-start" }}>
        <Box>
          <Box>
            {isInSession ? (
              <>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      <span style={{ color: 'red' }}>Currently In Session</span>
                    </Typography>
                <Box
                  sx={{
                    backgroundColor: '#b9f6ca', // Light green background
                    border: '2px solid #2e7d32', // Darker green border
                    borderRadius: '8px',
                    padding: '12px 16px',
                    width: '100%',
                    maxWidth: '400px',
                    boxSizing: 'border-box',
                  }}
                >
                  {/* Header: Class Name */}
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5, color: '#000' }}>
                    Preschool Lesson
                  </Typography>

                  {/* Subheader: Time and Teacher */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#444' }}>
                      9:00 - 10:00
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#444' }}>
                      Alex Rodriguez
                    </Typography>
                  </Box>

                  {/* Attendance Footer */}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      <span style={{ color: 'red' }}>8/10</span> students present
                    </Typography>
                  </Box>
                </Box>
              </>
            ):(
              <>
              </>
            )}
          </Box>

          <Box sx={{ display: "flex", gap: 4 ,justifyContent: "space-between"}}>
            {/* Left side: Teachers */}
            <Box>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                {teachers.length} Teachers Registered
              </Typography>

              <Stack spacing={2}>
                {teachers.map((teacher) => (
                  <Card
                    key={teacher.name}
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
                      <Typography variant="h6">{teacher.name}</Typography>
                      <Box
                        sx={{
                          backgroundColor: teacher.type === "Preschool" ? "#32CD32" : "#D81B60",
                          color: "white",
                          padding: "4px 16px",
                          borderRadius: "20px", // Makes it an ellipse/pill shape
                          display: "inline-block",
                          width: "fit-content",
                          fontSize: "0.875rem",
                          fontWeight: "medium"
                        }}
                      >
                        {teacher.type}
                      </Box>
                    </Box>
                  </Card>
                ))}
              </Stack>
            </Box>
          </Box>
        </Box>
        <Box sx={{ ml: 10 }}>
          <iframe 
          src="https://calendar.google.com/calendar/embed?height=600&wkst=1&ctz=America%2FChicago&showPrint=0&src=NDMwNWJkMTU0N2ZhZTk3MTQyZTU4OTc1ZTAwODczMWVmOTQ0OGI0NmRmOWUwMTg5NDE4MzcwN2NlZjYwNTRiNUBncm91cC5jYWxlbmRhci5nb29nbGUuY29t&src=ZW4udXNhI2hvbGlkYXlAZ3JvdXAudi5jYWxlbmRhci5nb29nbGUuY29t&color=%23e4c441&color=%230b8043" 
          style={{ border: "solid 1px #777", borderRadius: 10, width: 800, height: 600 }}>
          </iframe>
        </Box>
      </Box>
    </Box>
  )
}


