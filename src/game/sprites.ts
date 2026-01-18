// SimCity 3000 Style Sprite Manager
// Loads actual sprite images from Kenney's CC0 isometric asset packs

// Kenney's sprites are 132x83, we'll use them at native size for quality
export const SPRITE_WIDTH = 132;
export const SPRITE_HEIGHT = 66; // Base tile height (the isometric diamond)
export const SPRITE_DEPTH = 17;  // Height per elevation level

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

  private async loadAllSprites(): Promise<void> {
    const promises = Object.entries(SPRITE_MAPPINGS).map(([name, src]) =>
      this.loadImage(name, src)
    );
    await Promise.all(promises);
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
  getBuilding(zone: string, level: number): HTMLImageElement | null {
    const zonePrefix = zone === 'residential' ? 'res' :
                       zone === 'commercial' ? 'com' : 'ind';
    const clampedLevel = Math.max(1, Math.min(8, level));
    return this.get(`building_${zonePrefix}_${clampedLevel}`);
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
