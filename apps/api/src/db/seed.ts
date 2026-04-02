/**
 * Database Seed Script
 * Creates comprehensive test data for all roles with 50+ entries per entity
 *
 * Run with: npx tsx src/db/seed.ts
 */

import "dotenv/config";
import { randomUUID } from "crypto";
import { db } from "./index";
import {
  UserTable,
  LocationTable,
  TeacherProfileTable,
  ParentProfileTable,
  StudentTable,
  SiblingTable,
  ScheduleTable,
  EnrollmentTable,
  TeacherStudentTable,
  ParentStudentLinkTable,
  AttendanceTable,
  SessionNoteTable,
  AssessmentTable,
  BulletinTable,
  DocumentTable,
  MakeupRequestTable,
  ScheduleChangeRequestTable,
} from "./schema";

// ==================== HELPER FUNCTIONS ====================

const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0] as string;
};

const randomElement = <T>(arr: readonly T[] | T[]): T =>
  arr[Math.floor(Math.random() * arr.length)] as T;

const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const shuffleArray = <T>(arr: T[]): T[] => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j] as T, shuffled[i] as T];
  }
  return shuffled;
};

// ==================== DEV USER IDS (shared with auth middleware) ====================
// These must match the IDs in:
// - apps/api/src/domains/auth/middleware/authMiddleware.ts
// - apps/web/src/auth.tsx

export const DEV_USER_IDS = {
  ADMIN: "5126c34f-4393-406c-8683-c9b696c02f38",
  TEACHER: "cd7c3cb2-a14c-4a94-b320-b64ec164df2e",
  PARENT: "823e1615-9ec0-483e-910e-6cd27296712d",
} as const;

// ==================== NAME DATA ====================

const FIRST_NAMES = [
  "James",
  "Michael",
  "Robert",
  "David",
  "William",
  "Richard",
  "Joseph",
  "Thomas",
  "Christopher",
  "Charles",
  "Daniel",
  "Matthew",
  "Anthony",
  "Mark",
  "Donald",
  "Steven",
  "Paul",
  "Andrew",
  "Joshua",
  "Kenneth",
  "Kevin",
  "Brian",
  "George",
  "Timothy",
  "Ronald",
  "Edward",
  "Jason",
  "Jeffrey",
  "Ryan",
  "Jacob",
  "Gary",
  "Nicholas",
  "Eric",
  "Jonathan",
  "Stephen",
  "Larry",
  "Justin",
  "Scott",
  "Brandon",
  "Benjamin",
  "Samuel",
  "Raymond",
  "Gregory",
  "Frank",
  "Alexander",
  "Patrick",
  "Jack",
  "Dennis",
  "Jerry",
  "Tyler",
  "Emma",
  "Olivia",
  "Ava",
  "Isabella",
  "Sophia",
  "Mia",
  "Charlotte",
  "Amelia",
  "Harper",
  "Evelyn",
  "Abigail",
  "Emily",
  "Elizabeth",
  "Sofia",
  "Ella",
  "Madison",
  "Scarlett",
  "Victoria",
  "Aria",
  "Grace",
  "Chloe",
  "Camila",
  "Penelope",
  "Riley",
  "Layla",
  "Lillian",
  "Nora",
  "Zoey",
  "Mila",
  "Aubrey",
  "Hannah",
  "Lily",
  "Addison",
  "Eleanor",
  "Natalie",
  "Luna",
  "Savannah",
  "Brooklyn",
  "Leah",
  "Zoe",
  "Stella",
  "Hazel",
  "Ellie",
  "Paisley",
  "Audrey",
  "Skylar",
  "Violet",
  "Claire",
  "Bella",
  "Aurora",
];

const LAST_NAMES = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Hernandez",
  "Lopez",
  "Gonzalez",
  "Wilson",
  "Anderson",
  "Thomas",
  "Taylor",
  "Moore",
  "Jackson",
  "Martin",
  "Lee",
  "Perez",
  "Thompson",
  "White",
  "Harris",
  "Sanchez",
  "Clark",
  "Ramirez",
  "Lewis",
  "Robinson",
  "Walker",
  "Young",
  "Allen",
  "King",
  "Wright",
  "Scott",
  "Torres",
  "Nguyen",
  "Hill",
  "Flores",
  "Green",
  "Adams",
  "Nelson",
  "Baker",
  "Hall",
  "Rivera",
  "Campbell",
  "Mitchell",
  "Carter",
  "Roberts",
  "Gomez",
  "Phillips",
  "Evans",
  "Turner",
  "Diaz",
  "Parker",
  "Cruz",
  "Edwards",
  "Collins",
  "Reyes",
  "Stewart",
  "Morris",
  "Morales",
  "Murphy",
  "Cook",
  "Rogers",
  "Gutierrez",
  "Ortiz",
  "Morgan",
  "Cooper",
];

const EMAIL_DOMAINS = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com"];

const generateEmail = (firstName: string, lastName: string, index: number): string => {
  const domain = randomElement(EMAIL_DOMAINS);
  const patterns = [
    `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@${domain}`,
    `${firstName.toLowerCase()}${lastName.toLowerCase()}${index}@${domain}`,
    `${firstName.toLowerCase()}_${lastName.toLowerCase()}${index}@${domain}`,
    `${firstName.toLowerCase()[0]}${lastName.toLowerCase()}${index}@${domain}`,
  ];
  return randomElement(patterns);
};

const generatePhone = (index: number): string => {
  const area = randomInt(310, 818);
  const exchange = randomInt(200, 999);
  const subscriber = (1000 + index).toString().slice(-4);
  return `(${area}) ${exchange}-${subscriber}`;
};

// ==================== LA AREA LOCATIONS ====================

interface LocationData {
  name: string;
  type: "education_center" | "pop_up" | "remote";
  address: string;
  city: string;
  zip: string;
  lat: string;
  lng: string;
}

