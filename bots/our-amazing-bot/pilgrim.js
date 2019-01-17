import unitHelper from './unit.js';
import {BCAbstractRobot, SPECS} from 'battlecode';

var pilgrimHelper = {
  turn: self => {
    // On the first turn, find out our base
    if (!self.castle) {
        self.castle = self.getVisibleRobots()
        .filter(robot => robot.team === self.me.team && robot.unit === SPECS.CASTLE)[0];
    }
    // Current position
    let location = {x: self.me.x, y: self.me.y};

    // Set new destination if none exist
    if(!self.destination || !self.distanceMap){
      self.destination = {x:0, y:0}; // Why not top left corner?
      self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
      for(var i=0; i<self.distanceMap.length; i++){
        self.log(i);
        self.log(self.distanceMap[i]);
      }
    }

    let nextDirection = unitHelper.getNextDirection(location, 1, self.distanceMap);
    self.log("Current location: (" +(location.x) + ", " +(location.y) + ")");
    self.log("Next location: (" +(location.x+nextDirection.x) + ", " +(location.y+nextDirection.y) + ")");
    self.log("moving pilgrim");
    return self.move(nextDirection.x, nextDirection.y);
  }
};

export default pilgrimHelper;
