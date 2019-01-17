
var unitHelper = {
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
  // I halp
  path: () => {
    // I find paths :D
  },

  // createDistanceMap creates a distancemap according to the destination
  // should be stored and used with getNextDirection method
  createDistanceMap: (dest, fullMap, robotMap) =>{
    let distMap = []; // Init distMap
    for(var y=0; y<fullMap.length; y++){
      distMap[y] = [];
    }
    distMap[dest.y][dest.x] = 0;
    let done = false;
    let current_location = dest;
    let current_locations = [] // Locations that can be reached with current amount of moves
    current_locations.push(current_location) // add current location
    let next_locations = [] // Destinations reachable from current_locations
    let moves = 0;

    while(!done){
      for(var i = 0; i<current_locations.length; i++){
        current_location = current_locations[i];
        // Check all adjacent tiles:
        for(var j = 0; j<unitHelper.directions.length; j++){
          let direction  = unitHelper.directions[j];
          let new_location = {};
          new_location.x = current_location.x + direction.x;
          new_location.y = current_location.y + direction.y;

          if(new_location.y >= 0 && new_location.y < fullMap.length &&
            new_location.x >= 0 && new_location.x < fullMap.length &&
            distMap[new_location.y][new_location.x] == undefined){
            if(!unitHelper.isPassable(new_location, fullMap, robotMap)){
              distMap[new_location.y][new_location.x] = -2;
            }else{
              distMap[new_location.y][new_location.x] = moves + 1;
              next_locations.push(new_location)
            }
          }
        }
      }
      moves++;
      current_locations = next_locations;
      next_locations = [];

      if (current_locations.length == 0){
        done = true;
      }
    }
    return distMap;
  },

  //Get next direction according to distance map
  getNextDirection: (loc, range, distMap) => {
    let currentValue = 1000;
    let currentLocation = {};

    // Test all positions in range and find the one closest to 0
    for(var y = loc.y-range; y<=loc.y+range; y++){
      for(var x = loc.x-range; x<=loc.x+range; x++){
        if( y<distMap.length && x<distMap.length && x>0 && y>0 &&
          distMap[y][x] < currentValue && distMap[y][x] > -1){
            currentLocation.x =  x;
            currentLocation.y =  y;
            currentValue = distMap[y][x];
        }
      }
    }
    return {y: currentLocation.y-loc.y, x: currentLocation.x-loc.x};
  }
};

export default unitHelper;