const LA_LOCATIONS: LocationData[] = [
  // Education Centers (10)
  {
    name: "Downtown LA Education Center",
    type: "education_center",
    address: "333 S Hope St",
    city: "Los Angeles",
    zip: "90071",
    lat: "34.0522",
    lng: "-118.2537",
  },
  {
    name: "Hollywood Education Center",
    type: "education_center",
    address: "6801 Hollywood Blvd",
    city: "Hollywood",
    zip: "90028",
    lat: "34.1016",
    lng: "-118.3388",
  },
  {
    name: "Santa Monica Education Center",
    type: "education_center",
    address: "1450 Ocean Ave",
    city: "Santa Monica",
    zip: "90401",
    lat: "34.0195",
    lng: "-118.4912",
  },
  {
    name: "Pasadena Education Center",
    type: "education_center",
    address: "285 E Walnut St",
    city: "Pasadena",
    zip: "91101",
    lat: "34.1478",
    lng: "-118.1445",
  },
  {
    name: "Long Beach Education Center",
    type: "education_center",
    address: "101 Pacific Ave",
    city: "Long Beach",
    zip: "90802",
    lat: "33.7701",
    lng: "-118.1937",
  },
  {
    name: "Burbank Education Center",
    type: "education_center",
    address: "110 N Glenoaks Blvd",
    city: "Burbank",
    zip: "91502",
    lat: "34.1808",
    lng: "-118.3090",
  },
  {
    name: "Glendale Education Center",
    type: "education_center",
    address: "222 E Harvard St",
    city: "Glendale",
    zip: "91205",
    lat: "34.1425",
    lng: "-118.2551",
  },
  {
    name: "Torrance Education Center",
    type: "education_center",
    address: "3031 Torrance Blvd",
    city: "Torrance",
    zip: "90503",
    lat: "33.8358",
    lng: "-118.3406",
  },
  {
    name: "Culver City Education Center",
    type: "education_center",
    address: "4089 Overland Ave",
    city: "Culver City",
    zip: "90232",
    lat: "34.0211",
    lng: "-118.4151",
  },
  {
    name: "West LA Education Center",
    type: "education_center",
    address: "11360 Santa Monica Blvd",
    city: "Los Angeles",
    zip: "90025",
    lat: "34.0407",
    lng: "-118.4445",
  },

  // Pop-Ups (52)
  {
    name: "Echo Park Library",
    type: "pop_up",
    address: "1410 W Temple St",
    city: "Los Angeles",
    zip: "90026",
    lat: "34.0714",
    lng: "-118.2606",
  },
  {
    name: "Silver Lake Community Center",
    type: "pop_up",
    address: "2411 Glendale Blvd",
    city: "Los Angeles",
    zip: "90039",
    lat: "34.0936",
    lng: "-118.2612",
  },
  {
    name: "Los Feliz Library",
    type: "pop_up",
    address: "1874 Hillhurst Ave",
    city: "Los Angeles",
    zip: "90027",
    lat: "34.1059",
    lng: "-118.2867",
  },
  {
    name: "Venice Community Center",
    type: "pop_up",
    address: "610 California Ave",
    city: "Venice",
    zip: "90291",
    lat: "33.9925",
    lng: "-118.4633",
  },
  {
    name: "Mar Vista Library",
    type: "pop_up",
    address: "12006 Venice Blvd",
    city: "Los Angeles",
    zip: "90066",
    lat: "34.0033",
    lng: "-118.4283",
  },
  {
    name: "Westchester Library",
    type: "pop_up",
    address: "7114 W Manchester Ave",
    city: "Los Angeles",
    zip: "90045",
    lat: "33.9600",
    lng: "-118.3997",
  },
  {
    name: "Inglewood Community Center",
    type: "pop_up",
    address: "110 S La Brea Ave",
    city: "Inglewood",
    zip: "90301",
    lat: "33.9617",
    lng: "-118.3531",
  },
  {
    name: "Compton Library",
    type: "pop_up",
    address: "240 W Compton Blvd",
    city: "Compton",
    zip: "90220",
    lat: "33.8958",
    lng: "-118.2237",
  },
  {
    name: "Hawthorne Community Center",
    type: "pop_up",
    address: "3901 W El Segundo Blvd",
    city: "Hawthorne",
    zip: "90250",
    lat: "33.9164",
    lng: "-118.3525",
  },
  {
    name: "El Segundo Library",
    type: "pop_up",
    address: "111 W Mariposa Ave",
    city: "El Segundo",
    zip: "90245",
    lat: "33.9192",
    lng: "-118.4156",
  },
  {
    name: "Redondo Beach Library",
    type: "pop_up",
    address: "303 N Pacific Coast Hwy",
    city: "Redondo Beach",
    zip: "90277",
    lat: "33.8492",
    lng: "-118.3884",
  },
  {
    name: "Manhattan Beach Library",
    type: "pop_up",
    address: "1320 Highland Ave",
    city: "Manhattan Beach",
    zip: "90266",
    lat: "33.8847",
    lng: "-118.4109",
  },
  {
    name: "Huntington Park Library",
    type: "pop_up",
    address: "6518 Miles Ave",
    city: "Huntington Park",
    zip: "90255",
    lat: "33.9817",
    lng: "-118.2253",
  },
  {
    name: "Bell Gardens Community Center",
    type: "pop_up",
    address: "7100 Garfield Ave",
    city: "Bell Gardens",
    zip: "90201",
    lat: "33.9650",
    lng: "-118.1514",
  },
  {
    name: "Montebello Library",
    type: "pop_up",
    address: "1550 W Beverly Blvd",
    city: "Montebello",
    zip: "90640",
    lat: "34.0167",
    lng: "-118.1131",
  },
  {
    name: "Alhambra Library",
    type: "pop_up",
    address: "101 S First St",
    city: "Alhambra",
    zip: "91801",
    lat: "34.0953",
    lng: "-118.1275",
  },
  {
    name: "San Gabriel Library",
    type: "pop_up",
    address: "500 S Del Mar Ave",
    city: "San Gabriel",
    zip: "91776",
    lat: "34.0892",
    lng: "-118.1056",
  },
  {
    name: "Temple City Library",
    type: "pop_up",
    address: "5939 Golden West Ave",
    city: "Temple City",
    zip: "91780",
    lat: "34.1075",
    lng: "-118.0578",
  },
  {
    name: "Arcadia Library",
    type: "pop_up",
    address: "20 W Duarte Rd",
    city: "Arcadia",
    zip: "91007",
    lat: "34.1397",
    lng: "-118.0353",
  },
  {
    name: "Monrovia Library",
    type: "pop_up",
    address: "321 S Myrtle Ave",
    city: "Monrovia",
    zip: "91016",
    lat: "34.1442",
    lng: "-117.9989",
  },
  {
    name: "Azusa Library",
    type: "pop_up",
    address: "729 N Dalton Ave",
    city: "Azusa",
    zip: "91702",
    lat: "34.1336",
    lng: "-117.9076",
  },
  {
    name: "Covina Library",
    type: "pop_up",
    address: "234 N Second Ave",
    city: "Covina",
    zip: "91723",
    lat: "34.0900",
    lng: "-117.8903",
  },
  {
    name: "West Covina Library",
    type: "pop_up",
    address: "1601 W Covina Pkwy",
    city: "West Covina",
    zip: "91790",
    lat: "34.0686",
    lng: "-117.9389",
  },
  {
    name: "Pomona Library",
    type: "pop_up",
    address: "625 S Garey Ave",
    city: "Pomona",
    zip: "91766",
    lat: "34.0551",
    lng: "-117.7500",
  },
  {
    name: "Claremont Library",
    type: "pop_up",
    address: "208 N Harvard Ave",
    city: "Claremont",
    zip: "91711",
    lat: "34.0967",
    lng: "-117.7197",
  },
  {
    name: "La Verne Library",
    type: "pop_up",
    address: "3640 D St",
    city: "La Verne",
    zip: "91750",
    lat: "34.1008",
    lng: "-117.7678",
  },
  {
    name: "Diamond Bar Library",
    type: "pop_up",
    address: "21800 Copley Dr",
    city: "Diamond Bar",
    zip: "91765",
    lat: "33.9992",
    lng: "-117.8103",
  },
  {
    name: "Rowland Heights Community Center",
    type: "pop_up",
    address: "18150 E Pathfinder Rd",
    city: "Rowland Heights",
    zip: "91748",
    lat: "33.9764",
    lng: "-117.8767",
  },
  {
    name: "Hacienda Heights Community Center",
    type: "pop_up",
    address: "1234 N Hacienda Blvd",
    city: "Hacienda Heights",
    zip: "91745",
    lat: "33.9931",
    lng: "-117.9686",
  },
  {
    name: "Whittier Library",
    type: "pop_up",
    address: "7344 S Washington Ave",
    city: "Whittier",
    zip: "90602",
    lat: "33.9792",
    lng: "-118.0328",
  },
  {
    name: "Norwalk Library",
    type: "pop_up",
    address: "12350 Imperial Hwy",
    city: "Norwalk",
    zip: "90650",
    lat: "33.9164",
    lng: "-118.0817",
  },
  {
    name: "Cerritos Library",
    type: "pop_up",
    address: "18025 Bloomfield Ave",
    city: "Cerritos",
    zip: "90703",
    lat: "33.8583",
    lng: "-118.0647",
  },
  {
    name: "Lakewood Library",
    type: "pop_up",
    address: "4990 Clark Ave",
    city: "Lakewood",
    zip: "90712",
    lat: "33.8536",
    lng: "-118.1339",
  },
  {
    name: "Downey Library",
    type: "pop_up",
    address: "11121 Brookshire Ave",
    city: "Downey",
    zip: "90241",
    lat: "33.9400",
    lng: "-118.1325",
  },
  {
    name: "Bellflower Library",
    type: "pop_up",
    address: "10045 E Flower St",
    city: "Bellflower",
    zip: "90706",
    lat: "33.8817",
    lng: "-118.1170",
  },
  {
    name: "Paramount Community Center",
    type: "pop_up",
    address: "14400 Paramount Blvd",
    city: "Paramount",
    zip: "90723",
    lat: "33.8894",
    lng: "-118.1597",
  },
  {
    name: "Carson Library",
    type: "pop_up",
    address: "151 E Carson St",
    city: "Carson",
    zip: "90745",
    lat: "33.8314",
    lng: "-118.2614",
  },
  {
    name: "Wilmington Library",
    type: "pop_up",
    address: "1300 N Avalon Blvd",
    city: "Wilmington",
    zip: "90744",
    lat: "33.7928",
    lng: "-118.2631",
  },
  {
    name: "San Pedro Library",
    type: "pop_up",
    address: "931 S Gaffey St",
    city: "San Pedro",
    zip: "90731",
    lat: "33.7322",
    lng: "-118.2936",
  },
  {
    name: "Rancho Palos Verdes Library",
    type: "pop_up",
    address: "30436 Hawthorne Blvd",
    city: "Rancho Palos Verdes",
    zip: "90275",
    lat: "33.7444",
    lng: "-118.3786",
  },
  {
    name: "Hermosa Beach Library",
    type: "pop_up",
    address: "550 Pier Ave",
    city: "Hermosa Beach",
    zip: "90254",
    lat: "33.8622",
    lng: "-118.3994",
  },
  {
    name: "Gardena Library",
    type: "pop_up",
    address: "1731 W Gardena Blvd",
    city: "Gardena",
    zip: "90247",
    lat: "33.8886",
    lng: "-118.3089",
  },
  {
    name: "Lawndale Library",
    type: "pop_up",
    address: "14615 Burin Ave",
    city: "Lawndale",
    zip: "90260",
    lat: "33.8872",
    lng: "-118.3531",
  },
  {
    name: "Lennox Library",
    type: "pop_up",
    address: "4359 Lennox Blvd",
    city: "Lennox",
    zip: "90304",
    lat: "33.9383",
    lng: "-118.3583",
  },
  {
    name: "Koreatown Community Center",
    type: "pop_up",
    address: "3545 Wilshire Blvd",
    city: "Los Angeles",
    zip: "90010",
    lat: "34.0619",
    lng: "-118.3053",
  },
  {
    name: "Highland Park Library",
    type: "pop_up",
    address: "6145 N Figueroa St",
    city: "Los Angeles",
    zip: "90042",
    lat: "34.1117",
    lng: "-118.1936",
  },
  {
    name: "Eagle Rock Library",
    type: "pop_up",
    address: "5027 Caspar Ave",
    city: "Los Angeles",
    zip: "90041",
    lat: "34.1394",
    lng: "-118.2147",
  },
  {
    name: "Atwater Village Community Center",
    type: "pop_up",
    address: "3379 Glendale Blvd",
    city: "Los Angeles",
    zip: "90039",
    lat: "34.1172",
    lng: "-118.2667",
  },
  {
    name: "Glassell Park Community Center",
    type: "pop_up",
    address: "3704 Verdugo Rd",
    city: "Los Angeles",
    zip: "90065",
    lat: "34.1214",
    lng: "-118.2297",
  },
  {
    name: "Lincoln Heights Library",
    type: "pop_up",
    address: "2530 Workman St",
    city: "Los Angeles",
    zip: "90031",
    lat: "34.0678",
    lng: "-118.2100",
  },
  {
    name: "Boyle Heights Community Center",
    type: "pop_up",
    address: "2839 E 3rd St",
    city: "Los Angeles",
    zip: "90033",
    lat: "34.0386",
    lng: "-118.2117",
  },
  {
    name: "El Sereno Library",
    type: "pop_up",
    address: "5226 Huntington Dr S",
    city: "Los Angeles",
    zip: "90032",
    lat: "34.0847",
    lng: "-118.1786",
  },
];

