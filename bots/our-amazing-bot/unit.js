import nav from './nav.js';
import {BCAbstractRobot, SPECS} from 'battlecode';

var unitHelper = {
  nav: nav,

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

  // Gives squared distance
  sqDist : (start, end) => {
    return Math.pow(start.x - end.x, 2) + Math.pow(start.y - end.y, 2);
  },

  // True if loc is passable, else False
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

  reflect: (loc, fullMap, isHorizontalReflection) => {
      const mapLen = fullMap.length-1;
      const hReflect = {
          x: loc.x,
          y: mapLen - loc.y,
      };
      const vReflect = {
          x: mapLen - loc.y,
          y: loc.y,
      };

      if (isHorizontalReflection) {
          return fullMap[hReflect.y][hReflect.x] ? hReflect : vReflect;
      } else {
          return fullMap[vReflect.y][vReflect.x] ? vReflect : hReflect;
      }
  },

  getClosestAttackableOpponent : (me, robots) => {
    var closestRobot = false;
    var shortestDist = 1000;
    for(var i=0; i<robots.length; i++){
      let r = robots[i];
      const dist = unitHelper.sqDist(r, me);
      if (r.team !== me.team
          && SPECS.UNITS[me.unit].ATTACK_RADIUS[0] <= dist
          && dist <= SPECS.UNITS[me.unit].ATTACK_RADIUS[1] ){
          if(dist<shortestDist){
            closestRobot = r;
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
    let closestDist = 100000; // Large number;
    for (let y = 0; y < mapLen; y++) {
        for (let x = 0; x < mapLen; x++) {
            if (karbMap[y][x] && unitHelper.sqDist({x,y}, loc) < closestDist && robotMap[y][x] < 1) {
                closestDist = unitHelper.sqDist({x,y}, loc);
                closestLoc = {x,y};
            }
        }
    }
    return closestLoc;
  },

  // Gives the closest karbonite location
  getClosestKarbonite : (loc, karbMap) => {
      const mapLen = karbMap.length;
      let closestLoc = null;
      let closestDist = 100000; // Large number;
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
  getRandomKarbonite : (loc, karbMap) => {
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

  // Gives closest position where a church could be built
  getOptimalChurchLocation: (location, churchProspectMap) =>{
    let topValue = 0;
    let result = {x:0, y:0};

    for(var y=0; y<churchProspectMap.length;y++){
      for(var x=0; x<churchProspectMap.length;x++){
        if(churchProspectMap[y][x] == topValue){
          if(unitHelper.sqDist({x:x, y:y}, location) < unitHelper.sqDist(result, location)){
            result = {x:x, y:y};
          }
        }else if(churchProspectMap[y][x] > topValue){
          topValue = churchProspectMap[y][x];
          result = {x:x, y:y}
        }
      }
    }
    return result;
  },

  // Create a 2d map with values, higher value is better position for churches
  createChurchProspectMap: (fullMap, karboniteMap, fuelMap) =>{
    let churchProspectMap = [];

    for(var y=0; y<fullMap.length;y++){
      churchProspectMap[y] = [];
    }

    for(var y=0; y<fullMap.length;y++){
      for(var x=0; x<fullMap.length;x++){
        if(fullMap[y][x] && !karboniteMap[y][x] && !fuelMap[y][x]){
          churchProspectMap[y][x] = (unitHelper.getNearbyResourceLocations({x:x, y:y}, karboniteMap, fuelMap, 4)).length;
        }else{
          churchProspectMap[y][x] = -1;
        }
      }
    }
    return churchProspectMap;
  },

  // Get all positions for resources within a square radius
  getNearbyResourceLocations: (loc, karboniteMap, fuelMap, radius) => {
    let resourceLocations = [];
    for(var y = loc.y-radius; y<=loc.y+radius; y++){
      for(var x = loc.x-radius; x<=loc.x+radius; x++){
        if(karboniteMap[y] && karboniteMap[y][x]){
          resourceLocations.push( { x:x, y:y, resource:'karbonite'} );
        }else if(fuelMap[y] && fuelMap[y][x]){
          resourceLocations.push( { x:x, y:y, resource:'fuel'} );
        }
      }
    }
    return resourceLocations;
  },

  //Get next direction according to a distance map
  getNextDirection: (loc, range, distMap) => {
    let currentValue = 1000;
    let currentLocation = {x:0, y:0};

    // Test all positions in range and find the one closest to 0
    for(var y = loc.y-range; y<=loc.y+range; y++){
      for(var x = loc.x-range; x<=loc.x+range; x++){
        if( y<distMap.length && x<distMap.length && x>=0 && y>=0 &&
          distMap[y][x] < currentValue && distMap[y][x] > -1 &&
          !(loc.x == x && loc.y == y)){
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
