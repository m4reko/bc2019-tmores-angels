
var structureHelper = {
  // I halp too
  build: () => {
    // I bild :D
  },

  isVertical: (map) => {
    // check if the map is vertically mirrored
    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map.length / 2; x++) {
        if (map[y][x] !== map[y][map.length - (x + 1)]) return false;
      }
    }

    return true;
  }
}

export default structureHelper;
