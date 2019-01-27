import nav from './nav.js';

var structureHelper = {
  nav: nav,

  // I halp too
  build: () => {
    // I bild :D
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

  posTo6Bit: (position, mapLen) => {
    return {x: (position.x - (position.x % (Math.round(mapLen/8)))) / (Math.round(mapLen/8)), y: (position.y - (position.y % (Math.round(mapLen/8)))) / (Math.round(mapLen/8))};
  },

  isVertical: (map) => {
    // check if the map is vertically mirrored
    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map.length / 2; x++) {
        if (map[y][x] !== map[y][map.length - (x + 1)]) return false;
      }
    }

    return true;
  },

  isPassable: (loc, fullMap, robotMap) => {
    const {x, y} = loc;
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

  getClosestResource: (location, resourceMap) => {
    let resources = [];
    for (let y = 0; y < resourceMap.length; y++) {
      for (let x = 0; x < resourceMap.length; x++) {
        if (resourceMap[y][x]) {
          let dist = nav.sqDist(location, {x: x, y: y});
          resources.push({x: x, y: y, dist: dist});
        }
      }
    }
    return resources.sort((a, b) => {
      return b.dist - a.dist;
    }).pop();
  },

  createCastleGuardPositions: (location, vision, fullMap, karbMap, fuelMap) => {
    let guardPositions = [];

    for (let y = location.y - 10; y < location.y + 10; y++) {
      for (let x = location.x - 10; x < location.x + 10; x++) {
        if (fullMap[y] && fullMap[y][x]) {
          if (x >= location.x - 1  && x <= location.x + 1 && y >= location.y - 1 && y <= location.y + 1) continue;
          if ((x + y) % 2 !== 1) continue;
          let dist = structureHelper.nav.sqDist(location, {x: x, y: y});
          if (dist > vision) continue;
          if (karbMap[y][x] || fuelMap[y][x]) continue;
          guardPositions.push({x: x, y: y, dist: dist});
        }
      }
    }
    guardPositions = guardPositions.sort((a, b) => {
      return a.dist - b.dist;
    });
    return guardPositions;
  },

  getCastleGuardPosition: (positions, robotMap, destination = null) => {
    let guardPosition = false;
    let shortestDist = Infinity;

    for (const position of positions) {
      if (robotMap[position.y] && robotMap[position.y][position.x]) continue;
      if (!destination) {
        guardPosition = {x: position.x, y: position.y};
        break;
      } else {
        let dist = structureHelper.nav.sqDist(position, destination);
        if (dist < shortestDist) {
          shortestDist = dist;
          guardPosition = {x: position.x, y: position.y};
        }
      }
    }
    return guardPosition;
  },

  getPossibleDirections: (loc, fullMap, robotMap) => {
    let possibleDirections = [];
    for (const direction of structureHelper.directions) {
      if (loc.x + direction.x < 0 || loc.x + direction.x >= fullMap.length || loc.y + direction.y < 0 || loc.y + direction.y >= fullMap.length) continue;
      let testLocation = {x: loc.x + direction.x, y: loc.y + direction.y};
      if (structureHelper.isPassable(testLocation, fullMap, robotMap)) {
        possibleDirections.push(direction);
      }
    }
    return possibleDirections;
  },

  getDirectionTowards: (loc, destination, fullMap, robotMap) => {
    if (destination.x < 0 || destination.y < 0) return false;
    let closestDist = Infinity;
    let closestDirection = false;
    for (const direction of structureHelper.directions) {
      if (loc.x + direction.x < 0 || loc.x + direction.x >= fullMap.length || loc.y + direction.y < 0 || loc.y + direction.y >= fullMap.length) continue;
      if (!fullMap[loc.y + direction.y][loc.x + direction.x] || robotMap[loc.y + direction.y][loc.x + direction.x] > 0) continue;
      let dist = nav.sqDist({x: loc.x + direction.x, y: loc.y + direction.y}, destination);
      if (dist < closestDist) {
        closestDirection = direction;
        closestDist = dist;
      }
    }
    return closestDirection;
  }
}

export default structureHelper;
