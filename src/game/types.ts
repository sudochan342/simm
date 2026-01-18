// SimCity Game Types

export type BuildingCategory = 'residential' | 'commercial' | 'industrial' | 'road' | 'park' | 'utility' | 'special';

export interface BuildingType {
  id: string;
  name: string;
  category: BuildingCategory;
  cost: number;
  width: number;
  height: number;
  color: string;
  emoji: string;
  population?: number;
  jobs?: number;
  power?: number;
  powerConsumption?: number;
  happiness?: number;
  pollution?: number;
  income?: number;
  description: string;
  unlockPopulation?: number;
}

export interface Building {
  id: string;
  type: BuildingType;
  x: number;
  y: number;
  level: number;
  powered: boolean;
  connected: boolean;
  residents?: number;
  workers?: number;
  happiness: number;
  builtAt: number;
}

export interface Tile {
  x: number;
  y: number;
  terrain: 'grass' | 'water' | 'sand' | 'dirt';
  building: Building | null;
  zoneType: BuildingCategory | null;
  elevation?: number;
}

export interface CityStats {
  population: number;
  maxPopulation: number;
  money: number;
  income: number;
  expenses: number;
  happiness: number;
  pollution: number;
  power: number;
  powerDemand: number;
  jobs: number;
  unemployed: number;
  day: number;
  cityName: string;
}

export interface GameState {
  tiles: Map<string, Tile>;
  buildings: Building[];
  stats: CityStats;
  selectedTool: BuildingType | 'bulldoze' | 'select' | null;
  gameSpeed: number;
  isPaused: boolean;
  camera: { x: number; y: number; zoom: number };
  gridSize: { width: number; height: number };
  showGrid: boolean;
  timeOfDay: number; // 0-24
  weather: 'clear' | 'cloudy' | 'rain' | 'night';
}

