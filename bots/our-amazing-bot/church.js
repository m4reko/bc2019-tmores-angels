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

    const allies = self.getVisibleRobots().filter(r => r.team === self.me.team && r.unit === SPECS.PROPHET);

    if(!self.spawnedProphets) self.spawnedProphets = 0;

    if (self.karbonite >= 30 + self.SK && self.fuel >= 50 + self.SF && allies.length < 0) {
      let location = {x: self.me.x, y: self.me.y};
      let possibleDirections = structureHelper.getPossibleDirections(location, self.map, self.getVisibleRobotMap())
      let randomDirection = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];

      if (randomDirection) {
        self.spawnedProphets++;
        self.log('Church building a prophet at ' + (self.me.x + randomDirection.x) + ',' + (self.me.y + randomDirection.y));
        return self.buildUnit(SPECS.PROPHET, randomDirection.x, randomDirection.y);
      } else {
        self.log("No random direction was found - cannot build");
      }
    }


    return null;
  }
};

export default churchHelper;
