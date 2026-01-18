import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  GameState,
  Building,
  BuildingType,
  Tile,
  CityStats,
  BUILDING_TYPES,
  getTileKey,
} from '@/game/types';

interface GameStore extends GameState {
  // Actions
  initializeGame: (width: number, height: number, cityName?: string) => void;
  selectTool: (tool: BuildingType | 'bulldoze' | 'select' | null) => void;
  placeBuilding: (x: number, y: number) => boolean;
  bulldoze: (x: number, y: number) => boolean;
  updateCamera: (x: number, y: number, zoom?: number) => void;
  setGameSpeed: (speed: number) => void;
  togglePause: () => void;
  tick: () => void;
  toggleGrid: () => void;
  saveGame: () => string;
  loadGame: (saveData: string) => boolean;
  resetGame: () => void;
  getAvailableBuildings: () => BuildingType[];
  canAfford: (cost: number) => boolean;
  getTile: (x: number, y: number) => Tile | undefined;
  isInitialized: boolean;
}

const createInitialStats = (cityName: string): CityStats => ({
  population: 0,
  maxPopulation: 0,
  money: 50000, // More starting money
  income: 0,
  expenses: 0,
  happiness: 75,
  pollution: 0,
  power: 0,
  powerDemand: 0,
  jobs: 0,
  unemployed: 0,
  day: 1,
  cityName,
});

// Seeded random for consistent terrain
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const createTile = (x: number, y: number, width: number, height: number): Tile => {
  const seed = x * 1000 + y;
  const rand = seededRandom(seed);

  // Create more interesting terrain
  let terrain: 'grass' | 'water' | 'sand' | 'dirt' = 'grass';

  // Create a river through the map
  const riverCenterY = height / 2;
  const riverWidth = 3;
  const riverWave = Math.sin(x / 8) * 4;
  if (Math.abs(y - riverCenterY - riverWave) < riverWidth) {
    terrain = 'water';
  }

  // Add some random water (lakes)
  if (rand > 0.97) {
    terrain = 'water';
  }

  // Add some dirt patches
  if (rand > 0.9 && rand <= 0.93 && terrain === 'grass') {
    terrain = 'dirt';
  }

  // Add sand near water
  if (terrain === 'grass') {
    const checkNearby = (dx: number, dy: number) => {
      const nearSeed = (x + dx) * 1000 + (y + dy);
      const nearRand = seededRandom(nearSeed);
      const nearRiverWave = Math.sin((x + dx) / 8) * 4;
      return Math.abs((y + dy) - riverCenterY - nearRiverWave) < riverWidth || nearRand > 0.97;
    };

    if (checkNearby(-1, 0) || checkNearby(1, 0) || checkNearby(0, -1) || checkNearby(0, 1)) {
      if (rand > 0.5) terrain = 'sand';
    }
  }

  return {
    x,
    y,
    terrain,
    building: null,
    zoneType: null,
    elevation: Math.floor(seededRandom(seed + 500) * 3), // 0-2 elevation
  };
};

