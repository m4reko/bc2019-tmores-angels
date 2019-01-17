import unitHelper from './unit.js';
import {BCAbstractRobot, SPECS} from 'battlecode';

var pilgrimHelper = {
  turn: self => {
    self.log("moving pilgrim");

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
    }

    let nextDirection = unitHelper.getNextDirection(location, 1, self.distanceMap);
    self.log("Next location: (" +(location.x+nextDirection.x) + ", " +(location.y+nextDirection.y) + ")");

    self.move(nextDirection.x, nextDirection.y);
    return null;
  }
};

export default pilgrimHelper;
