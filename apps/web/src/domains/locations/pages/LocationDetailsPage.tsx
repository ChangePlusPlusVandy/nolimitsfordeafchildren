import { useLocationHttpService } from "../services/LocationHttpService";
import { Button, Avatar, Box, Stack, Typography, TextField, IconButton, Card, ToggleButton, ToggleButtonGroup } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LocationDetailsPage() {
  useLocationHttpService()
  
  const [isInSession] = useState(true);
  const [role, setRole] = useState("teachers");
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("Smith Public Library");
  const [address, setAddress] = useState(
    "4181 Baldwin Park Blvd Baldwin Park, CA 91706"
  );

  const teachers = [
  { id: 1, name: "Alex Rodriguez", type: "Preschool"},
  { id: 2,name: "Sarah Jones", type: "Teen"},
  { id: 3,name: "Cecily Greene", type: "Teen"},
  ];

  const students = [
  { id: 4, name: "Ryan Mccauley", grade: "Preschool", isHere: true},
  { id: 5,name: "Avash Aryal", grade: "Teen", isHere: true},
  { id: 6,name: "Roy Won", grade: "Infant", isHere: false},
  { id: 7, name: "Emily Peng", grade: "Adult", isHere: true},
  { id: 8,name: "Ashley Lai", grade: "Teen", isHere: false},
  { id: 9,name: "Nirmal Alla", grade: "Baby", isHere: false},
  ];
  
  const myEvents = [
    {
      title: "Conference",
      start: "2026-01-18", // Matches Sun 1/18
      end: "2026-01-20", // Ends on Mon 1/19 (end date is exclusive in FC)
      allDay: true,
    },
    {
      title: "Birthday Party",
      start: "2026-01-20T07:00:00", // Tue 1/20 at 7:00 AM
      end: "2026-01-20T08:00:00",
    },
    {
      title: "Meeting",
      start: "2026-01-19T10:30:00", // Mon 1/19
      end: "2026-01-19T12:30:00",
    },
    {
      title: "Lunch",
      start: "2026-01-19T12:00:00",
      end: "2026-01-19T13:00:00",
    },
  ];

  const handleEditClick = () => {
    setIsEditing(!isEditing)
  }

  const handleRoleChange = (_event: React.MouseEvent<HTMLElement>, newRole: string) => {
    if (newRole !== null) {
      setRole(newRole);
    }
  };


  const navigate = useNavigate();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", mb: 3, gap: 2 }}>
        
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <IconButton onClick={() => navigate("/locations")}>
          <ArrowBackIcon/>
        </IconButton>
      </Box>
      
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Title + location on the left */}
        <Box sx={{ ml: 12 }}>
          <Typography variant="h4">
            {isEditing ? (
              <>
                <TextField label="name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
              </>
            ) : (
              <>
                <Typography variant="h5">{name}</Typography>
              </>
            )}
          </Typography>
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
            onClick={handleEditClick}
          >
            {isEditing ? (
              <>Save Changes</>
            ):(
              <>Edit Details</>
            )}
          </Button>
          <Box sx={{ maxWidth: 200, mt: 1, alignSelf: "flex-start" }}> 
            <Typography sx={{ whiteSpace: "normal", wordBreak: "break-word", textAlign: "left" }}>
              {isEditing ? (
              <>
                <TextField label="address" value={address} onChange={(e) => setAddress(e.target.value)} fullWidth />
              </>
            ) : (
              <>
                <Typography>{address}</Typography>
              </>
            )}
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
            <ToggleButtonGroup
                  value={role}
                  exclusive
                  onChange={handleRoleChange}
                  sx={{
                    borderRadius: "20px",
                    overflow: "hidden",
                    mt: 4,
                  }}
                >
                  <ToggleButton value="teachers">
                    Teachers
                  </ToggleButton>
                  <ToggleButton value="students">
                    Students
                  </ToggleButton>
                </ToggleButtonGroup>

          <Box sx={{ display: "flex", gap: 4 ,justifyContent: "space-between", mt: 4}}>
            <Box>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                {teachers.length} Teachers Registered
              </Typography>

              <Stack spacing={2}>
                {role === "teachers" &&
                  teachers.map((teacher) => (
                    <Card
                      key={teacher.id}
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
                        <Typography
                          variant="h6"
                          onClick={() => navigate(`/users/${teacher.id}`)}
                          sx={{ cursor: "pointer", "&:hover": { color: "#4780c1" }}}
                        >
                          {teacher.name}
                        </Typography>
                        <Box
                          sx={{
                            backgroundColor:
                            teacher.type === "Preschool" ? "#32CD32" : "#D81B60",
                            color: "white",
                            padding: "4px 16px",
                            borderRadius: "20px",
                            display: "inline-block",
                            width: "fit-content",
                            fontSize: "0.875rem",
                            fontWeight: "medium",
                          }}
                        >
                          {teacher.type}
                        </Box>
                      </Box>
                    </Card>
                  ))}

                {role === "students" &&
                  students.map((student) => (
                    <Card
                      key={student.id}
                      sx={{
                        p: 2,
                        display: "flex",
                        alignItems: "center",
                        borderRadius: 4,
                        backgroundColor: student.isHere ? "#4CAF50" : "#ce4848",
                        maxWidth: 1200,
                        minWidth: 400,
                        width: "100%",
                        mx: "auto",
                      }}
                    >
                      <Avatar
                        src="student.jpg"
                        sx={{ width: 56, height: 56, mr: 2 }}
                      />
                      <Box>
                        <Typography variant="h6" onClick={() => navigate(`/users/${student.id}`)} sx={{ cursor: "pointer", "&:hover": { color: "#4780c1" }}}>{student.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          <Box sx={{
                            backgroundColor: student.isHere ? "#32CD32" : "#D81B60",
                            color: "white",
                            padding: "4px 16px",
                            borderRadius: "20px",
                            display: "inline-block",
                            width: "fit-content",
                            fontSize: "0.875rem",
                            fontWeight: "medium",
                          }}>{student.grade}</Box>
                        </Typography>
                      </Box>
                    </Card>
                  ))}
              </Stack>
            </Box>
          </Box>
        </Box>
        <Box sx={{ ml: 15 }}>
          <Box
            sx={{
              border: "1px solid #e0e0e0",
              borderRadius: 2,
              padding: 2,
              minWidth: 320,
              backgroundColor: "#fafafa",
            }}
          >
            <Typography variant="h6" sx={{ mb: 2 }}>
              Upcoming Events
            </Typography>
            <Stack spacing={1}>
              {myEvents.map((event) => (
                <Box
                  key={`${event.title}-${event.start}`}
                  sx={{
                    padding: 1,
                    borderRadius: 1,
                    backgroundColor: "#fff",
                    border: "1px solid #eee",
                  }}
                >
                  <Typography variant="subtitle1">{event.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {event.start} {event.end ? `– ${event.end}` : ""}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
