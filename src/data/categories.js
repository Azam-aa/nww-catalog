export const CATEGORIES = [
  {
    id: "almari",
    label: "Almari",
    icon: "cabinet",
    subCategories: [
      {
        id: "single-door",
        label: "Single Door",
        typeCode: "SD",
        weightTypes: ["LW", "MH", "H"]
      },
      {
        id: "double-door",
        label: "Double Door",
        typeCode: "DD",
        weightTypes: ["LW", "MH", "H"]
      },
      {
        id: "triple-door",
        label: "Triple Door",
        typeCode: "TD",
        weightTypes: ["LW", "MH", "H"]
      },
      {
        id: "office-almari",
        label: "Office Almari",
        typeCode: "OA",
        weightTypes: []
      },
      {
        id: "wall-doors",
        label: "Wall Doors",
        typeCode: "WD",
        weightTypes: []
      }
    ]
  },
  {
    id: "cots",
    label: "Cots",
    icon: "bed",
    subCategories: [
      { id: "up-down-cots", label: "Up & Down Cots", typeCode: "UDC", weightTypes: [] },
      { id: "sofa-diwan", label: "Sofa & Diwan Cot", typeCode: "SDC", weightTypes: [] },
      { id: "bail-patti", label: "Bail Patti Cots", typeCode: "BPC", weightTypes: [] },
      { id: "nawar-cots", label: "Nawar Cots", typeCode: "NC", weightTypes: [] },
      { id: "single-cots", label: "Single Cots", typeCode: "SC", weightTypes: ["RM", "H"] },
      { id: "double-cots", label: "Double Cots", typeCode: "DC", weightTypes: ["RM", "MH"] },
      { id: "cot-4.5x6.2", label: "4½ × 6.2 Cot", typeCode: "C1", weightTypes: ["H"] },
      { id: "cot-5x6.5", label: "5 × 6½ Cot", typeCode: "C2", weightTypes: ["H"] }
    ]
  },
  {
    id: "chairs",
    label: "Chairs",
    icon: "armchair",
    subCategories: [
      { id: "metal-chairs", label: "Metal Chairs", typeCode: "MC", weightTypes: [] },
      { id: "study-chairs", label: "Study Chairs", typeCode: "STC", weightTypes: [] },
      { id: "plastic-chairs", label: "Plastic Chairs", typeCode: "PC", weightTypes: [] }
    ]
  },
  {
    id: "others",
    label: "Others",
    icon: "grid",
    subCategories: [
      { id: "stools", label: "Stools", typeCode: "ST", weightTypes: [] },
      { id: "racks", label: "Racks", typeCode: "RK", weightTypes: [] },
      { id: "tables", label: "Tables", typeCode: "TB", weightTypes: [] },
      { id: "misc", label: "Miscellaneous", typeCode: "MS", weightTypes: [] }
    ]
  }
];
