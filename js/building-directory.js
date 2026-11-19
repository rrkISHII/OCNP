"use strict";

// ==========================================================
// Building directory
// The floor-by-floor room lists shown in a building's bottom sheet, and searched by the
// search bar. Keyed by building id (the id used in campus-geojson.js).
//
// Each building is a list of sections (usually floors). A section has one or more
// groups (e.g. Left Side / Middle / Right Side). Rooms are [number/code, name];
// either can be "".
// ==========================================================
const G = (rooms, label = null) => ({ label, rooms });
const BUILDING_DIRECTORY = {
  OC_ELO: [
    {
      label: "Floor 1",
      groups: [
        G([
          ["", "Security Department"],
          ["", "CHOW"],
        ]),
      ],
    },
    {
      label: "Floor 2",
      groups: [
        G([
          ["", "Cashier"],
          ["", "Accounting Office"],
          ["", "Board Room"],
          ["201", "Registrar's Office"],
          ["202", "Office of the Vice President"],
        ]),
      ],
    },
    {
      label: "Floor 3",
      groups: [
        G([
          ["307", "Faculty Room"],
          ["308", "Education Lab 2"],
          ["309", "Education Lab 1"],
        ]),
      ],
    },
    {
      label: "Floor 4",
      groups: [
        G([
          ["402", "Consultation Room"],
          ["402", "Business Administration Lab"],
          ["403", "Accountancy Lab"],
          ["404", "Customs Administration Lab"],
          ["409", "Faculty Room"],
        ]),
      ],
    },
    {
      label: "Floor 5",
      groups: [
        G([
          ["506", "Faculty Room"],
          ["509", "Faculty Room"],
          ["513", "Conference Room"],
        ]),
      ],
    },
    {
      label: "Floor 6",
      groups: [
        G([
          ["609", "IT Department"],
          ["610", "TESDA Laboratories"],
          ["612", "Computer Laboratory 1 (CL1)"],
          ["613", "Computer Laboratory 2 (CL2)"],
          ["614", "Computer Laboratory 3 (CL3)"],
        ]),
      ],
    },
    {
      label: "Floor 7",
      groups: [
        G([
          ["701", "Isolation Room"],
          ["702", "Pharmacy Central Supply"],
          ["707", "Conference Room"],
          ["710", "Emergency Room"],
        ]),
      ],
    },
    {
      label: "Floor 8",
      groups: [
        G([
          ["805", "Faculty Room"],
          ["807", "Library"],
          ["808", "Faculty Room"],
          ["809", "Defense Room"],
          ["810", "Quality Assurance Office"],
          ["811", "Office Records Room"],
        ]),
      ],
    },
    { label: "Floor 9", groups: [G([])] },
    { label: "Floor 10", groups: [G([["", "Gymnasium"]])] },
  ],
  OC_ADL: [
    {
      label: "4th Floor – Nursing",
      groups: [
        G([
          ["", "12 Commitment"],
          ["", "12 Compassion"],
          ["", "12 Cooperation"],
          ["", "X-ray Lab"],
          ["", "Ultrasound Lab / ADL 4"],
          ["", "Radiologic Technology Faculty / ADL 407"],
          ["ADL 408", "Nursing Arts Lab 3"],
          ["", "Nursing Arts Lab 3 – Lecture Room"],
          ["", "ADL 4 – Lecture Room"],
          ["", "Lab 5 – Lecture Room"],
          ["", "Lab 6"],
        ]),
      ],
    },
  ],
  OC_IBED: [
    {
      label: "Rooms",
      groups: [
        G([
          ["RLO 206", "Laboratory Office"],
          ["RLO 210", ""],
          ["RLO 209", ""],
          ["RLO 208", "Science Laboratory"],
          ["RLO 207", "Student Affairs and Service Office"],
          ["RLO 201", ""],
          ["RLO 202", ""],
          ["RLO 203", ""],
          ["RLO 204", "Grade Learning Resource Center / School Center"],
          ["RLO 205", ""],
          ["", "Comfort Room (CR)"],
        ]),
      ],
    },
  ],
  OC_CASA: [
    {
      label: "1st Floor",
      groups: [G([["AL 103", "Cookery NC II Assessment Center"]])],
    },
  ],
  OC_DPRO: [
    {
      label: "1st Floor",
      groups: [
        G([
          ["PRO 116", ""],
          ["PRO 117", ""],
          ["PRO 118", ""],
          ["PRO 119", ""],
          ["PRO 120", "DPRO SHS Faculty Room"],
          ["", "CR 1"],
          ["", "CR 2"],
        ]),
        G([
          ["SDL 115", ""],
          ["PRO 114", ""],
          ["PRO 113", ""],
          ["PRO 112", "Faculty Room"],
          ["PRO 110", ""],
          ["PRO 109", ""],
          ["PRO 108", ""],
        ]),
        G([
          ["PRO 101", ""],
          ["PRO 102", ""],
          ["PRO 103", ""],
          ["PRO 104", ""],
          ["PRO 105", ""],
          ["PRO 106", ""],
          ["PRO 107", ""],
        ]),
      ],
    },
    {
      label: "2nd Floor",
      groups: [
        G([
          ["PRO 201", ""],
          ["PRO 202", ""],
          ["PRO 203", ""],
          ["PRO 204", ""],
          ["", "CR"],
        ]),
        G([
          ["SDL 207", ""],
          ["PRO 206", ""],
          ["PRO 205", ""],
        ]),
        G(
          [
            ["", "Storage Room"],
            ["", "Multimedia Room"],
            ["", "Computer / Internet Section"],
            ["", "Discussion Room"],
            ["", "Filipiniana Section"],
            ["", "Intensive Reading Room"],
            ["", "Information and Acquisition Section"],
            ["", "Research Office"],
            ["", "General Reference and Serial Section"],
            ["", "Special Collection Section"],
          ],
          "Library",
        ),
      ],
    },
    {
      label: "3rd Floor",
      groups: [
        G([
          ["PRO 304", "Faculty Room"],
          ["PRO 303", ""],
          ["PRO 302", ""],
          ["PRO 301", ""],
          ["", "CR"],
        ]),
        G([
          ["PRO 305", ""],
          ["PRO 306", ""],
          ["PRO 307", ""],
          ["PRO 308", "Faculty Room"],
        ]),
        G([
          ["PRO 309", ""],
          ["PRO 310", ""],
          ["PRO 311", ""],
          ["PRO 312", ""],
          ["PRO 313", ""],
        ]),
        G(
          [
            ["", "Computer Laboratory 1 (COMLAB 1)"],
            ["", "Computer Laboratory 2 (COMLAB 2)"],
            ["", "Computer Laboratory 3 (COMLAB 3)"],
            ["", "IT Department"],
            ["", "Reserve and Newly Acquired Section"],
            ["", "General Collection and Fiction Section"],
            ["", "CR"],
          ],
          "Library",
        ),
      ],
    },
  ],
  OC_CRIMINOLOGY: [
    { label: "1st Floor", groups: [G([["", "Entrance"]])] },
    {
      label: "2nd Floor",
      groups: [
        G([
          ["PO 203", ""],
          ["", "Male CR"],
          ["", "Photo Laboratory"],
          ["PO 201", ""],
          ["PO 202", "Interrogation Room"],
        ]),
      ],
    },
    {
      label: "3rd Floor",
      groups: [
        G([
          ["PO 303", "Office of the Program Chair"],
          ["", "Female CR"],
          ["PO 302", "Faculty Room"],
          ["PO 301", ""],
          ["", "Exit"],
        ]),
      ],
    },
    {
      label: "4th Floor",
      groups: [
        G([
          ["PO 401", "Crime Laboratory"],
          ["", "General Laboratory"],
          ["", "Bullet Recovery Room"],
          ["PO 2", "Armory"],
          ["", "Faculty Male CR"],
          ["", "Faculty Female CR"],
        ]),
      ],
    },
  ],
};

// Title fallbacks, in case a building has no id in the geojson.
const DIRECTORY_TITLE_TO_ID = {
  ELO: "OC_ELO",
  ADL: "OC_ADL",
  IBED: "OC_IBED",
  CASA: "OC_CASA",
  DPRO: "OC_DPRO",
  CRIMINOLOGY: "OC_CRIMINOLOGY",
};
