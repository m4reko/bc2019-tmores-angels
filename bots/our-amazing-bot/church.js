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
    let location = {x: self.me.x, y: self.me.y};

    const visible_allies = self.getVisibleRobots().filter(r => r.team === self.me.team);
    const visible_prophets = visible_allies.filter(r => r.unit === SPECS.PROPHET);
    const visible_pilgrims = visible_allies.filter(r => r.unit === SPECS.PILGRIM);
    const enemies = self.getVisibleRobots().filter(r => r.team !== self.me.team);

    if (self.step === 1) self.spawnedProphets = 0;
    if (self.step === 1) self.spawnedPilgrims = 0;
    if (self.step === 1) self.spawnDefense = 0;

    if(!enemies.length){
      self.spawnDefense = 0;
    }

    if (enemies.length > 0 && self.spawnDefense < 7 && self.karbonite >= 25 && self.fuel >= 50) {
      let shortestDist = Infinity;
      let closestEnemy = enemies[0];

      for (const enemy of enemies) {
        let dist = structureHelper.nav.sqDist({x: self.me.x, y: self.me.y}, {x: enemy.x, y: enemy.y});
        if (dist < shortestDist) {
          shortestDist = dist;
          closestEnemy = enemy;
        }
      }

      let direction = structureHelper.getDirectionTowards(location, closestEnemy, self.map, self.getVisibleRobotMap());

      if (direction) {
        self.log('Church building a prophet at ' + (self.me.x + direction.x) + ',' + (self.me.y + direction.y));
        self.spawnDefense++;
        return self.buildUnit(SPECS.PROPHET, direction.x, direction.y);
      } else {
        self.log("No direction was found - cannot build");
      }
    } else if(!visible_pilgrims.length
      && self.karbonite >= 25 + self.SK
      && self.fuel >= 50 + self.SF
      && self.spawnedPilgrims <= 5
    ){

      let possibleDirections = structureHelper.getPossibleDirections(location, self.map, self.getVisibleRobotMap())
      let direction = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];

      if (direction) {
        self.spawnedPilgrims++;
        self.log('Church building a pilgrim at ' + (self.me.x + direction.x) + ',' + (self.me.y + direction.y));
        return self.buildUnit(SPECS.PILGRIM, direction.x, direction.y);
      } else {
        self.log("No random direction was found - cannot build");
      }

    } else if ((self.karbonite > 25 + self.SK
      && self.fuel > 50 + self.SF
      && (self.spawnedProphets < ((self.step - self.step % 15) / 15 + 1)))
    || (self.karbonite > 250 && self.fuel > 500)
    || self.step > 700) {

      let possibleDirections = structureHelper.getPossibleDirections(location, self.map, self.getVisibleRobotMap())
      let direction = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];

      if (direction) {
        self.log('Church building a prophet at ' + (self.me.x + direction.x) + ',' + (self.me.y + direction.y));
        self.spawnedProphets++;
        return self.buildUnit(SPECS.PROPHET, direction.x, direction.y);
      } else {
        self.log("No random direction was found - cannot build");
      }

    }

    return null;
  }
};

export default churchHelper;