// ==================== SCHOOLS DATA ====================

const SCHOOLS = [
  "Sunshine Preschool",
  "Little Stars Daycare",
  "Happy Kids Academy",
  "Rainbow Learning Center",
  "ABC Preschool",
  "Tiny Tots Academy",
  "Bright Futures Preschool",
  "Creative Kids Center",
  "Lincoln Elementary",
  "Washington Elementary",
  "Jefferson Elementary",
  "Roosevelt Elementary",
  "Kennedy Elementary",
  "Madison Elementary",
  "Franklin Elementary",
  "Adams Elementary",
  "Oak Tree School",
  "Pine Valley Academy",
  "Maple Leaf School",
  "Cedar Grove Elementary",
  "Westside Elementary",
  "Eastside Elementary",
  "Northgate School",
  "Southpark Elementary",
  "Valley View School",
  "Hillside Academy",
  "Lakewood Elementary",
  "Riverside School",
  "Home Schooled",
  "Private Tutor",
  "Online Academy",
  "Montessori School",
];

const LANGUAGES = [
  "English",
  "Spanish",
  "Mandarin",
  "Korean",
  "Vietnamese",
  "Tagalog",
  "Armenian",
  "Farsi",
];

// ==================== QUALIFICATION DATA ====================

const QUALIFICATIONS = [
  "M.S. in Speech-Language Pathology",
  "M.A. in Deaf Education",
  "B.A. in Special Education",
  "M.Ed. in Communication Disorders",
  "Ph.D. in Audiology",
  "M.S. in Communication Sciences",
  "B.S. in Speech and Hearing Science",
  "M.A. in Educational Audiology",
];

