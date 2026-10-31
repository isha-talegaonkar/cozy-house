// The house footprint and its inner walls, in world units (1 unit ≈ 1 m).
// x runs west → east, z runs north (back) → south (front door).
export const HOUSE = { west: -5, east: 5, north: -3.5, south: 4.3 };
export const BEDROOM_WALL_Z = 0;      // between bedroom (north) and living room (south), west half
export const KITCHEN_WALL_Z = -.6;    // between kitchen (north) and hobby room (south), east half
export const MIDDLE_WALL_X = 0;       // between the west rooms and the east rooms

// Is (x, z) within `margin` of the house? Used to keep rain, fallen leaves and fireflies outside.
export const nearHouse = (x, z, margin = 0) =>
  x > HOUSE.west - margin && x < HOUSE.east + margin && z > HOUSE.north - margin && z < HOUSE.south + margin;
