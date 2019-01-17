import structureHelper from './structure.js';
import {BCAbstractRobot, SPECS} from 'battlecode';

var castleHelper = {
  turn: self => {
    // we do stuff
    // Build crusadors
    if(!self.spawnedPilgrims){
      self.spawnedPilgrims = 0;
    }
    if (self.karbonite >= 20 && self.spawnedPilgrims < 10) {
      self.spawnedPilgrims++;
      let location = {x: self.me.x, y: self.me.y};
      let possibleDirections = structureHelper.getPossibleDirections(location, self.map, self.getVisibleRobotMap())
      let randomDirection = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];

      self.log('Building a pilgrim at ' + (self.me.x+randomDirection.x) + ',' + (self.me.y+randomDirection.y));
      return self.buildUnit(SPECS.PILGRIM, randomDirection.x, randomDirection.y);
    }

    const team = self.me.team;
    self.log(self.last_offer);
    let selfOffer = self.last_offer[team];

    let tradeSign = 1;
    if (team === 0) {
      tradeSign = -1;
    }
    let isNegative = (tradeSign < 0 ? 2 : 1);

    if (self.step === 1) {
      // things to do first turn only
      // count castles
      self.log(self.me.x);
      self.log(self.me.y);
      let castles = selfOffer[0] || 0;
      castles += 1 * tradeSign;
      self.castleNumber = castles * tradeSign;
      self.log(castles);
      return self.proposeTrade(castles, 1000 * tradeSign);

    } else if (self.step === 2 && (selfOffer[0] > 1 || selfOffer[0] < -1)) {
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
      self.log(self.castleNumber);
      self.log(selfOffer);
    } else if (self.step === 3) {
      // things to do on the third turn only
      // check the next castle location if there is one
      self.log(self.castleLocations);
    }

    return null;
  }
};

export default castleHelper;
