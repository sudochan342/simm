// SimCity 3000 Clone - Game Store

import { create } from 'zustand';
import {
  Tile,
  PlacedBuilding,
  CityStats,
  Budget,
  NewsItem,
  ToolType,
  ZoneType,
  ZoneDensity,
  DevelopmentLevel,
  BuildingDef,
  InfrastructureType,
  BUILDINGS,
  ZONE_COSTS,
  INFRASTRUCTURE_COSTS,
  getBuildingById,
} from '@/game/types';
import { v4 as uuidv4 } from 'uuid';

interface GameStore {
  // Game state
  isInitialized: boolean;
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
  speed: 0 | 1 | 2 | 3;

  // UI state
  selectedTool: ToolType | null;
  showZones: boolean;
  showPower: boolean;
  showWater: boolean;
  viewX: number;
  viewY: number;
  zoom: number;

  // Multiplayer
  walletAddress: string | null;
  otherCities: Array<{ address: string; cityName: string; population: number }>;

  // Actions
  initializeGame: (width: number, height: number, cityName: string, mayorName?: string) => void;
  selectTool: (tool: ToolType | null) => void;
  placeZone: (x: number, y: number, zone: ZoneType, density: ZoneDensity) => boolean;
  placeInfrastructure: (x: number, y: number, type: InfrastructureType) => boolean;
  placeBuilding: (x: number, y: number, building: BuildingDef) => boolean;
  bulldoze: (x: number, y: number) => boolean;
  tick: () => void;
  setSpeed: (speed: 0 | 1 | 2 | 3) => void;
  setBudget: (budget: Partial<Budget>) => void;
  setView: (x: number, y: number) => void;
  setZoom: (zoom: number) => void;
  toggleZones: () => void;
  togglePower: () => void;
  toggleWater: () => void;
  setWallet: (address: string | null) => void;
  saveGame: () => string;
  loadGame: (data: string) => void;
  addNews: (type: NewsItem['type'], title: string, message: string) => void;
}

// Initial stats
const initialStats: CityStats = {
  population: 0,
  residentialPop: 0,
  commercialPop: 0,
  industrialPop: 0,
  employment: 0,
  unemployment: 0,
  money: 50000,
  income: 0,
  expenses: 0,
  demand: { residential: 50, commercial: 20, industrial: 30 },
  happiness: 50,
  health: 50,
  education: 0,
  safety: 50,
  traffic: 0,
  pollution: 0,
  landValue: 50,
  power: 0,
  powerDemand: 0,
  water: 0,
  waterDemand: 0,
  crimeRate: 20,
  fireRisk: 20,
};

// Initial budget
const initialBudget: Budget = {
  taxResidential: 7,
  taxCommercial: 8,
  taxIndustrial: 8,
  fundingPolice: 100,
  fundingFire: 100,
  fundingHealth: 100,
  fundingEducation: 100,
  fundingTransportation: 100,
};

