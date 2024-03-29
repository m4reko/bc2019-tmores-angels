import structureHelper from './structure.js';
import {BCAbstractRobot, SPECS} from 'battlecode';

var castleHelper = {
  turn: self => {
    if (!self.castleAmount) {
      // Just setting castle amount to 1 before we counted them
      self.castleAmount = 1;
    }

    // if(self.managedKarbonite){
    //   self.log("ROUND " + self.step);
    // }
    // we do stuff
    const team = self.me.team;
    const location = {x: self.me.x, y: self.me.y};
    let selfOffer = self.last_offer[team];

    const map = self.getPassableMap();

    let tradeSign = 1;
    if (team === 0) {
      tradeSign = -1;
    }
    let isNegative = (tradeSign < 0 ? 2 : 1);

    if (self.step === 1) {
      // things to do first turn only
      // count castles
      // self.deadPilgrims = [];
      self.resourcesManagedKarbonite = [];
      self.resourcesManagedFuel = [];
      self.needBodyGuard = false;
      self.guardedAreas = [];
      self.castleLocations = [
        [-1, -1],
        [-1, -1],
        [-1, -1]
      ];
      self.oppCastleLocations = [
        [-1, -1],
        [-1, -1],
        [-1, -1]
      ];
      self.vertical = structureHelper.isVertical(map);
      self.locationToEnemy = (self.vertical ? (location.x >= map.length / 2 ? {x: location.x - 4, y: location.y} : {x: location.x + 4, y: location.y}) : (location.y >= map.length / 2 ? {x: location.x, y: location.y - 4} : {x: location.x, y: location.y + 4}));
      self.guardPositions = structureHelper.createCastleGuardPositions(location, self.vision, map, self.getKarboniteMap(), self.getFuelMap());
      self.maxSpawns = self.guardPositions.length;

      let castles = selfOffer[0] || 0;
      castles += 1 * tradeSign;
      self.castleNumber = castles * tradeSign;
      return self.proposeTrade(castles, 1000 * tradeSign);

    } else if (self.step === 2) {
      // things to do second turn only
      // check castle locations
      if (self.castleNumber === 1) {
        self.castleLocations[0] = [self.me.x, self.me.y];
        self.castleAmount = selfOffer[0] * tradeSign;
        return self.proposeTrade(parseInt(selfOffer[0].toString() + self.me.x.toString(), 10), parseInt(selfOffer[0].toString() + self.me.y.toString(), 10));
      } else {
        let offerXString = selfOffer[0].toString();
        let offerYString = selfOffer[1].toString();
        self.castleLocations[0] = [parseInt(offerXString.substring(isNegative), 10), parseInt(offerYString.substring(isNegative), 10)];
      }
      let highestCastleCount = selfOffer[0].toString();
      highestCastleCount = parseInt(highestCastleCount.substring(0, isNegative), 10);
      self.castleAmount = highestCastleCount * tradeSign;
      if (self.castleNumber === self.castleAmount) {
        self.castleLocations[self.castleNumber - 1] = [self.me.x, self.me.y];
        return self.proposeTrade(parseInt((self.castleAmount * tradeSign).toString() + self.me.x.toString(), 10), parseInt((self.castleAmount * tradeSign).toString() + self.me.y.toString(), 10));
      }
    } else if (self.step === 3) {
      // things to do on the third turn only
      // check the next castle location if there is one
      if (self.castleAmount > 1) {
        if (self.castleNumber !== self.castleAmount) {
          let offerXString = selfOffer[0].toString();
          let offerYString = selfOffer[1].toString();
          self.castleLocations[self.castleAmount - 1] = [parseInt(offerXString.substring(isNegative), 10), parseInt(offerYString.substring(isNegative), 10)];
        }
        if (self.castleNumber !== self.castleAmount && self.castleNumber !== 1) {
          self.castleLocations[self.castleNumber - 1] = [self.me.x, self.me.y];
          return self.proposeTrade(parseInt((self.castleAmount * tradeSign).toString() + self.me.x.toString(), 10), parseInt((self.castleAmount * tradeSign).toString() + self.me.y.toString(), 10));
        }
      }
    } else if (self.step === 4) {
      // things to do on the fourth turn only
      // if there are 3 castles we check the last positions here
      if (self.castleAmount > 2) {
        if (self.castleNumber === 1 || self.castleNumber === 3) {
          let offerXString = selfOffer[0].toString();
          let offerYString = selfOffer[1].toString();
          self.castleLocations[1] = [parseInt(offerXString.substring(isNegative), 10), parseInt(offerYString.substring(isNegative), 10)];
        }
      }
    } else if (self.step === 5) {
      // things to do on the fifth turn only
      // check the map and calculate the position of opposing castles
      const vertical = self.vertical;
      if (vertical) {
        if (self.castleLocations[0][0] >= 0) {
          self.oppCastleLocations[0][0] = map[0].length - (self.castleLocations[0][0] + 1);
          self.oppCastleLocations[0][1] = self.castleLocations[0][1];
        }
        if (self.castleLocations[1][0] >= 0) {
          self.oppCastleLocations[1][0] = map[0].length - (self.castleLocations[1][0] + 1);
          self.oppCastleLocations[1][1] = self.castleLocations[1][1];
        }
        if (self.castleLocations[2][0] >= 0) {
          self.oppCastleLocations[2][0] = map[0].length - (self.castleLocations[2][0] + 1);
          self.oppCastleLocations[2][1] = self.castleLocations[2][1];
        }
      } else {
        if (self.castleLocations[0][1] >= 0) {
          self.oppCastleLocations[0][0] = self.castleLocations[0][0];
          self.oppCastleLocations[0][1] = map.length - (self.castleLocations[0][1] + 1);
        }
        if (self.castleLocations[1][1] >= 0) {
          self.oppCastleLocations[1][0] = self.castleLocations[1][0];
          self.oppCastleLocations[1][1] = map.length - (self.castleLocations[1][1] + 1);
        }
        if (self.castleLocations[2][1] >= 0) {
          self.oppCastleLocations[2][0] = self.castleLocations[2][0];
          self.oppCastleLocations[2][1] = map.length - (self.castleLocations[2][1] + 1);
        }
      }
      // self.log("CastleAmount: " + self.castleAmount);
      if (!self.resourcesManagedKarbonite || !self.resourcesManagedFuel || !self.managedKarbonite || !self.managedFuel) {
        for (let y = 0; y < self.getKarboniteMap().length; y++) {
          for (let x = 0; x < self.getKarboniteMap().length; x++) {
            if (self.getKarboniteMap()[y][x]) {
              let dangerous = false;
              for (const enemycastle of self.oppCastleLocations) {
                if (enemycastle[0] === -1) continue;
                if (structureHelper.nav.sqDist({x: x, y: y}, {x: enemycastle[0], y: enemycastle[1]}) <= 100) dangerous = true;
              }
              if (dangerous) continue;
              if (self.castleAmount === 1) {
                let dist = structureHelper.nav.sqDist({x: x, y: y}, {x: self.castleLocations[0][0], y: self.castleLocations[0][1]});
                self.resourcesManagedKarbonite.push({x: x, y: y, dist: dist});
                continue;
              }
              let dist = [];
              dist.push(structureHelper.nav.sqDist({x: x, y: y}, {x: self.castleLocations[0][0], y: self.castleLocations[0][1]}));
              dist.push(structureHelper.nav.sqDist({x: x, y: y}, {x: self.castleLocations[1][0], y: self.castleLocations[1][1]}));
              dist.push(Infinity);
              if (self.castleAmount === 3) dist[2] = structureHelper.nav.sqDist({x: x, y: y}, {x: self.castleLocations[2][0], y: self.castleLocations[2][1]});
              let min = Math.min(dist[0], dist[1], dist[2]);
              for (let i = 0; i < 3; i++) {
                if (dist[i] === min && self.castleNumber === i + 1) {
                  self.resourcesManagedKarbonite.push({x: x, y: y, dist: min});
                  break;
                }
              }
            }
            if (self.getFuelMap()[y][x]) {
              let dangerous = false;
              for (const enemycastle of self.oppCastleLocations) {
                if (enemycastle[0] === -1) continue;
                if (structureHelper.nav.sqDist({x: x, y: y}, {x: enemycastle[0], y: enemycastle[1]}) <= 100) dangerous = true;
              }
              if (dangerous) continue;
              if (self.castleAmount === 1) {
                let dist = structureHelper.nav.sqDist({x: x, y: y}, {x: self.castleLocations[0][0], y: self.castleLocations[0][1]});
                self.resourcesManagedFuel.push({x: x, y: y, dist: dist});
                continue;
              }
              let dist = [];
              dist.push(structureHelper.nav.sqDist({x: x, y: y}, {x: self.castleLocations[0][0], y: self.castleLocations[0][1]}));
              dist.push(structureHelper.nav.sqDist({x: x, y: y}, {x: self.castleLocations[1][0], y: self.castleLocations[1][1]}));
              dist.push(Infinity);
              if (self.castleAmount === 3) dist[2] = structureHelper.nav.sqDist({x: x, y: y}, {x: self.castleLocations[2][0], y: self.castleLocations[2][1]});
              let min = Math.min(dist[0], dist[1], dist[2]);
              for (let i = 0; i < 3; i++) {
                if (dist[i] === min && self.castleNumber === i + 1) {
                  self.resourcesManagedFuel.push({x: x, y: y, dist: min});
                  break;
                }
              }
            }
          }
        }
        // self.allManagedFuel = self.resourcesManagedFuel;
        self.resourcesManagedFuel = self.resourcesManagedFuel.sort((a, b) => {
          return b.dist - a.dist;
        }).filter(s => !(s.x === self.closestFuel.x && s.y === self.closestFuel.y));
        // self.allManagedKarbonite = self.resourcesManagedKarbonite;
        self.resourcesManagedKarbonite = self.resourcesManagedKarbonite.sort((a, b) => {
          return b.dist - a.dist;
        }).filter(s => !(s.x === self.closestKarb.x && s.y === self.closestKarb.y));
        self.managedFuel = self.resourcesManagedFuel.length;
        self.managedKarbonite = self.resourcesManagedKarbonite.length;
        // self.log(self.resourcesManagedKarbonite);
        // self.log(self.resourcesManagedFuel);
      }
    }
    if (self.time < 30) return null;

    if (!self.closestKarb || !self.closestFuel) {
      self.closestKarb = structureHelper.getClosestResource({x: self.me.x, y: self.me.y}, self.getKarboniteMap());
      // self.log("My closest karbonite is here: " + self.closestKarb.x + ", " + self.closestKarb.y);
      self.closestFuel = structureHelper.getClosestResource({x: self.me.x, y: self.me.y}, self.getFuelMap());
      // self.log("My closest fuel is here: " + self.closestFuel.x + ", " + self.closestFuel.y);
    }

    if (!self.spawnedKarbonite && !self.spawnedFuel && !self.spawnedCrusaders && !self.spawnedProphets && !self.spawnedClosestKarb && !self.spawnedClosestFuel) {
      self.spawnedKarbonite = 0;
      self.spawnedFuel = 0;
      self.spawnedCrusaders = 0;
      self.spawnedProphets = 0;
      self.spawnedClosestKarb = 0;
      self.spawnedClosestFuel = 0;
    }
    if (!self.managedKarbonite && !self.managedFuel) {
      self.managedKarbonite = 0;
      self.managedFuel = 0;
    }

    // defend or attack
    const visibleRobots = self.getVisibleRobots().filter(r => structureHelper.nav.sqDist(r, location) <= self.vision);
    const enemies = visibleRobots.filter(r => r.team !== team);
    const allies = visibleRobots.filter(r => r.team === team && (r.unit === SPECS.PREACHER || r.unit === SPECS.PROPHET));
    if (enemies.length > 0) {
      let spawnLimit = 1;
      if (enemies.length > 2) spawnLimit = enemies.length;

      let preachers = enemies.filter(r => r.unit === SPECS.PREACHER || r.unit === SPECS.CRUSADER).length;
      let shortestDist = Infinity;
      let closestEnemy = enemies[0];

      for (const enemy of enemies) {
        let dist = structureHelper.nav.sqDist({x: self.me.x, y: self.me.y}, {x: enemy.x, y: enemy.y});
        if (dist < shortestDist) {
          shortestDist = dist;
          closestEnemy = enemy;
        }
      }
      if (allies.length < spawnLimit && self.karbonite >= 30 && self.fuel >= 50) {
        let direction = structureHelper.getDirectionTowards(location, closestEnemy, map, self.getVisibleRobotMap());

        if (direction) {
          // self.log('Building a preacher/prophet at ' + (self.me.x + direction.x) + ',' + (self.me.y + direction.y));
          let pos = closestEnemy.y * map.length + closestEnemy.x;
          self.signal(parseInt(pos.toString(), 10), 2);
          return self.buildUnit((preachers ? SPECS.PREACHER : SPECS.PROPHET), direction.x, direction.y);
        } else {
          // self.log("No open direction was found - cannot build");
        }
      } else {
        let alliesWithin8 = allies.filter(r => r.unit === SPECS.PREACHER && structureHelper.nav.sqDist(location, r) <= 8);
        if (alliesWithin8.length) {
          let pos = closestEnemy.y * map.length + closestEnemy.x;
          self.signal(parseInt(pos.toString(), 10), 8);
        }
        if(structureHelper.nav.sqDist(location, closestEnemy) <= 64){
          return self.attack(closestEnemy.x - self.me.x, closestEnemy.y - self.me.y);
        }
      }
    }

    // if (self.step > 400 && self.step % 150 === 0) {
    //   let location = {x: self.me.x, y: self.me.y};
    //   let nearbyPilgrims = visibleRobots.filter(r => r.team === team && r.unit === SPECS.PILGRIM && structureHelper.nav.sqDist(location, r) <= 9);
    //   let nearbyFuel = self.allManagedFuel.filter(f => f.dist <= 9);
    //   let nearbyKarbonite = self.allManagedKarbonite.filter(k => k.dist <= 9);
    //   if (nearbyPilgrims.length < nearbyFuel.length + nearbyKarbonite.length) {
    //     for (const fuel of nearbyFuel) {
    //       let occupied = false;
    //       for (const pilgrim of nearbyPilgrims) {
    //         if (pilgrim.x === fuel.x && pilgrim.y === fuel.y) {
    //           occupied = true;
    //           break;
    //         }
    //       }
    //       if (!occupied) self.deadPilgrims.push(fuel);
    //     }
    //     for (const karb of nearbyKarbonite) {
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


    let needDef = (self.spawnedProphets < 2 && self.turn <= 20) || (self.spawnedProphets < 3 && self.turn <= 40);
    // self.log("I have this much karbonite: " + self.karbonite);
    // self.log("I have this much fuel: " + self.fuel);
    // self.log("The status of body guard is this: " + self.needBodyGuard);
    // self.log("The status of needDef is this: " + needDef);
    // self.log("I have this many karbonite left: " + self.resourcesManagedKarbonite.length);
    // self.log("I have this many fuel left: " + self.resourcesManagedFuel.length);
    // self.log("Status of spawning first karbonite: " + self.spawnedClosestKarb);
    // self.log("Status of spawning first fuel: " + self.spawnedClosestFuel);

    // Spawn pilgrims huge if statement
    if (!self.needBodyGuard && !needDef && self.karbonite >= (self.turn < 10 ? 20 : 10 + self.SK) && self.fuel >= 50 + self.SF && ((self.resourcesManagedKarbonite.length || self.resourcesManagedFuel.length) || self.spawnedClosestFuel === 0 || self.spawnedClosestKarb === 0)) {
      // self.log("spawning pilgrim");
      // self.log(self.resourcesManagedKarbonite);
      // self.log(self.resourcesManagedFuel);
      let spawnKarbonite = false;
      if (self.spawnedClosestKarb === 0 || self.spawnedClosestFuel === 0) {
        spawnKarbonite = self.spawnedClosestKarb === 0;
      } else {
        spawnKarbonite = self.resourcesManagedKarbonite.length && (self.spawnedKarbonite <= (self.resourcesManagedFuel.length ? self.managedKarbonite : self.spawnedFuel));
      }
      let location = {x: self.me.x, y: self.me.y};

      // // self.log("SpawnKarbonite: " + spawnKarbonite);
      // // self.log("SpawnedKarbonite: " + self.spawnedKarbonite);
      // // self.log("ManagedKarbonite: " + self.managedKarbonite);
      // // self.log("SpawnedFuel: " + self.spawnedFuel);
      // // self.log("ManagedFuel: " + self.managedFuel);
      // // self.log("ClosestKarbonite: " + self.spawnedClosestKarb);
      // // self.log("ClosestFuel: " + self.spawnedClosestFuel);

      let targetResource = {x: 0, y: 0};
      if (spawnKarbonite && (self.spawnedClosestKarb === 0 || self.resourcesManagedKarbonite.length)) {
        if (self.spawnedClosestKarb === 0) {
          targetResource = self.closestKarb;
        } else {
          // // self.log(karbSources);
          targetResource = self.resourcesManagedKarbonite.pop();
        }
      } else if (!spawnKarbonite && (self.spawnedClosestFuel === 0 || self.resourcesManagedFuel.length)) {
        if (self.spawnedClosestFuel === 0) {
          targetResource = self.closestFuel;
        } else {
          // // self.log(fuelSources);
          targetResource = self.resourcesManagedFuel.pop();
        }
      } else {
        // no need to spawn another pilgrim
        targetResource = {x: -1, y: -1};
        // targetResource = {x: self.me.x + randomDirection.x, y: self.me.y + randomDirection.y};
      }
      // check if it's in a dangerous spot
      let onOtherHalfX = (location.x > map.length / 2 ? (targetResource.x - map.length / 2 < 0) : ((targetResource.x - map.length / 2 > 0)));
      let onOtherHalfY = (location.y > map.length / 2 ? (targetResource.y - map.length / 2 < 0) : ((targetResource.y - map.length / 2 > 0)));
      let nearMiddleX = (targetResource.x - map.length / 2 < 4 && targetResource.x - map.length / 2 > -4);
      let nearMiddleY = (targetResource.y - map.length / 2 < 4 && targetResource.y - map.length / 2 > -4);
      if (structureHelper.nav.sqDist(location, targetResource) > 8 && ((self.vetical && (onOtherHalfX || nearMiddleX)) || (!self.vetical && (onOtherHalfY || nearMiddleY)))) {
        self.needBodyGuard = {x: targetResource.x, y: targetResource.y};
      }

      let direction = structureHelper.getDirectionTowards(location, targetResource, map, self.getVisibleRobotMap());
      // // self.log("Direction: " + direction);
      //let pos = structureHelper.posTo6Bit(targetResource, map.length);
      if (direction) {
        if (spawnKarbonite) {
          if (self.spawnedClosestKarb === 0) self.spawnedClosestKarb++;
          else self.spawnedKarbonite++;
        }
        else {
          if (self.spawnedClosestFuel === 0) self.spawnedClosestFuel++;
          else self.spawnedFuel++;
        }
        let pos = targetResource.y * map.length + targetResource.x;
        self.signal(parseInt(pos.toString(), 10), 2);
        // self.log('Building a pilgrim at ' + (self.me.x + direction.x) + ',' + (self.me.y + direction.y));
        // self.log('The target is: ' + targetResource.x + ", " + targetResource.y);
        // self.log(self.resourcesManagedKarbonite);
        // self.log(self.resourcesManagedFuel);
        return self.buildUnit(SPECS.PILGRIM, direction.x, direction.y);
      } else {
        // self.log("No open direction was found - cannot build");
      }
    }

    let notMaxed = allies.length < self.maxSpawns;
    let safeKarbonite = (self.step < 150 ? self.karbonite >= 25 + self.SK : self.karbonite >= 25)

    // Spawn prophets
    if ((self.needBodyGuard && self.karbonite >= 55 && self.fuel >= 200) || (notMaxed && (safeKarbonite && self.fuel >= 50 + self.SF && (self.spawnedProphets < ((self.step - self.step % 20) / 20 - 1)) && self.spawnedClosestKarb > 0 && self.spawnedClosestFuel > 0) || (self.karbonite > 250 && self.fuel > 300) || (self.step > 700 && self.karbonite > 25 && self.fuel > 200))) {
      let location = {x: self.me.x, y: self.me.y};
      let position = null;

      // self.log("I'm spawning a prophet :D");
      // self.log(self.resourcesManagedKarbonite);
      // self.log(self.resourcesManagedFuel);

      let skip = false;
      if (self.needBodyGuard) {
        if (self.guardedAreas.length) {
          for (const area of self.guardedAreas) {
            if (structureHelper.nav.sqDist(self.needBodyGuard, area) <= 8) {
              self.needBodyGuard = false;
              skip = true;
            }
          }
          if (!skip) position = {x: self.needBodyGuard.x, y: self.needBodyGuard.y};
        } else {
          position = {x: self.needBodyGuard.x, y: self.needBodyGuard.y};
        }
      } else {
        position = structureHelper.getCastleGuardPosition(self.guardPositions, allies, self.locationToEnemy);
      }

      if (!skip && position) {
        let direction = structureHelper.getDirectionTowards(location, position, map, self.getVisibleRobotMap());
        if (direction) {
          let pos = position.y * map.length + position.x;
          self.signal(parseInt(pos.toString(), 10), 2);
          if (self.needBodyGuard) {
            self.guardedAreas.push(position);
            self.needBodyGuard = false;
          } else {
            self.spawnedProphets++;
          }
          // self.log('Building a prophet at ' + (self.me.x + direction.x) + ',' + (self.me.y + direction.y));
          return self.buildUnit(SPECS.PROPHET, direction.x, direction.y);
        } else {
          // self.log("No direction was found - cannot build");
        }
      }
    }


    // if (self.karbonite >= 50 && self.spawnedCrusaders < 4 && self.spawnedKarbonite > 0 && self.spawnedFuel > 0) {
    //   let location = {x: self.me.x, y: self.me.y};
    //   let possibleDirections = structureHelper.getPossibleDirections(location, map, self.getVisibleRobotMap())
    //   let randomDirection = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
    //   if(randomDirection){
    //     self.spawnedCrusaders++;
    //     // self.log('Building a crusader at ' + (self.me.x+randomDirection.x) + ',' + (self.me.y+randomDirection.y));
    //     return self.buildUnit(SPECS.CRUSADER, randomDirection.x, randomDirection.y);
    //   }else{
    //     // self.log("No random direction was found - cannot build");
    //   }
    // }

    // no action
    return null;
  }
};

export default castleHelper;
