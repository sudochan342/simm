// SimCity 3000 Style Sprite Manager
// Uses Kenney's CC0 assets for terrain/roads and Screaming Brain Studios town tiles for buildings

// Kenney's sprites are 132x83, we'll use them at native size for quality
export const SPRITE_WIDTH = 132;
export const SPRITE_HEIGHT = 66; // Base tile height (the isometric diamond)
export const SPRITE_DEPTH = 17;  // Height per elevation level

// Town building tile dimensions (from Screaming Brain Studios pack)
export const BUILDING_TILE_WIDTH = 64;
export const BUILDING_TILE_HEIGHT = 96;
export const BUILDING_SHEET_COLS = 18;
export const BUILDING_SHEET_ROWS = 8;

// Building sprite sheet definitions
const BUILDING_SHEETS = {
  buildings1: '/sprites/town_tiles/Building Tiles/Isometric Buildings 1 - 64x96.png',
  buildings2: '/sprites/town_tiles/Building Tiles/Isometric Buildings 2 - 64x96.png',
  buildings3: '/sprites/town_tiles/Building Tiles/Isometric Buildings 3 - 64x96.png',
  roofs: '/sprites/town_tiles/Roof Tiles/Isometric Town Roofing - 143x92.png',
};

// Sprite mappings from Kenney asset packs
// landscapeTiles: grass, water, dirt, trees, etc.
// cityTiles: roads, buildings, infrastructure

const SPRITE_MAPPINGS = {
  // Terrain - from isometric landscape pack
  grass_0: '/sprites/PNG/landscapeTiles_067.png', // grass
  grass_1: '/sprites/PNG/landscapeTiles_068.png', // grass variant
  grass_2: '/sprites/PNG/landscapeTiles_067.png', // grass
  grass_3: '/sprites/PNG/landscapeTiles_068.png', // grass variant
  water: '/sprites/PNG/landscapeTiles_073.png',   // water
  dirt: '/sprites/PNG/landscapeTiles_070.png',    // dirt/sand

  // Trees
  tree_0: '/sprites/PNG/landscapeTiles_081.png',  // small tree
  tree_1: '/sprites/PNG/landscapeTiles_082.png',  // medium tree
  tree_2: '/sprites/PNG/landscapeTiles_083.png',  // large tree

  // Roads - from isometric city pack
  road_0: '/sprites/PNG/cityTiles_073.png',   // road isolated
  road_1: '/sprites/PNG/cityTiles_079.png',   // road N
  road_2: '/sprites/PNG/cityTiles_075.png',   // road E
  road_3: '/sprites/PNG/cityTiles_080.png',   // road NE corner
  road_4: '/sprites/PNG/cityTiles_076.png',   // road S
  road_5: '/sprites/PNG/cityTiles_074.png',   // road NS
  road_6: '/sprites/PNG/cityTiles_081.png',   // road SE corner
  road_7: '/sprites/PNG/cityTiles_086.png',   // road NSE T
  road_8: '/sprites/PNG/cityTiles_078.png',   // road W
  road_9: '/sprites/PNG/cityTiles_082.png',   // road NW corner
  road_10: '/sprites/PNG/cityTiles_077.png',  // road EW
  road_11: '/sprites/PNG/cityTiles_087.png',  // road NEW T
  road_12: '/sprites/PNG/cityTiles_083.png',  // road SW corner
  road_13: '/sprites/PNG/cityTiles_088.png',  // road NSW T
  road_14: '/sprites/PNG/cityTiles_089.png',  // road SEW T
  road_15: '/sprites/PNG/cityTiles_090.png',  // road 4-way

  // Parking/plaza tiles for zones
  parking_0: '/sprites/PNG/cityTiles_091.png', // parking lot
  parking_1: '/sprites/PNG/cityTiles_092.png', // parking variant

  // Buildings - various sizes from city pack
  building_res_1: '/sprites/PNG/cityTiles_000.png',  // small house
  building_res_2: '/sprites/PNG/cityTiles_001.png',  // house variant
  building_res_3: '/sprites/PNG/cityTiles_002.png',  // apartment
  building_res_4: '/sprites/PNG/cityTiles_003.png',  // apartment variant
  building_res_5: '/sprites/PNG/cityTiles_004.png',  // larger apartment
  building_res_6: '/sprites/PNG/cityTiles_005.png',  // high rise
  building_res_7: '/sprites/PNG/cityTiles_006.png',  // high rise variant
  building_res_8: '/sprites/PNG/cityTiles_007.png',  // tower

  building_com_1: '/sprites/PNG/cityTiles_012.png',  // small shop
  building_com_2: '/sprites/PNG/cityTiles_013.png',  // shop variant
  building_com_3: '/sprites/PNG/cityTiles_014.png',  // office
  building_com_4: '/sprites/PNG/cityTiles_015.png',  // office variant
  building_com_5: '/sprites/PNG/cityTiles_016.png',  // larger office
  building_com_6: '/sprites/PNG/cityTiles_017.png',  // commercial tower
  building_com_7: '/sprites/PNG/cityTiles_018.png',  // skyscraper
  building_com_8: '/sprites/PNG/cityTiles_019.png',  // tall skyscraper

  building_ind_1: '/sprites/PNG/cityTiles_024.png',  // small warehouse
  building_ind_2: '/sprites/PNG/cityTiles_025.png',  // warehouse variant
  building_ind_3: '/sprites/PNG/cityTiles_026.png',  // factory
  building_ind_4: '/sprites/PNG/cityTiles_027.png',  // factory variant
  building_ind_5: '/sprites/PNG/cityTiles_028.png',  // larger factory
  building_ind_6: '/sprites/PNG/cityTiles_029.png',  // industrial complex
  building_ind_7: '/sprites/PNG/cityTiles_030.png',  // heavy industry
  building_ind_8: '/sprites/PNG/cityTiles_031.png',  // large industrial

  // Civic buildings
  civic_police: '/sprites/PNG/cityTiles_036.png',
  civic_fire: '/sprites/PNG/cityTiles_037.png',
  civic_hospital: '/sprites/PNG/cityTiles_038.png',
  civic_school: '/sprites/PNG/cityTiles_039.png',
  civic_city_hall: '/sprites/PNG/cityTiles_040.png',
  civic_park: '/sprites/PNG/landscapeTiles_081.png', // use tree tile for park

  // Power/utilities
  power_coal: '/sprites/PNG/cityTiles_044.png',
  power_nuclear: '/sprites/PNG/cityTiles_045.png',
  power_solar: '/sprites/PNG/cityTiles_046.png',
  water_pump: '/sprites/PNG/cityTiles_048.png',
  water_tower: '/sprites/PNG/cityTiles_049.png',

  // Infrastructure
  power_line: '/sprites/PNG/cityTiles_052.png',
  rail: '/sprites/PNG/cityTiles_056.png',
  highway: '/sprites/PNG/cityTiles_060.png',
};