// Seeded random number generator
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Generate terrain
function generateTerrain(width: number, height: number, seed: number = Date.now()): Tile[][] {
  const tiles: Tile[][] = [];

  for (let y = 0; y < height; y++) {
    tiles[y] = [];
    for (let x = 0; x < width; x++) {
      const noise1 = seededRandom(seed + x * 100 + y);
      const noise2 = seededRandom(seed + x * 50 + y * 2);
      const noise3 = seededRandom(seed + x + y * 100);

      // Determine terrain
      let terrain: Tile['terrain'] = 'grass';
      let elevation = 0;

      // Create some water bodies (rivers/lakes)
      const waterNoise = seededRandom(seed + x * 0.1 + y * 0.1);
      const riverX = width / 3 + Math.sin(y * 0.1) * 10;
      const riverX2 = (width * 2) / 3 + Math.cos(y * 0.15) * 8;

      if (Math.abs(x - riverX) < 3 || Math.abs(x - riverX2) < 2) {
        terrain = 'water';
      } else if (noise1 > 0.85) {
        terrain = 'trees';
        elevation = Math.floor(noise2 * 2);
      } else if (noise1 > 0.75 && noise2 > 0.5) {
        terrain = 'rock';
        elevation = Math.floor(noise3 * 3);
      } else if (noise2 > 0.9) {
        terrain = 'dirt';
      } else {
        // Hills
        elevation = Math.floor(noise1 * noise2 * 3);
      }

      tiles[y][x] = {
        x,
        y,
        terrain,
        elevation,
        zone: null,
        zoneDensity: null,
        development: 0 as DevelopmentLevel,
        building: null,
        infrastructure: null,
        powered: false,
        watered: false,
        landValue: 50 + Math.floor(noise1 * 30) - Math.floor(noise2 * 20),
        pollution: 0,
        crime: 20,
        traffic: 0,
      };
    }
  }

  return tiles;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  isInitialized: false,
  cityName: '',
  mayorName: '',
  tiles: [],
  width: 0,
  height: 0,
  stats: initialStats,
  budget: initialBudget,
  buildings: [],
  news: [],
  year: 1900,
  month: 1,
  day: 1,
  speed: 1,

  // UI state
  selectedTool: null,
  showZones: true,
  showPower: false,
  showWater: false,
  viewX: 0,
  viewY: 0,
  zoom: 0.25, // Start zoomed out to see more of the map

  // Multiplayer
  walletAddress: null,
  otherCities: [],

  // Initialize game
  initializeGame: (width, height, cityName, mayorName = 'Mayor') => {
    const tiles = generateTerrain(width, height);

    set({
      isInitialized: true,
      cityName,
      mayorName,
      tiles,
      width,
      height,
      stats: { ...initialStats },
      budget: { ...initialBudget },
      buildings: [],
      news: [],
      year: 1900,
      month: 1,
      day: 1,
      speed: 1,
      viewX: width / 2,
      viewY: height / 2,
      zoom: 0.25, // Zoomed out to see more of the map
    });

    get().addNews('info', 'Welcome!', `Welcome to ${cityName}, ${mayorName}! Build your dream city.`);
  },

  // Select tool
  selectTool: (tool) => set({ selectedTool: tool }),

  // Place zone
  placeZone: (x, y, zone, density) => {
    const { tiles, stats } = get();
    const tile = tiles[y]?.[x];
    if (!tile) return false;

    // Can't zone on water or existing buildings
    if (tile.terrain === 'water' || tile.building || tile.infrastructure) return false;

    // Get cost
    const costKey = `zone_${zone?.[0]}_${density}`;
    const cost = ZONE_COSTS[costKey] || 10;

    if (stats.money < cost) return false;

    // Update tile
    const newTiles = [...tiles];
    newTiles[y] = [...newTiles[y]];
    newTiles[y][x] = {
      ...tile,
      zone,
      zoneDensity: density,
      terrain: 'grass', // Clear trees/rocks
      development: 0 as DevelopmentLevel,
    };

    set({
      tiles: newTiles,
      stats: { ...stats, money: stats.money - cost },
    });

    return true;
  },

  // Place infrastructure
  placeInfrastructure: (x, y, type) => {
    const { tiles, stats } = get();
    const tile = tiles[y]?.[x];
    if (!tile) return false;

    // Can't build on water (except bridges later)
    if (tile.terrain === 'water') return false;
    if (tile.building) return false;

    const cost = INFRASTRUCTURE_COSTS[type];
    if (stats.money < cost) return false;

    const newTiles = [...tiles];
    newTiles[y] = [...newTiles[y]];
    newTiles[y][x] = {
      ...tile,
      infrastructure: type,
      zone: null,
      zoneDensity: null,
      terrain: 'dirt',
    };

    set({
      tiles: newTiles,
      stats: { ...stats, money: stats.money - cost },
    });

    return true;
  },

  // Place building
  placeBuilding: (x, y, buildingDef) => {
    const { tiles, stats, buildings } = get();

    // Check if we can afford it
    if (stats.money < buildingDef.cost) return false;

    // Check population requirement
    if (buildingDef.unlockPopulation && stats.population < buildingDef.unlockPopulation) return false;

    // Check if area is clear
    for (let dy = 0; dy < buildingDef.height; dy++) {
      for (let dx = 0; dx < buildingDef.width; dx++) {
        const tile = tiles[y + dy]?.[x + dx];
        if (!tile) return false;
        if (tile.terrain === 'water') return false;
        if (tile.building) return false;
        if (tile.infrastructure && tile.infrastructure !== 'power_line') return false;
      }
    }

    // Create building
    const building: PlacedBuilding = {
      id: uuidv4(),
      defId: buildingDef.id,
      x,
      y,
      powered: false,
      watered: false,
      active: true,
    };

    // Update tiles
    const newTiles = [...tiles];
    for (let dy = 0; dy < buildingDef.height; dy++) {
      newTiles[y + dy] = [...newTiles[y + dy]];
      for (let dx = 0; dx < buildingDef.width; dx++) {
        const tile = newTiles[y + dy][x + dx];
        newTiles[y + dy][x + dx] = {
          ...tile,
          building,
          zone: null,
          zoneDensity: null,
          terrain: 'dirt',
        };
      }
    }

    set({
      tiles: newTiles,
      buildings: [...buildings, building],
      stats: { ...stats, money: stats.money - buildingDef.cost },
    });

    get().addNews('info', 'Construction Complete', `${buildingDef.name} has been built.`);

    return true;
  },

  // Bulldoze
  bulldoze: (x, y) => {
    const { tiles, stats, buildings } = get();
    const tile = tiles[y]?.[x];
    if (!tile) return false;
    if (tile.terrain === 'water') return false;

    const cost = 10;
    if (stats.money < cost) return false;

    const newTiles = [...tiles];
    newTiles[y] = [...newTiles[y]];

    // Remove building if present
    if (tile.building) {
      const building = tile.building;
      const def = getBuildingById(building.defId);
      if (def) {
        // Clear all tiles of this building
        for (let dy = 0; dy < def.height; dy++) {
          for (let dx = 0; dx < def.width; dx++) {
            const ty = building.y + dy;
            const tx = building.x + dx;
            if (newTiles[ty]?.[tx]) {
              newTiles[ty] = [...newTiles[ty]];
              newTiles[ty][tx] = {
                ...newTiles[ty][tx],
                building: null,
                terrain: 'dirt',
              };
            }
          }
        }
      }
      set({
        buildings: buildings.filter(b => b.id !== building.id),
      });
    }

    // Clear the tile
    newTiles[y][x] = {
      ...newTiles[y][x],
      zone: null,
      zoneDensity: null,
      development: 0 as DevelopmentLevel,
      infrastructure: null,
      building: null,
      terrain: 'dirt',
    };

    set({
      tiles: newTiles,
      stats: { ...stats, money: stats.money - cost },
    });

    return true;
  },

  // Game tick
  tick: () => {
    const state = get();
    if (!state.isInitialized || state.speed === 0) return;

    const { tiles, buildings, stats, budget, year, month, day } = state;
    const newTiles = tiles.map(row => [...row]);
    const newStats = { ...stats };

    // Update time
    let newDay = day + 1;
    let newMonth = month;
    let newYear = year;

    if (newDay > 30) {
      newDay = 1;
      newMonth++;
      if (newMonth > 12) {
        newMonth = 1;
        newYear++;
      }
    }

    // Calculate power grid
    let totalPower = 0;
    let totalPowerDemand = 0;

    // Power from buildings
    buildings.forEach(building => {
      const def = getBuildingById(building.defId);
      if (def) {
        if (def.power > 0) {
          totalPower += def.power;
        } else {
          totalPowerDemand += Math.abs(def.power);
        }
      }
    });

    // Power demand from zones
    for (let y = 0; y < state.height; y++) {
      for (let x = 0; x < state.width; x++) {
        const tile = newTiles[y][x];
        if (tile.zone && tile.development > 0) {
          totalPowerDemand += tile.development * 10;
        }
      }
    }

    // Propagate power (simplified - just check if we have enough)
    const hasPower = totalPower >= totalPowerDemand * 0.8;

    // Update water similar to power
    let totalWater = 0;
    let totalWaterDemand = 0;

    buildings.forEach(building => {
      const def = getBuildingById(building.defId);
      if (def) {
        if (def.water > 0) {
          totalWater += def.water;
        } else {
          totalWaterDemand += Math.abs(def.water);
        }
      }
    });

    const hasWater = totalWater >= totalWaterDemand * 0.8;

    // Update buildings power/water status
    const newBuildings = buildings.map(b => ({
      ...b,
      powered: hasPower,
      watered: hasWater,
      active: hasPower,
    }));

    // Calculate building effects
    let totalEducation = 0;
    let totalHealth = 0;
    let totalCrimeReduction = 0;
    let totalFireReduction = 0;
    let totalPollution = 0;
    let totalHappiness = 0;
    let totalLandValueBonus = 0;
    let totalMaintenance = 0;

    newBuildings.forEach(building => {
      const def = getBuildingById(building.defId);
      if (def && building.active) {
        totalMaintenance += def.maintenance;
        if (def.effects.education) totalEducation += def.effects.education;
        if (def.effects.health) totalHealth += def.effects.health;
        if (def.effects.crime) totalCrimeReduction += Math.abs(def.effects.crime);
        if (def.effects.fire) totalFireReduction += Math.abs(def.effects.fire);
        if (def.effects.pollution) totalPollution += def.effects.pollution;
        if (def.effects.happiness) totalHappiness += def.effects.happiness;
        if (def.effects.landValue) totalLandValueBonus += def.effects.landValue;
      }
    });

    // Zone development and population
    let totalResidential = 0;
    let totalCommercial = 0;
    let totalIndustrial = 0;
    let totalJobs = 0;

    for (let y = 0; y < state.height; y++) {
      for (let x = 0; x < state.width; x++) {
        const tile = newTiles[y][x];

        // Update powered status
        newTiles[y][x] = {
          ...tile,
          powered: hasPower && (tile.zone !== null || tile.building !== null),
          watered: hasWater,
        };

        // Zone development
        if (tile.zone && tile.powered) {
          // Check for road access
          const hasRoadAccess = checkRoadAccess(newTiles, x, y, state.width, state.height);

          if (hasRoadAccess && tile.development < 8) {
            // Chance to develop based on demand
            const demand = newStats.demand[tile.zone];
            const developChance = Math.max(0, demand / 200);

            if (Math.random() < developChance) {
              newTiles[y][x] = {
                ...newTiles[y][x],
                development: Math.min(8, tile.development + 1) as DevelopmentLevel,
              };
            }
          }

          // Count population and jobs
          const densityMultiplier = tile.zoneDensity === 'dense' ? 3 : tile.zoneDensity === 'medium' ? 2 : 1;
          const pop = tile.development * 10 * densityMultiplier;

          switch (tile.zone) {
            case 'residential':
              totalResidential += pop;
              break;
            case 'commercial':
              totalCommercial += pop / 2;
              totalJobs += pop;
              break;
            case 'industrial':
              totalIndustrial += pop / 3;
              totalJobs += pop * 1.5;
              break;
          }
        }
      }
    }

    // Calculate totals
    const totalPopulation = totalResidential + totalCommercial + totalIndustrial;
    const employment = Math.min(totalResidential, totalJobs);
    const unemployment = Math.max(0, totalResidential - totalJobs);

    // Calculate demand
    const residentialDemand = Math.min(100, Math.max(-100,
      50 - (totalResidential / Math.max(1, totalJobs)) * 30 + totalJobs * 0.01
    ));
    const commercialDemand = Math.min(100, Math.max(-100,
      20 + totalResidential * 0.05 - totalCommercial * 0.1
    ));
    const industrialDemand = Math.min(100, Math.max(-100,
      30 + totalResidential * 0.03 - totalIndustrial * 0.15
    ));

    // Calculate income and expenses
    const taxIncome =
      totalResidential * budget.taxResidential * 0.1 +
      totalCommercial * budget.taxCommercial * 0.15 +
      totalIndustrial * budget.taxIndustrial * 0.12;

    const expenses = totalMaintenance +
      (budget.fundingPolice / 100) * totalPopulation * 0.01 +
      (budget.fundingFire / 100) * totalPopulation * 0.01 +
      (budget.fundingHealth / 100) * totalPopulation * 0.02 +
      (budget.fundingEducation / 100) * totalPopulation * 0.02 +
      (budget.fundingTransportation / 100) * totalPopulation * 0.01;

    // Monthly income/expense
    if (newDay === 1) {
      newStats.money += Math.floor(taxIncome - expenses);
    }

    // Calculate happiness
    const baseHappiness = 50;
    const happinessFromServices = (totalEducation + totalHealth) / 10;
    const happinessFromEmployment = employment > 0 ? (employment / totalResidential) * 30 : 0;
    const happinessPenalty = unemployment * 0.1 + totalPollution * 0.2;
    const happiness = Math.min(100, Math.max(0,
      baseHappiness + happinessFromServices + happinessFromEmployment - happinessPenalty + totalHappiness
    ));

    // Update stats
    newStats.population = Math.floor(totalPopulation);
    newStats.residentialPop = Math.floor(totalResidential);
    newStats.commercialPop = Math.floor(totalCommercial);
    newStats.industrialPop = Math.floor(totalIndustrial);
    newStats.employment = Math.floor(employment);
    newStats.unemployment = Math.floor(unemployment);
    newStats.income = Math.floor(taxIncome);
    newStats.expenses = Math.floor(expenses);
    newStats.demand = {
      residential: Math.floor(residentialDemand),
      commercial: Math.floor(commercialDemand),
      industrial: Math.floor(industrialDemand),
    };
    newStats.happiness = Math.floor(happiness);
    newStats.health = Math.min(100, totalHealth);
    newStats.education = Math.min(100, totalEducation);
    newStats.power = totalPower;
    newStats.powerDemand = totalPowerDemand;
    newStats.water = totalWater;
    newStats.waterDemand = totalWaterDemand;
    newStats.pollution = Math.max(0, Math.min(100, totalPollution));
    newStats.crimeRate = Math.max(0, Math.min(100, 20 + totalPopulation * 0.001 - totalCrimeReduction));
    newStats.fireRisk = Math.max(0, Math.min(100, 20 - totalFireReduction));
    newStats.landValue = Math.min(100, Math.max(0, 50 + totalLandValueBonus - totalPollution * 0.5));

    // Bankruptcy check
    if (newStats.money < -10000) {
      get().addNews('warning', 'Financial Crisis', 'Your city is deeply in debt! Cut expenses or raise taxes.');
    }

    set({
      tiles: newTiles,
      buildings: newBuildings,
      stats: newStats,
      year: newYear,
      month: newMonth,
      day: newDay,
    });
  },

  setSpeed: (speed) => set({ speed }),

  setBudget: (budgetUpdate) => {
    const { budget } = get();
    set({ budget: { ...budget, ...budgetUpdate } });
  },

  setView: (x, y) => set({ viewX: x, viewY: y }),

  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(1.5, zoom)) }),

  toggleZones: () => set(state => ({ showZones: !state.showZones })),

  togglePower: () => set(state => ({ showPower: !state.showPower })),

  toggleWater: () => set(state => ({ showWater: !state.showWater })),

  setWallet: (address) => set({ walletAddress: address }),

  saveGame: () => {
    const state = get();
    const saveData = {
      cityName: state.cityName,
      mayorName: state.mayorName,
      tiles: state.tiles,
      width: state.width,
      height: state.height,
      stats: state.stats,
      budget: state.budget,
      buildings: state.buildings,
      year: state.year,
      month: state.month,
      day: state.day,
    };
    return JSON.stringify(saveData);
  },

  loadGame: (data) => {
    try {
      const saveData = JSON.parse(data);
      set({
        isInitialized: true,
        ...saveData,
        speed: 1,
        selectedTool: null,
        news: [],
      });
      get().addNews('info', 'Game Loaded', `Welcome back to ${saveData.cityName}!`);
    } catch (e) {
      console.error('Failed to load game:', e);
    }
  },

  addNews: (type, title, message) => {
    const { news } = get();
    const newItem: NewsItem = {
      id: uuidv4(),
      timestamp: Date.now(),
      type,
      title,
      message,
    };
    set({ news: [newItem, ...news].slice(0, 50) });
  },
}));

// Helper function to check road access
function checkRoadAccess(tiles: Tile[][], x: number, y: number, width: number, height: number): boolean {
  const directions = [
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
  ];

  for (const { dx, dy } of directions) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
      const neighbor = tiles[ny][nx];
      if (neighbor.infrastructure === 'road' || neighbor.infrastructure === 'highway') {
        return true;
      }
    }
  }

  return false;
}
