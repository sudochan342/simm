import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
}

const createInitialStats = (cityName: string): CityStats => ({
  population: 0,
  maxPopulation: 0,
  money: 10000,
  income: 0,
  expenses: 0,
  happiness: 50,
  pollution: 0,
  power: 0,
  powerDemand: 0,
  jobs: 0,
  unemployed: 0,
  day: 1,
  cityName,
});

const createTile = (x: number, y: number): Tile => ({
  x,
  y,
  terrain: Math.random() > 0.95 ? 'water' : 'grass',
  building: null,
  zoneType: null,
});

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      tiles: new Map(),
      buildings: [],
      stats: createInitialStats('New City'),
      selectedTool: null,
      gameSpeed: 1,
      isPaused: false,
      camera: { x: 0, y: 0, zoom: 1 },
      gridSize: { width: 50, height: 50 },
      showGrid: true,
      timeOfDay: 12,
      weather: 'clear',

      initializeGame: (width: number, height: number, cityName = 'New City') => {
        const tiles = new Map<string, Tile>();

        // Create terrain with some variation
        for (let x = 0; x < width; x++) {
          for (let y = 0; y < height; y++) {
            const tile = createTile(x, y);

            // Create some water features
            const distFromCenter = Math.sqrt(
              Math.pow(x - width / 2, 2) + Math.pow(y - height / 2, 2)
            );
            if (distFromCenter > width * 0.4 && Math.random() > 0.7) {
              tile.terrain = 'water';
            }

            // Create a river
            if (Math.abs(y - height / 2 + Math.sin(x / 5) * 3) < 2 && Math.random() > 0.3) {
              tile.terrain = 'water';
            }

            tiles.set(getTileKey(x, y), tile);
          }
        }

        set({
          tiles,
          buildings: [],
          stats: createInitialStats(cityName),
          gridSize: { width, height },
          camera: { x: width * 16, y: height * 8, zoom: 1 },
          selectedTool: null,
          isPaused: false,
          gameSpeed: 1,
          timeOfDay: 12,
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
          powered: false,
          connected: false,
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
          newStats.pollution += buildingType.pollution;
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
          newStats.pollution -= buildingType.pollution;
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
        if (state.isPaused) return;

        const newStats = { ...state.stats };

        // Population growth based on available housing and happiness
        const growthRate = (newStats.happiness / 100) * 0.1 * state.gameSpeed;
        const potentialGrowth = Math.floor(
          (newStats.maxPopulation - newStats.population) * growthRate
        );
        newStats.population = Math.min(
          newStats.maxPopulation,
          newStats.population + Math.max(1, potentialGrowth)
        );

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
        income += newStats.population * 0.5;

        newStats.income = Math.floor(income);
        newStats.expenses = Math.floor(expenses);
        newStats.money += Math.floor((income - expenses) * state.gameSpeed);

        // Update unemployment
        newStats.unemployed = Math.max(0, newStats.population - newStats.jobs);

        // Update happiness based on various factors
        let happinessChange = 0;
        if (newStats.power >= newStats.powerDemand) {
          happinessChange += 1;
        } else {
          happinessChange -= 5;
        }
        if (newStats.unemployed > newStats.population * 0.1) {
          happinessChange -= 2;
        }
        if (newStats.pollution > 50) {
          happinessChange -= newStats.pollution / 25;
        }

        newStats.happiness = Math.min(100, Math.max(0, newStats.happiness + happinessChange * 0.1));

        // Advance time
        let newTimeOfDay = state.timeOfDay + 0.5 * state.gameSpeed;
        if (newTimeOfDay >= 24) {
          newTimeOfDay = 0;
          newStats.day += 1;
        }

        // Determine weather
        let weather = state.weather;
        if (Math.random() > 0.99) {
          const weathers: ('clear' | 'cloudy' | 'rain')[] = ['clear', 'cloudy', 'rain'];
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
          day: state.stats.day,
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
            timeOfDay: data.timeOfDay || 12,
          });

          return true;
        } catch {
          return false;
        }
      },

      resetGame: () => {
        get().initializeGame(50, 50, 'New City');
      },

      getAvailableBuildings: () => {
        const { stats } = get();
        return BUILDING_TYPES.filter(
          (b) => !b.unlockPopulation || stats.population >= b.unlockPopulation
        );
      },

      canAfford: (cost: number) => get().stats.money >= cost,

      getTile: (x: number, y: number) => get().tiles.get(getTileKey(x, y)),
    }),
    {
      name: 'simcity-game-storage',
      partialize: (state) => ({
        buildings: state.buildings,
        stats: state.stats,
        gridSize: state.gridSize,
        timeOfDay: state.timeOfDay,
      }),
    }
  )
);
