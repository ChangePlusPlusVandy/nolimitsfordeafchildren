import { useState, useEffect } from "react";
import { Box, Typography, TextField, Accordion, AccordionSummary, AccordionDetails, List, ListItem, Paper } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  MapContainer,
  TileLayer,
  AttributionControl,
  Popup,
  Marker,
  useMap
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

type PersonList = string[];
type Sites = Record<string, PersonList>;
type StateData = Record<string, Sites>;

const center: [number, number] = [36.1447, -86.8027];

function MapResizer() {
  const map = useMap();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [map]);
  
  return null;
}

export default function PopupSitesPage() {
  const [search, setSearch] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const data: StateData = {
    California: {
      "Smith Public Library": ["Kevin Morales (10)", "Sara Jones (12)"],
    },
    Colorado: {
      "Boulder Community Center": [],
      "Greenville Children Center": [],
      "Denver Public Library": [],
    },
    "New Mexico": {},
    Utah: {},
    Vermont: {},
    Washington: {},
    Wyoming: {},
  };

  const filteredData = Object.entries(data).reduce<StateData>((acc, [state, sites]) => {
    const filteredSites = Object.entries(sites).filter(([site]) =>
      site.toLowerCase().includes(search.toLowerCase())
    );
    if (filteredSites.length > 0 || state.toLowerCase().includes(search.toLowerCase())) {
      acc[state] = Object.fromEntries(filteredSites);
    }
    return acc;
  }, {});

  return (
    <Box className="flex p-4 gap-6 w-full h-screen bg-gray-100">
      <Box className="flex flex-col flex-1 min-h-0">
        <Typography variant="h4" className="mb-4 font-semibold">
          Welcome, Elizabeth!
        </Typography>

        <TextField
          placeholder="Search here..."
          variant="outlined"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4 w-80"
        />

        <Box className="flex gap-6 flex-1 min-h-0" style={{ height: 'calc(100vh - 200px)' }}>
          <Paper className="w-80 p-2 overflow-auto flex-shrink-0" elevation={3}>
            <Typography variant="h6" className="p-2 bg-purple-700 text-white rounded-md">
              Pop-Up Sites
            </Typography>

            {Object.entries(filteredData).map(([state, sites]) => (
              <Accordion key={state}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}> {state} </AccordionSummary>
                <AccordionDetails>
                  {Object.entries(sites).map(([site, people]) => (
                    <Accordion key={site}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>{site}</AccordionSummary>
                      <AccordionDetails>
                        <List>
                          {people.map((p) => (
                            <ListItem key={p}>{p}</ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </AccordionDetails>
              </Accordion>
            ))}
          </Paper>

          <Paper className="flex-1 overflow-hidden" elevation={3} style={{ minHeight: 0 }}>
            {mounted && (
              <MapContainer
                center={center}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={true}
              >
                <MapResizer />
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <AttributionControl
                  position="bottomright"
                  prefix={false}
                />
                <Marker position={center}>
                  <Popup>
                    Example popup
                  </Popup>
                </Marker>
              </MapContainer>
            )}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}