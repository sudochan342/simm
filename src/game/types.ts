// SimCity 3000 Clone - Game Types

// Zone types (RCI system)
export type ZoneType = 'residential' | 'commercial' | 'industrial' | null;
export type ZoneDensity = 'light' | 'medium' | 'dense';

// Infrastructure types
export type InfrastructureType =
  | 'road'
  | 'highway'
  | 'rail'
  | 'power_line'
  | 'water_pipe';

// Building categories
export type BuildingCategory =
  | 'civic'
  | 'power'
  | 'water'
  | 'education'
  | 'health'
  | 'safety'
  | 'recreation'
  | 'transportation'
  | 'landmark';

// Terrain types
export type TerrainType = 'grass' | 'water' | 'trees' | 'dirt' | 'sand' | 'rock';

// Development levels for zones (0-8 like SC3000)
export type DevelopmentLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

// Zone demand (-100 to 100)
export interface RCIDemand {
  residential: number;
  commercial: number;
  industrial: number;
}

// A single tile on the map
export interface Tile {
  x: number;
  y: number;
  terrain: TerrainType;
  elevation: number; // 0-4 height levels
  zone: ZoneType;
  zoneDensity: ZoneDensity | null;
  development: DevelopmentLevel;
  building: PlacedBuilding | null;
  infrastructure: InfrastructureType | null;
  powered: boolean;
  watered: boolean;
  landValue: number; // 0-100
  pollution: number; // 0-100
  crime: number; // 0-100
  traffic: number; // 0-100
}

// Building definition
export interface BuildingDef {
  id: string;
  name: string;
  category: BuildingCategory;
  width: number;
  height: number;
  cost: number;
  maintenance: number;
  power: number; // negative = consumes, positive = produces
  water: number; // negative = consumes, positive = produces
  radius: number; // effect radius
  effects: {
    landValue?: number;
    pollution?: number;
    crime?: number;
    health?: number;
    education?: number;
    fire?: number;
    police?: number;
    happiness?: number;
  };
  unlockPopulation?: number;
}

// Placed building instance
export interface PlacedBuilding {
  id: string;
  defId: string;
  x: number;
  y: number;
  powered: boolean;
  watered: boolean;
  active: boolean;
}

// Zone building (developed from zones)
export interface ZoneBuilding {
  style: number; // 0-5 different visual styles
  level: DevelopmentLevel;
  population: number;
  jobs: number;
}

// City statistics
export interface CityStats {
  population: number;
  residentialPop: number;
  commercialPop: number;
  industrialPop: number;
  employment: number;
  unemployment: number;

  money: number;
  income: number;
  expenses: number;

  demand: RCIDemand;

  happiness: number;
  health: number;
  education: number;
  safety: number;
  traffic: number;
  pollution: number;
  landValue: number;

  power: number;
  powerDemand: number;
  water: number;
  waterDemand: number;

  crimeRate: number;
  fireRisk: number;
}

// Budget categories
export interface Budget {
  taxResidential: number; // 0-20%
  taxCommercial: number;
  taxIndustrial: number;
  fundingPolice: number; // 0-100%
  fundingFire: number;
  fundingHealth: number;
  fundingEducation: number;
  fundingTransportation: number;
}

// News/Events
export interface NewsItem {
  id: string;
  timestamp: number;
  type: 'info' | 'warning' | 'disaster' | 'achievement';
  title: string;
  message: string;
}

// Game state
export interface GameState {
  cityName: string;
  mayorName: string;
  tiles: Tile[][];
  width: number;
  height: number;
  stats: CityStats;
  budget: Budget;
  buildings: PlacedBuilding[];
  news: NewsItem[];
  year: number;
  month: number;
  day: number;
  speed: 0 | 1 | 2 | 3; // 0 = paused
  funds: number;
}

// Tool types
export type ToolType =
  | 'pointer'
  | 'bulldoze'
  | 'zone_r_light'
  | 'zone_r_medium'
  | 'zone_r_dense'
  | 'zone_c_light'
  | 'zone_c_medium'
  | 'zone_c_dense'
  | 'zone_i_light'
  | 'zone_i_medium'
  | 'zone_i_dense'
  | 'dezone'
  | 'road'
  | 'highway'
  | 'rail'
  | 'power_line'
  | 'water_pipe'
  | BuildingDef;

