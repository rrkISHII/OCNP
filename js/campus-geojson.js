"use strict";

// ==========================================================
// Campus map data (GeoJSON)
// One FeatureCollection with everything drawn on the main map.
// Coordinates are [longitude, latitude].
//
// Each feature's `properties` says what it is:
//   perimeter - the campus boundary line (the area outside it is shaded).
//   walkway   - a walkable path. These lines become the network used for routes.
//   NAME: "OC_ID" (e.g. ELO: "OC_ELO") - a building or area. Its `entrances` list the
//               doors as { name, coords }; `description` and `imageUrls` fill the
//               bottom sheet. The same building can use name + id instead.
//   A shape with no name is drawn as plain grey ground.
//
// To add a building: add a Polygon feature here, then (optionally) list its
// rooms in building-directory.js.
// ==========================================================
const geojsonData = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.996124, 14.478541],
          [120.9958346, 14.4779401],
          [120.995645, 14.478038],
          [120.995598, 14.477931],
          [120.9957961, 14.4778554],
          [120.9957489, 14.4777316],
          [120.9950571, 14.4779912],
          [120.9950541, 14.4781594],
          [120.9952108, 14.4784906],
          [120.9954432, 14.478999],
          [120.9956916, 14.4795828],
          [120.996016, 14.4800601],
          [120.9967999, 14.4797939],
          [120.99776, 14.47923],
          [120.997333, 14.478282],
          [120.996812, 14.478525],
          [120.996676, 14.478282],
          [120.996124, 14.478541],
        ],
      },
      properties: {
        perimeter: "oc_perimeter",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [120.997023, 14.478803],
            [120.996963, 14.478683],
            [120.996901, 14.478564],
            [120.997067, 14.478487],
            [120.997188, 14.478728],
            [120.997023, 14.478803],
          ],
        ],
      },
      properties: {
        "EYE CENTER": "OGH_EYE_CENTER",
        description:
          "The Medical Arts Building is a facility associated with healthcare-related education and services. It provides spaces that support medical learning, training, and professional activities. The building contributes to the development of students pursuing healthcare-related fields.",
        imageUrls: ["images/Eye_Center1.jpg", "images/Eye_Center2.jpg"],
        entrances: [
          {
            name: "entrance1",
            coords: [120.997083, 14.478776],
          },
        ],
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [120.996933, 14.479621],
            [120.996789, 14.479335],
            [120.996925, 14.479268],
            [120.997088, 14.479194],
            [120.99723, 14.479479],
            [120.996933, 14.479621],
          ],
        ],
      },
      properties: {
        TENNIS_COURT: "OC_TENNIS",
        description:
          "The Tennis Court is a place for tennis practice, training, and recreational games. Beside it is a Cafeteria connected to the SDL Building, where students, tennis players, and visitors watching tennis matches can buy food and drinks. Both facilities provide a space for sports, dining, and relaxation.",
        imageUrls: [
          "images/TENNIS1.jpg",
          "images/TENNIS2.jpg",
          "images/TENNIS3.jpg",
        ],
        entrances: [
          {
            name: "entrance1",
            coords: [120.996943, 14.479616],
          },
          {
            name: "entrance2",
            coords: [120.9972441, 14.4793578],
          },
        ],
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [120.996814, 14.479676],
            [120.996673, 14.479396],
            [120.996789, 14.479336],
            [120.996933, 14.479621],
            [120.996814, 14.479676],
          ],
        ],
      },
      properties: {
        SDL: "OC_SDL",
        description:
          "The SDL is an academic building that provides classrooms and learning spaces for Nursing students. It also houses a library where students can study and access educational resources. A bookstore is located within the building, where students can purchase school supplies and other learning materials.",
        imageUrls: ["images/SDL1.jpg", "images/SDL2.jpg"],
        entrances: [
          {
            name: "entrance1",
            coords: [120.996746, 14.479541],
          },
          {
            name: "entrance2",
            coords: [120.9968036, 14.4796553],
          },
        ],
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [120.996551, 14.479665],
            [120.996719, 14.479578],
            [120.996778, 14.479693],
            [120.996607, 14.479775],
            [120.996551, 14.479665],
          ],
        ],
      },
      properties: {
        BOOKSTORE: "OC_BOOKSTORE",
        description:
          "The Bookstore is a campus facility where students can purchase school supplies, textbooks, and other educational materials. It also offers school uniforms for students from different courses and departments. This facility provides students with easy access to the essential items they need for their academic activities.",
        imageUrls: ["images/BOOKSTORE.jpg"],
        entrances: [
          {
            name: "entrance1",
            coords: [120.996569, 14.479701],
          },
        ],
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [120.996528, 14.479618],
            [120.996471, 14.479502],
            [120.996637, 14.479415],
            [120.996695, 14.479534],
            [120.996617, 14.479573],
            [120.996528, 14.479618],
          ],
        ],
      },
      properties: {
        CLINIC: "OC_CLINIC",
        description:
          "The Clinic is a healthcare facility that provides basic medical assistance to students, faculty, and staff. It serves as a place for first aid, health consultations, and minor medical concerns. The clinic helps promote health and safety within the campus.",
        imageUrls: ["images/CLINIC_.jpg"],
        entrances: [
          {
            name: "entrance1",
            coords: [120.996495, 14.479549],
          },
        ],
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [120.996471, 14.479502],
            [120.996431, 14.479424],
            [120.996634, 14.47921],
            [120.996621, 14.479185],
            [120.996765, 14.479117],
            [120.996808, 14.479206],
            [120.996854, 14.479301],
            [120.996471, 14.479502],
          ],
        ],
      },
      properties: {
        "OLI'S DEN": "OC_CAFETERIA",
        description:
          "Oli's Den is a cafeteria where students can purchase food, snacks, and beverages. It serves as a dining area for students from different departments and grade levels. Students can enjoy their meals and spend time with friends during breaks.",
        imageUrls: [
          "images/OLI_S DEN1.jpg",
          "images/OLI_S DEN2.jpg",
          "images/OLI_S DEN3.jpg",
        ],
        entrances: [
          {
            name: "entrance1",
            coords: [120.996454, 14.479466],
          },
          {
            name: "entrance2",
            coords: [120.996569, 14.479279],
          },
        ],
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [120.996855, 14.479301],
            [120.996793, 14.479174],
            [120.996861, 14.479142],
            [120.996924, 14.479268],
            [120.996855, 14.479301],
          ],
        ],
      },
      properties: {
        CAFÉ: "OC_CAFÉ",
        description:
          "The Cafe is located beside Oli's Den, providing a convenient place for students, faculty, and staff to purchase drinks and light snacks. It offers a comfortable environment where students can relax during breaks between classes. Students can also spend their free time here while socializing with friends.",
        imageUrls: [
          "images/CAFE1.jpg",
          "images/CAFE2.jpg",
          "images/CAFE3.jpg",
        ],
        entrances: [
          {
            name: "entrance1",
            coords: [120.996832, 14.479156],
          },
        ],
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [120.996924, 14.479269],
            [120.996861, 14.479142],
            [120.99709, 14.479034],
            [120.997029, 14.47891],
            [120.997153, 14.478851],
            [120.997357, 14.479256],
            [120.997233, 14.479317],
            [120.997154, 14.479163],
            [120.996924, 14.479269],
          ],
        ],
      },
      properties: {
        "OLIVAREZ GENERAL HOSPITAL": "OGH_MAIN",
        description:
          "Olivarez General Hospital is a healthcare institution that provides medical services to patients and the community. It offers facilities for medical consultations, treatment, and other healthcare needs. The hospital also supports healthcare-related learning and clinical experiences.",
        imageUrls: [
          "images/OGH1.jpg",
          "images/OGH2.jpg",
          "images/OGH3.jpg",
        ],
        entrances: [
          {
            name: "entrance1",
            coords: [120.99725, 14.479045],
          },
        ],
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [120.997589, 14.479244],
            [120.997507, 14.479067],
            [120.997607, 14.479023],
            [120.997687, 14.479199],
            [120.997589, 14.479244],
          ],
        ],
      },
      properties: {
        CRIMINOLOGY: "OC_CRIMINOLOGY",
        description:
          "The Criminology Building is an academic facility for students taking the Criminology program. It provides learning spaces for discussions, training, and activities related to criminal justice and law enforcement. Located beside the Criminology Building is the Marketing Office, which assists first-time enrollees by providing information about academic programs, admission requirements, and enrollment procedures.",
        imageUrls: [
          "images/CRIM1.jpg",
          "images/CRIM 2.jpg",
          "images/CRIM3.jpg",
        ],
        entrances: [
          {
            name: "entrance1",
            coords: [120.997546, 14.479151],
          },
        ],
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [120.996016, 14.480026],
            [120.995922, 14.479905],
            [120.995846, 14.479772],
            [120.996229, 14.479615],
            [120.996389, 14.479912],
            [120.996016, 14.480026],
          ],
        ],
      },
      properties: {
        PARKING: "OC_PARKING",
        description:
          "The Parking Area is a designated space for vehicles belonging to students, faculty, staff, and visitors. It provides an organized location for parking cars and motorcycles. This facility helps maintain proper vehicle arrangements within the campus.",
        imageUrls: [
          "images/PARKING1.jpg",
          "images/PARKING2.jpg",
          "images/PARKING3.jpg",
        ],
        entrances: [
          {
            name: "car_entrance",
            coords: [120.9959815, 14.4799264],
          },
          {
            name: "entrance1",
            coords: [120.996212, 14.479622],
          },
          {
            name: "entrance2",
            coords: [120.996388, 14.479911],
          },
        ],
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [120.995838, 14.479765],
            [120.995735, 14.479611],
            [120.99567, 14.479452],
            [120.996057, 14.479279],
            [120.996225, 14.479605],
            [120.995838, 14.479765],
          ],
        ],
      },
      properties: {
        name: "BOTANICAL",
        description:
          "The Botanical Area is an open space where students can practice dancing and other group performances. It is also used for basketball practice and recreational activities. This area provides students with a place to improve their skills, practice with friends, and prepare for school events.",
        imageUrls: ["images/BOTANICAL_.jpg"],
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [120.996408, 14.479887],
            [120.995975, 14.479038],
            [120.99605, 14.479002],
            [120.996166, 14.479227],
            [120.996279, 14.479453],
            [120.99637, 14.479412],
            [120.996424, 14.479519],
            [120.996478, 14.479622],
            [120.996382, 14.479667],
            [120.996478, 14.479853],
            [120.996408, 14.479887],
          ],
        ],
      },
      properties: {
        ADL: "OC_ADL",
        description:
          "The ADL is a campus building located near the Botanical Area and the pathway leading to other school buildings. It houses the Office of Student Affairs (OSA) and classrooms for Nursing students. The building provides spaces for student concerns, academic activities, and nursing education.",
        imageUrls: [
          "images/ADL1.jpg",
          "images/ADL2.jpg",
          "images/ADL3.jpg",
        ],
        entrances: [
          {
            name: "entrance1",
            coords: [120.995984, 14.479055],
          },
          {
            name: "entrance2",
            coords: [120.996408, 14.479487],
          },
          {
            name: "entrance3",
            coords: [120.996261, 14.479597],
          },
          {
            name: "entrance4",
            coords: [120.996059, 14.479023],
          },
        ],
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [120.995613, 14.479324],
            [120.995519, 14.479128],
            [120.995888, 14.478964],
            [120.99598, 14.479161],
            [120.995613, 14.479324],
          ],
          [
            [120.995683, 14.479207],
            [120.995866, 14.479127],
            [120.995839, 14.479071],
            [120.995656, 14.479151],
            [120.995683, 14.479207],
          ],
        ],
      },
      properties: {
        IBED: "OC_IBED",
        description:
          "The IBED is a learning area for kindergarten and elementary students. It provides classrooms and facilities that support basic education and early learning. This department helps students develop essential knowledge, skills, and good learning habits.",
        imageUrls: ["images/IBED1.jpg", "images/IBED2.jpg"],
        entrances: [
          {
            name: "entrance1",
            coords: [120.99594, 14.479076],
          },
        ],
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [120.996173, 14.479128],
            [120.996087, 14.47896],
            [120.9969, 14.478591],
            [120.996984, 14.478752],
            [120.996173, 14.479128],
          ],
        ],
      },
      properties: {
        ELO: "OC_ELO",
        description:
          "The ELO Building is a multi-story academic and administrative facility at Olivarez College. It contains classrooms, computer laboratories, faculty offices, the Registrar's Office, a library, and other student services. The building supports daily academic activities and provides essential facilities for students and faculty members.",
        imageUrls: ["images/ELO1.jpg", "images/ELO2.jpg"],
        entrances: [
          {
            name: "entrance1",
            coords: [120.996643, 14.478807],
          },
          {
            name: "entrance2",
            coords: [120.996252, 14.478928],
          },
        ],
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [120.996228, 14.478802],
            [120.996124, 14.478594],
            [120.996641, 14.478356],
            [120.996746, 14.478566],
            [120.996228, 14.478802],
          ],
        ],
      },
      properties: {
        GYMNASIUM: "OC_GYMNASIUM",
        description:
          "The Gymnasium is an indoor facility used for physical education, sports activities, and school events. It provides a spacious area for students to participate in exercises, competitions, and group activities. The facility promotes physical fitness, teamwork, and active student participation.",
        imageUrls: ["images/GYMNASIUM1.jpg", "images/GYMNASIUM2.jpg"],
        entrances: [
          {
            name: "entrance1",
            coords: [120.996649, 14.47861],
          },
          {
            name: "entrance2",
            coords: [120.99631, 14.478764],
          },
        ],
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [120.995764, 14.478635],
            [120.995903, 14.478569],
            [120.995955, 14.478678],
            [120.996013, 14.478801],
            [120.995874, 14.478866],
            [120.99582, 14.478753],
            [120.995764, 14.478635],
          ],
        ],
      },
      properties: {
        KITCHEN: "OC_KITCHEN",
        description:
          "The Kitchen Area is located beside the CASA and is used by Hospitality Management (HM) students for culinary training. It provides a space where students can practice cooking, food preparation, and proper kitchen procedures. This facility helps students improve their culinary skills and gain practical experience in food service and kitchen operations.",
        imageUrls: ["images/CASA1.jpg", "images/CASA2.jpg"],
        entrances: [
          {
            name: "entrance1",
            coords: [120.995899, 14.478854],
          },
          {
            name: "entrance2",
            coords: [120.99585, 14.478815],
          },
        ],
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [120.995903, 14.478569],
            [120.99604, 14.478503],
            [120.996153, 14.478734],
            [120.996013, 14.478801],
            [120.995903, 14.478569],
          ],
        ],
      },
      properties: {
        CASA: "OC_CASA",
        description:
          "The CASA is a learning facility designed for Hospitality Management (HM) and Tourism students. It provides spaces for practical training, demonstrations, and activities related to hospitality and tourism. This facility helps students develop professional skills and gain hands-on experience for their future careers.",
        imageUrls: ["images/CASA1.jpg", "images/CASA2.jpg"],
        entrances: [
          {
            name: "entrance1",
            coords: [120.996111, 14.478753],
          },
        ],
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [120.995418, 14.477976],
            [120.995383, 14.477882],
            [120.995732, 14.477753],
            [120.995768, 14.477844],
            [120.995418, 14.477976],
          ],
        ],
      },
      properties: {
        RESORT: "OC_RESORT",
        description:
          "The Resort is a peaceful area where students can relax and enjoy their free time. It is also a place where students can work on school projects and complete group activities. The area provides a comfortable environment for both relaxation and academic tasks.",
        imageUrls: [
          "images/RESORT1.jpg",
          "images/RESORT2.jpg",
          "images/RESORT3.jpg",
        ],
        entrances: [
          {
            name: "entrance1",
            coords: [120.995426, 14.477973],
          },
          {
            name: "entrance2",
            coords: [120.995558, 14.477923],
          },
        ],
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [120.995503, 14.47903],
            [120.995257, 14.478533],
            [120.9956, 14.478372],
            [120.995846, 14.478872],
            [120.995503, 14.47903],
          ],
        ],
      },
      properties: {
        COLISEUM: "OC_COLISEUM",
        description:
          "The Coliseum is a large facility used for school events, sports activities, and gatherings. It provides space for competitions, performances, and other institutional programs. Students and faculty can gather here for various school activities.",
        imageUrls: [
          "images/COLI.jpg",
          "images/COLI(1).jpg",
          "images/COLI_.jpg",
        ],
        entrances: [
          {
            name: "entrance1",
            coords: [120.995615, 14.478403],
          },
          {
            name: "entrance2",
            coords: [120.995834, 14.478848],
          },
          {
            name: "entrance3",
            coords: [120.9956791, 14.4789423],
          },
          {
            name: "entrance4",
            coords: [120.9957774, 14.4787327],
          },
          {
            name: "entrance5",
            coords: [120.99565, 14.4784735],
          },
        ],
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [120.995257, 14.478533],
            [120.995222, 14.478459],
            [120.995566, 14.478301],
            [120.9956, 14.478372],
            [120.995257, 14.478533],
          ],
        ],
      },
      properties: {
        "VISUAL ARTS": "OC_VISUAL_ARTS",
        description:
          "The Performing Arts Section is a space for students to practice dancing, acting, and other creative performances. It supports school presentations, rehearsals, and artistic activities. This area helps students develop their talents, creativity, and confidence.",
        imageUrls: ["images/VISUAL ARTS.jpg"],
        entrances: [
          {
            name: "entrance1",
            coords: [120.995583, 14.478337],
          },
        ],
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [120.995222, 14.478459],
            [120.995075, 14.47816],
            [120.99542, 14.478002],
            [120.995566, 14.478301],
            [120.995222, 14.478459],
          ],
        ],
      },
      properties: {
        POOL_AREA: "OC_POOL_AREA",
        description:
          "The Pool Area is a facility used for swimming lessons and physical education activities. Students can practice swimming techniques and develop their water safety skills. It provides a suitable environment for swimming practice, training, and recreational activities.",
        imageUrls: [
          "images/POOL AREA1.jpg",
          "images/POOL AREA2.jpg",
          "images/POOL AREA3.jpg",
        ],
        entrances: [
          {
            name: "entrance1",
            coords: [120.995431, 14.478025],
          },
        ],
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [120.995764, 14.478635],
            [120.995522, 14.478124],
            [120.995785, 14.477984],
            [120.99604, 14.478504],
            [120.995764, 14.478635],
          ],
        ],
      },
      properties: {
        DPRO: "OC_DPRO",
        description:
          "The DPRO is an educational building that serves high school students at Olivarez College. It offers classrooms and facilities for daily lessons and school activities. The building also includes computer laboratories for Information Technology (IT) students and libraries that provide spaces for studying, researching, and learning.",
        imageUrls: ["images/DPRO1.jpg", "images/DPRO2.jpg"],
        entrances: [
          {
            name: "entrance1",
            coords: [120.995752, 14.47861],
          },
          {
            name: "entrance2",
            coords: [120.995647, 14.478387],
          },
          {
            name: "entrance3",
            coords: [120.995625, 14.47807],
          },
          {
            name: "entrance4",
            coords: [120.995531, 14.478144],
          },
        ],
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.9958979, 14.4789487],
          [120.9958462, 14.4788419],
          [120.9958365, 14.4788218],
          [120.9957905, 14.4787267],
          [120.9957374, 14.4786168],
          [120.9956648, 14.4784667],
          [120.9956301, 14.478395],
          [120.9955987, 14.4783301],
          [120.9955125, 14.4781518],
          [120.9954472, 14.4780169],
          [120.9954302, 14.4779817],
          [120.995426, 14.477973],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "walkway",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.995431, 14.478025],
          [120.9954472, 14.4780169],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "pool_area_entrance1",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.995583, 14.478337],
          [120.9955987, 14.4783301],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "visual_arts_entrance1",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.996182, 14.478906],
          [120.996111, 14.478753],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "casa_entrance1",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.9959348, 14.4789327],
          [120.995899, 14.478854],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "food_and_beverage_entrance1",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.9967514, 14.4789868],
          [120.996643, 14.478807],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "elo_entrance1",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.996832, 14.479156],
          [120.9967514, 14.4789868],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "caf_entrance1",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.9975062, 14.4791709],
          [120.997546, 14.479151],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "criminology_entrance1",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.997149, 14.478798],
          [120.997163, 14.478802],
          [120.997181, 14.478809],
          [120.997187, 14.478814],
          [120.997234, 14.4789],
          [120.997274, 14.478975],
          [120.9972988, 14.4790211],
          [120.997317, 14.479055],
          [120.9974, 14.479207],
          [120.997403, 14.479208],
          [120.997499, 14.479157],
          [120.9975062, 14.4791709],
          [120.9975342, 14.4792249],
          [120.997554, 14.479263],
          [120.997565, 14.479311],
          [120.997582, 14.479334],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "walkway",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.997149, 14.478798],
          [120.997105, 14.4788189],
          [120.9967514, 14.4789868],
          [120.9967478, 14.4789885],
          [120.996475, 14.479118],
          [120.996443, 14.479074],
          [120.996425, 14.479075],
          [120.99639, 14.479072],
          [120.996333, 14.479054],
          [120.996292, 14.479006],
          [120.996273, 14.478982],
          [120.996251, 14.478958],
          [120.996233, 14.47894],
          [120.996211, 14.478924],
          [120.996182, 14.478906],
          [120.996166, 14.478896],
          [120.996136, 14.478877],
          [120.99613, 14.478875],
          [120.996123, 14.478874],
          [120.996108, 14.478873],
          [120.996093, 14.478871],
          [120.996084, 14.478869],
          [120.996082, 14.478869],
          [120.996079, 14.478869],
          [120.996077, 14.47887],
          [120.996074, 14.478871],
          [120.995941, 14.47893],
          [120.9959348, 14.4789327],
          [120.9958979, 14.4789487],
          [120.9957176, 14.4790267],
          [120.995499, 14.4791274],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "walkway",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.9957374, 14.4786168],
          [120.995752, 14.47861],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "dpro_entrance1",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.995615, 14.478403],
          [120.99563, 14.478395],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "coliseum_entrance1",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.99563, 14.478395],
          [120.995647, 14.478387],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "dpro_entrance2",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.995834, 14.478848],
          [120.9958462, 14.4788419],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "coliseum_entrance2",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.99624, 14.479605],
          [120.996209, 14.479618],
          [120.996212, 14.479622],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "parking_entrance1",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.996398, 14.479908],
          [120.996426, 14.479896],
          [120.996464, 14.479878],
          [120.996532, 14.479842],
          [120.9965902, 14.4798073],
          [120.996594, 14.479805],
          [120.996655, 14.479776],
          [120.996767, 14.479724],
          [120.9968115, 14.479703],
          [120.9969537, 14.4796355],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "walkway",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.99596, 14.479067],
          [120.995984, 14.479055],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "adl_entrance1",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.996182, 14.478962],
          [120.996233, 14.47894],
          [120.996252, 14.478928],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "elo_entrance2",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.9965902, 14.4798073],
          [120.9965445, 14.4797128],
          [120.9965177, 14.4796572],
          [120.9964706, 14.4795597],
          [120.9964307, 14.4794771],
          [120.9963761, 14.479364],
          [120.9962174, 14.4790368],
          [120.99612, 14.4790795],
          [120.9960254, 14.4788925],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "walkway",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.996398, 14.479908],
          [120.99624, 14.479605],
          [120.996092, 14.479321],
          [120.9959596, 14.4790672],
          [120.9958979, 14.4789487],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "walkway",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.9965177, 14.4796572],
          [120.996732, 14.479548],
          [120.9967903, 14.4796617],
          [120.9968115, 14.479703],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "walkway",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.99725, 14.479045],
          [120.9972988, 14.4790211],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "olivarez_general_hospital_entrance1",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.997105, 14.4788189],
          [120.997083, 14.478776],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "eye_center_entrance1",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.995625, 14.47807],
          [120.995558, 14.477923],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "dpro_resort_walkway",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.9955125, 14.4781518],
          [120.995531, 14.478144],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "dpro_entrance4",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.996182, 14.478906],
          [120.996191, 14.478872],
          [120.996201, 14.478856],
          [120.996215, 14.478846],
          [120.996283, 14.47881],
          [120.9963243, 14.4787915],
          [120.996571, 14.4786811],
          [120.996665, 14.478639],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "walkway",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.996431, 14.479477],
          [120.996454, 14.479466],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "oli_s_den_entrance1",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.996431, 14.479477],
          [120.996408, 14.479487],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "adl_entrance2",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.99624, 14.479605],
          [120.996261, 14.479597],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "adl_entrance3",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.996398, 14.479908],
          [120.996388, 14.479911],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "parking_entrance2",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.9964706, 14.4795597],
          [120.996495, 14.479549],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "clinic_entrance1",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.9967478, 14.4789885],
          [120.9965099, 14.4792288],
          [120.9963761, 14.479364],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "walkway",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.9965099, 14.4792288],
          [120.996569, 14.479279],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "oli_s_den_entrance2",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.9965445, 14.4797128],
          [120.996569, 14.479701],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "bookstore_entrance1",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.996182, 14.478962],
          [120.996059, 14.479023],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "adl_entrance4",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.99596, 14.479067],
          [120.99594, 14.479076],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "ibed_entrance1",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.996665, 14.478639],
          [120.996649, 14.47861],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "gymnasium_entrance1",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.9963243, 14.4787915],
          [120.99631, 14.478764],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "gymnasium_entrance2",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.996571, 14.4786811],
          [120.9966348, 14.4787926],
          [120.996643, 14.478807],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "walkway",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.9966348, 14.4787926],
          [120.996274, 14.478956],
          [120.996259, 14.478924],
          [120.996252, 14.478928],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "walkway",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.9958365, 14.4788218],
          [120.99585, 14.478815],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "food_and_beverage_entrance2",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.996081, 14.479326],
          [120.996092, 14.479321],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "unnamed_building_entrance",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.996732, 14.479548],
          [120.996746, 14.479541],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "sdl_entrance1",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.9969538, 14.4796357],
          [120.996943, 14.479616],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "tennis_court_entrance1",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.9956791, 14.4789423],
          [120.9957176, 14.4790267],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "auto_coliseum_entrance3",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.9957774, 14.4787327],
          [120.9957905, 14.4787267],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "auto_coliseum_entrance4",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.99565, 14.4784735],
          [120.9956648, 14.4784667],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "auto_coliseum_entrance5",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.9968036, 14.4796553],
          [120.9967903, 14.4796617],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "auto_sdl_entrance2",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [120.995558, 14.477923],
          [120.9954302, 14.4779817],
        ],
      },
      properties: {
        walkway: "walkway",
        label: "auto_bridge_resort_walkway",
      },
    },
    {
      type: "Feature",
      properties: {
        walkway: "walkway",
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [120.9960795, 14.4788691],
          [120.996201, 14.478856],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        walkway: "walkway",
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [120.996233, 14.4789401],
          [120.996201, 14.478856],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        walkway: "walkway",
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [120.9964733, 14.4791184],
          [120.9962962, 14.4791983],
        ],
      },
    },
    {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: [
          [120.9962944, 14.4791993],
          [120.9962944, 14.4791993],
        ],
      },
    },
    {
      type: "Feature",
      properties: {
        walkway: "walkway",
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [120.9962171, 14.4790371],
          [120.9962728, 14.4790117],
          [120.9962328, 14.4789395],
        ],
      },
    },
  ],
};
