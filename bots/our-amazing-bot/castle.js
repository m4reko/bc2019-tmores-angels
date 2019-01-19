import structureHelper from './structure.js';
import {BCAbstractRobot, SPECS} from 'battlecode';

var castleHelper = {
  turn: self => {
    if(!self.castleAmount){
      // Just setting castle amount to 1 before we counted them
      self.castleAmount = 1;
    }
    // we do stuff
    const team = self.me.team;
    let selfOffer = self.last_offer[team];

    let castleTalkValue = self.me.castle_talk;

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
    }

    if (castleTalkValue >= 64) {
      // a unit should send this to locate enemies
      let position = castleTalkValue - 64;
      let xPos = position % 8;
      let yPos = (position - xPos) / 8;

      self.objectiveMap.push({code: 1, frag: true, x: xPos, y: yPos});

      if (self.castleNumber === self.castleAmount) {
        // last castle will reset the signal
        self.castleTalk(0);
      }
    }

    // Build pilgrims
    if(!self.spawnedPilgrims && !self.spawnedCrusaders){
      self.spawnedPilgrims = 0;
      self.spawnedCrusaders = 0;
    }
    if (self.karbonite >= 20 && self.spawnedPilgrims < (6/self.castleAmount)) {
      self.spawnedPilgrims++;
      let location = {x: self.me.x, y: self.me.y};
      let possibleDirections = structureHelper.getPossibleDirections(location, self.map, self.getVisibleRobotMap())
      let randomDirection = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];

      self.log('Building a pilgrim at ' + (self.me.x+randomDirection.x) + ',' + (self.me.y+randomDirection.y));
      return self.buildUnit(SPECS.PILGRIM, randomDirection.x, randomDirection.y);
    }
    if (self.karbonite >= 50 && self.spawnedCrusaders < (10/self.castleAmount)) {
      self.spawnedCrusaders++;
      let location = {x: self.me.x, y: self.me.y};
      let possibleDirections = structureHelper.getPossibleDirections(location, self.map, self.getVisibleRobotMap())
      let randomDirection = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];

      self.log('Building a crusader at ' + (self.me.x+randomDirection.x) + ',' + (self.me.y+randomDirection.y));
      return self.buildUnit(SPECS.CRUSADER, randomDirection.x, randomDirection.y);
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

          self.log('Building a preacher at ' + (self.me.x+randomDirection.x) + ',' + (self.me.y+randomDirection.y));

          self.signal(parseInt(closestEnemy.x.toString() + closestEnemy.y.toString(), 10), 1);
          return self.buildUnit(SPECS.PREACHER, randomDirection.x, randomDirection.y);
        }
      } else {
        return self.attack(closestEnemy.x - self.me.x, closestEnemy.y - self.me.y);
      }
    }

    if (!self.resourceNumber || !self.resourceMap) {
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
    }
    // no action
    return null;
  }
};

export default castleHelper;
