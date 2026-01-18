// SimCity 3000 Style Sprite Manager
// Pre-generates and caches isometric sprites for high-performance rendering

export const SPRITE_WIDTH = 64;
export const SPRITE_HEIGHT = 32;
export const SPRITE_DEPTH = 16;

// SC3000 authentic color palette
const SC3K = {
  // Grass variations
  grass1: '#3a8a2a',
  grass2: '#4a9a3a',
  grass3: '#2a7a1a',
  grass4: '#45953a',
  grassDark: '#2a6a1a',
  grassShadow: '#1a5a0a',

  // Water
  waterDeep: '#1a4878',
  waterMid: '#2a5888',
  waterShallow: '#3a78a8',
  waterHighlight: '#5a98c8',

  // Terrain
  dirt: '#8a7050',
  dirtLight: '#9a8060',
  sand: '#c8b898',

  // Roads
  road: '#484848',
  roadLight: '#585858',
  roadDark: '#383838',
  roadLine: '#e8d020',
  sidewalk: '#909090',

  // Rail
  railBed: '#5a5a5a',
  railTie: '#4a3020',
  railTrack: '#787878',

  // Power
  powerPole: '#505050',
  powerCross: '#404040',
  powerWire: '#303030',

  // Zone colors
  zoneResLight: '#80e080',
  zoneResMed: '#40c040',
  zoneResDense: '#209020',
  zoneComLight: '#80b0e0',
  zoneComMed: '#4080d0',
  zoneComDense: '#2050a0',
  zoneIndLight: '#e8e080',
  zoneIndMed: '#d0c040',
  zoneIndDense: '#a08020',

  // Buildings - Residential
  houseWall: '#e8d8c8',
  houseWallShade: '#c8b8a8',
  houseWallSide: '#b8a898',
  houseRoof: '#a04020',
  houseRoofShade: '#802010',
  aptWall: '#d0d0d0',
  aptWallShade: '#a0a0a0',

  // Buildings - Commercial
  officeWall: '#c8d0e0',
  officeWallShade: '#98a0b0',
  officeGlass: '#80b8e8',

  // Buildings - Industrial
  factoryWall: '#909080',
  factoryWallShade: '#606050',
  factoryRoof: '#484848',
  smokestackBrick: '#804020',

  // Trees
  treeTrunk: '#4a3020',
  treeLeaf1: '#2a6a1a',
  treeLeaf2: '#3a8a2a',
  treeLeaf3: '#4a9a3a',

  // Civic buildings
  schoolWall: '#d0a070',
  schoolRoof: '#803010',
  hospitalWall: '#f0f0f0',
  hospitalCross: '#cc0000',
  policeWall: '#3050a0',
  fireWall: '#a03030',
  civicWall: '#f0f0d0',

  // Power plants
  powerPlantWall: '#686868',
  nuclearDome: '#b0b0b0',
};

// Sprite cache
class SpriteManager {
  private cache = new Map<string, HTMLCanvasElement>();
  private initialized = false;

  // Initialize all sprites
  init(): void {
    if (this.initialized) return;

    // Terrain sprites
    for (let v = 0; v < 4; v++) {
      this.generateGrassSprite(v);
    }
    this.generateWaterSprite();
    this.generateDirtSprite();

    // Infrastructure sprites
    this.generateRoadSprites();
    this.generateRailSprite();
    this.generatePowerLineSprite();
    this.generateWaterPipeSprite();
    this.generateHighwaySprite();

    // Zone overlays
    for (const zone of ['residential', 'commercial', 'industrial']) {
      for (const density of ['light', 'medium', 'dense']) {
        this.generateZoneSprite(zone, density);
      }
    }

    // Tree sprites
    for (let size = 0; size < 3; size++) {
      this.generateTreeSprite(size);
    }

    // Residential buildings (levels 1-8)
    for (let level = 1; level <= 8; level++) {
      this.generateResidentialSprite(level, 'light');
      this.generateResidentialSprite(level, 'medium');
      this.generateResidentialSprite(level, 'dense');
    }

    // Commercial buildings
    for (let level = 1; level <= 8; level++) {
      this.generateCommercialSprite(level, 'light');
      this.generateCommercialSprite(level, 'medium');
      this.generateCommercialSprite(level, 'dense');
    }

    // Industrial buildings
    for (let level = 1; level <= 8; level++) {
      this.generateIndustrialSprite(level, 'light');
      this.generateIndustrialSprite(level, 'medium');
      this.generateIndustrialSprite(level, 'dense');
    }

    // Civic buildings
    this.generateCivicSprite('police');
    this.generateCivicSprite('fire');
    this.generateCivicSprite('hospital');
    this.generateCivicSprite('school');
    this.generateCivicSprite('city_hall');
    this.generateCivicSprite('park');

    // Power plants
    this.generatePowerPlantSprite('coal');
    this.generatePowerPlantSprite('nuclear');
    this.generatePowerPlantSprite('solar');

    // Water facilities
    this.generateWaterFacilitySprite('pump');
    this.generateWaterFacilitySprite('tower');

    this.initialized = true;
  }

