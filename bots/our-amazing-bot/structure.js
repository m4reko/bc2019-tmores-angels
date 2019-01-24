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
    let shortestDist = Infinity;
    let closestResource = location;
    for (let y = 0; y < resourceMap.length; y++) {
      for (let x = 0; x < resourceMap.length; x++) {
        if (resourceMap[y][x]) {
          let dist = nav.sqDist(location, {x: x, y: y});
          if (dist < shortestDist) {
            shortestDist = dist;
            closestResource = {x: x, y: y, dist: dist};
          }
        }
      }
    }
    return closestResource;
  },

  getPossibleDirections: (loc, fullMap, robotMap) => {
    let possibleDirections = [];
    for (var x = -1; x <= 1; x++) {
      for (var y = -1; y <= 1; y++) {
        if (loc.x + x < 0 || loc.x + x >= fullMap.length || loc.y + y < 0 || loc.y + y >= fullMap.length) continue;
        if (x == 0 && y == 0) continue;
        let dir = {x: x, y: y};
        let testLocation = {x: (loc.x + dir.x), y: (loc.y-dir.y)};
        if (structureHelper.isPassable(testLocation, fullMap, robotMap)) {
          possibleDirections.push(dir);
        }
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
