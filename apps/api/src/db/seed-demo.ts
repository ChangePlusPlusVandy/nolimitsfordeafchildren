/**
 * Production Demo Seed Script
 * Creates demo data linked to real app users
 *
 * IDEMPOTENT: Can be re-run without duplicating data
 * SAFE: Does NOT delete existing users
 *
 * Run with: npm run db:seed-demo
 */

import "dotenv/config";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "./index";
import {
  UserTable,
  LocationTable,
  TeacherProfileTable,
  ParentProfileTable,
  StudentTable,
  ScheduleTable,
  EnrollmentTable,
  TeacherStudentTable,
  ParentStudentLinkTable,
  AttendanceTable,
  SessionNoteTable,
  AssessmentTable,
  BulletinTable,
  MakeupRequestTable,
  ScheduleChangeRequestTable,
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
  { firstName: "Emma", lastName: "Johnson", age: 5 },
  { firstName: "Liam", lastName: "Williams", age: 7 },
  { firstName: "Olivia", lastName: "Brown", age: 4 },
  { firstName: "Noah", lastName: "Garcia", age: 8 },
  { firstName: "Ava", lastName: "Martinez", age: 6 },
  { firstName: "Ethan", lastName: "Davis", age: 9 },
  { firstName: "Sophia", lastName: "Rodriguez", age: 3 },
  { firstName: "Mason", lastName: "Wilson", age: 10 },
  { firstName: "Isabella", lastName: "Anderson", age: 5 },
  { firstName: "Lucas", lastName: "Taylor", age: 7 },
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

// ==================== BULLETIN DATA ====================

const BULLETIN_DATA = [
  {
    title: "Welcome to the New Cycle!",
    body: "We're excited to start a new 10-week teaching cycle. Please ensure all audiograms are up to date.",
  },
  {
    title: "Holiday Schedule Update",
    body: "Please note the upcoming holiday schedule changes. Sessions will resume on January 6th.",
  },
  {
    title: "New Assessment Guidelines",
    body: "Please review the updated assessment scoring rubric before completing assessments this cycle.",
  },
  {
    title: "Parent Workshop Announcement",
    body: "Join us for an informative workshop on January 15th. Refreshments will be provided.",
  },
  {
    title: "Summer Program Registration",
    body: "Registration is now open for our summer program. Space is limited, so sign up early!",
  },
  {
    title: "Staff Training Notice",
    body: "Staff members should plan to attend the upcoming training session on January 20th.",
  },
  {
    title: "Schedule Changes for Next Month",
    body: "Please review the schedule changes that will take effect next month.",
  },
  {
    title: "Graduation Ceremony Details",
    body: "Mark your calendars for our upcoming graduation ceremony on February 1st!",
  },
  {
    title: "New Resource Materials Available",
    body: "New learning materials are now available. Ask your teacher for more information.",
  },
  {
    title: "Health and Safety Guidelines",
    body: "Please review the updated health and safety guidelines for all participants.",
  },
];

// ==================== MAIN SEED FUNCTION ====================

async function seedDemo() {
  console.log("🌱 Starting production demo seed...\n");

  // Step 1: Look up real users
  console.log("👤 Looking up real users...");

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

  if (!adminUser) {
    console.error(`❌ Admin user not found: ${TEST_USERS.ADMIN}`);
    process.exit(1);
  }
  if (!teacherUser) {
    console.error(`❌ Teacher user not found: ${TEST_USERS.TEACHER}`);
    process.exit(1);
  }
  if (!parentUser) {
    console.error(`❌ Parent user not found: ${TEST_USERS.PARENT}`);
    process.exit(1);
  }

  console.log(`  ✓ Admin: ${adminUser.name} (${adminUser.id})`);
  console.log(`  ✓ Teacher: ${teacherUser.name} (${teacherUser.id})`);
  console.log(`  ✓ Parent: ${parentUser.name} (${parentUser.id})`);

  // Step 2: Check/Create Teacher Profile
  console.log("\n👩‍🏫 Setting up teacher profile...");
  let [teacherProfile] = await db
    .select()
    .from(TeacherProfileTable)
    .where(eq(TeacherProfileTable.user_id, teacherUser.id));

  // Step 3: Check/Create Locations (only if none exist)
  console.log("\n📍 Setting up locations...");
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
    console.log(`  ✓ Created ${locations.length} locations`);
  } else {
    locations = existingLocations;
    console.log(`  ✓ Using ${locations.length} existing locations`);
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
        bio: "Dedicated educator with 8 years of experience helping deaf children learn to speak.",
        qualifications: "M.S. in Speech-Language Pathology",
        credentials: "CCC-SLP, LSLS Cert. AVT",
        age_group_specialty: "elementary",
      })
      .returning();
    teacherProfile = newProfile!;
    console.log(`  ✓ Created teacher profile: ${teacherProfile.id}`);
  } else {
    console.log(`  ✓ Teacher profile exists: ${teacherProfile.id}`);
  }

  // Step 4: Check/Create Parent Profile
  console.log("\n👨‍👩‍👧 Setting up parent profile...");
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
        household_notes: "Prefers morning sessions. Both parents work from home.",
        preferred_contact_method: "email",
      })
      .returning();
    parentProfile = newProfile!;
    console.log(`  ✓ Created parent profile: ${parentProfile.id}`);
  } else {
    console.log(`  ✓ Parent profile exists: ${parentProfile.id}`);
  }

  // Step 5: Check/Create Students
  console.log("\n🧒 Setting up students...");
  const existingStudents = await db.select().from(StudentTable);

  let students: typeof existingStudents;
  if (existingStudents.length === 0) {
    console.log("  Creating 10 demo students...");
    const today = new Date();
    const studentData = STUDENT_DATA.map((s, i) => {
      const dob = new Date(today.getFullYear() - s.age, randomInt(0, 11), randomInt(1, 28));
      return {
        id: randomUUID(),
        site_id: locations[i % locations.length]!.id,
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
        guardian_summary: `Lives with parents in ${locations[i % locations.length]!.city}`,
        is_active: true,
      };
    });
    await db.insert(StudentTable).values(studentData);
    students = await db.select().from(StudentTable);
    console.log(`  ✓ Created ${students.length} students`);
  } else {
    students = existingStudents;
    console.log(`  ✓ Using ${students.length} existing students`);
  }

  // Step 6: Create Schedules for teacher
  console.log("\n📅 Setting up schedules...");
  const existingSchedules = await db
    .select()
    .from(ScheduleTable)
    .where(eq(ScheduleTable.teacher_id, teacherProfile.id));

  let schedules: typeof existingSchedules;
  if (existingSchedules.length === 0) {
    console.log("  Creating 3 schedules for teacher...");
    const cycleStart = new Date();
    cycleStart.setDate(cycleStart.getDate() - (cycleStart.getDay() || 7) + 1);
    const cycleEnd = new Date(cycleStart);
    cycleEnd.setDate(cycleEnd.getDate() + 69);

    const scheduleData = [
      { dayMask: 37, startTime: "09:00:00", endTime: "10:00:00" }, // M/W/S morning
      { dayMask: 37, startTime: "10:00:00", endTime: "11:00:00" }, // M/W/S mid-morning
      { dayMask: 37, startTime: "14:00:00", endTime: "15:00:00" }, // M/W/S afternoon
    ].map((s) => ({
      id: randomUUID(),
      teacher_id: teacherProfile!.id,
      site_id: primarySite.id,
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
    console.log(`  ✓ Created ${schedules.length} schedules`);
  } else {
    schedules = existingSchedules;
    console.log(`  ✓ Using ${schedules.length} existing schedules`);
  }

  // Step 7: Create Enrollments (link students to schedules)
  console.log("\n📝 Setting up enrollments...");
  const existingEnrollments = await db.select().from(EnrollmentTable);

  if (existingEnrollments.length === 0) {
    console.log("  Creating enrollments for all students...");
    const enrollmentData = students.map((student, i) => ({
      id: randomUUID(),
      student_id: student.id,
      schedule_id: schedules[i % schedules.length]!.id,
    }));
    await db.insert(EnrollmentTable).values(enrollmentData);
    console.log(`  ✓ Created ${enrollmentData.length} enrollments`);
  } else {
    console.log(`  ✓ Using ${existingEnrollments.length} existing enrollments`);
  }

  // Step 8: Create Teacher-Student Links
  console.log("\n🔗 Setting up teacher-student links...");
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
    console.log(`  ✓ Created ${linkData.length} teacher-student links`);
  } else {
    console.log(`  ✓ Using ${existingTeacherStudentLinks.length} existing links`);
  }

  // Step 9: Create Parent-Student Links (first 3 students linked to parent)
  console.log("\n👨‍👩‍👧 Setting up parent-student links...");
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
    console.log(`  ✓ Created ${linkData.length} parent-student links`);
  } else {
    console.log(`  ✓ Using ${existingParentStudentLinks.length} existing links`);
  }

  // Step 10: Create Attendance Records
  console.log("\n✅ Setting up attendance records...");
  const existingAttendance = await db.select().from(AttendanceTable);

  if (existingAttendance.length === 0) {
    console.log("  Creating 60 attendance records...");
    const today = new Date();
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
    ] as const;

    const enrollments = await db.select().from(EnrollmentTable);
    const attendanceData = [];

    for (let i = 0; i < 60; i++) {
      const enrollment = enrollments[i % enrollments.length]!;
      const daysAgo = randomInt(1, 45);
      const sessionDate = new Date(today);
      sessionDate.setDate(sessionDate.getDate() - daysAgo);
      const status = randomElement(attendanceStatuses);

      attendanceData.push({
        id: randomUUID(),
        student_id: enrollment.student_id,
        schedule_id: enrollment.schedule_id,
        session_date: formatDate(sessionDate),
        status,
        reason: status !== "present" ? randomElement(absenceReasons) : null,
        reason_text:
          status !== "present"
            ? randomElement(["Had a cold", "Family event", "Car trouble", null])
            : null,
        marked_by: teacherUser.id,
      });
    }
    await db.insert(AttendanceTable).values(attendanceData);
    console.log(`  ✓ Created ${attendanceData.length} attendance records`);
  } else {
    console.log(`  ✓ Using ${existingAttendance.length} existing records`);
  }

  // Step 11: Create Session Notes
  console.log("\n📝 Setting up session notes...");
  const existingNotes = await db.select().from(SessionNoteTable);

  if (existingNotes.length === 0) {
    console.log("  Creating 30 session notes...");
    const today = new Date();
    const enrollments = await db.select().from(EnrollmentTable);
    const noteData = [];

    for (let i = 0; i < 30; i++) {
      const student = students[i % students.length]!;
      const enrollment = enrollments.find((e) => e.student_id === student.id);
      if (!enrollment) continue;

      const daysAgo = randomInt(1, 45);
      const sessionDate = new Date(today);
      sessionDate.setDate(sessionDate.getDate() - daysAgo);

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
    console.log(`  ✓ Created ${noteData.length} session notes`);
  } else {
    console.log(`  ✓ Using ${existingNotes.length} existing notes`);
  }

  // Step 12: Create Assessments
  console.log("\n📊 Setting up assessments...");
  const existingAssessments = await db.select().from(AssessmentTable);

  if (existingAssessments.length === 0) {
    console.log("  Creating 20 assessments...");
    const cycleStart = new Date();
    cycleStart.setDate(cycleStart.getDate() - (cycleStart.getDay() || 7) + 1);

    const assessmentData = [];
    for (let i = 0; i < 20; i++) {
      const student = students[i % students.length]!;
      assessmentData.push({
        id: randomUUID(),
        student_id: student.id,
        teacher_id: teacherProfile!.id,
        cycle_start_date: formatDate(cycleStart),
        assessment_type: i < 10 ? ("pre" as const) : ("post" as const),
        teaching_focus: generateAssessmentFocus(),
        score: randomInt(8, 18),
        notes: randomElement([
          "Baseline assessment for new cycle",
          "Good progress from previous cycle",
          "Showing consistent improvement",
          null,
        ]),
      });
    }
    await db.insert(AssessmentTable).values(assessmentData);
    console.log(`  ✓ Created ${assessmentData.length} assessments`);
  } else {
    console.log(`  ✓ Using ${existingAssessments.length} existing assessments`);
  }

  // Step 13: Create Bulletins
  console.log("\n📢 Setting up bulletins...");
  const existingBulletins = await db.select().from(BulletinTable);

  if (existingBulletins.length === 0) {
    console.log("  Creating 10 bulletins...");
    const bulletinData = BULLETIN_DATA.map((b, i) => ({
      id: randomUUID(),
      site_id: i % 3 === 0 ? locations[i % locations.length]!.id : null,
      scope: i % 3 === 0 ? ("site" as const) : ("global" as const),
      role_target: randomElement(["all", "teacher", "parent"] as const),
      title: b.title,
      body: b.body,
      created_by: adminUser.id,
    }));
    await db.insert(BulletinTable).values(bulletinData);
    console.log(`  ✓ Created ${bulletinData.length} bulletins`);
  } else {
    console.log(`  ✓ Using ${existingBulletins.length} existing bulletins`);
  }

  // Step 14: Create Makeup Requests
  console.log("\n📋 Setting up makeup requests...");
  const existingMakeupRequests = await db.select().from(MakeupRequestTable);

  if (existingMakeupRequests.length === 0) {
    console.log("  Creating 5 makeup requests...");
    const today = new Date();
    const enrollments = await db.select().from(EnrollmentTable);
    const requestStatuses = ["pending", "approved", "denied", "completed"] as const;
    const absenceReasons = ["sick", "family_emergency", "transportation"] as const;

    // Get students linked to parent
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

      const daysAgo = randomInt(5, 20);
      const sessionDate = new Date(today);
      sessionDate.setDate(sessionDate.getDate() - daysAgo);

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
    console.log(`  ✓ Created ${makeupData.length} makeup requests`);
  } else {
    console.log(`  ✓ Using ${existingMakeupRequests.length} existing requests`);
  }

  // Step 15: Create Schedule Change Requests
  console.log("\n🔄 Setting up schedule change requests...");
  const existingScheduleChangeRequests = await db.select().from(ScheduleChangeRequestTable);

  if (existingScheduleChangeRequests.length === 0 && schedules.length >= 2) {
    console.log("  Creating 3 schedule change requests...");
    const enrollments = await db.select().from(EnrollmentTable);
    const requestStatuses = ["pending", "approved", "denied"] as const;
    const changeReasons = [
      "New work schedule",
      "Transportation issues",
      "Prefer different time slot",
    ];

    // Get students linked to parent
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

      // Find a different schedule
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
    console.log(`  ✓ Created ${changeData.length} schedule change requests`);
  } else {
    console.log(`  ✓ Using ${existingScheduleChangeRequests.length} existing requests`);
  }

  // ==================== SUMMARY ====================
  console.log("\n" + "=".repeat(50));
  console.log("✅ Production demo seed completed successfully!");
  console.log("=".repeat(50));
  console.log("\n📊 Summary:");
  console.log(`  - Locations: ${(await db.select().from(LocationTable)).length}`);
  console.log(`  - Students: ${(await db.select().from(StudentTable)).length}`);
  console.log(`  - Schedules: ${(await db.select().from(ScheduleTable)).length}`);
  console.log(`  - Enrollments: ${(await db.select().from(EnrollmentTable)).length}`);
  console.log(`  - Teacher-Student Links: ${(await db.select().from(TeacherStudentTable)).length}`);
  console.log(
    `  - Parent-Student Links: ${(await db.select().from(ParentStudentLinkTable)).length}`,
  );
  console.log(`  - Attendance Records: ${(await db.select().from(AttendanceTable)).length}`);
  console.log(`  - Session Notes: ${(await db.select().from(SessionNoteTable)).length}`);
  console.log(`  - Assessments: ${(await db.select().from(AssessmentTable)).length}`);
  console.log(`  - Bulletins: ${(await db.select().from(BulletinTable)).length}`);
  console.log(`  - Makeup Requests: ${(await db.select().from(MakeupRequestTable)).length}`);
  console.log(
    `  - Schedule Change Requests: ${(await db.select().from(ScheduleChangeRequestTable)).length}`,
  );

  console.log("\n🔑 Real Users for Testing:");
  console.log(`  - Admin: ${TEST_USERS.ADMIN}`);
  console.log(`  - Teacher: ${TEST_USERS.TEACHER}`);
  console.log(`  - Parent: ${TEST_USERS.PARENT}`);

  process.exit(0);
}

seedDemo().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
