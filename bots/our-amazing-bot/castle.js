import structureHelper from './structure.js';
import {BCAbstractRobot, SPECS} from 'battlecode';

var castleHelper = {
  turn: self => {
    // we do stuff
    const team = self.me.team;
    let selfOffer = self.last_offer[team];

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
        return self.proposeTrade(parseInt(selfOffer[0].toString() + self.me.x.toString(), 10), parseInt(selfOffer[0].toString() + self.me.y.toString(), 10));
      } else {
        let offerXString = selfOffer[0].toString();
        let offerYString = selfOffer[1].toString();
        self.castleLocations[0] = [parseInt(offerXString.substring(isNegative), 10), parseInt(offerYString.substring(isNegative), 10)];
      }
      let highestCastleCount = selfOffer[0].toString();
      highestCastleCount = parseInt(highestCastleCount.substring(0, isNegative), 10);
      if (self.castleNumber === highestCastleCount * tradeSign) {
        self.castleLocations[self.castleNumber - 1] = [self.me.x, self.me.y];
        return self.proposeTrade(parseInt((highestCastleCount * tradeSign).toString() + self.me.x.toString(), 10), parseInt((highestCastleCount * tradeSign).toString() + self.me.y.toString(), 10));
      }
    } else if (self.step === 3) {
      // things to do on the third turn only
      // check the next castle location if there is one
      let highestCastleCount = selfOffer[0].toString();
      highestCastleCount = parseInt(highestCastleCount.substring(0, isNegative), 10);
      if (highestCastleCount > 1) {
        if (self.castleNumber !== highestCastleCount) {
          let offerXString = selfOffer[0].toString();
          let offerYString = selfOffer[1].toString();
          self.castleLocations[highestCastleCount - 1] = [parseInt(offerXString.substring(isNegative), 10), parseInt(offerYString.substring(isNegative), 10)];
        }
        if (self.castleNumber !== highestCastleCount && self.castleNumber !== 1) {
          self.castleLocations[self.castleNumber - 1] = [self.me.x, self.me.y];
          return self.proposeTrade(parseInt((highestCastleCount * tradeSign).toString() + self.me.x.toString(), 10), parseInt((highestCastleCount * tradeSign).toString() + self.me.y.toString(), 10));
        }
      }
    } else if (self.step === 4) {
      // things to do on the fourth turn only
      // if there are 3 castles we check the last positions here
      let highestCastleCount = selfOffer[0].toString();
      highestCastleCount = parseInt(highestCastleCount.substring(0, isNegative), 10);
      if (highestCastleCount > 2) {
        if (self.castleNumber === 1 || self.castleNumber === 3) {
          let offerXString = selfOffer[0].toString();
          let offerYString = selfOffer[1].toString();
          self.castleLocations[1] = [parseInt(offerXString.substring(isNegative), 10), parseInt(offerYString.substring(isNegative), 10)];
        }
      }
      self.log(self.castleLocations);
    } else if (self.step === 5) {
      // things to do on the fifth turn only
      // check the map and calculate the position of opposing castles
      let highestCastleCount = selfOffer[0].toString();
      highestCastleCount = parseInt(highestCastleCount.substring(0, isNegative), 10);

      const vertical = structureHelper.isVertical(self.map);
      if (vertical) {
        self.log('vertical');
        if (self.castleLocations[0][0] >= 0) {
          self.oppCastleLocations[0][0] = self.map[0].length - self.castleLocations[0][0];
          self.oppCastleLocations[0][1] = self.castleLocations[0][1];
        }
        if (self.castleLocations[1][0] >= 0) {
          self.oppCastleLocations[1][0] = self.map[0].length - self.castleLocations[1][0];
          self.oppCastleLocations[1][1] = self.castleLocations[1][1];
        }
        if (self.castleLocations[2][0] >= 0) {
          self.oppCastleLocations[2][0] = self.map[0].length - self.castleLocations[2][0];
          self.oppCastleLocations[2][1] = self.castleLocations[2][1];
        }
      } else {
        self.log('horizontal');
        if (self.castleLocations[0][1] >= 0) {
          self.oppCastleLocations[0][0] = self.castleLocations[0][0];
          self.oppCastleLocations[0][1] = self.map.length - self.castleLocations[0][1];
        }
        if (self.castleLocations[1][1] >= 0) {
          self.oppCastleLocations[1][0] = self.castleLocations[1][0];
          self.oppCastleLocations[1][1] = self.map.length - self.castleLocations[1][1];
        }
        if (self.castleLocations[2][1] >= 0) {
          self.oppCastleLocations[2][0] = self.castleLocations[2][0];
          self.oppCastleLocations[2][1] = self.map.length - self.castleLocations[2][1];
        }
      }
      self.log(self.oppCastleLocations);
    }

    // Build crusadors
    if(!self.spawnedPilgrims){
      self.spawnedPilgrims = 0;
    }
    if (self.karbonite >= 20 && self.spawnedPilgrims < 5) {
      self.spawnedPilgrims++;
      let location = {x: self.me.x, y: self.me.y};
      let possibleDirections = structureHelper.getPossibleDirections(location, self.map, self.getVisibleRobotMap())
      let randomDirection = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];

      self.log('Building a pilgrim at ' + (self.me.x+randomDirection.x) + ',' + (self.me.y+randomDirection.y));
      return self.buildUnit(SPECS.PILGRIM, randomDirection.x, randomDirection.y);
    }

    return null;
  }
};

export default castleHelper;
