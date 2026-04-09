/**
 * Production Demo Seed Script
 * Creates demo data linked to real app users
 *
 * IDEMPOTENT: Can be re-run without duplicating data
 * SAFE: Does NOT delete existing users
 *
 * Run with: npm run db:seed-demo
 * Also runs automatically on server start (see server.ts)
 */

import "dotenv/config";
import { randomUUID } from "crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "./index";
import {
  UserTable,
  LocationTable,
  TeacherProfileTable,
  ParentProfileTable,
  StudentTable,
  SiblingTable,
  SessionTable,
  ScheduleTable,
  EnrollmentTable,
  TeacherStudentTable,
  ParentStudentLinkTable,
  TeacherLocationTable,
  AttendanceTable,
  AttendanceSiblingParticipantTable,
  SessionNoteTable,
  AssessmentTable,
  AssessmentFocusTable,
  DocumentTable,
  BulletinTable,
  BulletinViewTable,
  BulletinAcknowledgementTable,
  TeacherSickDayNoticeTable,
  ChatMessageTable,
  MakeupRequestTable,
  MakeupSessionTable,
  ScheduleChangeRequestTable,
  ScheduleChangeRequestEventTable,
} from "./schema";

// ==================== TEST USER EMAILS ====================
const TEST_USERS = {
  ADMIN: "admin@nolimitsfordeafchildren.org",
  TEACHER: "teacher@nolimitsfordeafchildren.org",
  PARENT: "parent@nolimitsfordeafchildren.org",
};

// ==================== HELPER FUNCTIONS ====================

const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0] as string;
};

const randomElement = <T>(arr: readonly T[] | T[]): T =>
  arr[Math.floor(Math.random() * arr.length)] as T;

const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const daysAgo = (n: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
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

// ==================== STUDENT DATA ====================

const STUDENT_DATA = [
  {
    firstName: "Emma",
    lastName: "Johnson",
    age: 5,
    devices: ["Cochlear Implant"],
    lossType: "profound" as const,
  },
  {
    firstName: "Liam",
    lastName: "Williams",
    age: 7,
    devices: ["Hearing Aid", "BAHA"],
    lossType: "severe" as const,
  },
  {
    firstName: "Olivia",
    lastName: "Brown",
    age: 4,
    devices: ["Cochlear Implant"],
    lossType: "profound" as const,
  },
  {
    firstName: "Noah",
    lastName: "Garcia",
    age: 8,
    devices: ["Hearing Aid"],
    lossType: "moderate" as const,
  },
  {
    firstName: "Ava",
    lastName: "Martinez",
    age: 6,
    devices: ["Cochlear Implant", "Hearing Aid"],
    lossType: "severe" as const,
  },
  {
    firstName: "Ethan",
    lastName: "Davis",
    age: 9,
    devices: ["BAHA"],
    lossType: "moderately_severe" as const,
  },
  {
    firstName: "Sophia",
    lastName: "Rodriguez",
    age: 3,
    devices: ["Hearing Aid"],
    lossType: "moderate" as const,
  },
  {
    firstName: "Mason",
    lastName: "Wilson",
    age: 10,
    devices: ["Cochlear Implant"],
    lossType: "profound" as const,
  },
  {
    firstName: "Isabella",
    lastName: "Anderson",
    age: 5,
    devices: ["Hearing Aid"],
    lossType: "mild" as const,
  },
  {
    firstName: "Lucas",
    lastName: "Taylor",
    age: 7,
    devices: ["Cochlear Implant", "BAHA"],
    lossType: "severe" as const,
  },
];

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
];

const SOUNDS = ["/s/", "/z/", "/r/", "/l/", "/th/", "/sh/", "/ch/"];
const TOPICS = ["animals", "colors", "shapes", "family", "food", "weather"];

const generateSessionNote = (studentName: string): string => {
  let note = randomElement(SESSION_NOTE_TEMPLATES);
  note = note.replace("{name}", studentName);
  note = note.replace("{sound}", randomElement(SOUNDS));
  note = note.replace("{topic}", randomElement(TOPICS));
  note = note.replace("{num}", randomInt(2, 5).toString());
  return note;
};

// ==================== ASSESSMENT TEMPLATES ====================

const ASSESSMENT_FOCUSES = [
  "Speech sound production - {sound} sounds",
  "Language development - sentence formation",
  "Auditory comprehension skills",
  "Vocabulary expansion - {topic}",
  "Articulation clarity",
];

const generateAssessmentFocus = (): string => {
  let focus = randomElement(ASSESSMENT_FOCUSES);
  focus = focus.replace("{sound}", randomElement(SOUNDS));
  focus = focus.replace("{topic}", randomElement(TOPICS));
  return focus;
};

// ==================== ASSESSMENT FOCUS GOALS ====================

const FOCUS_GOALS = [
  { goal: "Produces /s/ in initial position", maxScore: 10 },
  { goal: "Produces /r/ blends accurately", maxScore: 10 },
  { goal: "Uses 4-5 word sentences", maxScore: 10 },
  { goal: "Follows 2-step directions", maxScore: 10 },
  { goal: "Identifies environmental sounds", maxScore: 10 },
  { goal: "Responds to name from 3 feet", maxScore: 5 },
  { goal: "Imitates 3-syllable words", maxScore: 10 },
  { goal: "Uses past tense verbs", maxScore: 10 },
  { goal: "Answers wh- questions", maxScore: 5 },
  { goal: "Produces /th/ in final position", maxScore: 10 },
];

// ==================== BULLETIN DATA ====================

