import nav from './nav.js';
import {BCAbstractRobot, SPECS} from 'battlecode';

var unitHelper = {
  nav: nav,

  posTo12Bit: (map, position) => {
    let cellSize = (Math.round(map.length/8))
    let x = position.x * cellSize;
    let y = position.y * cellSize;
    let mid = Math.floor(cellSize / 2);
    if (y + mid >= 0 && y + mid < map.length && x + mid >= 0 && x + mid < map.length)
      if (map[y + mid][x + mid]) return {x: position.x * 8 + mid, y: position.y * 8 + mid};
    for (let i = 0; i < mid; i++) {
      for (let j = 0; j < mid; j++) {
        if (y + mid + i >= 0 && y + mid + i < map.length && x + mid + j >= 0 && x + mid + j < map.length)
          if (map[y + mid + i][x + mid + j]) return {x: position.x * 8 + mid + j, y: position.y * 8 + mid + i};
        if (y + mid + i >= 0 && y + mid + i < map.length && x + mid >= 0 && x + mid < map.length)
          if (map[y + mid + i][x + mid]) return {x: position.x * 8 + mid, y: position.y * 8 + mid + i};
        if (y + mid + i >= 0 && y + mid + i < map.length && x + mid - j >= 0 && x + mid - j < map.length)
          if (map[y + mid + i][x + mid - j]) return {x: position.x * 8 + mid - j, y: position.y * 8 + mid + i};
        if (y + mid >= 0 && y + mid < map.length && x + mid + j >= 0 && x + mid + j < map.length)
          if (map[y + mid][x + mid + j]) return {x: position.x * 8 + mid + j, y: position.y * 8 + mid};
        if (y + mid >= 0 && y + mid < map.length && x + mid - j >= 0 && x + mid - j < map.length)
          if (map[y + mid][x + mid - j]) return {x: position.x * 8 + mid - j, y: position.y * 8 + mid};
        if (y + mid - i >= 0 && y + mid - i < map.length && x + mid + j >= 0 && x + mid + j < map.length)
          if (map[y + mid - i][x + mid + j]) return {x: position.x * 8 + mid + j, y: position.y * 8 + mid - i};
        if (y + mid - i >= 0 && y + mid - i < map.length && x + mid >= 0 && x + mid < map.length)
          if (map[y + mid - i][x + mid]) return {x: position.x * 8 + mid, y: position.y * 8 + mid - i};
        if (y + mid - i >= 0 && y + mid - i < map.length && x + mid - j >= 0 && x + mid - j < map.length)
          if (map[y + mid - i][x + mid - j]) return {x: position.x * 8 + mid - j, y: position.y * 8 + mid - i};
      }
    }
    return {x: 0, y: 0};
  },

  directions: [
    {x:-1, y:0},
    {x:1, y:0},
    {x:-1, y:1},
    {x:1, y:1},
    {x:0, y:-1},
    {x:0, y:1},
    {x:1, y:-1},
    {x:-1, y:-1}
  ],

  directions_: [
    {x:-1, y:0},
    {x:1, y:0},
    {x:0, y:-1},
    {x:0, y:1},
  ],

  directions__: [
    {x:-1, y:0},
    {x:-2, y:0},
    {x:1, y:0},
    {x:2, y:0},
    {x:-1, y:1},
    {x:1, y:1},
    {x:0, y:-1},
    {x:0, y:-2},
    {x:0, y:1},
    {x:0, y:2},
    {x:1, y:-1},
    {x:-1, y:-1}
  ],

  // Gives squared distance
  sqDist : (start, end) => {
    return Math.pow(start.x - end.x, 2) + Math.pow(start.y - end.y, 2);
  },

  // True if loc is passable, else False
  isPassable: (loc, fullMap, robotMap) => {
    const x = loc.x;
    const y = loc.y;
    const mapLen = fullMap.length;
    if (x >= mapLen || x < 0) {
        return false;
    } else if (y >= mapLen || y < 0) {
        return false;
    } else if (robotMap[y][x] > 0 || !fullMap[y][x]) {
        return false;
    } else {
        return true;
    }
  },

  reflect: (loc, fullMap, isHorizontalReflection) => {
      const mapLen = fullMap.length-1;
      if(isHorizontalReflection){
        return {x: loc.x, y: mapLen-loc.y}
      }else{
        return {x: mapLen - loc.x, y: loc.y}
      }
  },

  getVisionRadius: (r) => {
    if (r.unit === SPECS.PROPHET) {
      return SPECS.PROPHET.VISION_RADIUS;
    } else if (r.unit === SPECS.CASTLE) {
      return SPECS.CASTLE.VISION_RADIUS;
    } else if (r.unit === SPECS.CHURCH) {
      return SPECS.CHURCH.VISION_RADIUS;
    } else if (r.unit === SPECS.PILGRIM) {
      return SPECS.PILGRIM.VISION_RADIUS;
    } else if (r.unit === SPECS.CRUSADER) {
      return SPECS.CRUSADER.VISION_RADIUS;
    } else if (r.unit === SPECS.PREACHER) {
      return SPECS.PREACHER.VISION_RADIUS;
    }
  },

  getClosestAttackableOpponent: (me, robots) => {
    let closestRobot = false;
    let shortestDist = Infinity;
    for (const robot of robots) {
      let dist = unitHelper.sqDist(robot, me);
      if (robot.team !== me.team
          && SPECS.UNITS[me.unit].ATTACK_RADIUS[0] <= dist
          && dist <= SPECS.UNITS[me.unit].ATTACK_RADIUS[1]) {
          if (dist < shortestDist) {
            closestRobot = robot;
            shortestDist = dist;
          }
      }
    }
    return closestRobot;
  },

  // Gives the closest karbonite location not occupied by any robot (can only see within view of robot)
  getClosestUnoccupiedKarbonite : (loc, karbMap, robotMap) => {
    const mapLen = karbMap.length;
    let closestLoc = null;
    let closestDist = Infinity; // Large number;
    for (let y = 0; y < mapLen; y++) {
        for (let x = 0; x < mapLen; x++) {
            if (karbMap[y][x] && unitHelper.sqDist({x: x, y: y}, loc) < closestDist && robotMap[y][x] < 1) {
                closestDist = unitHelper.sqDist({x: x, y: y}, loc);
                closestLoc = {x: x, y: y};
            }
        }
    }
    return closestLoc;
  },

  // Gives the closest karbonite location
  getClosestKarbonite : (loc, karbMap) => {
      const mapLen = karbMap.length;
      let closestLoc = null;
      let closestDist = Infinity; // Large number;
      for (let y = 0; y < mapLen; y++) {
          for (let x = 0; x < mapLen; x++) {
              if (karbMap[y][x] && unitHelper.sqDist({x,y}, loc) < closestDist) {
                  closestDist = unitHelper.sqDist({x,y}, loc);
                  closestLoc = {x,y};
              }
          }
      }
      return closestLoc;
  },

  // Gives a random karbonite location
  getRandomKarbonite : (karbMap) => {
      const mapLen = karbMap.length;
      let locations = [];
      for (let y = 0; y < mapLen; y++) {
          for (let x = 0; x < mapLen; x++) {
              if (karbMap[y][x]) {
                  locations.push({x,y});
              }
          }
      }
      return locations[Math.floor(Math.random() * locations.length)];
  },

  // I halp
  path: () => {
    // I find paths :D
  },

  // createDistanceMap creates a distancemap according to the destination
  // should be stored and used with getNextDirection method
  createDistanceMap: (dest, fullMap, danger = [], range = 2) => {
    let distMap = []; // Init distMap
    for (let y = 0; y < fullMap.length; y++) {
      distMap[y] = [];
      for (let x = 0; x < fullMap.length; x++) {
        distMap[y].push(null);
      }
    }
    distMap[dest.y][dest.x] = 0;
    let done = false;
    let current_location = {x: dest.x, y: dest.y, z: 0};
    let current_locations = []; // Locations that can be reached with current amount of moves
    current_locations.push(current_location); // add current location
    let moves = 0;

    while (!done) {
      let next_locations = []; // Destinations reachable from current_locations
      for (const current_location of current_locations) {
        // Check all adjacent tiles:
        for (const direction of unitHelper.directions_) {
          let new_location = {
            x: current_location.x + direction.x,
            y: current_location.y + direction.y,
            z: 0
          };

          if (new_location.y >= 0 && new_location.y < fullMap.length && new_location.x >= 0 && new_location.x < fullMap.length) {
            if (typeof distMap[new_location.y] !== 'undefined' && typeof distMap[new_location.y][new_location.x] !== 'undefined' && distMap[new_location.y][new_location.x] === null) {
              if (!fullMap[new_location.y][new_location.x]) {
                distMap[new_location.y][new_location.x] = -2;
                if (current_location.z < range - 1) {
                  new_location.z = 1;
                  next_locations.push(new_location);
                }
              } else {
                distMap[new_location.y][new_location.x] = moves + 1;
                if (danger.length) {
                  for (const enemy of danger) {
                    // check if spot is withing enemy vision
                    let distToEnemy = unitHelper.sqDist({x: new_location.x, y: new_location.y}, enemy);
                    if (!([SPECS.PILGRIM, SPECS.CASTLE, SPECS.CHURCH].includes(enemy.unit)) && distToEnemy <= unitHelper.getVisionRadius(enemy)) distMap[new_location.y][new_location.x] += 100;
                  }
                }
                new_location.z = 0;
                next_locations.push(new_location)
              }
            }
          }
        }
      }
      moves++;
      current_locations = next_locations;

      if (!current_locations.length) {
        done = true;
      }
    }
    return distMap;
  },

  getChurchBuildPosition: (location, map, fuelMap, karbMap, robotMap) => {
    let mostResources = -1;
    let bestLocation = {x: -1, y: -1};
    for (const newDirection of unitHelper.directions) {
      let newLocation = {
        x: location.x + newDirection.x,
        y: location.y + newDirection.y
      };
      if (newLocation.x < 0 || newLocation.x >= map.length || newLocation.y < 0 || newLocation.y >= map.length) continue;
      if (!map[newLocation.y][newLocation.x] || fuelMap[newLocation.y][newLocation.y] || karbMap[newLocation.y][newLocation.x] || robotMap[newLocation.y][newLocation.x] > 0) continue;
      let nearby = unitHelper.getNearbyResourceLocations(newLocation, karbMap, fuelMap, 1).length;
      if (nearby > mostResources) {
        bestLocation = newLocation;
        mostResources = nearby;
      }
    }
    return bestLocation;
  },

  // Gives closest position where a church could be built
  getOptimalChurchLocation: (location, churchProspectMap) => {
    let topValue = 0;
    let result = {x:0, y:0};

    for (var y = 0; y < churchProspectMap.length; y++) {
      for (var x = 0; x < churchProspectMap.length; x++) {
        if (churchProspectMap[y][x] == topValue) {
          if (unitHelper.sqDist({x:x, y:y}, location) < unitHelper.sqDist(result, location)) {
            result = {x:x, y:y};
          }
        } else if (churchProspectMap[y][x] > topValue) {
          topValue = churchProspectMap[y][x];
          result = {x:x, y:y}
        }
      }
    }
    return result;
  },

  // Create a 2d map with values, higher value is better position for churches
  createChurchProspectMap: (fullMap, karboniteMap, fuelMap, seenChurches = []) => {
    let churchProspectMap = [];

    for (var y = 0; y < fullMap.length; y++) {
      churchProspectMap.push([]);
    }

    for (var y = 0; y < fullMap.length; y++) {
      for (var x = 0; x < fullMap.length; x++) {
        let nearbyChurch = false;
        if (seenChurches.length) {
          for (const church in seenChurches) {
            let distToChurch = unitHelper.sqDist({x: x, y: y}, seenChurches[church]);
            if (distToChurch <= 36) nearbyChurch = true;
          }
        }
        if (fullMap[y][x] && !karboniteMap[y][x] && !fuelMap[y][x]) {
          churchProspectMap[y].push((unitHelper.getNearbyResourceLocations({x:x, y:y}, karboniteMap, fuelMap, 5)).length);
        } else {
          churchProspectMap[y].push(-1);
        }
      }
    }
    return churchProspectMap;
  },

  getClosestChurch: (location, visible) => {
    if (visible.length <= 0) return false;
    let closestDist = Infinity;
    let closest = visible[0];
    for (const church of visible) {
      let dist = unitHelper.sqDist(location, {x: church.x, y: church.y});
      if (dist < closestDist) {
        closestDist = dist;
        closest = church;
      }
    }
    return closest;
  },

  // Get all positions for resources within a square radius
  getNearbyResourceLocations: (loc, karboniteMap, fuelMap, radius) => {
    let resourceLocations = [];
    for (var y = loc.y - radius; y <= loc.y + radius; y++) {
      for (var x = loc.x - radius; x <= loc.x + radius; x++) {
        if (unitHelper.sqDist({x: loc.x, y: loc.y}, {x: x, y: y}) > radius) continue;
        if (karboniteMap[y] && karboniteMap[y][x]) {
          resourceLocations.push({x:x, y:y, resource:'karbonite'});
        } else if (fuelMap[y] && fuelMap[y][x]) {
          resourceLocations.push({x:x, y:y, resource:'fuel'});
        }
      }
    }
    return resourceLocations;
  },

  getCastleGuardPosition: (location, castle, fullMap, robotMap, karbMap, fuelMap) => {
    let guardPosition = {};
    let shortestDist = Infinity;
    let castlePos = (castle.x + castle.y) % 2;

    for (let y = location.y - 10; y < location.y + 10; y++) {
      for (let x = location.x - 10; x < location.x + 10; x++) {
        if (fullMap[y] && fullMap[y][x] && robotMap[y] && robotMap[y][x] === 0) {
          if (x === castle.x && y === castle.y) continue;
          if (karbMap[y][x] || fuelMap[y][x]) continue;
          let dist = unitHelper.sqDist(castle, {x: x, y: y});
          if (dist < shortestDist) {
            if ((y + x) % 2 === castlePos) {
              guardPosition = {x: x, y: y}; // Chess board pattern
              shortestDist = dist;
            }
          }
        }
      }
    }
    if (!guardPosition) {
      let longestDist = 0;
      for (const direction of unitHelper.directions__) {
        if (unitHelper.isPassable({x: location.x + direction.x, y: location.y + direction.y}, fullMap, robotMap)) {
          let dist = unitHelper.sqDist(castle, {x: location.x + direction.x, y: location.y + direction.y});
          if (dist > longestDist) {
            guardPosition = {x: location.x + direction.x, y: location.y + direction.y};
            longestDist = dist;
          }
        }
      }
    }
    if (!guardPosition) {
      guardPosition = unitHelper.getRandomKarbonite(karbMap);
    }
    return guardPosition;
  },

  //Get next direction according to a distance map
  getNextDirection: (loc, range, vision, distMap, unitMap) => {
    let currentValue = 1000;
    let currentLocations = [];

    // Test all positions in range and find the one closest to 0
    for (var y = loc.y - range; y <= loc.y + range; y++) {
      for (var x = loc.x - range; x <= loc.x + range; x++) {
        if (y < distMap.length && x < distMap.length && x >= 0 && y >= 0) {
          if (typeof distMap === 'undefined' || typeof distMap[y] === 'undefined' || typeof distMap[y][x] === 'undefined' || distMap[y][x] === null || unitMap[y][x] > 0) continue;
          let dist = unitHelper.sqDist(loc, {x: x, y: y});
          if (dist > range || dist > vision) continue;
          if (distMap[y][x] < currentValue && distMap[y][x] > -1 && !(loc.x == x && loc.y == y)) {
            currentLocations = [];
            currentLocations.push({x: x, y: y, dist: dist});
            currentValue = distMap[y][x];
          } else if (distMap[y][x] === currentValue && distMap[y][x] > -1 && !(loc.x == x && loc.y == y)) {
            currentLocations.push({x: x, y: y, dist: dist})
          }
        }
      }
    }
    currentLocations.sort((a, b) => {
      return b.dist - a.dist;
    });
    let currentLocation = currentLocations.pop();
    return {y: currentLocation.y - loc.y, x: currentLocation.x - loc.x};
  },

  getPossibleDirections: (loc, fullMap, robotMap) => {
    let possibleDirections = [];
    for (var x =- 1; x <= 1; x++) {
      for (var y =- 1; y <= 1; y++) {
        let dir = {x:x, y:y};
        let testLocation = {x: (loc.x + dir.x), y: (loc.y-dir.y)};
        if (unitHelper.isPassable(testLocation, fullMap, robotMap)) {
          possibleDirections.push(dir);
        }
      }
    }
    return possibleDirections;
  }

};

export default unitHelper;