const CREDENTIALS = [
  "CCC-SLP, LSLS Cert. AVT",
  "CA Teaching Credential",
  "LSLS Cert. AVEd",
  "CCC-SLP",
  "CA SLP License",
  "Board Certified Specialist",
  "Certified Deaf Educator",
  "National Board Certified",
];

const AGE_SPECIALTIES = [
  "infant",
  "toddler",
  "preschool",
  "elementary",
  "middle_school",
  "high_school",
  "young_adult",
  "all_ages",
] as const;

// ==================== SESSION NOTE TEMPLATES ====================

const SESSION_NOTE_TEMPLATES = [
  "Great progress on {sound} sounds today. {name} is showing consistent improvement.",
  "Working on sentence structure. {name} can now form {num}-word sentences consistently.",
  "Practiced listening exercises. {name} responded well to auditory prompts.",
  "Focused on vocabulary building. Introduced {num} new words related to {topic}.",
  "Excellent session! {name} demonstrated improved articulation of {sound} sounds.",
  "Reviewed previous concepts. {name} retained most of the material from last session.",
  "Worked on conversational skills. {name} initiated dialogue {num} times.",
  "{name} was engaged throughout the session. Made progress on {topic}.",
  "Introduced new concepts for {topic}. {name} showed good understanding.",
  "Speech clarity has improved significantly. {name} is more confident speaking.",
  "Practiced {topic} exercises. {name} completed all activities successfully.",
  "Good focus today. {name} worked on {sound} production in isolation and words.",
  "{name} struggled a bit with {topic} but showed improvement by end of session.",
  "Excellent participation! {name} was very motivated to learn today.",
  "Continued work on {topic}. {name} is progressing at a steady pace.",
];

const SOUNDS = ["/s/", "/z/", "/r/", "/l/", "/th/", "/sh/", "/ch/", "/k/", "/g/", "/f/", "/v/"];
const TOPICS = [
  "animals",
  "colors",
  "shapes",
  "family",
  "food",
  "weather",
  "body parts",
  "emotions",
  "transportation",
  "daily routines",
];

const generateSessionNote = (studentName: string): string => {
  let note = randomElement(SESSION_NOTE_TEMPLATES);
  note = note.replace("{name}", studentName);
  note = note.replace("{sound}", randomElement(SOUNDS));
  note = note.replace("{topic}", randomElement(TOPICS));
  note = note.replace("{num}", randomInt(2, 5).toString());
  return note;
};

// ==================== ASSESSMENT FOCUS TEMPLATES ====================