export const useGameStore = create<GameStore>()((set, get) => ({
  tiles: new Map(),
  buildings: [],
  stats: createInitialStats('New City'),
  selectedTool: null,
  gameSpeed: 1,
  isPaused: false,
  camera: { x: 0, y: 0, zoom: 1 },
  gridSize: { width: 50, height: 50 },
  showGrid: true,
  timeOfDay: 10,
  weather: 'clear',
  isInitialized: false,

  initializeGame: (width: number, height: number, cityName = 'New City') => {
    const tiles = new Map<string, Tile>();

    // Create terrain
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const tile = createTile(x, y, width, height);
        tiles.set(getTileKey(x, y), tile);
      }
    }

    set({
      tiles,
      buildings: [],
      stats: createInitialStats(cityName),
      gridSize: { width, height },
      camera: { x: 0, y: 0, zoom: 1 },
      selectedTool: null,
      isPaused: false,
      gameSpeed: 1,
      timeOfDay: 10,
      isInitialized: true,
    });
  },

  selectTool: (tool) => set({ selectedTool: tool }),

  placeBuilding: (x: number, y: number) => {
    const state = get();
    const { selectedTool, tiles, stats } = state;

    if (!selectedTool || selectedTool === 'bulldoze' || selectedTool === 'select') {
      return false;
    }

    const buildingType = selectedTool as BuildingType;

    // Check if we can afford it
    if (stats.money < buildingType.cost) {
      return false;
    }

    // Check if all tiles are available
    for (let dx = 0; dx < buildingType.width; dx++) {
      for (let dy = 0; dy < buildingType.height; dy++) {
        const tile = tiles.get(getTileKey(x + dx, y + dy));
        if (!tile || tile.building || tile.terrain === 'water') {
          return false;
        }
      }
    }

    // Create the building
    const building: Building = {
      id: uuidv4(),
      type: buildingType,
      x,
      y,
      level: 1,
      powered: buildingType.power ? true : false,
      connected: true,
      happiness: 50,
      builtAt: Date.now(),
    };

    // Update tiles
    const newTiles = new Map(tiles);
    for (let dx = 0; dx < buildingType.width; dx++) {
      for (let dy = 0; dy < buildingType.height; dy++) {
        const key = getTileKey(x + dx, y + dy);
        const tile = newTiles.get(key);
        if (tile) {
          newTiles.set(key, { ...tile, building, zoneType: buildingType.category });
        }
      }
    }

    // Update stats
    const newStats = { ...stats };
    newStats.money -= buildingType.cost;

    if (buildingType.population) {
      newStats.maxPopulation += buildingType.population;
    }
    if (buildingType.jobs) {
      newStats.jobs += buildingType.jobs;
    }
    if (buildingType.power) {
      newStats.power += buildingType.power;
    }
    if (buildingType.powerConsumption) {
      newStats.powerDemand += buildingType.powerConsumption;
    }
    if (buildingType.pollution) {
      newStats.pollution = Math.max(0, newStats.pollution + buildingType.pollution);
    }
    if (buildingType.happiness) {
      newStats.happiness = Math.min(100, Math.max(0, newStats.happiness + buildingType.happiness / 10));
    }

    set({
      tiles: newTiles,
      buildings: [...state.buildings, building],
      stats: newStats,
    });

    return true;
  },

  bulldoze: (x: number, y: number) => {
    const state = get();
    const tile = state.tiles.get(getTileKey(x, y));

    if (!tile || !tile.building) {
      return false;
    }

    const building = tile.building;
    const buildingType = building.type;
    const refund = Math.floor(buildingType.cost * 0.5);

    // Remove building from all tiles it occupies
    const newTiles = new Map(state.tiles);
    for (let dx = 0; dx < buildingType.width; dx++) {
      for (let dy = 0; dy < buildingType.height; dy++) {
        const key = getTileKey(building.x + dx, building.y + dy);
        const t = newTiles.get(key);
        if (t) {
          newTiles.set(key, { ...t, building: null, zoneType: null });
        }
      }
    }

    // Update stats
    const newStats = { ...state.stats };
    newStats.money += refund;

    if (buildingType.population) {
      newStats.maxPopulation -= buildingType.population;
      newStats.population = Math.min(newStats.population, newStats.maxPopulation);
    }
    if (buildingType.jobs) {
      newStats.jobs -= buildingType.jobs;
    }
    if (buildingType.power) {
      newStats.power -= buildingType.power;
    }
    if (buildingType.powerConsumption) {
      newStats.powerDemand -= buildingType.powerConsumption;
    }
    if (buildingType.pollution) {
      newStats.pollution = Math.max(0, newStats.pollution - buildingType.pollution);
    }

    set({
      tiles: newTiles,
      buildings: state.buildings.filter((b) => b.id !== building.id),
      stats: newStats,
    });

    return true;
  },

  updateCamera: (x: number, y: number, zoom?: number) => {
    const state = get();
    set({
      camera: {
        x,
        y,
        zoom: zoom ?? state.camera.zoom,
      },
    });
  },

  setGameSpeed: (speed: number) => set({ gameSpeed: speed }),

  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),

  tick: () => {
    const state = get();
    if (state.isPaused || !state.isInitialized) return;

    const newStats = { ...state.stats };

    // Population growth based on available housing and happiness
    if (newStats.maxPopulation > 0) {
      const growthRate = (newStats.happiness / 100) * 0.05 * state.gameSpeed;
      const potentialGrowth = Math.max(1, Math.floor(
        (newStats.maxPopulation - newStats.population) * growthRate
      ));
      newStats.population = Math.min(
        newStats.maxPopulation,
        newStats.population + potentialGrowth
      );
    }

    // Calculate income and expenses
    let income = 0;
    let expenses = 0;

    state.buildings.forEach((building) => {
      if (building.type.income) {
        income += building.type.income;
      }
      if (building.type.powerConsumption) {
        expenses += building.type.powerConsumption * 0.5;
      }
    });

    // Tax income from population
    income += newStats.population * 1;

    newStats.income = Math.floor(income);
    newStats.expenses = Math.floor(expenses);
    newStats.money += Math.floor((income - expenses) * state.gameSpeed);

    // Update unemployment
    newStats.unemployed = Math.max(0, newStats.population - newStats.jobs);

    // Update happiness based on various factors
    let happinessChange = 0;
    if (newStats.power >= newStats.powerDemand) {
      happinessChange += 0.5;
    } else if (newStats.powerDemand > 0) {
      happinessChange -= 3;
    }
    if (newStats.unemployed > newStats.population * 0.1) {
      happinessChange -= 1;
    }
    if (newStats.pollution > 50) {
      happinessChange -= newStats.pollution / 50;
    }
    if (newStats.population > 0 && newStats.jobs > newStats.population * 0.8) {
      happinessChange += 0.5;
    }

    newStats.happiness = Math.min(100, Math.max(10, newStats.happiness + happinessChange * 0.1));

    // Advance time
    let newTimeOfDay = state.timeOfDay + 0.1 * state.gameSpeed;
    if (newTimeOfDay >= 24) {
      newTimeOfDay = 0;
      newStats.day += 1;
    }

    // Determine weather
    let weather = state.weather;
    if (Math.random() > 0.995) {
      const weathers: ('clear' | 'cloudy' | 'rain')[] = ['clear', 'clear', 'clear', 'cloudy', 'rain'];
      weather = weathers[Math.floor(Math.random() * weathers.length)];
    }

    set({
      stats: newStats,
      timeOfDay: newTimeOfDay,
      weather,
    });
  },

  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),

  saveGame: () => {
    const state = get();
    const saveData = {
      buildings: state.buildings,
      stats: state.stats,
      gridSize: state.gridSize,
      timeOfDay: state.timeOfDay,
    };
    return btoa(JSON.stringify(saveData));
  },

  loadGame: (saveData: string) => {
    try {
      const data = JSON.parse(atob(saveData));
      get().initializeGame(data.gridSize.width, data.gridSize.height, data.stats.cityName);

      // Rebuild tiles with buildings
      const tiles = get().tiles;
      const newTiles = new Map(tiles);

      data.buildings.forEach((building: Building) => {
        for (let dx = 0; dx < building.type.width; dx++) {
          for (let dy = 0; dy < building.type.height; dy++) {
            const key = getTileKey(building.x + dx, building.y + dy);
            const tile = newTiles.get(key);
            if (tile) {
              newTiles.set(key, { ...tile, building, zoneType: building.type.category });
            }
          }
        }
      });

      set({
        tiles: newTiles,
        buildings: data.buildings,
        stats: data.stats,
        timeOfDay: data.timeOfDay || 10,
      });

      return true;
    } catch {
      return false;
    }
  },

  resetGame: () => {
    set({ isInitialized: false });
  },

  getAvailableBuildings: () => {
    const { stats } = get();
    return BUILDING_TYPES.filter(
      (b) => !b.unlockPopulation || stats.population >= b.unlockPopulation
    );
  },

  canAfford: (cost: number) => get().stats.money >= cost,

  getTile: (x: number, y: number) => get().tiles.get(getTileKey(x, y)),
}));
