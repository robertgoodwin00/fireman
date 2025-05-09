export const CONSTANTS = {
    // Viewport and Cell Size
    VIEWPORT_WIDTH: 12,
    VIEWPORT_HEIGHT: 12,
    CELL_SIZE: 50,
  
    // Floor Area Limits (up to 25 floors)
    MIN_AREA_LIMITS: [
      144,  // Floor 1: 12x12
      145,  // Floor 2: > 144
      171,  // Floor 3: > 170
      201,  // Floor 4: > 200
      235,  // Floor 5: > 234
      271,  // Floor 6: > 270
      309,  // Floor 7: > 308
      349,  // Floor 8: > 348
      391,  // Floor 9: > 390
      435,  // Floor 10: > 434
      481,  // Floor 11: > 480
      529,  // Floor 12: > 528
      579,  // Floor 13: > 578
      631,  // Floor 14: > 630
      685,  // Floor 15: > 684
      741,  // Floor 16: > 740
      799,  // Floor 17: > 798
      859,  // Floor 18: > 858
      921,  // Floor 19: > 920
      985,  // Floor 20: > 984
      1051, // Floor 21: > 1050
      1119, // Floor 22: > 1118
      1189, // Floor 23: > 1188
      1261, // Floor 24: > 1260
      1335  // Floor 25: > 1334
    ],
    MAX_AREA_LIMITS: [
      144,  // Floor 1: 12x12
      170,  // Floor 2: e.g., 13x13, 12x14
      200,  // Floor 3: e.g., 14x14, 13x15
      234,  // Floor 4: e.g., 15x15, 14x16
      270,  // Floor 5: e.g., 16x16, 15x18
      308,  // Floor 6: e.g., 17x17, 16x19
      348,  // Floor 7: e.g., 18x18, 17x20
      390,  // Floor 8: e.g., 19x19, 18x21
      434,  // Floor 9: e.g., 20x20, 19x22
      480,  // Floor 10: e.g., 21x21, 20x24
      528,  // Floor 11: e.g., 22x22, 21x25
      578,  // Floor 12: e.g., 23x23, 22x26
      630,  // Floor 13: e.g., 24x24, 23x27
      684,  // Floor 14: e.g., 25x25, 24x28
      740,  // Floor 15: e.g., 26x26, 25x29
      798,  // Floor 16: e.g., 27x27, 26x30
      858,  // Floor 17: e.g., 28x28, 27x31
      920,  // Floor 18: e.g., 29x29, 28x32
      984,  // Floor 19: e.g., 30x30, 29x33
      1050, // Floor 20: e.g., 31x31, 30x35
      1118, // Floor 21: e.g., 32x32, 31x36
      1188, // Floor 22: e.g., 33x33, 32x37
      1260, // Floor 23: e.g., 34x34, 33x38
      1334, // Floor 24: e.g., 35x35, 34x39
      1410  // Floor 25: e.g., 36x36, 35x40
    ],
  
    // Water Service
    BASE_WATER_RANGE: 3,
  
    // Floor Service
    MAX_RECURSION_DEPTH: 100,
    INITIAL_PLAYER_HEALTH: 10,
    MIN_PATH_LENGTH: 4,
    WALL_DENSITY: 0.1,  // 10% of inner cells
    FIRE_DENSITY_MAX: 0.2,  // Max 20% of inner cells
    FIRE_DENSITY_BASE: 0.05 // Base 5% of inner cells
  };