export const BUILDING_TYPES: BuildingType[] = [
  // Residential
  {
    id: 'house_small',
    name: 'Small House',
    category: 'residential',
    cost: 100,
    width: 1,
    height: 1,
    color: '#4ade80',
    emoji: '🏠',
    population: 4,
    powerConsumption: 1,
    happiness: 5,
    description: 'A cozy small house for a family'
  },
  {
    id: 'house_medium',
    name: 'Medium House',
    category: 'residential',
    cost: 250,
    width: 1,
    height: 1,
    color: '#22c55e',
    emoji: '🏡',
    population: 8,
    powerConsumption: 2,
    happiness: 8,
    description: 'A comfortable suburban home',
    unlockPopulation: 50
  },
  {
    id: 'apartment',
    name: 'Apartment',
    category: 'residential',
    cost: 500,
    width: 1,
    height: 1,
    color: '#16a34a',
    emoji: '🏢',
    population: 24,
    powerConsumption: 5,
    happiness: 6,
    description: 'Multi-family apartment building',
    unlockPopulation: 200
  },
  {
    id: 'tower',
    name: 'Residential Tower',
    category: 'residential',
    cost: 2000,
    width: 2,
    height: 2,
    color: '#15803d',
    emoji: '🏙️',
    population: 100,
    powerConsumption: 15,
    happiness: 7,
    description: 'High-rise residential tower',
    unlockPopulation: 1000
  },

  // Commercial
  {
    id: 'shop',
    name: 'Shop',
    category: 'commercial',
    cost: 150,
    width: 1,
    height: 1,
    color: '#60a5fa',
    emoji: '🏪',
    jobs: 5,
    income: 10,
    powerConsumption: 2,
    description: 'Small retail shop'
  },
  {
    id: 'store',
    name: 'Department Store',
    category: 'commercial',
    cost: 400,
    width: 1,
    height: 1,
    color: '#3b82f6',
    emoji: '🏬',
    jobs: 15,
    income: 30,
    powerConsumption: 5,
    description: 'Large department store',
    unlockPopulation: 100
  },
  {
    id: 'mall',
    name: 'Shopping Mall',
    category: 'commercial',
    cost: 1500,
    width: 2,
    height: 2,
    color: '#2563eb',
    emoji: '🛒',
    jobs: 50,
    income: 100,
    powerConsumption: 20,
    happiness: 10,
    description: 'Large shopping mall',
    unlockPopulation: 500
  },
  {
    id: 'office',
    name: 'Office Building',
    category: 'commercial',
    cost: 800,
    width: 1,
    height: 1,
    color: '#1d4ed8',
    emoji: '🏛️',
    jobs: 30,
    income: 50,
    powerConsumption: 8,
    description: 'Corporate office building',
    unlockPopulation: 300
  },

  // Industrial
  {
    id: 'factory_small',
    name: 'Small Factory',
    category: 'industrial',
    cost: 300,
    width: 1,
    height: 1,
    color: '#fbbf24',
    emoji: '🏭',
    jobs: 20,
    income: 25,
    powerConsumption: 10,
    pollution: 15,
    description: 'Small manufacturing plant'
  },
  {
    id: 'factory_large',
    name: 'Large Factory',
    category: 'industrial',
    cost: 800,
    width: 2,
    height: 2,
    color: '#f59e0b',
    emoji: '🏭',
    jobs: 60,
    income: 80,
    powerConsumption: 30,
    pollution: 40,
    description: 'Large industrial complex',
    unlockPopulation: 200
  },
  {
    id: 'warehouse',
    name: 'Warehouse',
    category: 'industrial',
    cost: 200,
    width: 1,
    height: 1,
    color: '#d97706',
    emoji: '📦',
    jobs: 10,
    income: 15,
    powerConsumption: 3,
    pollution: 5,
    description: 'Storage warehouse'
  },

  // Roads
  {
    id: 'road',
    name: 'Road',
    category: 'road',
    cost: 10,
    width: 1,
    height: 1,
    color: '#6b7280',
    emoji: '🛣️',
    description: 'Connect your city with roads'
  },
  {
    id: 'highway',
    name: 'Highway',
    category: 'road',
    cost: 50,
    width: 1,
    height: 1,
    color: '#4b5563',
    emoji: '🛤️',
    description: 'Fast transportation highway',
    unlockPopulation: 500
  },

  // Parks & Recreation
  {
    id: 'park_small',
    name: 'Small Park',
    category: 'park',
    cost: 50,
    width: 1,
    height: 1,
    color: '#34d399',
    emoji: '🌳',
    happiness: 10,
    pollution: -5,
    description: 'Green space for relaxation'
  },
  {
    id: 'park_large',
    name: 'Large Park',
    category: 'park',
    cost: 200,
    width: 2,
    height: 2,
    color: '#10b981',
    emoji: '🏞️',
    happiness: 30,
    pollution: -15,
    description: 'Beautiful public park',
    unlockPopulation: 100
  },
  {
    id: 'stadium',
    name: 'Stadium',
    category: 'park',
    cost: 3000,
    width: 3,
    height: 3,
    color: '#059669',
    emoji: '🏟️',
    jobs: 100,
    happiness: 50,
    income: 200,
    powerConsumption: 50,
    description: 'Sports stadium for events',
    unlockPopulation: 2000
  },
  {
    id: 'fountain',
    name: 'Fountain',
    category: 'park',
    cost: 100,
    width: 1,
    height: 1,
    color: '#06b6d4',
    emoji: '⛲',
    happiness: 15,
    description: 'Decorative water fountain'
  },

  // Utilities
  {
    id: 'power_plant',
    name: 'Power Plant',
    category: 'utility',
    cost: 500,
    width: 2,
    height: 2,
    color: '#ef4444',
    emoji: '⚡',
    power: 100,
    jobs: 20,
    pollution: 30,
    description: 'Generates electricity for the city'
  },
  {
    id: 'solar_plant',
    name: 'Solar Farm',
    category: 'utility',
    cost: 1000,
    width: 2,
    height: 2,
    color: '#fcd34d',
    emoji: '☀️',
    power: 50,
    jobs: 5,
    description: 'Clean solar energy',
    unlockPopulation: 500
  },
  {
    id: 'wind_turbine',
    name: 'Wind Turbine',
    category: 'utility',
    cost: 300,
    width: 1,
    height: 1,
    color: '#e5e7eb',
    emoji: '🌬️',
    power: 20,
    jobs: 2,
    description: 'Eco-friendly wind power'
  },
  {
    id: 'water_tower',
    name: 'Water Tower',
    category: 'utility',
    cost: 200,
    width: 1,
    height: 1,
    color: '#93c5fd',
    emoji: '🚰',
    powerConsumption: 5,
    description: 'Provides water to the city'
  },
  {
    id: 'fire_station',
    name: 'Fire Station',
    category: 'utility',
    cost: 500,
    width: 1,
    height: 1,
    color: '#dc2626',
    emoji: '🚒',
    jobs: 15,
    powerConsumption: 5,
    happiness: 10,
    description: 'Protects against fires'
  },
  {
    id: 'police_station',
    name: 'Police Station',
    category: 'utility',
    cost: 500,
    width: 1,
    height: 1,
    color: '#1e3a8a',
    emoji: '🚔',
    jobs: 20,
    powerConsumption: 5,
    happiness: 15,
    description: 'Keeps the city safe'
  },
  {
    id: 'hospital',
    name: 'Hospital',
    category: 'utility',
    cost: 1000,
    width: 2,
    height: 2,
    color: '#f9fafb',
    emoji: '🏥',
    jobs: 50,
    powerConsumption: 20,
    happiness: 25,
    description: 'Healthcare for citizens',
    unlockPopulation: 200
  },
  {
    id: 'school',
    name: 'School',
    category: 'utility',
    cost: 400,
    width: 1,
    height: 1,
    color: '#fde047',
    emoji: '🏫',
    jobs: 20,
    powerConsumption: 8,
    happiness: 20,
    description: 'Education for the young'
  },

  // Special Buildings
  {
    id: 'city_hall',
    name: 'City Hall',
    category: 'special',
    cost: 2000,
    width: 2,
    height: 2,
    color: '#a78bfa',
    emoji: '🏛️',
    jobs: 30,
    powerConsumption: 15,
    happiness: 20,
    description: 'The heart of city governance',
    unlockPopulation: 500
  },
  {
    id: 'monument',
    name: 'Monument',
    category: 'special',
    cost: 5000,
    width: 1,
    height: 1,
    color: '#f472b6',
    emoji: '🗽',
    happiness: 50,
    description: 'A city landmark',
    unlockPopulation: 5000
  },
  {
    id: 'airport',
    name: 'Airport',
    category: 'special',
    cost: 10000,
    width: 4,
    height: 3,
    color: '#94a3b8',
    emoji: '✈️',
    jobs: 200,
    income: 500,
    powerConsumption: 100,
    pollution: 50,
    happiness: 30,
    description: 'International airport',
    unlockPopulation: 10000
  },
  {
    id: 'casino',
    name: 'Casino',
    category: 'special',
    cost: 5000,
    width: 2,
    height: 2,
    color: '#fbbf24',
    emoji: '🎰',
    jobs: 100,
    income: 300,
    powerConsumption: 40,
    happiness: -5,
    description: 'Entertainment and gambling',
    unlockPopulation: 3000
  }
];

export const getTileKey = (x: number, y: number): string => `${x},${y}`;

export const getCategoryColor = (category: BuildingCategory): string => {
  switch (category) {
    case 'residential': return '#22c55e';
    case 'commercial': return '#3b82f6';
    case 'industrial': return '#f59e0b';
    case 'road': return '#6b7280';
    case 'park': return '#10b981';
    case 'utility': return '#ef4444';
    case 'special': return '#a78bfa';
    default: return '#ffffff';
  }
};