const ASSESSMENT_FOCUSES = [
  "Speech sound production - {sound} sounds",
  "Language development - sentence formation",
  "Auditory comprehension skills",
  "Vocabulary expansion - {topic}",
  "Articulation clarity",
  "Receptive language skills",
  "Expressive language development",
  "Phonological awareness",
  "Listening comprehension",
  "Conversation skills development",
];

const generateAssessmentFocus = (): string => {
  let focus = randomElement(ASSESSMENT_FOCUSES);
  focus = focus.replace("{sound}", randomElement(SOUNDS));
  focus = focus.replace("{topic}", randomElement(TOPICS));
  return focus;
};

// ==================== BULLETIN TEMPLATES ====================

const BULLETIN_TITLES = [
  "Welcome to the New Cycle!",
  "Holiday Schedule Update",
  "New Assessment Guidelines",
  "Parent Workshop Announcement",
  "Summer Program Registration",
  "Staff Training Notice",
  "Schedule Changes for Next Month",
  "Important Safety Reminder",
  "Graduation Ceremony Details",
  "New Resource Materials Available",
  "Building Maintenance Notice",
  "Weather Advisory",
  "Volunteer Opportunities",
  "Success Story Spotlight",
  "Policy Update",
  "Community Event Invitation",
  "Transportation Update",
  "Health and Safety Guidelines",
  "Technology Update",
  "Feedback Survey Request",
];

const BULLETIN_BODIES = [
  "We're excited to start a new 10-week teaching cycle. Please ensure all audiograms are up to date.",
  "Please note the upcoming holiday schedule changes. Sessions will resume on the date indicated.",
  "Please review the updated assessment scoring rubric before completing assessments this cycle.",
  "Join us for an informative workshop designed for parents. Refreshments will be provided.",
  "Registration is now open for our summer program. Space is limited, so sign up early!",
  "Staff members should plan to attend the upcoming training session. Details to follow.",
  "Please review the schedule changes that will take effect next month.",
  "This is a reminder about our safety protocols. Please review with your family.",
  "Mark your calendars for our upcoming graduation ceremony. All families are invited!",
  "New learning materials are now available. Ask your teacher for more information.",
  "Building maintenance will be conducted this week. Some areas may be temporarily closed.",
  "Due to weather conditions, please check for any schedule updates before your session.",
  "We're looking for volunteers! Contact the office if you'd like to help.",
  "Read about one of our students' amazing progress in this month's spotlight.",
  "Please review the updated policy that takes effect immediately.",
  "You're invited to join us at an upcoming community event. Details attached.",
  "Important information regarding transportation arrangements for sessions.",
  "Please review the updated health and safety guidelines for all participants.",
  "We've made improvements to our technology systems for better service.",
  "We value your feedback! Please complete our brief survey.",
];

// ==================== MAIN SEED FUNCTION ====================