  // Get a cached sprite
  get(name: string): HTMLCanvasElement | null {
    return this.cache.get(name) || null;
  }

  // Create offscreen canvas
  private createCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    return [canvas, ctx];
  }

  // Draw isometric tile diamond
  private drawIsoDiamond(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    color: string
  ): void {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + SPRITE_WIDTH / 2, cy + SPRITE_HEIGHT / 2);
    ctx.lineTo(cx, cy + SPRITE_HEIGHT);
    ctx.lineTo(cx - SPRITE_WIDTH / 2, cy + SPRITE_HEIGHT / 2);
    ctx.closePath();
    ctx.fill();
  }

  // Draw 3D building box
  private draw3DBox(
    ctx: CanvasRenderingContext2D,
    cx: number,
    baseY: number,
    width: number,
    height: number,
    frontColor: string,
    sideColor: string,
    topColor: string
  ): void {
    const halfW = width / 2;
    const depth = width / 3;

    // Front face
    ctx.fillStyle = frontColor;
    ctx.beginPath();
    ctx.moveTo(cx - halfW + depth / 2, baseY);
    ctx.lineTo(cx + halfW - depth / 2, baseY);
    ctx.lineTo(cx + halfW - depth / 2, baseY - height);
    ctx.lineTo(cx - halfW + depth / 2, baseY - height);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = this.adjustColor(frontColor, -35);
    ctx.lineWidth = 1;
    ctx.stroke();

    // Right face
    ctx.fillStyle = sideColor;
    ctx.beginPath();
    ctx.moveTo(cx + halfW - depth / 2, baseY);
    ctx.lineTo(cx + halfW, baseY - depth / 2);
    ctx.lineTo(cx + halfW, baseY - height - depth / 2);
    ctx.lineTo(cx + halfW - depth / 2, baseY - height);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Top face
    ctx.fillStyle = topColor;
    ctx.beginPath();
    ctx.moveTo(cx - halfW + depth / 2, baseY - height);
    ctx.lineTo(cx + halfW - depth / 2, baseY - height);
    ctx.lineTo(cx + halfW, baseY - height - depth / 2);
    ctx.lineTo(cx - halfW + depth, baseY - height - depth / 2);
    ctx.closePath();
    ctx.fill();
  }

  // Seeded random
  private seedRandom(seed: number): () => number {
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  // Adjust color brightness
  private adjustColor(color: string, amount: number): string {
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = Math.max(0, Math.min(255, parseInt(hex.slice(0, 2), 16) + amount));
      const g = Math.max(0, Math.min(255, parseInt(hex.slice(2, 4), 16) + amount));
      const b = Math.max(0, Math.min(255, parseInt(hex.slice(4, 6), 16) + amount));
      return `rgb(${r}, ${g}, ${b})`;
    }
    return color;
  }

  // === TERRAIN SPRITES ===

  private generateGrassSprite(variant: number): void {
    const [canvas, ctx] = this.createCanvas(SPRITE_WIDTH, SPRITE_HEIGHT + 8);
    const cx = SPRITE_WIDTH / 2;
    const cy = 4;

    const colors = [SC3K.grass1, SC3K.grass2, SC3K.grass3, SC3K.grass4];
    const baseColor = colors[variant];

    // Draw tile
    this.drawIsoDiamond(ctx, cx, cy, baseColor);

    // Add grass texture dots
    const random = this.seedRandom(variant * 1000);
    ctx.fillStyle = SC3K.grassDark;
    for (let i = 0; i < 8; i++) {
      const px = cx + (random() - 0.5) * 40;
      const py = cy + SPRITE_HEIGHT / 2 + (random() - 0.5) * 16;
      ctx.fillRect(Math.floor(px), Math.floor(py), 2, 2);
    }

    // Lighter spots
    ctx.fillStyle = colors[(variant + 1) % 4];
    for (let i = 0; i < 4; i++) {
      const px = cx + (random() - 0.5) * 30;
      const py = cy + SPRITE_HEIGHT / 2 + (random() - 0.5) * 12;
      ctx.fillRect(Math.floor(px), Math.floor(py), 2, 1);
    }

    this.cache.set(`grass_${variant}`, canvas);
  }

  private generateWaterSprite(): void {
    const [canvas, ctx] = this.createCanvas(SPRITE_WIDTH, SPRITE_HEIGHT + 8);
    const cx = SPRITE_WIDTH / 2;
    const cy = 4;

    // Water gradient
    const gradient = ctx.createLinearGradient(cx - 20, cy, cx + 20, cy + SPRITE_HEIGHT);
    gradient.addColorStop(0, SC3K.waterShallow);
    gradient.addColorStop(0.5, SC3K.waterMid);
    gradient.addColorStop(1, SC3K.waterDeep);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + SPRITE_WIDTH / 2, cy + SPRITE_HEIGHT / 2);
    ctx.lineTo(cx, cy + SPRITE_HEIGHT);
    ctx.lineTo(cx - SPRITE_WIDTH / 2, cy + SPRITE_HEIGHT / 2);
    ctx.closePath();
    ctx.fill();

    // Wave highlights
    ctx.strokeStyle = SC3K.waterHighlight;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.moveTo(cx - 15, cy + SPRITE_HEIGHT / 2 - 2);
    ctx.quadraticCurveTo(cx, cy + SPRITE_HEIGHT / 2 - 4, cx + 15, cy + SPRITE_HEIGHT / 2 - 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Sparkle
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.ellipse(cx - 6, cy + SPRITE_HEIGHT / 3, 4, 2, 0.3, 0, Math.PI * 2);
    ctx.fill();

    this.cache.set('water', canvas);
  }

  private generateDirtSprite(): void {
    const [canvas, ctx] = this.createCanvas(SPRITE_WIDTH, SPRITE_HEIGHT + 8);
    const cx = SPRITE_WIDTH / 2;
    const cy = 4;

    this.drawIsoDiamond(ctx, cx, cy, SC3K.dirt);

    // Dirt texture
    const random = this.seedRandom(12345);
    ctx.fillStyle = '#6a5040';
    for (let i = 0; i < 6; i++) {
      const px = cx + (random() - 0.5) * 35;
      const py = cy + SPRITE_HEIGHT / 2 + (random() - 0.5) * 14;
      ctx.fillRect(Math.floor(px), Math.floor(py), 3, 2);
    }

    this.cache.set('dirt', canvas);
  }

  // === INFRASTRUCTURE SPRITES ===

  private generateRoadSprites(): void {
    // Generate all road connection variants (16 total)
    for (let mask = 0; mask < 16; mask++) {
      const n = !!(mask & 1);
      const e = !!(mask & 2);
      const s = !!(mask & 4);
      const w = !!(mask & 8);
      this.generateRoadVariant(mask, n, e, s, w);
    }
  }

  private generateRoadVariant(mask: number, n: boolean, e: boolean, s: boolean, w: boolean): void {
    const [canvas, ctx] = this.createCanvas(SPRITE_WIDTH, SPRITE_HEIGHT + 12);
    const cx = SPRITE_WIDTH / 2;
    const cy = 6;

    // Sidewalk base (slightly larger than road)
    ctx.fillStyle = SC3K.sidewalk;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 2);
    ctx.lineTo(cx + 28, cy + SPRITE_HEIGHT / 2 + 2);
    ctx.lineTo(cx, cy + SPRITE_HEIGHT + 2);
    ctx.lineTo(cx - 28, cy + SPRITE_HEIGHT / 2 + 2);
    ctx.closePath();
    ctx.fill();

    // Road surface
    ctx.fillStyle = SC3K.road;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 4);
    ctx.lineTo(cx + 22, cy + SPRITE_HEIGHT / 2 + 2);
    ctx.lineTo(cx, cy + SPRITE_HEIGHT);
    ctx.lineTo(cx - 22, cy + SPRITE_HEIGHT / 2 + 2);
    ctx.closePath();
    ctx.fill();

    // Yellow center line
    ctx.strokeStyle = SC3K.roadLine;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);

    // Draw lines based on connections
    if ((n && s) || (!e && !w)) {
      // North-South line
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy + SPRITE_HEIGHT / 4 + 2);
      ctx.lineTo(cx + 8, cy + SPRITE_HEIGHT * 3 / 4 + 2);
      ctx.stroke();
    }
    if ((e && w) || (!n && !s)) {
      // East-West line
      ctx.beginPath();
      ctx.moveTo(cx - 14, cy + SPRITE_HEIGHT / 2 + 2);
      ctx.lineTo(cx + 14, cy + SPRITE_HEIGHT / 2 + 2);
      ctx.stroke();
    }

    ctx.setLineDash([]);
    this.cache.set(`road_${mask}`, canvas);
  }

  private generateHighwaySprite(): void {
    const [canvas, ctx] = this.createCanvas(SPRITE_WIDTH, SPRITE_HEIGHT + 12);
    const cx = SPRITE_WIDTH / 2;
    const cy = 4;

    // Highway surface (wider)
    ctx.fillStyle = '#404040';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 2);
    ctx.lineTo(cx + SPRITE_WIDTH / 2 - 4, cy + SPRITE_HEIGHT / 2 - 2);
    ctx.lineTo(cx, cy + SPRITE_HEIGHT - 2);
    ctx.lineTo(cx - SPRITE_WIDTH / 2 + 4, cy + SPRITE_HEIGHT / 2 - 2);
    ctx.closePath();
    ctx.fill();

    // Edge lines
    ctx.strokeStyle = '#606060';
    ctx.lineWidth = 2;
    ctx.stroke();

    // White dashed lines
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(cx - SPRITE_WIDTH / 4, cy + SPRITE_HEIGHT / 4);
    ctx.lineTo(cx + SPRITE_WIDTH / 4, cy + SPRITE_HEIGHT * 3 / 4);
    ctx.stroke();
    ctx.setLineDash([]);

    this.cache.set('highway', canvas);
  }

  private generateRailSprite(): void {
    const [canvas, ctx] = this.createCanvas(SPRITE_WIDTH, SPRITE_HEIGHT + 12);
    const cx = SPRITE_WIDTH / 2;
    const cy = 6;

    // Rail bed
    ctx.fillStyle = SC3K.railBed;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 4);
    ctx.lineTo(cx + 18, cy + SPRITE_HEIGHT / 2 + 2);
    ctx.lineTo(cx, cy + SPRITE_HEIGHT);
    ctx.lineTo(cx - 18, cy + SPRITE_HEIGHT / 2 + 2);
    ctx.closePath();
    ctx.fill();

    // Wooden ties
    ctx.fillStyle = SC3K.railTie;
    for (let i = -3; i <= 3; i++) {
      ctx.fillRect(cx + i * 4 - 1, cy + SPRITE_HEIGHT / 2, 3, 6);
    }

    // Rails
    ctx.strokeStyle = SC3K.railTrack;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy + SPRITE_HEIGHT / 2);
    ctx.lineTo(cx + 12, cy + SPRITE_HEIGHT / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy + SPRITE_HEIGHT / 2 + 4);
    ctx.lineTo(cx + 12, cy + SPRITE_HEIGHT / 2 + 4);
    ctx.stroke();

    this.cache.set('rail', canvas);
  }

  private generatePowerLineSprite(): void {
    const [canvas, ctx] = this.createCanvas(SPRITE_WIDTH, SPRITE_HEIGHT + 40);
    const cx = SPRITE_WIDTH / 2;
    const cy = 36;

    // Pole
    ctx.fillStyle = SC3K.powerPole;
    ctx.beginPath();
    ctx.moveTo(cx - 5, cy + SPRITE_HEIGHT / 2);
    ctx.lineTo(cx, cy - 25);
    ctx.lineTo(cx + 5, cy + SPRITE_HEIGHT / 2);
    ctx.closePath();
    ctx.fill();

    // Crossbar
    ctx.fillStyle = SC3K.powerCross;
    ctx.fillRect(cx - 14, cy - 20, 28, 3);
    ctx.fillRect(cx - 10, cy - 14, 20, 2);

    // Insulators
    ctx.fillStyle = '#808080';
    ctx.fillRect(cx - 12, cy - 20, 3, 5);
    ctx.fillRect(cx + 9, cy - 20, 3, 5);
    ctx.fillRect(cx - 1, cy - 20, 3, 5);

    // Wires
    ctx.strokeStyle = SC3K.powerWire;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy - 14);
    ctx.quadraticCurveTo(cx - 10, cy + 5, cx - 10, cy + 18);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 10, cy - 14);
    ctx.quadraticCurveTo(cx + 10, cy + 5, cx + 10, cy + 18);
    ctx.stroke();

    this.cache.set('power_line', canvas);
  }

  private generateWaterPipeSprite(): void {
    const [canvas, ctx] = this.createCanvas(SPRITE_WIDTH, SPRITE_HEIGHT + 8);
    const cx = SPRITE_WIDTH / 2;
    const cy = 4 + SPRITE_HEIGHT / 2;

    // Underground pipe indicator
    ctx.fillStyle = 'rgba(0, 120, 220, 0.35)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0, 80, 180, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Pipe icon
    ctx.fillStyle = '#4090d0';
    ctx.fillRect(cx - 6, cy - 2, 12, 4);

    this.cache.set('water_pipe', canvas);
  }

  // === ZONE SPRITES ===

  private generateZoneSprite(zone: string, density: string): void {
    const [canvas, ctx] = this.createCanvas(SPRITE_WIDTH, SPRITE_HEIGHT + 8);
    const cx = SPRITE_WIDTH / 2;
    const cy = 4;

    // Get zone color
    let color: string;
    if (zone === 'residential') {
      color = density === 'dense' ? SC3K.zoneResDense :
              density === 'medium' ? SC3K.zoneResMed : SC3K.zoneResLight;
    } else if (zone === 'commercial') {
      color = density === 'dense' ? SC3K.zoneComDense :
              density === 'medium' ? SC3K.zoneComMed : SC3K.zoneComLight;
    } else {
      color = density === 'dense' ? SC3K.zoneIndDense :
              density === 'medium' ? SC3K.zoneIndMed : SC3K.zoneIndLight;
    }

    // Zone overlay
    ctx.globalAlpha = 0.55;
    this.drawIsoDiamond(ctx, cx, cy, color);
    ctx.globalAlpha = 1;

    // Diagonal stripes
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + SPRITE_WIDTH / 2, cy + SPRITE_HEIGHT / 2);
    ctx.lineTo(cx, cy + SPRITE_HEIGHT);
    ctx.lineTo(cx - SPRITE_WIDTH / 2, cy + SPRITE_HEIGHT / 2);
    ctx.closePath();
    ctx.clip();

    ctx.strokeStyle = this.adjustColor(color, -40);
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.4;
    for (let i = -SPRITE_WIDTH; i < SPRITE_WIDTH * 2; i += 8) {
      ctx.beginPath();
      ctx.moveTo(cx - SPRITE_WIDTH / 2 + i, cy - 10);
      ctx.lineTo(cx - SPRITE_WIDTH / 2 + i + 30, cy + SPRITE_HEIGHT + 10);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // Border
    ctx.strokeStyle = this.adjustColor(color, -50);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + SPRITE_WIDTH / 2, cy + SPRITE_HEIGHT / 2);
    ctx.lineTo(cx, cy + SPRITE_HEIGHT);
    ctx.lineTo(cx - SPRITE_WIDTH / 2, cy + SPRITE_HEIGHT / 2);
    ctx.closePath();
    ctx.stroke();

    const key = `zone_${zone.charAt(0)}_${density}`;
    this.cache.set(key, canvas);
  }

  // === TREE SPRITES ===

  private generateTreeSprite(sizeVariant: number): void {
    const sizes = [10, 14, 18];
    const size = sizes[sizeVariant];
    const [canvas, ctx] = this.createCanvas(SPRITE_WIDTH, size + 30);
    const cx = SPRITE_WIDTH / 2;
    const cy = canvas.height - 8;

    // Trunk
    ctx.fillStyle = SC3K.treeTrunk;
    ctx.fillRect(cx - 2, cy - size / 2, 4, size / 2 + 4);

    // Foliage layers
    const colors = [SC3K.treeLeaf1, SC3K.treeLeaf2, SC3K.treeLeaf3];
    for (let layer = 0; layer < 3; layer++) {
      const layerSize = size - layer * 3;
      const layerY = cy - size / 2 - layer * 4;
      ctx.fillStyle = colors[layer];
      ctx.beginPath();
      ctx.moveTo(cx, layerY - layerSize);
      ctx.lineTo(cx + layerSize * 0.8, layerY + 2);
      ctx.lineTo(cx - layerSize * 0.8, layerY + 2);
      ctx.closePath();
      ctx.fill();
    }

    // Highlight
    ctx.fillStyle = '#5aaa4a';
    ctx.beginPath();
    ctx.moveTo(cx, cy - size - 4);
    ctx.lineTo(cx - 3, cy - size / 2 - 2);
    ctx.lineTo(cx - 1, cy - size / 2 - 2);
    ctx.closePath();
    ctx.fill();

    this.cache.set(`tree_${sizeVariant}`, canvas);
  }

  // === BUILDING SPRITES ===

  private generateResidentialSprite(level: number, density: string): void {
    const isHouse = density === 'light' || level <= 2;
    const height = isHouse ? 18 + level * 3 : 30 + level * 12;
    const [canvas, ctx] = this.createCanvas(SPRITE_WIDTH, height + 30);
    const cx = SPRITE_WIDTH / 2;
    const baseY = canvas.height - 8;

    if (isHouse) {
      // Small house
      const w = 20 + level * 2;
      const h = 14 + level * 3;

      this.draw3DBox(ctx, cx, baseY, w, h, SC3K.houseWall, SC3K.houseWallShade, SC3K.houseWallSide);

      // Pitched roof
      ctx.fillStyle = SC3K.houseRoof;
      ctx.beginPath();
      ctx.moveTo(cx - w / 2 + 3, baseY - h);
      ctx.lineTo(cx, baseY - h - 10);
      ctx.lineTo(cx + w / 2 - 3, baseY - h);
      ctx.closePath();
      ctx.fill();

      // Roof side
      ctx.fillStyle = SC3K.houseRoofShade;
      ctx.beginPath();
      ctx.moveTo(cx, baseY - h - 10);
      ctx.lineTo(cx + w / 2 - 3, baseY - h);
      ctx.lineTo(cx + w / 2 + 5, baseY - h + 3);
      ctx.lineTo(cx + 4, baseY - h - 8);
      ctx.closePath();
      ctx.fill();

      // Door
      ctx.fillStyle = '#4a3020';
      ctx.fillRect(cx - 3, baseY - 5, 6, 7);

      // Windows
      ctx.fillStyle = '#a8d8f8';
      ctx.fillRect(cx - w / 3, baseY - h / 2 - 1, 4, 4);
      ctx.fillRect(cx + w / 3 - 4, baseY - h / 2 - 1, 4, 4);
    } else {
      // Apartment building
      const w = 26 + (density === 'dense' ? 4 : 0);
      const h = height;

      this.draw3DBox(ctx, cx, baseY, w, h, SC3K.aptWall, SC3K.aptWallShade, '#909090');

      // Flat roof
      ctx.fillStyle = '#686868';
      ctx.beginPath();
      ctx.moveTo(cx - w / 2 + 3, baseY - h);
      ctx.lineTo(cx + w / 2 - 3, baseY - h);
      ctx.lineTo(cx + w / 2 + 5, baseY - h + 3);
      ctx.lineTo(cx - w / 2 + 11, baseY - h + 3);
      ctx.closePath();
      ctx.fill();

      // Window grid
      const rows = Math.min(level + 2, 10);
      const cols = density === 'dense' ? 4 : 3;
      const random = this.seedRandom(level * 100 + density.charCodeAt(0));
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const wx = cx - (cols * 5) / 2 + c * 6;
          const wy = baseY - h + 6 + r * (h - 12) / rows;
          const lit = random() > 0.35;
          ctx.fillStyle = lit ? '#f8f8a0' : '#303040';
          ctx.fillRect(wx, wy, 4, 4);
        }
      }
    }

    this.cache.set(`res_${density}_${level}`, canvas);
  }

  private generateCommercialSprite(level: number, density: string): void {
    const isShop = density === 'light' || level <= 2;
    const height = isShop ? 18 + level * 4 : 40 + level * 14;
    const [canvas, ctx] = this.createCanvas(SPRITE_WIDTH, height + 35);
    const cx = SPRITE_WIDTH / 2;
    const baseY = canvas.height - 8;

    if (isShop) {
      // Small shop
      const w = 22 + level * 2;
      const h = 18 + level * 4;

      this.draw3DBox(ctx, cx, baseY, w, h, SC3K.officeWall, SC3K.officeWallShade, '#98a0b0');

      // Storefront
      ctx.fillStyle = SC3K.officeGlass;
      ctx.fillRect(cx - w / 3, baseY - 8, w * 0.6, 10);

      // Sign
      ctx.fillStyle = '#e03030';
      ctx.fillRect(cx - 7, baseY - h + 4, 14, 5);
    } else {
      // Office tower
      const w = density === 'dense' ? 34 : 28;
      const h = height;

      this.draw3DBox(ctx, cx, baseY, w, h, SC3K.officeWall, SC3K.officeWallShade, '#8090a0');

      // Glass curtain wall
      ctx.fillStyle = SC3K.officeGlass;
      ctx.globalAlpha = 0.4;
      ctx.fillRect(cx - w / 3 + 4, baseY - h + 8, w * 0.5, h - 16);
      ctx.globalAlpha = 1;

      // Window grid
      const rows = Math.min(level + 4, 14);
      const cols = density === 'dense' ? 5 : 4;
      const random = this.seedRandom(level * 200 + density.charCodeAt(0));
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const wx = cx - (cols * 5) / 2 + c * 6;
          const wy = baseY - h + 10 + r * (h - 20) / rows;
          ctx.fillStyle = random() > 0.2 ? '#ffffff' : '#404050';
          ctx.fillRect(wx, wy, 4, 4);
        }
      }

      // Antenna for tall buildings
      if (level >= 6) {
        ctx.fillStyle = '#ff3030';
        ctx.fillRect(cx - 1, baseY - h - 12, 2, 12);
      }
    }

    this.cache.set(`com_${density}_${level}`, canvas);
  }

  private generateIndustrialSprite(level: number, density: string): void {
    const isWarehouse = density === 'light' || level <= 2;
    const height = isWarehouse ? 18 + level * 3 : 35 + level * 7;
    const [canvas, ctx] = this.createCanvas(SPRITE_WIDTH, height + 45);
    const cx = SPRITE_WIDTH / 2;
    const baseY = canvas.height - 12;

    if (isWarehouse) {
      // Warehouse
      const w = 28;
      const h = 18 + level * 3;

      this.draw3DBox(ctx, cx, baseY, w, h, SC3K.factoryWall, SC3K.factoryWallShade, '#505040');

      // Sawtooth roof
      const teeth = 3;
      const tw = (w - 8) / teeth;
      for (let i = 0; i < teeth; i++) {
        ctx.fillStyle = SC3K.factoryRoof;
        ctx.beginPath();
        ctx.moveTo(cx - w / 2 + 4 + i * tw, baseY - h);
        ctx.lineTo(cx - w / 2 + 4 + i * tw + tw / 2, baseY - h - 8);
        ctx.lineTo(cx - w / 2 + 4 + (i + 1) * tw, baseY - h);
        ctx.closePath();
        ctx.fill();
      }

      // Loading dock
      ctx.fillStyle = '#383838';
      ctx.fillRect(cx - 8, baseY - 3, 16, 6);
    } else {
      // Heavy factory
      const w = density === 'dense' ? 38 : 32;
      const h = height;

      this.draw3DBox(ctx, cx, baseY, w, h, SC3K.factoryWall, SC3K.factoryWallShade, '#404030');

      // Smokestacks
      this.drawSmokestackOnCanvas(ctx, cx - 10, baseY - h + 8);
      if (level >= 4 || density === 'dense') {
        this.drawSmokestackOnCanvas(ctx, cx + 10, baseY - h + 8);
      }

      // Equipment on roof
      ctx.fillStyle = '#5a5a5a';
      ctx.fillRect(cx - 6, baseY - h - 6, 12, 8);

      // Pipes
      ctx.strokeStyle = '#6a6a6a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx - w / 3, baseY - h / 2);
      ctx.lineTo(cx + w / 3, baseY - h / 2);
      ctx.stroke();
    }

    this.cache.set(`ind_${density}_${level}`, canvas);
  }

  private drawSmokestackOnCanvas(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // Stack
    ctx.fillStyle = SC3K.smokestackBrick;
    ctx.fillRect(x - 4, y, 8, 20);

    // Top
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(x - 5, y - 2, 10, 4);

    // Smoke
    ctx.fillStyle = '#606060';
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(x, y - 8, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 3, y - 16, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x - 2, y - 26, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // === CIVIC BUILDING SPRITES ===

  private generateCivicSprite(type: string): void {
    let height = 40;
    if (type === 'park') height = 20;
    if (type === 'city_hall') height = 60;

    const [canvas, ctx] = this.createCanvas(SPRITE_WIDTH * 2, height + 50);
    const cx = SPRITE_WIDTH;
    const baseY = canvas.height - 12;

    switch (type) {
      case 'police':
        this.draw3DBox(ctx, cx, baseY, 36, 35, SC3K.policeWall, this.adjustColor(SC3K.policeWall, -25), this.adjustColor(SC3K.policeWall, -40));
        // Garage doors
        ctx.fillStyle = '#282828';
        ctx.fillRect(cx - 9, baseY - 3, 7, 8);
        ctx.fillRect(cx + 2, baseY - 3, 7, 8);
        // Badge
        ctx.fillStyle = '#ffd000';
        ctx.beginPath();
        ctx.arc(cx, baseY - 24, 6, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'fire':
        this.draw3DBox(ctx, cx, baseY, 36, 35, SC3K.fireWall, this.adjustColor(SC3K.fireWall, -25), this.adjustColor(SC3K.fireWall, -40));
        // Garage doors
        ctx.fillStyle = '#282828';
        ctx.fillRect(cx - 9, baseY - 3, 7, 8);
        ctx.fillRect(cx + 2, baseY - 3, 7, 8);
        // Bell/light
        ctx.fillStyle = '#ffd000';
        ctx.beginPath();
        ctx.arc(cx, baseY - 24, 6, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'hospital':
        this.draw3DBox(ctx, cx, baseY, 44, 45, SC3K.hospitalWall, '#c8c8c8', '#a0a0a0');
        // Red cross
        ctx.fillStyle = SC3K.hospitalCross;
        ctx.fillRect(cx - 3, baseY - 30, 6, 14);
        ctx.fillRect(cx - 7, baseY - 26, 14, 6);
        // Windows
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = '#a8e0f8';
          ctx.fillRect(cx - 16 + i * 10, baseY - 15, 6, 8);
        }
        // Entrance
        ctx.fillStyle = '#383838';
        ctx.fillRect(cx - 10, baseY - 3, 20, 8);
        break;

      case 'school':
        this.draw3DBox(ctx, cx, baseY, 44, 35, SC3K.schoolWall, this.adjustColor(SC3K.schoolWall, -25), SC3K.schoolRoof);
        // Clock
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, baseY - 20, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.stroke();
        // Flag
        ctx.fillStyle = '#808080';
        ctx.fillRect(cx + 14, baseY - 55, 2, 26);
        ctx.fillStyle = '#cc0000';
        ctx.beginPath();
        ctx.moveTo(cx + 16, baseY - 55);
        ctx.lineTo(cx + 26, baseY - 51);
        ctx.lineTo(cx + 16, baseY - 47);
        ctx.closePath();
        ctx.fill();
        break;

      case 'city_hall':
        this.draw3DBox(ctx, cx, baseY, 52, 50, SC3K.civicWall, '#c8c8a8', '#b0a080');
        // Columns
        ctx.fillStyle = '#e8e8d0';
        for (let i = -2; i <= 2; i++) {
          ctx.fillRect(cx + i * 8 - 2, baseY - 42, 4, 42);
        }
        // Steps
        ctx.fillStyle = '#d8d8c0';
        ctx.fillRect(cx - 20, baseY, 40, 4);
        ctx.fillRect(cx - 17, baseY + 4, 34, 3);
        // Flag
        ctx.fillStyle = '#808080';
        ctx.fillRect(cx, baseY - 68, 2, 22);
        ctx.fillStyle = '#0044aa';
        ctx.beginPath();
        ctx.moveTo(cx + 2, baseY - 68);
        ctx.lineTo(cx + 12, baseY - 64);
        ctx.lineTo(cx + 2, baseY - 60);
        ctx.closePath();
        ctx.fill();
        break;

      case 'park':
        // Grass base
        ctx.fillStyle = '#4a9a3a';
        ctx.beginPath();
        ctx.ellipse(cx, baseY, 28, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        // Trees
        const random = this.seedRandom(42);
        for (let i = 0; i < 3; i++) {
          const tx = cx + (random() - 0.5) * 40;
          const ty = baseY - 6 + (random() - 0.5) * 8;
          // Mini tree
          ctx.fillStyle = SC3K.treeTrunk;
          ctx.fillRect(tx - 1, ty, 2, 6);
          ctx.fillStyle = SC3K.treeLeaf2;
          ctx.beginPath();
          ctx.moveTo(tx, ty - 8);
          ctx.lineTo(tx + 6, ty + 2);
          ctx.lineTo(tx - 6, ty + 2);
          ctx.closePath();
          ctx.fill();
        }
        // Path
        ctx.strokeStyle = '#c0a080';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx - 20, baseY + 4);
        ctx.quadraticCurveTo(cx, baseY - 4, cx + 20, baseY + 4);
        ctx.stroke();
        break;
    }

    this.cache.set(`civic_${type}`, canvas);
  }

  // === POWER PLANT SPRITES ===

  private generatePowerPlantSprite(type: string): void {
    const [canvas, ctx] = this.createCanvas(SPRITE_WIDTH * 2, 100);
    const cx = SPRITE_WIDTH;
    const baseY = canvas.height - 12;

    this.draw3DBox(ctx, cx, baseY, 50, 40, SC3K.powerPlantWall, '#484848', '#383838');

    if (type === 'coal') {
      this.drawSmokestackOnCanvas(ctx, cx - 14, baseY - 32);
      this.drawSmokestackOnCanvas(ctx, cx + 14, baseY - 32);
      // Coal pile
      ctx.fillStyle = '#202020';
      ctx.beginPath();
      ctx.ellipse(cx + 25, baseY - 5, 10, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'nuclear') {
      // Cooling tower
      ctx.fillStyle = SC3K.nuclearDome;
      ctx.beginPath();
      ctx.moveTo(cx - 16, baseY);
      ctx.quadraticCurveTo(cx - 20, baseY - 30, cx - 12, baseY - 50);
      ctx.lineTo(cx + 12, baseY - 50);
      ctx.quadraticCurveTo(cx + 20, baseY - 30, cx + 16, baseY);
      ctx.closePath();
      ctx.fill();
      // Steam
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.arc(cx, baseY - 58, 12, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'solar') {
      // Solar panels
      ctx.fillStyle = '#2040a0';
      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.translate(cx - 20 + i * 20, baseY - 35);
        ctx.rotate(-0.3);
        ctx.fillRect(-8, -2, 16, 20);
        ctx.restore();
      }
      // Panel grid lines
      ctx.strokeStyle = '#4060c0';
      ctx.lineWidth = 1;
    }

    // Power output indicators
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(cx - 20, baseY - 4, 8, 4);
    ctx.fillRect(cx + 12, baseY - 4, 8, 4);

    this.cache.set(`power_${type}`, canvas);
  }

  // === WATER FACILITY SPRITES ===

  private generateWaterFacilitySprite(type: string): void {
    const [canvas, ctx] = this.createCanvas(SPRITE_WIDTH * 2, 80);
    const cx = SPRITE_WIDTH;
    const baseY = canvas.height - 12;

    if (type === 'tower') {
      // Legs
      ctx.fillStyle = '#505050';
      ctx.fillRect(cx - 14, baseY - 28, 4, 32);
      ctx.fillRect(cx + 10, baseY - 28, 4, 32);

      // Tank
      ctx.fillStyle = '#4090d0';
      ctx.beginPath();
      ctx.ellipse(cx, baseY - 48, 18, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(cx - 18, baseY - 48, 36, 18);
      ctx.beginPath();
      ctx.ellipse(cx, baseY - 30, 18, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.ellipse(cx - 6, baseY - 42, 4, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Pump station
      this.draw3DBox(ctx, cx, baseY, 40, 30, '#4090d0', '#3070b0', '#2060a0');

      // Pipes
      ctx.strokeStyle = '#606070';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(cx - 28, baseY - 15);
      ctx.lineTo(cx + 28, baseY - 15);
      ctx.stroke();

      // Pump housing
      ctx.fillStyle = '#2050a0';
      ctx.fillRect(cx - 8, baseY - 25, 16, 12);
    }

    this.cache.set(`water_${type}`, canvas);
  }
}

// Singleton instance
export const sprites = new SpriteManager();

// Initialize sprites when module loads (client-side only)
if (typeof window !== 'undefined') {
  // Defer initialization to allow DOM to be ready
  setTimeout(() => sprites.init(), 0);
}