// SC3000 Color Palette (authentic colors)
export const SC3000_COLORS = {
  // UI Colors
  uiBackground: '#1a1a2e',
  uiPanel: '#16213e',
  uiBorder: '#0f3460',
  uiHighlight: '#e94560',
  uiText: '#eaeaea',
  uiTextDim: '#7f8c8d',

  // Zone colors
  zoneResidential: '#00aa00',
  zoneCommercial: '#0066cc',
  zoneIndustrial: '#cccc00',

  // Terrain colors
  terrainGrass: '#4a7c3f',
  terrainGrassLight: '#5a9c4f',
  terrainGrassDark: '#3a6c2f',
  terrainWater: '#2266aa',
  terrainWaterDeep: '#1a4a7a',
  terrainDirt: '#8b7355',
  terrainSand: '#d4b896',
  terrainRock: '#7a7a7a',
  terrainTrees: '#2d5a27',

  // Building colors
  buildingResidential: '#c4a484',
  buildingCommercial: '#6699cc',
  buildingIndustrial: '#aa8844',
  buildingCivic: '#ffffff',

  // Infrastructure
  road: '#444444',
  roadLine: '#ffff00',
  powerLine: '#888888',
  rail: '#666666',
};

// Building definitions - SC3000 style
export const BUILDINGS: BuildingDef[] = [
  // Power Plants
  {
    id: 'coal_power',
    name: 'Coal Power Plant',
    category: 'power',
    width: 4,
    height: 4,
    cost: 4000,
    maintenance: 200,
    power: 6000,
    water: -100,
    radius: 0,
    effects: { pollution: 80 },
  },
  {
    id: 'oil_power',
    name: 'Oil Power Plant',
    category: 'power',
    width: 4,
    height: 4,
    cost: 6500,
    maintenance: 250,
    power: 7000,
    water: -80,
    radius: 0,
    effects: { pollution: 60 },
  },
  {
    id: 'gas_power',
    name: 'Gas Power Plant',
    category: 'power',
    width: 4,
    height: 4,
    cost: 5000,
    maintenance: 150,
    power: 5000,
    water: -60,
    radius: 0,
    effects: { pollution: 30 },
  },
  {
    id: 'nuclear_power',
    name: 'Nuclear Power Plant',
    category: 'power',
    width: 4,
    height: 4,
    cost: 15000,
    maintenance: 500,
    power: 16000,
    water: -200,
    radius: 0,
    effects: { pollution: 5 },
    unlockPopulation: 10000,
  },
  {
    id: 'solar_power',
    name: 'Solar Power Plant',
    category: 'power',
    width: 4,
    height: 4,
    cost: 12000,
    maintenance: 50,
    power: 3000,
    water: 0,
    radius: 0,
    effects: { pollution: 0 },
    unlockPopulation: 5000,
  },
  {
    id: 'wind_power',
    name: 'Wind Farm',
    category: 'power',
    width: 2,
    height: 2,
    cost: 500,
    maintenance: 10,
    power: 200,
    water: 0,
    radius: 0,
    effects: { pollution: 0 },
  },

  // Water
  {
    id: 'water_pump',
    name: 'Water Pumping Station',
    category: 'water',
    width: 2,
    height: 2,
    cost: 1000,
    maintenance: 50,
    power: -100,
    water: 3000,
    radius: 0,
    effects: {},
  },
  {
    id: 'water_tower',
    name: 'Water Tower',
    category: 'water',
    width: 1,
    height: 1,
    cost: 300,
    maintenance: 10,
    power: -10,
    water: 500,
    radius: 0,
    effects: {},
  },
  {
    id: 'water_treatment',
    name: 'Water Treatment Plant',
    category: 'water',
    width: 3,
    height: 3,
    cost: 5000,
    maintenance: 150,
    power: -200,
    water: -500,
    radius: 10,
    effects: { pollution: -30 },
  },

  // Education
  {
    id: 'elementary',
    name: 'Elementary School',
    category: 'education',
    width: 2,
    height: 2,
    cost: 500,
    maintenance: 50,
    power: -50,
    water: -20,
    radius: 15,
    effects: { education: 30, landValue: 10 },
  },
  {
    id: 'high_school',
    name: 'High School',
    category: 'education',
    width: 3,
    height: 3,
    cost: 1000,
    maintenance: 100,
    power: -100,
    water: -40,
    radius: 20,
    effects: { education: 50, landValue: 15 },
    unlockPopulation: 1000,
  },
  {
    id: 'college',
    name: 'College',
    category: 'education',
    width: 4,
    height: 4,
    cost: 5000,
    maintenance: 300,
    power: -200,
    water: -80,
    radius: 30,
    effects: { education: 80, landValue: 25 },
    unlockPopulation: 5000,
  },
  {
    id: 'library',
    name: 'Library',
    category: 'education',
    width: 2,
    height: 2,
    cost: 400,
    maintenance: 30,
    power: -30,
    water: -10,
    radius: 12,
    effects: { education: 20, landValue: 15 },
  },
  {
    id: 'museum',
    name: 'Museum',
    category: 'education',
    width: 3,
    height: 3,
    cost: 1500,
    maintenance: 80,
    power: -60,
    water: -20,
    radius: 15,
    effects: { education: 40, landValue: 25, happiness: 10 },
    unlockPopulation: 2000,
  },

  // Health
  {
    id: 'clinic',
    name: 'Medical Clinic',
    category: 'health',
    width: 2,
    height: 2,
    cost: 500,
    maintenance: 60,
    power: -50,
    water: -30,
    radius: 12,
    effects: { health: 30 },
  },
  {
    id: 'hospital',
    name: 'Hospital',
    category: 'health',
    width: 4,
    height: 4,
    cost: 3000,
    maintenance: 200,
    power: -200,
    water: -100,
    radius: 25,
    effects: { health: 60, landValue: 10 },
    unlockPopulation: 2000,
  },

  // Safety
  {
    id: 'police_station',
    name: 'Police Station',
    category: 'safety',
    width: 2,
    height: 2,
    cost: 500,
    maintenance: 75,
    power: -50,
    water: -20,
    radius: 15,
    effects: { crime: -40, landValue: 5 },
  },
  {
    id: 'police_hq',
    name: 'Police Headquarters',
    category: 'safety',
    width: 3,
    height: 3,
    cost: 2000,
    maintenance: 200,
    power: -100,
    water: -40,
    radius: 25,
    effects: { crime: -60, landValue: 10 },
    unlockPopulation: 5000,
  },
  {
    id: 'fire_station',
    name: 'Fire Station',
    category: 'safety',
    width: 2,
    height: 2,
    cost: 500,
    maintenance: 75,
    power: -50,
    water: -50,
    radius: 15,
    effects: { fire: -50 },
  },
  {
    id: 'fire_hq',
    name: 'Fire Department HQ',
    category: 'safety',
    width: 3,
    height: 3,
    cost: 2000,
    maintenance: 200,
    power: -100,
    water: -100,
    radius: 25,
    effects: { fire: -70 },
    unlockPopulation: 5000,
  },
  {
    id: 'prison',
    name: 'Prison',
    category: 'safety',
    width: 4,
    height: 4,
    cost: 3000,
    maintenance: 150,
    power: -150,
    water: -80,
    radius: 0,
    effects: { crime: -20, landValue: -30 },
    unlockPopulation: 10000,
  },

  // Recreation
  {
    id: 'small_park',
    name: 'Small Park',
    category: 'recreation',
    width: 1,
    height: 1,
    cost: 50,
    maintenance: 5,
    power: 0,
    water: -5,
    radius: 5,
    effects: { happiness: 10, landValue: 15, pollution: -5 },
  },
  {
    id: 'large_park',
    name: 'Large Park',
    category: 'recreation',
    width: 3,
    height: 3,
    cost: 500,
    maintenance: 30,
    power: -10,
    water: -30,
    radius: 15,
    effects: { happiness: 30, landValue: 25, pollution: -15 },
  },
  {
    id: 'playground',
    name: 'Playground',
    category: 'recreation',
    width: 2,
    height: 2,
    cost: 200,
    maintenance: 15,
    power: 0,
    water: -10,
    radius: 8,
    effects: { happiness: 20, landValue: 10 },
  },
  {
    id: 'stadium',
    name: 'Stadium',
    category: 'recreation',
    width: 5,
    height: 5,
    cost: 10000,
    maintenance: 500,
    power: -500,
    water: -200,
    radius: 30,
    effects: { happiness: 50, landValue: 20 },
    unlockPopulation: 20000,
  },
  {
    id: 'marina',
    name: 'Marina',
    category: 'recreation',
    width: 3,
    height: 3,
    cost: 2000,
    maintenance: 80,
    power: -30,
    water: 0,
    radius: 10,
    effects: { happiness: 25, landValue: 30 },
    unlockPopulation: 5000,
  },
  {
    id: 'zoo',
    name: 'Zoo',
    category: 'recreation',
    width: 4,
    height: 4,
    cost: 5000,
    maintenance: 250,
    power: -100,
    water: -100,
    radius: 20,
    effects: { happiness: 40, landValue: 20 },
    unlockPopulation: 10000,
  },

  // Civic
  {
    id: 'city_hall',
    name: 'City Hall',
    category: 'civic',
    width: 3,
    height: 3,
    cost: 2000,
    maintenance: 100,
    power: -100,
    water: -40,
    radius: 20,
    effects: { landValue: 30, happiness: 10 },
  },
  {
    id: 'courthouse',
    name: 'Courthouse',
    category: 'civic',
    width: 2,
    height: 2,
    cost: 1000,
    maintenance: 75,
    power: -50,
    water: -20,
    radius: 15,
    effects: { crime: -20, landValue: 20 },
    unlockPopulation: 3000,
  },

  // Transportation
  {
    id: 'bus_depot',
    name: 'Bus Depot',
    category: 'transportation',
    width: 2,
    height: 2,
    cost: 500,
    maintenance: 50,
    power: -30,
    water: -10,
    radius: 20,
    effects: { landValue: 5 },
  },
  {
    id: 'train_station',
    name: 'Train Station',
    category: 'transportation',
    width: 2,
    height: 4,
    cost: 1500,
    maintenance: 100,
    power: -100,
    water: -20,
    radius: 25,
    effects: { landValue: 15 },
    unlockPopulation: 5000,
  },
  {
    id: 'airport',
    name: 'Airport',
    category: 'transportation',
    width: 6,
    height: 6,
    cost: 20000,
    maintenance: 1000,
    power: -500,
    water: -200,
    radius: 40,
    effects: { landValue: -20, pollution: 40 },
    unlockPopulation: 30000,
  },
  {
    id: 'seaport',
    name: 'Seaport',
    category: 'transportation',
    width: 4,
    height: 6,
    cost: 8000,
    maintenance: 400,
    power: -200,
    water: -50,
    radius: 30,
    effects: { pollution: 30 },
    unlockPopulation: 15000,
  },

  // Landmarks
  {
    id: 'statue',
    name: 'Mayor Statue',
    category: 'landmark',
    width: 1,
    height: 1,
    cost: 1000,
    maintenance: 20,
    power: -10,
    water: 0,
    radius: 10,
    effects: { happiness: 15, landValue: 25 },
    unlockPopulation: 10000,
  },
  {
    id: 'fountain',
    name: 'Fountain',
    category: 'landmark',
    width: 1,
    height: 1,
    cost: 200,
    maintenance: 10,
    power: -5,
    water: -20,
    radius: 8,
    effects: { happiness: 10, landValue: 20 },
  },
];

// Zone costs
export const ZONE_COSTS: Record<string, number> = {
  zone_r_light: 10,
  zone_r_medium: 20,
  zone_r_dense: 30,
  zone_c_light: 15,
  zone_c_medium: 30,
  zone_c_dense: 45,
  zone_i_light: 10,
  zone_i_medium: 20,
  zone_i_dense: 30,
};

// Infrastructure costs
export const INFRASTRUCTURE_COSTS: Record<InfrastructureType, number> = {
  road: 10,
  highway: 100,
  rail: 50,
  power_line: 5,
  water_pipe: 5,
};

// Helper functions
export function getBuildingById(id: string): BuildingDef | undefined {
  return BUILDINGS.find(b => b.id === id);
}

export function getBuildingsByCategory(category: BuildingCategory): BuildingDef[] {
  return BUILDINGS.filter(b => b.category === category);
}

export function getZoneColor(zone: ZoneType, density?: ZoneDensity): string {
  if (!zone) return 'transparent';
  const baseColors = {
    residential: SC3000_COLORS.zoneResidential,
    commercial: SC3000_COLORS.zoneCommercial,
    industrial: SC3000_COLORS.zoneIndustrial,
  };
  return baseColors[zone];
}
