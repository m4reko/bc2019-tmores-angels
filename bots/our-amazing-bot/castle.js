import structureHelper from './structure.js';
import {BCAbstractRobot, SPECS} from 'battlecode';

var castleHelper = {
  turn: self => {
    if(!self.castleAmount){
      // Just setting castle amount to 1 before we counted them
      self.castleAmount = 1;
    }

    if(self.managedKarbonite){
      self.log("ROUND " + self.step);
    }
    // we do stuff
    const team = self.me.team;
    let selfOffer = self.last_offer[team];

    let castleTalking = self.getVisibleRobots().filter(r => r.team === team && r.castle_talk > 0);

    let tradeSign = 1;
    if (team === 0) {
      tradeSign = -1;
    }
    let isNegative = (tradeSign < 0 ? 2 : 1);

    if (self.step === 1) {
      // things to do first turn only
      // count castles
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
      const vertical = structureHelper.isVertical(self.map);
      if (vertical) {
        if (self.castleLocations[0][0] >= 0) {
          self.oppCastleLocations[0][0] = self.map[0].length - (self.castleLocations[0][0] + 1);
          self.oppCastleLocations[0][1] = self.castleLocations[0][1];
        }
        if (self.castleLocations[1][0] >= 0) {
          self.oppCastleLocations[1][0] = self.map[0].length - (self.castleLocations[1][0] + 1);
          self.oppCastleLocations[1][1] = self.castleLocations[1][1];
        }
        if (self.castleLocations[2][0] >= 0) {
          self.oppCastleLocations[2][0] = self.map[0].length - (self.castleLocations[2][0] + 1);
          self.oppCastleLocations[2][1] = self.castleLocations[2][1];
        }
      } else {
        if (self.castleLocations[0][1] >= 0) {
          self.oppCastleLocations[0][0] = self.castleLocations[0][0];
          self.oppCastleLocations[0][1] = self.map.length - (self.castleLocations[0][1] + 1);
        }
        if (self.castleLocations[1][1] >= 0) {
          self.oppCastleLocations[1][0] = self.castleLocations[1][0];
          self.oppCastleLocations[1][1] = self.map.length - (self.castleLocations[1][1] + 1);
        }
        if (self.castleLocations[2][1] >= 0) {
          self.oppCastleLocations[2][0] = self.castleLocations[2][0];
          self.oppCastleLocations[2][1] = self.map.length - (self.castleLocations[2][1] + 1);
        }
      }
      // divide resource sources based on distance from each castle
      /*if (!self.resourceNumber || !self.resourceMap) {
        self.resourceNumber = 0;
        self.resourceMap = [];
        for (let y = 0; y < self.map.length; y += 8) {
          let currentRow = [];
          for (let x = 0; x < self.map.length; x += 8) {
            let currentCell = false;
            for (let i = 0; i < 8; i++) {
              for (let j = 0; j < 8; j++) {
                if (y + i >= self.map.length || x + j >= self.map.length) continue;
                currentCell = self.karbonite_map[y + i][x + j] || self.fuel_map[y + i][x + j];
              }
            }
            currentRow.push(currentCell);
          }
          self.resourceMap.push(currentRow);
        }
      }*/
      if (!self.resourcesManagedKarbonite || !self.resourcesManagedFuel || !self.managedKarbonite || !self.managedFuel) {
        self.resourcesManagedKarbonite = [];
        self.resourcesManagedFuel = [];
        self.managedKarbonite = 0;
        self.managedFuel = 0;
        for (let y = 0; y < self.karbonite_map.length; y++) {
          for (let x = 0; x < self.karbonite_map.length; x++) {
            if (self.karbonite_map[y][x]) {
              let dangerous = false;
              for (const enemycastle of self.oppCastleLocations) {
                if (enemycastle[0] === -1) continue;
                if (structureHelper.nav.sqDist({x: x, y: y}, {x: enemycastle[0], y: enemycastle[1]}) <= 100) dangerous = true;
              }
              if (dangerous) continue;
              if (self.castleAmount === 1) {
                self.managedKarbonite++;
                let dist = structureHelper.nav.sqDist({x: x, y: y}, {x: self.castleLocations[0][0], y: self.castleLocations[0][1]});
                self.resourcesManagedKarbonite.push({x: x, y: y, dist: dist});
                continue;
              }
              let dist = [];
              dist.push(structureHelper.nav.sqDist({x: x, y: y}, {x: self.castleLocations[0][0], y: self.castleLocations[0][1]}));
              dist.push(structureHelper.nav.sqDist({x: x, y: y}, {x: self.castleLocations[1][0], y: self.castleLocations[0][1]}));
              dist.push(Infinity);
              if (self.castleAmount === 3) dist[2] = structureHelper.nav.sqDist({x: x, y: y}, {x: self.castleLocations[2][0], y: self.castleLocations[0][1]});
              let min = Math.min(dist[0], dist[1], dist[2]);
              for (let i = 0; i < 3; i++) {
                if (dist[i] === min && self.castleNumber === i + 1) {
                  self.managedKarbonite++;
                  self.resourcesManagedKarbonite.push({x: x, y: y, dist: min});
                  break;
                }
              }
            }
            if (self.fuel_map[y][x]) {
              let dangerous = false;
              for (const enemycastle of self.oppCastleLocations) {
                if (enemycastle[0] === -1) continue;
                if (structureHelper.nav.sqDist({x: x, y: y}, {x: enemycastle[0], y: enemycastle[1]}) <= 100) dangerous = true;
              }
              if (dangerous) continue;
              if (self.castleAmount === 1) {
                self.managedFuel++;
                let dist = structureHelper.nav.sqDist({x: x, y: y}, {x: self.castleLocations[0][0], y: self.castleLocations[0][1]});
                self.resourcesManagedFuel.push({x: x, y: y, dist: dist});
                continue;
              }
              let dist = [];
              dist.push(structureHelper.nav.sqDist({x: x, y: y}, {x: self.castleLocations[0][0], y: self.castleLocations[0][1]}));
              dist.push(structureHelper.nav.sqDist({x: x, y: y}, {x: self.castleLocations[1][0], y: self.castleLocations[0][1]}));
              dist.push(Infinity);
              if (self.castleAmount === 3) dist[2] = structureHelper.nav.sqDist({x: x, y: y}, {x: self.castleLocations[2][0], y: self.castleLocations[0][1]});
              let min = Math.min(dist[0], dist[1], dist[2]);
              for (let i = 0; i < 3; i++) {
                if (dist[i] === min && self.castleNumber === i + 1) {
                  self.managedFuel++;
                  self.resourcesManagedFuel.push({x: x, y: y, dist: min});
                  break;
                }
              }
            }
          }
        }
        self.resourcesManagedFuel.sort((a, b) => {
          return b.dist - a.dist;
        });
        self.resourcesManagedKarbonite.sort((a, b) => {
          return b.dist - a.dist;
        });
      }
    }

    if (castleTalking.length) {
      for (const ally of castleTalking) {
        // a unit should send this to locate enemies

        self.heatMap.push({code: ally.castle_talk /*, x: ally.x, y: ally.y*/ });
      }
    }

    // Build pilgrims
    if(!self.spawnedKarbonite && !self.spawnedFuel && !self.spawnedCrusaders){
      self.spawnedKarbonite = 0;
      self.spawnedFuel = 0;
      self.spawnedCrusaders = 0;
    }
    if (!self.managedKarbonite || !self.managedFuel) {
      self.managedKarbonite = 0;
      self.managedFuel = 0;
    }
    if (self.karbonite >= 10 + ((self.step > 50 ? 1 : 5) * self.step) && self.fuel >= 100 && (self.spawnedKarbonite < self.managedKarbonite || self.spawnedFuel < self.managedFuel)) {
      self.log("spawning pilgrim");
      let spawnKarbonite = (self.spawnedKarbonite <= self.spawnedFuel);//) || ((self.karbonite < 40 + 10 * self.step && self.spawnedKarbonite < self.managedKarbonite) || self.spawnedFuel >= self.managedFuel);
      let location = {x: self.me.x, y: self.me.y};
      let possibleDirections = structureHelper.getPossibleDirections(location, self.map, self.getVisibleRobotMap())
      let randomDirection = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];

      let targetResource = {x: 0, y: 0};
      if (spawnKarbonite && self.resourcesManagedKarbonite.length > 0) {
        self.log(self.resourcesManagedKarbonite);
        targetResource = self.resourcesManagedKarbonite.pop();
      } else if (!spawnKarbonite && self.resourcesManagedFuel.length > 0) {
        self.log(self.resourcesManagedFuel);
        targetResource = self.resourcesManagedFuel.pop();
      } else if (randomDirection) {
        targetResource = {x: randomDirection.x, y: randomDirection.y};
      }
      //let pos = structureHelper.posTo6Bit(targetResource, self.map.length);
      let pos = targetResource.y * self.map.length + targetResource.x;
      if (pos) {
        self.signal(parseInt((spawnKarbonite ? "1" : "2") + pos.toString(), 10), 2);
      }
      if (randomDirection) {
        if (spawnKarbonite) self.spawnedKarbonite++;
        else self.spawnedFuel++;
        self.log('Building a pilgrim at ' + (self.me.x + randomDirection.x) + ',' + (self.me.y + randomDirection.y));
        return self.buildUnit(SPECS.PILGRIM, randomDirection.x, randomDirection.y);
      } else {
        self.log("No random direction was found - cannot build");
      }
    }

    // defend
    const enemies = self.getVisibleRobots().filter(r => r.team !== team);
    const allies = self.getVisibleRobots().filter(r => r.team === team && r.type === SPECS.PREACHER);
    if (enemies.length > 0) {
      let shortestDist = Infinity;
      let closestEnemy = enemies[0];
      for (const enemy of enemies) {
        let dist = structureHelper.nav.sqDist({x: self.me.x, y: self.me.y}, {x: enemy.x, y: enemy.y});
        if (dist < shortestDist) {
          shortestDist = dist;
          closestEnemy = enemy;
        }
      }
      if (allies.length < 2) {
        if (self.karbonite >= 30) {
          let location = {x: self.me.x, y: self.me.y};
          let possibleDirections = structureHelper.getPossibleDirections(location, self.map, self.getVisibleRobotMap())
          let randomDirection = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];

          if(randomDirection){
            self.log('Building a preacher at ' + (self.me.x+randomDirection.x) + ',' + (self.me.y+randomDirection.y));
            self.signal(parseInt(closestEnemy.x.toString() + closestEnemy.y.toString(), 10), 1);
            return self.buildUnit(SPECS.PREACHER, randomDirection.x, randomDirection.y);
          }else{
            self.log("No random direction was found - cannot build");
          }
        }
      } else {
        return self.attack(closestEnemy.x - self.me.x, closestEnemy.y - self.me.y);
      }
    }

    // if (self.karbonite >= 100 && self.spawnedKarbonite > 0 && self.spawnedFuel > 0) {
    //   let location = {x: self.me.x, y: self.me.y};
    //   let possibleDirections = structureHelper.getPossibleDirections(location, self.map, self.getVisibleRobotMap())
    //   let randomDirection = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
    //
    //   if(randomDirection){
    //     self.log('Building a prophet at ' + (self.me.x+randomDirection.x) + ',' + (self.me.y+randomDirection.y));
    //     return self.buildUnit(SPECS.PROPHET, randomDirection.x, randomDirection.y);
    //   }else{
    //     self.log("No random direction was found - cannot build");
    //   }
    // }

    // if (self.karbonite >= 50 && self.spawnedCrusaders < 4 && self.spawnedKarbonite > 0 && self.spawnedFuel > 0) {
    //   let location = {x: self.me.x, y: self.me.y};
    //   let possibleDirections = structureHelper.getPossibleDirections(location, self.map, self.getVisibleRobotMap())
    //   let randomDirection = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
    //   if(randomDirection){
    //     self.spawnedCrusaders++;
    //     self.log('Building a crusader at ' + (self.me.x+randomDirection.x) + ',' + (self.me.y+randomDirection.y));
    //     return self.buildUnit(SPECS.CRUSADER, randomDirection.x, randomDirection.y);
    //   }else{
    //     self.log("No random direction was found - cannot build");
    //   }
    // }

    // no action
    return null;
  }
};

export default castleHelper;