async function seed() {
  console.log("🌱 Starting database seed with 50+ entries per entity...\n");

  // Clear existing data (in reverse dependency order)
  console.log("🧹 Clearing existing data...");
  await db.delete(ScheduleChangeRequestTable);
  await db.delete(MakeupRequestTable);
  await db.delete(AssessmentTable);
  await db.delete(SessionNoteTable);
  await db.delete(AttendanceTable);
  await db.delete(EnrollmentTable);
  await db.delete(TeacherStudentTable);
  await db.delete(ParentStudentLinkTable);
  await db.delete(ScheduleTable);
  await db.delete(SiblingTable);
  await db.delete(StudentTable);
  await db.delete(BulletinTable);
  await db.delete(ParentProfileTable);
  await db.delete(TeacherProfileTable);
  await db.delete(LocationTable);
  await db.delete(UserTable);

  // ==================== GENERATE LOCATIONS (62) ====================
  console.log("📍 Creating 62 locations...");

  const locations = LA_LOCATIONS.map((loc) => ({
    id: randomUUID(),
    name: loc.name,
    type: loc.type,
    address_line1: loc.address,
    city: loc.city,
    state: "CA",
    postal_code: loc.zip,
    country: "USA",
    latitude: loc.lat,
    longitude: loc.lng,
    timezone: "America/Los_Angeles",
    zoom_link:
      loc.type === "education_center"
        ? `https://zoom.us/j/${randomInt(100000000, 999999999)}`
        : null,
    is_active: true,
  }));

  await db.insert(LocationTable).values(locations);

  // ==================== GENERATE USERS ====================
  console.log("👤 Creating users (5 admins, 72 teachers, 60 parents)...");

  const shuffledFirstNames = shuffleArray(FIRST_NAMES);
  const shuffledLastNames = shuffleArray(LAST_NAMES);

  const users: Array<{
    id: string;
    authUserId: string;
    email: string;
    name: string;
    phone: string;
    role: "administrator" | "teacher" | "parent";
    is_active: boolean;
  }> = [];

  // Dev Admin (first admin uses fixed ID for dev auth)
  users.push({
    id: DEV_USER_IDS.ADMIN,
    authUserId: "dev-admin",
    email: "admin.dev@gmail.com",
    name: "Dev Admin",
    phone: generatePhone(1),
    role: "administrator",
    is_active: true,
  });

  // 4 more Admins with random UUIDs
  for (let i = 1; i < 5; i++) {
    const firstName = shuffledFirstNames[i] as string;
    const lastName = shuffledLastNames[i] as string;
    users.push({
      id: randomUUID(),
      authUserId: `seed-admin-${i + 1}`,
      email: generateEmail(firstName, lastName, i + 1),
      name: `${firstName} ${lastName}`,
      phone: generatePhone(i + 1),
      role: "administrator",
      is_active: true,
    });
  }

  // Dev Teacher (first teacher uses fixed ID for dev auth)
  users.push({
    id: DEV_USER_IDS.TEACHER,
    authUserId: "dev-teacher",
    email: "teacher.dev@gmail.com",
    name: "Dev Teacher",
    phone: generatePhone(100),
    role: "teacher",
    is_active: true,
  });

  // 71 more Teachers with random UUIDs
  for (let i = 1; i < 72; i++) {
    const firstName = shuffledFirstNames[(i + 5) % shuffledFirstNames.length] as string;
    const lastName = shuffledLastNames[(i + 10) % shuffledLastNames.length] as string;
    users.push({
      id: randomUUID(),
      authUserId: `seed-teacher-${i + 1}`,
      email: generateEmail(firstName, lastName, 100 + i),
      name: `${firstName} ${lastName}`,
      phone: generatePhone(100 + i),
      role: "teacher",
      is_active: i < 70, // 2 inactive teachers
    });
  }

  // Dev Parent (first parent uses fixed ID for dev auth)
  users.push({
    id: DEV_USER_IDS.PARENT,
    authUserId: "dev-parent",
    email: "parent.dev@gmail.com",
    name: "Dev Parent",
    phone: generatePhone(200),
    role: "parent",
    is_active: true,
  });

  // 59 more Parents with random UUIDs
  for (let i = 1; i < 60; i++) {
    const firstName = shuffledFirstNames[(i + 30) % shuffledFirstNames.length] as string;
    const lastName = shuffledLastNames[(i + 40) % shuffledLastNames.length] as string;
    users.push({
      id: randomUUID(),
      authUserId: `seed-parent-${i + 1}`,
      email: generateEmail(firstName, lastName, 200 + i),
      name: `${firstName} ${lastName}`,
      phone: generatePhone(200 + i),
      role: "parent",
      is_active: true,
    });
  }

  await db.insert(UserTable).values(users);

  // ==================== GENERATE TEACHER PROFILES (72) ====================
  console.log("👩‍🏫 Creating 72 teacher profiles...");

  const teacherUsers = users.filter((u) => u.role === "teacher");
  const teacherProfiles = teacherUsers.map((user, i) => ({
    id: randomUUID(),
    user_id: user.id,
    primary_site_id: locations[i % locations.length]!.id,
    bio: `Dedicated educator with ${randomInt(2, 15)} years of experience helping deaf children learn to speak.`,
    qualifications: randomElement(QUALIFICATIONS),
    credentials: randomElement(CREDENTIALS),
    age_group_specialty: randomElement(AGE_SPECIALTIES),
  }));

  await db.insert(TeacherProfileTable).values(teacherProfiles);

  // ==================== GENERATE PARENT PROFILES (60) ====================
  console.log("👨‍👩‍👧 Creating 60 parent profiles...");

  const parentUsers = users.filter((u) => u.role === "parent");
  const parentProfiles = parentUsers.map((user) => ({
    id: randomUUID(),
    user_id: user.id,
    household_notes: randomElement([
      "Prefers morning sessions.",
      "Has flexible schedule.",
      "Works from home, available anytime.",
      "Prefers afternoon sessions after school pickup.",
      "Weekend sessions preferred.",
      "Can only do Saturday sessions.",
      null,
    ]),
    preferred_contact_method: randomElement(["email", "phone", "text"]),
  }));

  await db.insert(ParentProfileTable).values(parentProfiles);

  // ==================== GENERATE STUDENTS (100) ====================
  console.log("🧒 Creating 100 students...");

  const today = new Date();
  const students = [];

  for (let i = 0; i < 100; i++) {
    const firstName = shuffledFirstNames[(i + 50) % shuffledFirstNames.length] as string;
    const lastName = shuffledLastNames[(i + 20) % shuffledLastNames.length] as string;
    const ageYears = randomInt(1, 18);
    const dob = new Date(today.getFullYear() - ageYears, randomInt(0, 11), randomInt(1, 28));

    students.push({
      id: randomUUID(),
      site_id: locations[i % locations.length]!.id,
      first_name: firstName,
      last_name: lastName,
      initials: `${firstName[0]}${lastName[0]}`,
      dob: formatDate(dob),
      current_school: randomElement(SCHOOLS),
      preferred_language: randomElement(LANGUAGES),
      guardian_summary: `Lives with ${randomElement(["parents", "mother", "father", "grandparents", "guardian"])} in ${locations[i % locations.length]!.city}`,
      is_active: i < 95, // 5 inactive students
    });
  }

  await db.insert(StudentTable).values(students);

  // ==================== GENERATE SIBLINGS (80) ====================
  console.log("👧 Creating 80 sibling records...");

  const siblings = [];
  const relationships = [
    "brother",
    "sister",
    "twin brother",
    "twin sister",
    "half-brother",
    "half-sister",
  ];

  for (let i = 0; i < 80; i++) {
    const student = students[i % students.length]!;
    siblings.push({
      id: randomUUID(),
      student_id: student.id,
      name: shuffledFirstNames[(i + 70) % shuffledFirstNames.length] as string,
      age: randomInt(1, 18),
      relationship: randomElement(relationships),
      notes: randomElement([
        "Also enrolled in No Limits program",
        "Younger sibling, not in program",
        "Older sibling, graduated from program",
        "Has normal hearing",
        null,
      ]),
    });
  }

  await db.insert(SiblingTable).values(siblings);

  // ==================== GENERATE SCHEDULES (80) ====================
  console.log("📅 Creating 80 schedules...");

  const cycleStart = new Date();
  cycleStart.setDate(cycleStart.getDate() - (cycleStart.getDay() || 7) + 1);
  const cycleEnd = new Date(cycleStart);
  cycleEnd.setDate(cycleEnd.getDate() + 69);

  const timeSlots = [
    { start: "08:00:00", end: "09:00:00" },
    { start: "09:00:00", end: "10:00:00" },
    { start: "10:00:00", end: "11:00:00" },
    { start: "11:00:00", end: "12:00:00" },
    { start: "13:00:00", end: "14:00:00" },
    { start: "14:00:00", end: "15:00:00" },
    { start: "15:00:00", end: "16:00:00" },
    { start: "16:00:00", end: "17:00:00" },
  ];

  const dayMasks = [37, 42]; // M/W/S = 37, T/Th/S = 42

  const schedules: Array<{
    id: string;
    teacher_id: string;
    site_id: string;
    day_of_week_mask: number;
    start_time: string;
    end_time: string;
    cycle_start_date: string;
    cycle_end_date: string;
    is_active: boolean;
  }> = [];
  for (let i = 0; i < 80; i++) {
    const teacher = teacherProfiles[i % teacherProfiles.length]!;
    const timeSlot = timeSlots[i % timeSlots.length]!;
    schedules.push({
      id: randomUUID(),
      teacher_id: teacher.id,
      site_id: teacher.primary_site_id,
      day_of_week_mask: dayMasks[i % 2]!,
      start_time: timeSlot.start,
      end_time: timeSlot.end,
      cycle_start_date: formatDate(cycleStart),
      cycle_end_date: formatDate(cycleEnd),
      is_active: true,
    });
  }

  await db.insert(ScheduleTable).values(schedules);

  // ==================== GENERATE ENROLLMENTS (100) ====================
  console.log("📝 Creating 100 enrollments...");

  const enrollments = students.map((student, i) => ({
    id: randomUUID(),
    student_id: student.id,
    schedule_id: schedules[i % schedules.length]!.id,
  }));

  await db.insert(EnrollmentTable).values(enrollments);

  // ==================== GENERATE TEACHER-STUDENT LINKS (100) ====================
  console.log("🔗 Creating 100 teacher-student links...");

  const teacherStudentLinks = enrollments.map((enrollment) => {
    const schedule = schedules.find((s) => s.id === enrollment.schedule_id)!;
    return {
      id: randomUUID(),
      teacher_id: schedule.teacher_id,
      student_id: enrollment.student_id,
    };
  });

  await db.insert(TeacherStudentTable).values(teacherStudentLinks);

  // ==================== GENERATE PARENT-STUDENT LINKS (120) ====================
  console.log("👨‍👩‍👧 Creating 120 parent-student links...");

  const parentStudentLinks = [];
  const relationshipTypes = [
    "mother",
    "father",
    "grandmother",
    "grandfather",
    "guardian",
    "aunt",
    "uncle",
  ];

  for (let i = 0; i < 120; i++) {
    const student = students[i % students.length]!;
    const parent = parentProfiles[i % parentProfiles.length]!;
    parentStudentLinks.push({
      id: randomUUID(),
      parent_id: parent.id,
      student_id: student.id,
      relationship: randomElement(relationshipTypes),
      is_primary: i < 100, // First 100 are primary
    });
  }

  await db.insert(ParentStudentLinkTable).values(parentStudentLinks);

  // ==================== GENERATE ATTENDANCE (300) ====================
  console.log("✅ Creating 300 attendance records...");

  const attendanceStatuses = [
    "present",
    "present",
    "present",
    "present",
    "no_show",
    "cancelled",
  ] as const;
  const absenceReasons = [
    "sick",
    "family_emergency",
    "transportation",
    "schedule_conflict",
    "no_show_unknown",
    "other",
  ] as const;

  const attendance = [];
  const adminUser = users.find((u) => u.role === "administrator")!;

  for (let i = 0; i < 300; i++) {
    const enrollment = enrollments[i % enrollments.length]!;
    const daysAgo = randomInt(1, 60);
    const sessionDate = new Date(today);
    sessionDate.setDate(sessionDate.getDate() - daysAgo);

    const status = randomElement(attendanceStatuses);

    attendance.push({
      id: randomUUID(),
      student_id: enrollment.student_id,
      schedule_id: enrollment.schedule_id,
      session_date: formatDate(sessionDate),
      status,
      reason: status !== "present" ? randomElement(absenceReasons) : null,
      reason_text:
        status !== "present"
          ? randomElement(["Had a cold", "Family event", "Car trouble", "Doctor appointment", null])
          : null,
      marked_by: adminUser.id,
    });
  }

  await db.insert(AttendanceTable).values(attendance);

  // ==================== GENERATE SESSION NOTES (150) ====================
  console.log("📝 Creating 150 session notes...");

  const sessionNotes = [];

  for (let i = 0; i < 150; i++) {
    const student = students[i % students.length]!;
    const teacherStudentLink = teacherStudentLinks.find((ts) => ts.student_id === student.id);
    if (!teacherStudentLink) continue;

    const daysAgo = randomInt(1, 60);
    const sessionDate = new Date(today);
    sessionDate.setDate(sessionDate.getDate() - daysAgo);

    sessionNotes.push({
      id: randomUUID(),
      student_id: student.id,
      teacher_id: teacherStudentLink.teacher_id,
      schedule_id: enrollments[i % enrollments.length]!.schedule_id,
      session_date: formatDate(sessionDate),
      note: generateSessionNote(student.first_name),
    });
  }

  await db.insert(SessionNoteTable).values(sessionNotes);

  // ==================== GENERATE ASSESSMENTS (100) ====================
  console.log("📊 Creating 100 assessments...");

  const assessments = [];

  for (let i = 0; i < 100; i++) {
    const student = students[i % students.length]!;
    const teacherStudentLink = teacherStudentLinks.find((ts) => ts.student_id === student.id);
    if (!teacherStudentLink) continue;

    assessments.push({
      id: randomUUID(),
      student_id: student.id,
      teacher_id: teacherStudentLink.teacher_id,
      cycle_start_date: formatDate(cycleStart),
      assessment_type: i < 60 ? ("pre" as const) : ("post" as const),
      teaching_focus: generateAssessmentFocus(),
      score: randomInt(5, 18),
      notes: randomElement([
        "Baseline assessment for new cycle",
        "Good progress from previous cycle",
        "Needs additional support in this area",
        "Showing consistent improvement",
        "Strong performance, advancing to next level",
        null,
      ]),
    });
  }

  await db.insert(AssessmentTable).values(assessments);

  // ==================== GENERATE BULLETINS (50) ====================
  console.log("📢 Creating 50 bulletins...");

  const bulletinRoleTargets = ["all", "administrator", "teacher", "parent"] as const;
  const adminUsers = users.filter((u) => u.role === "administrator");

  const bulletins = [];

  for (let i = 0; i < 50; i++) {
    const isGlobal = i % 3 !== 0;
    bulletins.push({
      id: randomUUID(),
      site_id: isGlobal ? null : locations[i % locations.length]!.id,
      scope: isGlobal ? ("global" as const) : ("site" as const),
      role_target: randomElement(bulletinRoleTargets),
      title: BULLETIN_TITLES[i % BULLETIN_TITLES.length]!,
      body: BULLETIN_BODIES[i % BULLETIN_BODIES.length]!,
      created_by: adminUsers[i % adminUsers.length]!.id,
    });
  }

  await db.insert(BulletinTable).values(bulletins);

  // ==================== GENERATE MAKEUP REQUESTS (50) ====================
  console.log("📋 Creating 50 makeup requests...");

  const requestStatuses = ["pending", "approved", "denied", "completed"] as const;
  const makeupRequests = [];

  for (let i = 0; i < 50; i++) {
    const enrollment = enrollments[i % enrollments.length]!;
    const parentLink = parentStudentLinks.find((ps) => ps.student_id === enrollment.student_id);
    if (!parentLink) continue;

    const parent = parentProfiles.find((p) => p.id === parentLink.parent_id);
    if (!parent) continue;

    const daysAgo = randomInt(5, 30);
    const sessionDate = new Date(today);
    sessionDate.setDate(sessionDate.getDate() - daysAgo);

    const status = requestStatuses[i % requestStatuses.length]!;
    const isReviewed = status !== "pending";

    makeupRequests.push({
      id: randomUUID(),
      student_id: enrollment.student_id,
      original_session_date: formatDate(sessionDate),
      original_schedule_id: enrollment.schedule_id,
      reason: randomElement(absenceReasons),
      reason_text: randomElement([
        "Child was sick",
        "Family emergency",
        "Transportation issue",
        "Scheduling conflict",
        null,
      ]),
      preferred_dates: randomElement([
        "Any Saturday morning",
        "Next week afternoon",
        "Flexible",
        "Weekday morning preferred",
        null,
      ]),
      status,
      requested_by: parentUsers.find((u) => u.id === parent.user_id)!.id,
      reviewed_by: isReviewed ? adminUsers[0]!.id : null,
      review_notes: isReviewed
        ? randomElement([
            "Approved for next Saturday",
            "Scheduled with same teacher",
            "No availability, denied",
            "Completed successfully",
            null,
          ])
        : null,
    });
  }

  await db.insert(MakeupRequestTable).values(makeupRequests);

  // ==================== GENERATE SCHEDULE CHANGE REQUESTS (50) ====================
  console.log("🔄 Creating 50 schedule change requests...");

  const scheduleChangeRequests = [];
  const changeReasons = [
    "New work schedule",
    "Transportation issues",
    "Prefer different teacher",
    "Need different time slot",
    "Sibling coordination",
    "Medical appointments conflict",
    "School schedule changed",
    "Moving to different area",
  ];

  for (let i = 0; i < 50; i++) {
    const enrollment = enrollments[i % enrollments.length]!;
    const currentSchedule = schedules.find((s) => s.id === enrollment.schedule_id)!;

    // Find a different schedule
    const alternativeSchedules = schedules.filter((s) => s.id !== currentSchedule.id);
    const requestedSchedule = alternativeSchedules[i % alternativeSchedules.length]!;

    const parentLink = parentStudentLinks.find((ps) => ps.student_id === enrollment.student_id);
    if (!parentLink) continue;

    const parent = parentProfiles.find((p) => p.id === parentLink.parent_id);
    if (!parent) continue;

    const status = requestStatuses[i % requestStatuses.length]!;
    const isReviewed = status !== "pending";

    scheduleChangeRequests.push({
      id: randomUUID(),
      student_id: enrollment.student_id,
      current_schedule_id: currentSchedule.id,
      requested_schedule_id: requestedSchedule.id,
      reason: randomElement(changeReasons),
      status,
      requested_by: parentUsers.find((u) => u.id === parent.user_id)!.id,
      reviewed_by: isReviewed ? adminUsers[0]!.id : null,
      review_notes: isReviewed
        ? randomElement([
            "Schedule change approved",
            "New slot available",
            "Cannot accommodate at this time",
            "Completed transfer",
            null,
          ])
        : null,
    });
  }

  await db.insert(ScheduleChangeRequestTable).values(scheduleChangeRequests);

  // ==================== SUMMARY ====================
  console.log("\n✅ Seed completed successfully!");
  console.log("\n📊 Summary:");
  console.log(`  - ${locations.length} Locations (10 education centers, 52 pop-ups)`);
  console.log(`  - ${users.length} Users (5 admins, 72 teachers, 60 parents)`);
  console.log(`  - ${teacherProfiles.length} Teacher profiles`);
  console.log(`  - ${parentProfiles.length} Parent profiles`);
  console.log(`  - ${students.length} Students`);
  console.log(`  - ${siblings.length} Siblings`);
  console.log(`  - ${schedules.length} Schedules`);
  console.log(`  - ${enrollments.length} Enrollments`);
  console.log(`  - ${teacherStudentLinks.length} Teacher-student links`);
  console.log(`  - ${parentStudentLinks.length} Parent-student links`);
  console.log(`  - ${attendance.length} Attendance records`);
  console.log(`  - ${sessionNotes.length} Session notes`);
  console.log(`  - ${assessments.length} Assessments`);
  console.log(`  - ${bulletins.length} Bulletins`);
  console.log(`  - ${makeupRequests.length} Makeup requests`);
  console.log(`  - ${scheduleChangeRequests.length} Schedule change requests`);

  console.log("\n🔑 Dev Users for Testing (use ?role= URL parameter):");
  console.log(`  - Admin: admin.dev@gmail.com (?role=administrator)`);
  console.log(`  - Teacher: teacher.dev@gmail.com (?role=teacher)`);
  console.log(`  - Parent: parent.dev@gmail.com (?role=parent)`);

  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