const BULLETIN_DATA = [
  {
    title: "Welcome to the New Cycle!",
    body: "We're excited to start a new 10-week teaching cycle. Please ensure all audiograms are up to date.",
    roleTarget: "all" as const,
    requiresInitials: false,
  },
  {
    title: "Holiday Schedule Update",
    body: "Please note the upcoming holiday schedule changes. Sessions will resume on January 6th.",
    roleTarget: "all" as const,
    requiresInitials: false,
  },
  {
    title: "New Assessment Guidelines",
    body: "Please review the updated assessment scoring rubric before completing assessments this cycle.",
    roleTarget: "teacher" as const,
    requiresInitials: false,
  },
  {
    title: "Parent Workshop Announcement",
    body: "Join us for an informative workshop on supporting your child's speech development at home. Refreshments will be provided. Please RSVP by confirming below.",
    roleTarget: "parent" as const,
    requiresInitials: true,
  },
  {
    title: "Summer Program Registration",
    body: "Registration is now open for our summer program. Space is limited, so sign up early!",
    roleTarget: "all" as const,
    requiresInitials: false,
  },
  {
    title: "Staff Training Notice",
    body: "Staff members should plan to attend the upcoming training session on the new assessment platform.",
    roleTarget: "teacher" as const,
    requiresInitials: false,
  },
  {
    title: "Important: Audiogram Compliance Reminder",
    body: "All parents must submit updated audiograms every 6 months. Several students are past due. Please upload your child's most recent audiogram through the app immediately.",
    roleTarget: "parent" as const,
    requiresInitials: true,
  },
  {
    title: "Graduation Ceremony Details",
    body: "Mark your calendars for our upcoming graduation ceremony! Students will present their graduation speeches.",
    roleTarget: "all" as const,
    requiresInitials: false,
  },
  {
    title: "New Resource Materials Available",
    body: "New learning materials are now available. Ask your teacher for more information.",
    roleTarget: "all" as const,
    requiresInitials: false,
  },
  {
    title: "Health and Safety Guidelines",
    body: "Please review the updated health and safety guidelines for all participants.",
    roleTarget: "all" as const,
    requiresInitials: false,
  },
];

// ==================== CHAT MESSAGE DATA ====================

const CHAT_MESSAGES = [
  {
    fromRole: "admin",
    message: "Good morning everyone! Reminder that assessments are due by end of this cycle.",
    isAnnouncement: true,
  },
  { fromRole: "teacher", message: "Thanks for the reminder. I have 3 students left to complete." },
  {
    fromRole: "admin",
    message: "Great, let me know if you need any help with the scoring rubric.",
  },
  {
    fromRole: "teacher",
    message: "Quick question - should we use the updated rubric for the post-assessments too?",
  },
  {
    fromRole: "admin",
    message: "Yes, use the updated rubric for both pre and post going forward.",
  },
  {
    fromRole: "teacher",
    message:
      "Got it, thanks! Also, Emma Johnson has been making amazing progress this cycle. Her /s/ production improved from 3/10 to 8/10.",
  },
  {
    fromRole: "admin",
    message:
      "That's wonderful to hear! Make sure to document that in the session notes for her parents to see.",
  },
];

// ==================== MAIN SEED FUNCTION ====================