// Sprite cache
class SpriteManager {
  private cache = new Map<string, HTMLImageElement>();
  private sheets = new Map<string, HTMLImageElement>();
  private loadPromises = new Map<string, Promise<void>>();
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  // Initialize - load all sprites
  async init(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.loadAllSprites();
    await this.initPromise;
    this.initialized = true;
  }

  isReady(): boolean {
    return this.initialized;
  }

  private async loadAllSprites(): Promise<void> {
    // Load individual sprites
    const spritePromises = Object.entries(SPRITE_MAPPINGS).map(([name, src]) =>
      this.loadImage(name, src)
    );

    // Load sprite sheets
    const sheetPromises = Object.entries(BUILDING_SHEETS).map(([name, src]) =>
      this.loadSheet(name, src)
    );

    await Promise.all([...spritePromises, ...sheetPromises]);
  }

  private loadSheet(name: string, src: string): Promise<void> {
    const key = `sheet_${name}`;
    if (this.loadPromises.has(key)) {
      return this.loadPromises.get(key)!;
    }

    const promise = new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.sheets.set(name, img);
        resolve();
      };
      img.onerror = () => {
        console.warn(`Failed to load sprite sheet: ${name} from ${src}`);
        resolve();
      };
      img.src = src;
    });

    this.loadPromises.set(key, promise);
    return promise;
  }

  private loadImage(name: string, src: string): Promise<void> {
    if (this.loadPromises.has(name)) {
      return this.loadPromises.get(name)!;
    }

    const promise = new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.cache.set(name, img);
        resolve();
      };
      img.onerror = () => {
        console.warn(`Failed to load sprite: ${name} from ${src}`);
        resolve(); // Resolve anyway so we don't block
      };
      img.src = src;
    });

    this.loadPromises.set(name, promise);
    return promise;
  }

  // Get a cached sprite image
  get(name: string): HTMLImageElement | null {
    return this.cache.get(name) || null;
  }

  // Check if sprite exists
  has(name: string): boolean {
    return this.cache.has(name);
  }

  // Get road sprite based on connection mask
  getRoad(mask: number): HTMLImageElement | null {
    return this.get(`road_${mask}`);
  }

  // Get building sprite based on zone type, density, and development level
  // Returns null - use drawBuildingTile instead for sprite sheet buildings
  getBuilding(zone: string, level: number): HTMLImageElement | null {
    // Legacy method - return null to trigger sprite sheet rendering
    return null;
  }

  // Get a sprite sheet by name
  getSheet(name: string): HTMLImageElement | null {
    return this.sheets.get(name) || null;
  }

  // Draw a building tile from a sprite sheet directly to a canvas context
  // sheetIndex: 0 = buildings1, 1 = buildings2, 2 = buildings3
  // tileIndex: 0-143 (18 cols x 8 rows per sheet)
  drawBuildingTile(
    ctx: CanvasRenderingContext2D,
    sheetIndex: number,
    tileIndex: number,
    destX: number,
    destY: number,
    scale: number = 1
  ): boolean {
    const sheetNames = ['buildings1', 'buildings2', 'buildings3'];
    const sheetName = sheetNames[sheetIndex];
    const sheet = this.sheets.get(sheetName);

    if (!sheet) return false;

    const col = tileIndex % BUILDING_SHEET_COLS;
    const row = Math.floor(tileIndex / BUILDING_SHEET_COLS);
    const srcX = col * BUILDING_TILE_WIDTH;
    const srcY = row * BUILDING_TILE_HEIGHT;

    ctx.drawImage(
      sheet,
      srcX, srcY, BUILDING_TILE_WIDTH, BUILDING_TILE_HEIGHT,
      destX, destY, BUILDING_TILE_WIDTH * scale, BUILDING_TILE_HEIGHT * scale
    );

    return true;
  }

  // Get building tile info based on zone and level
  // Returns { sheetIndex, tileIndex } for the appropriate building
  getBuildingTileInfo(zone: string, level: number, seed: number = 0): { sheetIndex: number; tileIndex: number } {
    // Map zone types and development levels to specific tiles in the sprite sheets
    // Each sheet has 144 tiles (18x8), 432 total across 3 sheets
    // We'll pick tiles that look appropriate for each zone/level combo

    const clampedLevel = Math.max(1, Math.min(8, level));

    // Use seed for variety within same level
    const variant = seed % 6;

    // Residential: Lower rows (smaller buildings) for lower levels
    // Commercial: Middle area tiles
    // Industrial: More utilitarian looking tiles
    if (zone === 'residential') {
      // Residential buildings - use sheet 1, rows based on level
      const row = Math.min(7, Math.floor((clampedLevel - 1) / 2) + variant % 2);
      const col = (clampedLevel + variant) % 18;
      return { sheetIndex: 0, tileIndex: row * 18 + col };
    } else if (zone === 'commercial') {
      // Commercial buildings - use sheet 2
      const row = Math.min(7, Math.floor((clampedLevel - 1) / 2) + variant % 2);
      const col = (clampedLevel + variant * 2) % 18;
      return { sheetIndex: 1, tileIndex: row * 18 + col };
    } else {
      // Industrial buildings - use sheet 3
      const row = Math.min(7, Math.floor((clampedLevel - 1) / 2));
      const col = (clampedLevel + variant * 3) % 18;
      return { sheetIndex: 2, tileIndex: row * 18 + col };
    }
  }

  // Get grass sprite variant
  getGrass(variant: number): HTMLImageElement | null {
    return this.get(`grass_${variant % 4}`);
  }

  // Get tree sprite variant
  getTree(variant: number): HTMLImageElement | null {
    return this.get(`tree_${variant % 3}`);
  }
}

// Singleton instance
export const sprites = new SpriteManager();

// Initialize sprites when module loads (client-side only)
if (typeof window !== 'undefined') {
  // Initialize asynchronously
  sprites.init().catch(console.error);
}
