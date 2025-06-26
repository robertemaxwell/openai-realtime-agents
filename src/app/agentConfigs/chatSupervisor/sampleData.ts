export const exampleAccountInfo = {
  accountId: "CC-123456",
  name: "Alex Johnson",
  phone: "+1-206-135-1246",
  email: "alex.johnson@email.com",
  membershipType: "Premium Navigator",
  status: "Active",
  joinDate: "2024-05-15",
  lastLoginDate: "2024-05-20",
  address: {
    street: "1234 Pine St",
    city: "Seattle",
    state: "WA",
    zip: "98101"
  },
  medicalProfile: {
    conditions: ["Type 2 Diabetes", "Hypertension"],
    currentTrials: 2,
    completedTrials: 1,
    interestedIn: ["Cardiovascular", "Endocrinology"],
    notes: "Looking for trials in Seattle area, prefers virtual visits when possible."
  }
};

export const examplePolicyDocs = [
  {
    id: "CC-010",
    name: "Trial Matching Algorithm Policy",
    topic: "trial matching and algorithm",
    content:
      "ClinConnect's proprietary matching algorithm considers patient medical history, location preferences, trial inclusion/exclusion criteria, and patient-reported outcomes. The system prioritizes trials within 50 miles of the patient's location unless they specifically request broader geographic options. All matches undergo clinical review before presentation to patients.",
  },
  {
    id: "CC-020",
    name: "Privacy and HIPAA Compliance Policy",
    topic: "privacy and HIPAA compliance",
    content:
      "ClinConnect maintains strict HIPAA compliance for all patient data. Medical information is encrypted at rest and in transit, with access limited to authorized clinical staff. Patient consent is required before sharing any information with trial sponsors. Patients retain full control over their data and can request deletion at any time. All clinical trial communications are conducted through secure, encrypted channels.",
  },
  {
    id: "CC-030",
    name: "Navigator Support Services Policy",
    topic: "navigator support and concierge services",
    content:
      "ClinConnect provides free navigator support to all patients enrolled in our platform. Services include trial matching, enrollment assistance, appointment coordination, transportation support, and ongoing clinical trial education. Premium Navigator members receive priority scheduling and dedicated support representatives.",
  },
  {
    id: "CC-040",
    name: "Partner Clinic Network Policy",
    topic: "partner clinics and research centers",
    content:
      "ClinConnect partners with over 2,500 research centers and clinics nationwide. Partner sites undergo rigorous vetting for research quality, patient safety protocols, and ethical standards. All partner clinics maintain current FDA and IRB approvals. Patients can access trials at any partner location, with travel assistance available for qualifying studies.",
  },
];

export const exampleStoreLocations = [
  // NorCal Partner Clinics
  {
    name: "ClinConnect Partner - UCSF Clinical Research Center",
    address: "1001 Potrero Ave, San Francisco, CA",
    zip_code: "94110",
    phone: "(415) 555-1001",
    hours: "Mon-Fri 8am-5pm",
    specialties: ["Oncology", "Neurology", "Cardiology"]
  },
  {
    name: "ClinConnect Partner - Stanford Medicine Research",
    address: "300 Pasteur Dr, Stanford, CA",
    zip_code: "94305",
    phone: "(650) 555-2002",
    hours: "Mon-Fri 7am-6pm",
    specialties: ["Immunology", "Dermatology", "Psychiatry"]
  },
  {
    name: "ClinConnect Partner - UC Davis Clinical Trials",
    address: "2315 Stockton Blvd, Sacramento, CA",
    zip_code: "95817",
    phone: "(916) 555-3003",
    hours: "Mon-Fri 8am-4pm",
    specialties: ["Endocrinology", "Gastroenterology"]
  },
  // SoCal Partner Clinics
  {
    name: "ClinConnect Partner - Cedars-Sinai Research",
    address: "8700 Beverly Blvd, Los Angeles, CA",
    zip_code: "90048",
    phone: "(310) 555-4004",
    hours: "Mon-Fri 7am-7pm",
    specialties: ["Oncology", "Cardiology", "Neurology"]
  },
  {
    name: "ClinConnect Partner - UC San Diego Clinical Research",
    address: "9500 Gilman Dr, La Jolla, CA",
    zip_code: "92093",
    phone: "(858) 555-5005",
    hours: "Mon-Fri 8am-5pm",
    specialties: ["Rheumatology", "Infectious Disease"]
  },
  {
    name: "ClinConnect Partner - USC Research Center",
    address: "1975 Zonal Ave, Los Angeles, CA",
    zip_code: "90089",
    phone: "(323) 555-6006",
    hours: "Mon-Fri 8am-6pm",
    specialties: ["Pediatrics", "Ophthalmology"]
  },
  // East Coast Partner Clinics
  {
    name: "ClinConnect Partner - NYU Langone Clinical Trials",
    address: "550 1st Ave, New York, NY",
    zip_code: "10016",
    phone: "(212) 555-7007",
    hours: "Mon-Fri 7am-8pm",
    specialties: ["Oncology", "Neurology", "Cardiology"]
  },
  {
    name: "ClinConnect Partner - Mass General Research",
    address: "55 Fruit St, Boston, MA",
    zip_code: "02114",
    phone: "(617) 555-8008",
    hours: "Mon-Fri 8am-6pm",
    specialties: ["Immunology", "Gastroenterology"]
  },
  {
    name: "ClinConnect Partner - Georgetown University Medical",
    address: "3800 Reservoir Rd NW, Washington, DC",
    zip_code: "20007",
    phone: "(202) 555-9009",
    hours: "Mon-Fri 8am-5pm",
    specialties: ["Endocrinology", "Nephrology"]
  },
  {
    name: "ClinConnect Partner - University of Miami Research",
    address: "1611 NW 12th Ave, Miami, FL",
    zip_code: "33136",
    phone: "(305) 555-1010",
    hours: "Mon-Fri 8am-6pm",
    specialties: ["Dermatology", "Psychiatry"]
  }
];