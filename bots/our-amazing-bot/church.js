import structureHelper from './structure.js';
import {BCAbstractRobot, SPECS} from 'battlecode';

var churchHelper = {
  turn: self => {
    // we do stuff
    // if (self.karbonite > 50 && self.fuel >= 50) {
    //   let location = {x: self.me.x, y: self.me.y};
    //   let possibleDirections = structureHelper.getPossibleDirections(location, self.getPassableMap(), self.getVisibleRobotMap())
    //   if (possibleDirections) {
    //     let randomDirection = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
    //     if (randomDirection && randomDirection.x && randomDirection.y) {
    //       // self.log('Church building a crusader at ' + (self.me.x + randomDirection.x) + ',' + (self.me.y + randomDirection.y));
    //       return self.buildUnit(SPECS.CRUSADER, randomDirection.x, randomDirection.y);
    //     }
    //   }
    // }
    if (self.time < 30) return null;
    let location = {x: self.me.x, y: self.me.y};

    const visible = self.getVisibleRobots();
    const visible_allies = visible.filter(r => r.team === self.me.team);
    const visible_prophets = visible_allies.filter(r => r.unit === SPECS.PROPHET);
    const visible_pilgrims = visible_allies.filter(r => r.unit === SPECS.PILGRIM);
    const enemies = visible.filter(r => r.team !== self.me.team);

    if (self.step === 1) {
      self.deadPilgrims = [];
      self.spawnedProphets = 0;
      self.spawnedPilgrims = 0;
      self.spawnDefense = 0;
      self.guardPositions = structureHelper.createCastleGuardPositions(location, self.vision, self.getPassableMap(), self.getKarboniteMap(), self.getFuelMap());
      self.maxSpawns = self.guardPositions.length;
      self.nearbyFuel = [];
      self.nearbyKarbonite = [];
    } else if (self.step === 2) {
      // let fuelmap = self.getFuelMap();
      // for (let y = 0; y < fuelmap.length; y++) {
      //   for (let x = 0; x < fuelmap.length; x++) {
      //     if (fuelmap[y][x] && structureHelper.nav.sqDist(location, {x: x, y: y})) self.nearbyFuel.push({x: x, y: y});
      //   }
      // }
      // let karbmap = self.getKarboniteMap();
      // for (let y = 0; y < karbmap.length; y++) {
      //   for (let x = 0; x < karbmap.length; x++) {
      //     if (karbmap[y][x] && structureHelper.nav.sqDist(location, {x: x, y: y})) self.nearbyKarbonite.push({x: x, y: y});
      //   }
      // }
    }

    if (!enemies.length) {
      self.spawnDefense = 0;
    }

    // if (self.step > 400 && self.step % 150 === 0) {
    //   let location = {x: self.me.x, y: self.me.y};
    //   let nearbyPilgrims = visible_pilgrims.filter(r => structureHelper.nav.sqDist(location, r) <= 9);
    //   if (nearbyPilgrims.length < self.nearbyFuel.length + self.nearbyKarbonite.length) {
    //     for (const fuel of self.nearbyFuel) {
    //       let occupied = false;
    //       for (const pilgrim of nearbyPilgrims) {
    //         if (pilgrim.x === fuel.x && pilgrim.y === fuel.y) {
    //           occupied = true;
    //           break;
    //         }
    //       }
    //       if (!occupied) self.deadPilgrims.push(fuel);
    //     }
    //     for (const karb of self.nearbyKarbonite) {
    //       let occupied = false;
    //       for (const pilgrim of nearbyPilgrims) {
    //         if (pilgrim.x === karb.x && pilgrim.y === karb.y) {
    //           occupied = true;
    //           break;
    //         }
    //       }
    //       if (!occupied) self.deadPilgrims.push(karb);
    //     }
    //   }
    // }

    let notMaxed = visible_prophets.length < self.maxSpawns;

    if (enemies.length > 0 && self.spawnDefense < 4 && self.karbonite >= 25 && self.fuel >= 50 && notMaxed) {
      let shortestDist = Infinity;
      let closestEnemy = enemies[0];

      for (const enemy of enemies) {
        let dist = structureHelper.nav.sqDist({x: self.me.x, y: self.me.y}, {x: enemy.x, y: enemy.y});
        if (dist < shortestDist) {
          shortestDist = dist;
          closestEnemy = enemy;
        }
      }

      let position = structureHelper.getCastleGuardPosition(self.guardPositions, visible_allies, closestEnemy);
      if (position) {
        let direction = structureHelper.getDirectionTowards(location, position, self.getPassableMap(), self.getVisibleRobotMap());

        if (direction) {
          // self.log('Church building a prophet at ' + (self.me.x + direction.x) + ',' + (self.me.y + direction.y));
          let pos = position.y * self.getPassableMap().length + position.x;
          self.signal(parseInt(pos.toString(), 10), 2);
          self.spawnDefense++;
          self.spawnedProphets++;
          return self.buildUnit(SPECS.PROPHET, direction.x, direction.y);
        } else {
          // self.log("No direction was found - cannot build");
        }
      }
    } else if (!visible_pilgrims.length
      && self.karbonite >= 25 + self.SK
      && self.fuel >= 50 + self.SF) {

      // let targetResource = self.deadPilgrims.pop();

      let possibleDirections = structureHelper.getPossibleDirections(location, self.getPassableMap(), self.getVisibleRobotMap())
      let direction = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
      if (direction) {
        // self.log('Church building a pilgrim at ' + (self.me.x + direction.x) + ',' + (self.me.y + direction.y));
        // let pos = targetResource.y * map.length + targetResource.x;
        // self.signal(parseInt(pos.toString(), 10), 2);
        return self.buildUnit(SPECS.PILGRIM, direction.x, direction.y);
      } else {
        // self.log("No random direction was found - cannot build");
      }
    } else if ((self.karbonite > 25 + self.SK + 20
      && self.fuel > 50 + self.SF
      && (self.spawnedProphets < ((self.step - self.step % 25) / 25)))
      || (self.karbonite > 300 && self.fuel > 500)
      || (self.step > 700 && self.karbonite > 25 && self.fuel > 250)
      && notMaxed) {

      let position = structureHelper.getCastleGuardPosition(self.guardPositions, visible_allies);
      if (position) {
        let map = self.getPassableMap();
        let direction = structureHelper.getDirectionTowards(location, position, map, self.getVisibleRobotMap());

        if (direction) {
          // self.log('Church building a prophet at ' + (self.me.x + direction.x) + ',' + (self.me.y + direction.y));
          let pos = position.y * map.length + position.x;
          self.signal(parseInt(pos.toString(), 10), 2);
          self.spawnedProphets++;
          return self.buildUnit(SPECS.PROPHET, direction.x, direction.y);
        } else {
          // self.log("No random direction was found - cannot build");
        }
      }
    }

    return null;
  }
};

export default churchHelper;