export async function seedDemo() {
  console.log("Starting production demo seed...\n");

  // Step 1: Look up real users
  console.log("Looking up real users...");

  const [adminUser] = await db
    .select()
    .from(UserTable)
    .where(eq(UserTable.email, TEST_USERS.ADMIN));
  const [teacherUser] = await db
    .select()
    .from(UserTable)
    .where(eq(UserTable.email, TEST_USERS.TEACHER));
  const [parentUser] = await db
    .select()
    .from(UserTable)
    .where(eq(UserTable.email, TEST_USERS.PARENT));

  if (!adminUser || !teacherUser || !parentUser) {
    console.log("  Test users not found yet -- skipping demo seed (run db:seed-users first)");
    return;
  }

  console.log(`  Admin: ${adminUser.name} (${adminUser.id})`);
  console.log(`  Teacher: ${teacherUser.name} (${teacherUser.id})`);
  console.log(`  Parent: ${parentUser.name} (${parentUser.id})`);

  // Step 2: Check/Create Teacher Profile
  console.log("\nSetting up teacher profile...");
  let [teacherProfile] = await db
    .select()
    .from(TeacherProfileTable)
    .where(eq(TeacherProfileTable.user_id, teacherUser.id));

  // Step 3: Check/Create Locations (only if none exist)
  console.log("\nSetting up locations...");
  const existingLocations = await db.select().from(LocationTable);

  let locations: typeof existingLocations;
  if (existingLocations.length === 0) {
    console.log("  Creating 62 locations...");
    const locationData = LA_LOCATIONS.map((loc) => ({
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
    await db.insert(LocationTable).values(locationData);
    locations = await db.select().from(LocationTable);
    console.log(`  Created ${locations.length} locations`);
  } else {
    locations = existingLocations;
    console.log(`  Using ${locations.length} existing locations`);
  }

  const primarySite = locations[0]!;

  // Create teacher profile if needed
  if (!teacherProfile) {
    console.log("  Creating teacher profile...");
    const [newProfile] = await db
      .insert(TeacherProfileTable)
      .values({
        id: randomUUID(),
        user_id: teacherUser.id,
        primary_site_id: primarySite.id,
        bio: "Dedicated educator with 8 years of experience helping deaf children learn to speak. Specializes in auditory-verbal therapy and early intervention.",
        qualifications: "M.S. in Speech-Language Pathology, University of Southern California",
        credentials: "CCC-SLP, LSLS Cert. AVT",
        age_group_specialty: "elementary",
      })
      .returning();
    teacherProfile = newProfile!;
    console.log(`  Created teacher profile: ${teacherProfile.id}`);
  } else {
    console.log(`  Teacher profile exists: ${teacherProfile.id}`);
  }

  // Step 3b: Teacher Locations
  console.log("\nSetting up teacher locations...");
  const existingTeacherLocations = await db
    .select()
    .from(TeacherLocationTable)
    .where(eq(TeacherLocationTable.teacher_profile_id, teacherProfile.id));

  if (existingTeacherLocations.length === 0) {
    console.log("  Assigning teacher to 3 locations...");
    const teacherLocationData = [locations[0]!, locations[1]!, locations[2]!].map((loc) => ({
      id: randomUUID(),
      teacher_profile_id: teacherProfile!.id,
      location_id: loc.id,
    }));
    await db.insert(TeacherLocationTable).values(teacherLocationData);
    console.log(`  Assigned teacher to ${teacherLocationData.length} locations`);
  } else {
    console.log(`  Using ${existingTeacherLocations.length} existing teacher locations`);
  }

  // Step 4: Check/Create Parent Profile
  console.log("\nSetting up parent profile...");
  let [parentProfile] = await db
    .select()
    .from(ParentProfileTable)
    .where(eq(ParentProfileTable.user_id, parentUser.id));

  if (!parentProfile) {
    console.log("  Creating parent profile...");
    const [newProfile] = await db
      .insert(ParentProfileTable)
      .values({
        id: randomUUID(),
        user_id: parentUser.id,
        address_line1: "1234 Maple Drive",
        city: "Los Angeles",
        state: "CA",
        postal_code: "90071",
        household_notes: "Prefers morning sessions. Both parents work from home.",
        preferred_contact_method: "email",
      })
      .returning();
    parentProfile = newProfile!;
    console.log(`  Created parent profile: ${parentProfile.id}`);
  } else {
    // Update address if missing
    if (!parentProfile.address_line1) {
      await db
        .update(ParentProfileTable)
        .set({
          address_line1: "1234 Maple Drive",
          city: "Los Angeles",
          state: "CA",
          postal_code: "90071",
        })
        .where(eq(ParentProfileTable.id, parentProfile.id));
      console.log(`  Updated parent profile address`);
    }
    console.log(`  Parent profile exists: ${parentProfile.id}`);
  }

  // Step 5: Session (semester/cycle)
  console.log("\nSetting up session (10-week cycle)...");
  const existingSessions = await db.select().from(SessionTable);

  let session: (typeof existingSessions)[0];
  if (existingSessions.length === 0) {
    const cycleStart = new Date();
    cycleStart.setDate(cycleStart.getDate() - (cycleStart.getDay() || 7) + 1); // Monday of this week
    cycleStart.setDate(cycleStart.getDate() - 14); // Start 2 weeks ago so there's existing data
    const cycleEnd = new Date(cycleStart);
    cycleEnd.setDate(cycleEnd.getDate() + 69); // 10 weeks

    const [newSession] = await db
      .insert(SessionTable)
      .values({
        id: randomUUID(),
        name: "Spring 2026 - Cycle 3",
        start_date: formatDate(cycleStart),
        end_date: formatDate(cycleEnd),
        is_active: true,
        is_archived: false,
      })
      .returning();
    session = newSession!;
    console.log(
      `  Created session: ${session.name} (${session.start_date} to ${session.end_date})`,
    );
  } else {
    session = existingSessions[0]!;
    console.log(`  Using existing session: ${session.name}`);
  }

  // Step 6: Check/Create Students
  console.log("\nSetting up students...");
  const existingStudents = await db.select().from(StudentTable);

  let students: typeof existingStudents;
  if (existingStudents.length === 0) {
    console.log("  Creating 10 demo students...");
    const today = new Date();
    // All students at the primary site so parent/teacher/admin views align
    const studentData = STUDENT_DATA.map((s) => {
      const dob = new Date(today.getFullYear() - s.age, randomInt(0, 11), randomInt(1, 28));
      return {
        id: randomUUID(),
        site_id: primarySite.id, // All at teacher's primary site
        first_name: s.firstName,
        last_name: s.lastName,
        initials: `${s.firstName[0]}${s.lastName[0]}`,
        dob: formatDate(dob),
        current_school: randomElement([
          "Sunshine Preschool",
          "Lincoln Elementary",
          "Home Schooled",
          "Oak Tree School",
        ]),
        preferred_language: "English",
        hearing_devices: s.devices,
        hearing_loss_type: s.lossType,
        guardian_summary: `Lives with parents in Los Angeles`,
        is_active: true,
      };
    });
    await db.insert(StudentTable).values(studentData);
    students = await db.select().from(StudentTable);
    console.log(`  Created ${students.length} students`);
  } else {
    students = existingStudents;
    // Update hearing info if missing
    for (let i = 0; i < Math.min(students.length, STUDENT_DATA.length); i++) {
      const student = students[i]!;
      const data = STUDENT_DATA[i]!;
      if (!student.hearing_loss_type || student.hearing_devices.length === 0) {
        await db
          .update(StudentTable)
          .set({
            hearing_devices: data.devices,
            hearing_loss_type: data.lossType,
            site_id: primarySite.id,
          })
          .where(eq(StudentTable.id, student.id));
      }
    }
    console.log(`  Using ${students.length} existing students (updated hearing info)`);
  }

  // Step 7: Siblings
  console.log("\nSetting up siblings...");
  const existingSiblings = await db.select().from(SiblingTable);

  let siblings: typeof existingSiblings;
  if (existingSiblings.length === 0 && students.length >= 2) {
    console.log("  Creating siblings...");
    const siblingData = [
      {
        student_id: students[0]!.id,
        name: "Jake Johnson",
        age: 8,
        relationship: "brother",
        is_participant: true,
        has_hearing_loss: false,
        notes: "Attends sessions to support Emma",
      },
      {
        student_id: students[0]!.id,
        name: "Mia Johnson",
        age: 3,
        relationship: "sister",
        is_participant: true,
        has_hearing_loss: true,
        notes: "Recently diagnosed, starting therapy next cycle",
      },
      {
        student_id: students[1]!.id,
        name: "Owen Williams",
        age: 5,
        relationship: "brother",
        is_participant: true,
        has_hearing_loss: false,
        notes: "Very supportive during sessions",
      },
    ].map((s) => ({ id: randomUUID(), ...s }));
    await db.insert(SiblingTable).values(siblingData);
    siblings = await db.select().from(SiblingTable);
    console.log(`  Created ${siblings.length} siblings`);
  } else {
    siblings = existingSiblings;
    console.log(`  Using ${siblings.length} existing siblings`);
  }

  // Step 8: Create Schedules for teacher
  // Use day_of_week_mask = 62 (Mon-Fri, bits 1-5) so demo works any weekday
  console.log("\nSetting up schedules...");
  const existingSchedules = await db
    .select()
    .from(ScheduleTable)
    .where(eq(ScheduleTable.teacher_id, teacherProfile.id));

  let schedules: typeof existingSchedules;
  if (existingSchedules.length === 0) {
    console.log("  Creating 3 schedules for teacher...");
    const cycleStart = new Date(session.start_date);
    const cycleEnd = new Date(session.end_date);

    const scheduleData = [
      { dayMask: 62, startTime: "09:00:00", endTime: "10:00:00" }, // Mon-Fri morning
      { dayMask: 62, startTime: "10:30:00", endTime: "11:30:00" }, // Mon-Fri mid-morning
      { dayMask: 62, startTime: "14:00:00", endTime: "15:00:00" }, // Mon-Fri afternoon
    ].map((s) => ({
      id: randomUUID(),
      teacher_id: teacherProfile!.id,
      site_id: primarySite.id,
      session_id: session.id,
      day_of_week_mask: s.dayMask,
      start_time: s.startTime,
      end_time: s.endTime,
      cycle_start_date: formatDate(cycleStart),
      cycle_end_date: formatDate(cycleEnd),
      is_active: true,
    }));
    await db.insert(ScheduleTable).values(scheduleData);
    schedules = await db
      .select()
      .from(ScheduleTable)
      .where(eq(ScheduleTable.teacher_id, teacherProfile.id));
    console.log(`  Created ${schedules.length} schedules`);
  } else {
    // Update existing schedules to use Mon-Fri mask and current cycle dates
    const cycleStart = new Date(session.start_date);
    const cycleEnd = new Date(session.end_date);
    for (const sched of existingSchedules) {
      await db
        .update(ScheduleTable)
        .set({
          day_of_week_mask: 62,
          session_id: session.id,
          cycle_start_date: formatDate(cycleStart),
          cycle_end_date: formatDate(cycleEnd),
        })
        .where(eq(ScheduleTable.id, sched.id));
    }
    schedules = await db
      .select()
      .from(ScheduleTable)
      .where(eq(ScheduleTable.teacher_id, teacherProfile.id));
    console.log(`  Updated ${schedules.length} existing schedules (Mon-Fri, current cycle)`);
  }

  // Step 9: Create Enrollments (link students to schedules)
  console.log("\nSetting up enrollments...");
  const existingEnrollments = await db.select().from(EnrollmentTable);

  if (existingEnrollments.length === 0) {
    console.log("  Creating enrollments for all students...");
    const enrollmentData = students.map((student, i) => ({
      id: randomUUID(),
      student_id: student.id,
      schedule_id: schedules[i % schedules.length]!.id,
    }));
    await db.insert(EnrollmentTable).values(enrollmentData);
    console.log(`  Created ${enrollmentData.length} enrollments`);
  } else {
    console.log(`  Using ${existingEnrollments.length} existing enrollments`);
  }

  // Step 10: Create Teacher-Student Links
  console.log("\nSetting up teacher-student links...");
  const existingTeacherStudentLinks = await db
    .select()
    .from(TeacherStudentTable)
    .where(eq(TeacherStudentTable.teacher_id, teacherProfile.id));

  if (existingTeacherStudentLinks.length === 0) {
    console.log("  Linking all students to teacher...");
    const linkData = students.map((student) => ({
      id: randomUUID(),
      teacher_id: teacherProfile!.id,
      student_id: student.id,
    }));
    await db.insert(TeacherStudentTable).values(linkData);
    console.log(`  Created ${linkData.length} teacher-student links`);
  } else {
    console.log(`  Using ${existingTeacherStudentLinks.length} existing links`);
  }

  // Step 11: Create Parent-Student Links (first 3 students linked to parent)
  console.log("\nSetting up parent-student links...");
  const existingParentStudentLinks = await db
    .select()
    .from(ParentStudentLinkTable)
    .where(eq(ParentStudentLinkTable.parent_id, parentProfile.id));

  if (existingParentStudentLinks.length === 0) {
    console.log("  Linking first 3 students to parent...");
    const linkData = students.slice(0, 3).map((student, i) => ({
      id: randomUUID(),
      parent_id: parentProfile!.id,
      student_id: student.id,
      relationship: i === 0 ? "mother" : "father",
      is_primary: i === 0,
    }));
    await db.insert(ParentStudentLinkTable).values(linkData);
    console.log(`  Created ${linkData.length} parent-student links`);
  } else {
    console.log(`  Using ${existingParentStudentLinks.length} existing links`);
  }

  // Step 12: Create Attendance Records
  console.log("\nSetting up attendance records...");
  const existingAttendance = await db.select().from(AttendanceTable);

  if (existingAttendance.length === 0) {
    console.log("  Creating 80 attendance records...");
    const attendanceStatuses = [
      "present",
      "present",
      "present",
      "present",
      "present",
      "late",
      "no_show",
      "cancelled",
    ] as const;
    const absenceReasons = [
      "sick",
      "family_emergency",
      "transportation",
      "schedule_conflict",
    ] as const;
    const enrollments = await db.select().from(EnrollmentTable);
    const attendanceData = [];

    for (let i = 0; i < 80; i++) {
      const enrollment = enrollments[i % enrollments.length]!;
      const ago = randomInt(1, 30);
      const sessionDate = daysAgo(ago);
      const status = randomElement(attendanceStatuses);

      attendanceData.push({
        id: randomUUID(),
        student_id: enrollment.student_id,
        schedule_id: enrollment.schedule_id,
        session_date: formatDate(sessionDate),
        status,
        late_minutes: status === "late" ? randomInt(5, 20) : null,
        reason: status !== "present" && status !== "late" ? randomElement(absenceReasons) : null,
        reason_text:
          status === "no_show" || status === "cancelled"
            ? randomElement(["Had a cold", "Family event", "Car trouble", null])
            : null,
        marked_by: teacherUser.id,
      });
    }
    await db.insert(AttendanceTable).values(attendanceData);
    console.log(`  Created ${attendanceData.length} attendance records`);
  } else {
    console.log(`  Using ${existingAttendance.length} existing records`);
  }

  // Step 12b: Attendance Sibling Participants
  console.log("\nSetting up attendance sibling participants...");
  const existingSiblingParticipants = await db.select().from(AttendanceSiblingParticipantTable);

  if (existingSiblingParticipants.length === 0 && siblings.length > 0) {
    const allAttendance = await db.select().from(AttendanceTable);
    // Find attendance records for students that have siblings
    const studentIdsWithSiblings = [...new Set(siblings.map((s) => s.student_id))];
    const relevantAttendance = allAttendance.filter(
      (a) => studentIdsWithSiblings.includes(a.student_id) && a.status === "present",
    );

    if (relevantAttendance.length > 0) {
      const participantData = [];
      for (const att of relevantAttendance.slice(0, 8)) {
        const studentSiblings = siblings.filter((s) => s.student_id === att.student_id);
        for (const sib of studentSiblings) {
          participantData.push({
            id: randomUUID(),
            attendance_id: att.id,
            sibling_id: sib.id,
          });
        }
      }
      if (participantData.length > 0) {
        await db.insert(AttendanceSiblingParticipantTable).values(participantData);
        console.log(`  Created ${participantData.length} sibling participation records`);
      }
    }
  } else {
    console.log(`  Using ${existingSiblingParticipants.length} existing sibling participants`);
  }

  // Step 13: Create Session Notes
  console.log("\nSetting up session notes...");
  const existingNotes = await db.select().from(SessionNoteTable);

  if (existingNotes.length === 0) {
    console.log("  Creating 30 session notes...");
    const enrollments = await db.select().from(EnrollmentTable);
    const noteData = [];

    for (let i = 0; i < 30; i++) {
      const student = students[i % students.length]!;
      const enrollment = enrollments.find((e) => e.student_id === student.id);
      if (!enrollment) continue;

      const ago = randomInt(1, 30);
      const sessionDate = daysAgo(ago);

      noteData.push({
        id: randomUUID(),
        student_id: student.id,
        teacher_id: teacherProfile!.id,
        schedule_id: enrollment.schedule_id,
        session_date: formatDate(sessionDate),
        note: generateSessionNote(student.first_name),
      });
    }
    await db.insert(SessionNoteTable).values(noteData);
    console.log(`  Created ${noteData.length} session notes`);
  } else {
    console.log(`  Using ${existingNotes.length} existing notes`);
  }

  // Step 14: Create Assessments + Assessment Focuses
  console.log("\nSetting up assessments...");
  const existingAssessments = await db.select().from(AssessmentTable);

  if (existingAssessments.length === 0) {
    console.log("  Creating 20 assessments with focus breakdowns...");
    const cycleStart = new Date(session.start_date);

    const assessmentData = [];
    for (let i = 0; i < 20; i++) {
      const student = students[i % students.length]!;
      const isPre = i < 10;
      const preScore = randomInt(5, 12);
      const postScore = isPre ? preScore : preScore + randomInt(2, 6); // Post always higher

      assessmentData.push({
        id: randomUUID(),
        student_id: student.id,
        teacher_id: teacherProfile!.id,
        cycle_start_date: formatDate(cycleStart),
        assessment_type: isPre ? ("pre" as const) : ("post" as const),
        teaching_focus: generateAssessmentFocus(),
        score: isPre ? preScore : Math.min(postScore, 20),
        notes: randomElement([
          "Baseline assessment for new cycle",
          "Good progress from previous cycle",
          "Showing consistent improvement",
          "Strong auditory comprehension skills",
          null,
        ]),
      });
    }
    const inserted = await db.insert(AssessmentTable).values(assessmentData).returning();
    console.log(`  Created ${inserted.length} assessments`);

    // Assessment focuses (2-3 goals per assessment)
    console.log("  Adding assessment focus breakdowns...");
    const focusData = [];
    for (const assessment of inserted) {
      const numGoals = randomInt(2, 3);
      const usedGoals = new Set<number>();
      for (let g = 0; g < numGoals; g++) {
        let goalIdx: number;
        do {
          goalIdx = randomInt(0, FOCUS_GOALS.length - 1);
        } while (usedGoals.has(goalIdx));
        usedGoals.add(goalIdx);
        const goal = FOCUS_GOALS[goalIdx]!;
        focusData.push({
          id: randomUUID(),
          assessment_id: assessment.id,
          goal: goal.goal,
          score: randomInt(Math.floor(goal.maxScore * 0.3), goal.maxScore),
          max_score: goal.maxScore,
          sort_order: g,
        });
      }
    }
    await db.insert(AssessmentFocusTable).values(focusData);
    console.log(`  Created ${focusData.length} assessment focus goals`);
  } else {
    console.log(`  Using ${existingAssessments.length} existing assessments`);
    // Check if focuses exist
    const existingFocuses = await db.select().from(AssessmentFocusTable);
    if (existingFocuses.length === 0 && existingAssessments.length > 0) {
      console.log("  Adding missing assessment focus breakdowns...");
      const focusData = [];
      for (const assessment of existingAssessments) {
        const numGoals = randomInt(2, 3);
        const usedGoals = new Set<number>();
        for (let g = 0; g < numGoals; g++) {
          let goalIdx: number;
          do {
            goalIdx = randomInt(0, FOCUS_GOALS.length - 1);
          } while (usedGoals.has(goalIdx));
          usedGoals.add(goalIdx);
          const goal = FOCUS_GOALS[goalIdx]!;
          focusData.push({
            id: randomUUID(),
            assessment_id: assessment.id,
            goal: goal.goal,
            score: randomInt(Math.floor(goal.maxScore * 0.3), goal.maxScore),
            max_score: goal.maxScore,
            sort_order: g,
          });
        }
      }
      if (focusData.length > 0) {
        await db.insert(AssessmentFocusTable).values(focusData);
        console.log(`  Created ${focusData.length} assessment focus goals`);
      }
    }
  }

  // Step 15: Documents (audiograms, IEPs, graduation speeches)
  console.log("\nSetting up documents...");
  const existingDocuments = await db.select().from(DocumentTable);

  if (existingDocuments.length === 0) {
    console.log("  Creating documents for students...");
    const documentData = [];
    const today = new Date();

    for (const student of students) {
      // Audiogram (most recent)
      const audiogramDate = daysAgo(randomInt(30, 120));
      const nextDue = new Date(audiogramDate);
      nextDue.setMonth(nextDue.getMonth() + 6);
      const isOverdue = nextDue < today;

      documentData.push({
        id: randomUUID(),
        entity_type: "student",
        entity_id: student.id,
        document_type: "audiogram" as const,
        file_url: `https://storage.example.com/documents/${student.id}/audiogram-${formatDate(audiogramDate)}.pdf`,
        file_name: `audiogram-${formatDate(audiogramDate)}.pdf`,
        file_size: randomInt(50000, 200000),
        mime_type: "application/pdf",
        document_date: formatDate(audiogramDate),
        next_due_date: formatDate(nextDue),
        review_status: isOverdue ? ("pending" as const) : ("approved" as const),
        reviewed_by: isOverdue ? null : adminUser.id,
        reviewed_at: isOverdue ? null : daysAgo(randomInt(1, 20)),
        uploaded_by: parentUser.id,
      });

      // IEP for half the students
      if (students.indexOf(student) % 2 === 0) {
        documentData.push({
          id: randomUUID(),
          entity_type: "student",
          entity_id: student.id,
          document_type: "iep" as const,
          file_url: `https://storage.example.com/documents/${student.id}/iep-current.pdf`,
          file_name: `${student.first_name}-IEP-2026.pdf`,
          file_size: randomInt(100000, 500000),
          mime_type: "application/pdf",
          document_date: formatDate(daysAgo(randomInt(30, 90))),
          next_due_date: null,
          review_status: "approved" as const,
          reviewed_by: adminUser.id,
          reviewed_at: daysAgo(randomInt(1, 15)),
          uploaded_by: parentUser.id,
        });
      }
    }
    await db.insert(DocumentTable).values(documentData);
    console.log(`  Created ${documentData.length} documents`);
  } else {
    console.log(`  Using ${existingDocuments.length} existing documents`);
  }

  // Step 16: Create Bulletins
  console.log("\nSetting up bulletins...");
  const existingBulletins = await db.select().from(BulletinTable);

  let bulletins: typeof existingBulletins;
  if (existingBulletins.length === 0) {
    console.log("  Creating 10 bulletins...");
    const bulletinValues = BULLETIN_DATA.map((b, i) => ({
      id: randomUUID(),
      site_id: i % 3 === 0 ? locations[i % locations.length]!.id : null,
      scope: (i % 3 === 0 ? "site" : "global") as "site" | "global",
      role_target: b.roleTarget,
      requires_initials: b.requiresInitials,
      title: b.title,
      body: b.body,
      created_by: adminUser.id,
    }));
    await db.insert(BulletinTable).values(bulletinValues);
    bulletins = await db.select().from(BulletinTable);
    console.log(`  Created ${bulletins.length} bulletins`);
  } else {
    bulletins = existingBulletins;
    // Ensure some require initials
    const hasInitials = bulletins.some((b) => b.requires_initials);
    if (!hasInitials && bulletins.length >= 4) {
      await db
        .update(BulletinTable)
        .set({ requires_initials: true, role_target: "parent" })
        .where(eq(BulletinTable.id, bulletins[3]!.id));
      if (bulletins.length >= 7) {
        await db
          .update(BulletinTable)
          .set({ requires_initials: true, role_target: "parent" })
          .where(eq(BulletinTable.id, bulletins[6]!.id));
      }
      console.log(`  Updated bulletins to include requires_initials`);
    }
    console.log(`  Using ${bulletins.length} existing bulletins`);
  }

  // Step 16b: Bulletin Views
  console.log("\nSetting up bulletin views...");
  const existingViews = await db.select().from(BulletinViewTable);

  if (existingViews.length === 0 && bulletins.length > 0) {
    const viewData = [];
    // Teacher and admin have viewed most bulletins
    for (const bulletin of bulletins.slice(0, 7)) {
      viewData.push({
        id: randomUUID(),
        bulletin_id: bulletin.id,
        user_id: teacherUser.id,
        viewed_at: daysAgo(randomInt(0, 5)),
        last_viewed_at: daysAgo(randomInt(0, 2)),
      });
      viewData.push({
        id: randomUUID(),
        bulletin_id: bulletin.id,
        user_id: adminUser.id,
        viewed_at: daysAgo(randomInt(0, 5)),
        last_viewed_at: daysAgo(randomInt(0, 2)),
      });
    }
    // Parent has viewed a few
    for (const bulletin of bulletins.slice(0, 4)) {
      viewData.push({
        id: randomUUID(),
        bulletin_id: bulletin.id,
        user_id: parentUser.id,
        viewed_at: daysAgo(randomInt(0, 5)),
        last_viewed_at: daysAgo(randomInt(0, 2)),
      });
    }
    await db.insert(BulletinViewTable).values(viewData);
    console.log(`  Created ${viewData.length} bulletin views`);
  } else {
    console.log(`  Using ${existingViews.length} existing bulletin views`);
  }

  // Step 16c: Bulletin Acknowledgements
  console.log("\nSetting up bulletin acknowledgements...");
  const existingAcks = await db.select().from(BulletinAcknowledgementTable);

  if (existingAcks.length === 0) {
    // Find bulletins that require initials
    const initialsRequired = bulletins.filter((b) => b.requires_initials);
    if (initialsRequired.length > 0) {
      // Teacher has acknowledged the first one
      const ackData = [
        {
          id: randomUUID(),
          bulletin_id: initialsRequired[0]!.id,
          user_id: teacherUser.id,
          initials: "TT",
        },
      ];
      await db.insert(BulletinAcknowledgementTable).values(ackData);
      console.log(`  Created ${ackData.length} bulletin acknowledgements`);
    }
  } else {
    console.log(`  Using ${existingAcks.length} existing acknowledgements`);
  }

  // Step 17: Chat Messages
  console.log("\nSetting up chat messages...");
  const existingMessages = await db.select().from(ChatMessageTable);

  if (existingMessages.length === 0) {
    console.log("  Creating chat messages...");
    const messageData = CHAT_MESSAGES.map((m, i) => ({
      id: randomUUID(),
      channel: "community" as const,
      message: m.message,
      is_announcement: m.isAnnouncement || false,
      created_by: m.fromRole === "admin" ? adminUser.id : teacherUser.id,
      created_at: daysAgo(7 - i), // Spread over the last week
    }));
    await db.insert(ChatMessageTable).values(messageData);
    console.log(`  Created ${messageData.length} chat messages`);
  } else {
    console.log(`  Using ${existingMessages.length} existing messages`);
  }

  // Step 18: Teacher Sick Day Notice
  console.log("\nSetting up teacher sick day notices...");
  const existingSickDays = await db.select().from(TeacherSickDayNoticeTable);

  if (existingSickDays.length === 0) {
    const sickDayBulletinId = randomUUID();
    // Create the auto-generated bulletin for the sick day
    await db.insert(BulletinTable).values({
      id: sickDayBulletinId,
      scope: "site",
      site_id: primarySite.id,
      role_target: "parent",
      title: "Teacher Absence Notice",
      body: `Test Teacher will be absent on ${formatDate(daysAgo(5))} at Downtown LA Education Center. Sessions for that day are cancelled.`,
      created_by: teacherUser.id,
    });

    await db.insert(TeacherSickDayNoticeTable).values({
      id: randomUUID(),
      teacher_id: teacherProfile.id,
      site_id: primarySite.id,
      notice_date: formatDate(daysAgo(5)),
      note: "Not feeling well, will return next session.",
      bulletin_id: sickDayBulletinId,
      created_by: teacherUser.id,
    });
    console.log("  Created 1 sick day notice");
  } else {
    console.log(`  Using ${existingSickDays.length} existing sick day notices`);
  }

  // Step 19: Makeup Requests
  console.log("\nSetting up makeup requests...");
  const existingMakeupRequests = await db.select().from(MakeupRequestTable);

  let makeupRequests: typeof existingMakeupRequests;
  if (existingMakeupRequests.length === 0) {
    console.log("  Creating 5 makeup requests...");
    const enrollments = await db.select().from(EnrollmentTable);
    const requestStatuses = ["pending", "approved", "denied", "completed"] as const;
    const absenceReasons = ["sick", "family_emergency", "transportation"] as const;

    const parentStudentLinks = await db
      .select()
      .from(ParentStudentLinkTable)
      .where(eq(ParentStudentLinkTable.parent_id, parentProfile.id));
    const parentStudentIds = parentStudentLinks.map((l) => l.student_id);

    const makeupData = [];
    for (let i = 0; i < 5; i++) {
      const studentId = parentStudentIds[i % parentStudentIds.length]!;
      const enrollment = enrollments.find((e) => e.student_id === studentId);
      if (!enrollment) continue;

      const ago = randomInt(5, 20);
      const sessionDate = daysAgo(ago);
      const status = requestStatuses[i % requestStatuses.length]!;
      const isReviewed = status !== "pending";

      makeupData.push({
        id: randomUUID(),
        student_id: studentId,
        original_session_date: formatDate(sessionDate),
        original_schedule_id: enrollment.schedule_id,
        reason: randomElement(absenceReasons),
        reason_text: randomElement(["Child was sick", "Family emergency", "Transportation issue"]),
        preferred_dates: randomElement(["Any Saturday morning", "Next week afternoon", "Flexible"]),
        status,
        requested_by: parentUser.id,
        reviewed_by: isReviewed ? adminUser.id : null,
        review_notes: isReviewed
          ? randomElement([
              "Approved for next Saturday",
              "Scheduled with same teacher",
              "No availability",
            ])
          : null,
      });
    }
    if (makeupData.length > 0) {
      await db.insert(MakeupRequestTable).values(makeupData);
    }
    makeupRequests = await db.select().from(MakeupRequestTable);
    console.log(`  Created ${makeupData.length} makeup requests`);
  } else {
    makeupRequests = existingMakeupRequests;
    console.log(`  Using ${existingMakeupRequests.length} existing requests`);
  }

  // Step 19b: Makeup Sessions (actual scheduled sessions, not just requests)
  console.log("\nSetting up makeup sessions...");
  const existingMakeupSessions = await db.select().from(MakeupSessionTable);

  if (existingMakeupSessions.length === 0) {
    const approvedRequests = makeupRequests.filter(
      (r) => r.status === "approved" || r.status === "completed",
    );
    const makeupSessionData = [];

    // Create sessions for approved/completed requests
    for (const req of approvedRequests.slice(0, 2)) {
      makeupSessionData.push({
        id: randomUUID(),
        makeup_request_id: req.id,
        student_id: req.student_id,
        teacher_id: teacherProfile.id,
        site_id: primarySite.id,
        scheduled_date: formatDate(daysAgo(randomInt(1, 7))),
        scheduled_time: "10:00:00",
        attendance_status: req.status === "completed" ? ("present" as const) : null,
        notes:
          req.status === "completed" ? "Makeup completed successfully" : "Scheduled for this week",
        created_by: adminUser.id,
      });
    }

    // One standalone makeup (admin-created, no request)
    if (students.length > 3) {
      makeupSessionData.push({
        id: randomUUID(),
        makeup_request_id: null,
        student_id: students[3]!.id,
        teacher_id: teacherProfile.id,
        site_id: primarySite.id,
        scheduled_date: formatDate(daysAgo(2)),
        scheduled_time: "14:00:00",
        attendance_status: null,
        notes: "Extra session requested by admin",
        created_by: adminUser.id,
      });
    }

    if (makeupSessionData.length > 0) {
      await db.insert(MakeupSessionTable).values(makeupSessionData);
      console.log(`  Created ${makeupSessionData.length} makeup sessions`);
    }
  } else {
    console.log(`  Using ${existingMakeupSessions.length} existing makeup sessions`);
  }

  // Step 20: Schedule Change Requests
  console.log("\nSetting up schedule change requests...");
  const existingScheduleChangeRequests = await db.select().from(ScheduleChangeRequestTable);

  let scheduleChangeRequests: typeof existingScheduleChangeRequests;
  if (existingScheduleChangeRequests.length === 0 && schedules.length >= 2) {
    console.log("  Creating 3 schedule change requests...");
    const enrollments = await db.select().from(EnrollmentTable);
    const requestStatuses = ["pending", "approved", "denied"] as const;
    const changeReasons = [
      "New work schedule",
      "Transportation issues",
      "Prefer different time slot",
    ];

    const parentStudentLinks = await db
      .select()
      .from(ParentStudentLinkTable)
      .where(eq(ParentStudentLinkTable.parent_id, parentProfile.id));
    const parentStudentIds = parentStudentLinks.map((l) => l.student_id);

    const changeData = [];
    for (let i = 0; i < 3; i++) {
      const studentId = parentStudentIds[i % parentStudentIds.length]!;
      const enrollment = enrollments.find((e) => e.student_id === studentId);
      if (!enrollment) continue;

      const otherSchedule = schedules.find((s) => s.id !== enrollment.schedule_id);
      if (!otherSchedule) continue;

      const status = requestStatuses[i % requestStatuses.length]!;
      const isReviewed = status !== "pending";

      changeData.push({
        id: randomUUID(),
        student_id: studentId,
        current_schedule_id: enrollment.schedule_id,
        requested_schedule_id: otherSchedule.id,
        reason: changeReasons[i]!,
        status,
        requested_by: parentUser.id,
        reviewed_by: isReviewed ? adminUser.id : null,
        review_notes: isReviewed
          ? randomElement(["Schedule change approved", "New slot available", "Cannot accommodate"])
          : null,
      });
    }
    if (changeData.length > 0) {
      await db.insert(ScheduleChangeRequestTable).values(changeData);
    }
    scheduleChangeRequests = await db.select().from(ScheduleChangeRequestTable);
    console.log(`  Created ${changeData.length} schedule change requests`);
  } else {
    scheduleChangeRequests = existingScheduleChangeRequests;
    console.log(`  Using ${existingScheduleChangeRequests.length} existing requests`);
  }

  // Step 20b: Schedule Change Request Events (activity log)
  console.log("\nSetting up schedule change request events...");
  const existingEvents = await db.select().from(ScheduleChangeRequestEventTable);

  if (existingEvents.length === 0 && scheduleChangeRequests.length > 0) {
    const eventData = [];
    for (const req of scheduleChangeRequests) {
      // Every request has a "submitted" event
      eventData.push({
        id: randomUUID(),
        schedule_change_request_id: req.id,
        event_type: "submitted",
        from_status: null,
        to_status: "pending",
        actor_user_id: parentUser.id,
        notes: "Request submitted by parent",
        created_at: daysAgo(randomInt(5, 15)),
      });

      // Reviewed requests have a review event
      if (req.status !== "pending") {
        eventData.push({
          id: randomUUID(),
          schedule_change_request_id: req.id,
          event_type: "reviewed",
          from_status: "pending",
          to_status: req.status,
          actor_user_id: adminUser.id,
          notes: req.review_notes || `Request ${req.status} by admin`,
          created_at: daysAgo(randomInt(1, 4)),
        });
      }
    }
    if (eventData.length > 0) {
      await db.insert(ScheduleChangeRequestEventTable).values(eventData);
      console.log(`  Created ${eventData.length} schedule change events`);
    }
  } else {
    console.log(`  Using ${existingEvents.length} existing events`);
  }

  // ==================== SUMMARY ====================
  console.log("\n" + "=".repeat(50));
  console.log("Production demo seed completed!");
  console.log("=".repeat(50));

  const counts = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(LocationTable),
    db.select({ count: sql<number>`count(*)` }).from(StudentTable),
    db.select({ count: sql<number>`count(*)` }).from(SiblingTable),
    db.select({ count: sql<number>`count(*)` }).from(SessionTable),
    db.select({ count: sql<number>`count(*)` }).from(ScheduleTable),
    db.select({ count: sql<number>`count(*)` }).from(EnrollmentTable),
    db.select({ count: sql<number>`count(*)` }).from(TeacherStudentTable),
    db.select({ count: sql<number>`count(*)` }).from(ParentStudentLinkTable),
    db.select({ count: sql<number>`count(*)` }).from(TeacherLocationTable),
    db.select({ count: sql<number>`count(*)` }).from(AttendanceTable),
    db.select({ count: sql<number>`count(*)` }).from(SessionNoteTable),
    db.select({ count: sql<number>`count(*)` }).from(AssessmentTable),
    db.select({ count: sql<number>`count(*)` }).from(AssessmentFocusTable),
    db.select({ count: sql<number>`count(*)` }).from(DocumentTable),
    db.select({ count: sql<number>`count(*)` }).from(BulletinTable),
    db.select({ count: sql<number>`count(*)` }).from(BulletinViewTable),
    db.select({ count: sql<number>`count(*)` }).from(ChatMessageTable),
    db.select({ count: sql<number>`count(*)` }).from(MakeupRequestTable),
    db.select({ count: sql<number>`count(*)` }).from(MakeupSessionTable),
    db.select({ count: sql<number>`count(*)` }).from(ScheduleChangeRequestTable),
  ]);

  const labels = [
    "Locations",
    "Students",
    "Siblings",
    "Sessions",
    "Schedules",
    "Enrollments",
    "Teacher-Student Links",
    "Parent-Student Links",
    "Teacher Locations",
    "Attendance Records",
    "Session Notes",
    "Assessments",
    "Assessment Focuses",
    "Documents",
    "Bulletins",
    "Bulletin Views",
    "Chat Messages",
    "Makeup Requests",
    "Makeup Sessions",
    "Schedule Change Requests",
  ];

  console.log("\nData Summary:");
  for (let i = 0; i < labels.length; i++) {
    console.log(`  - ${labels[i]}: ${counts[i]![0]!.count}`);
  }

  console.log("\nTest Accounts:");
  console.log(`  - Admin: ${TEST_USERS.ADMIN}`);
  console.log(`  - Teacher: ${TEST_USERS.TEACHER}`);
  console.log(`  - Parent: ${TEST_USERS.PARENT}`);
}

// Allow running directly: npm run db:seed-demo
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDemo()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seed failed:", error);
      process.exit(1);
    });
}
