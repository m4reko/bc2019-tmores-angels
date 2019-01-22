import nav from './nav.js';

var structureHelper = {
  nav: nav,

  // I halp too
  build: () => {
    // I bild :D
  },

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

  getPossibleDirections : (loc, fullMap, robotMap) => {
    let possibleDirections = [];
    for(var x=-1;x<=1; x++){
      for(var y=-1;y<=1; y++){
        if (loc.x < 0 || loc.x >= fullMap.length || loc.y < 0 || loc.y >= fullMap.length) continue;
        let dir = {x:x, y:y};
        let testLocation = {x: (loc.x + dir.x), y: (loc.y-dir.y)};
        if(structureHelper.isPassable(testLocation, fullMap, robotMap)){
          possibleDirections.push(dir);
        }
      }
    }
    return possibleDirections;
  }
}

export default structureHelper;
