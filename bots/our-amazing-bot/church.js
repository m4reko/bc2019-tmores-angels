import structureHelper from './structure.js';
import {BCAbstractRobot, SPECS} from 'battlecode';

var churchHelper = {
  turn: self => {
    // we do stuff
    // if (self.karbonite > 50 && self.fuel >= 50) {
    //   let location = {x: self.me.x, y: self.me.y};
    //   let possibleDirections = structureHelper.getPossibleDirections(location, self.map, self.getVisibleRobotMap())
    //   if (possibleDirections) {
    //     let randomDirection = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
    //     if (randomDirection && randomDirection.x && randomDirection.y) {
    //       self.log('Church building a crusader at ' + (self.me.x + randomDirection.x) + ',' + (self.me.y + randomDirection.y));
    //       return self.buildUnit(SPECS.CRUSADER, randomDirection.x, randomDirection.y);
    //     }
    //   }
    // }

    return null;
  }
};

export default churchHelper;
