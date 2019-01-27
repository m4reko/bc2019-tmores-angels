import unitHelper from './unit.js';
import nav from './nav.js';
import {BCAbstractRobot, SPECS} from 'battlecode';

var prophetHelper = {
  turn: self => {
    // // self.log("Prophet:");
    // On the first turn, find out our base
    if (!self.castle) {
      let visibleRobots = self.getVisibleRobots();

      self.castle = visibleRobots
      .filter(robot => robot.team === self.me.team && robot.unit === SPECS.CASTLE)[0];

      if (!self.castle) {
        self.castle = visibleRobots
        .filter(robot => robot.team === self.me.team && robot.unit === SPECS.CHURCH)[0];
      }
    }

    if (!self.task) {
        self.task = "attack_opponent";
    }

    // Current positions
    let location = {x: self.me.x, y: self.me.y};
    let distanceToDestination = Infinity;
    // let randomKarb = unitHelper.getRandomKarbonite(self.getKarboniteMap());

    if (!self.lastDestination) self.lastDestination = {x:-1, y:-1};

    if (self.destination) {
      distanceToDestination = unitHelper.sqDist(location, self.destination);
    }

    let visibleRobotMap = self.getVisibleRobotMap();

    // Set new destination if none exist
    if (!self.destination || !Object.keys(self.destination).length) {

      if (nav.isVertical(self.map)) {
        self.mapIsHorizontal = 0;
      }else{
        self.mapIsHorizontal = 1;
      }
      // self.log("Adding mirrored position as destination!");
      self.destination = unitHelper.reflect(self.me, self.getPassableMap(), self.mapIsHorizontal);
      distanceToDestination = unitHelper.sqDist(location, self.destination);
    }

    // Find nearby robots
    let robotsInView = self.getVisibleRobots().filter(r => r.team !== self.me.team);
    let castleInView = robotsInView.filter(r => r.unit === SPECS.CASTLE)[0];
    let robotsInRange = robotsInView.filter(r => unitHelper.sqDist(location, r) >= 16);

    if(castleInView){
      return self.attack(castleInView.x - location.x, castleInView.y - location.y);
    }
    // Attack if opponent nearby!
    else if (robotsInRange.length) {
      let closestAttackableOpponent = unitHelper.getClosestAttackableOpponent(self.me, robotsInRange);
      // self.log("Attack closest attackable opponent!");
      return self.attack(closestAttackableOpponent.x - location.x, closestAttackableOpponent.y - location.y);
    } else if (robotsInView.length > 0) {
        let closestOpponent = unitHelper.getClosestOpponent(self.me, robotsInView);

        if (closestOpponent) {
          let previousDestination = {x: self.destination.x, y: self.destination.y};
          self.destination = {x: closestOpponent.x, y: closestOpponent.y};
          // self.log(self.destination);
          self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map);
          let populatedDistanceMap = unitHelper.addUnitsToDistanceMap(self.distanceMap, visibleRobotMap, location);
          let nextDirection = unitHelper.getNextDirection(location, 4, self.vision, populatedDistanceMap, visibleRobotMap, true);
          self.destination = {x: previousDestination.x, y: previousDestination.y};
          return self.move(nextDirection.x, nextDirection.y);
        }

    }

    // Walk towards destination
    if (Object.keys(self.destination).length) {
      // self.log(self.destination);
      self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map);

      if (self.distanceMap) {
        let populatedDistanceMap = unitHelper.addUnitsToDistanceMap(self.distanceMap, visibleRobotMap, location);
        let nextDirection = unitHelper.getNextDirection(location, 4, self.vision, populatedDistanceMap);
        // self.log("Moving Prophet to: (" + (location.x + nextDirection.x) + ", " + (location.y + nextDirection.y) + ")");
        if (self.fuel > self.SF) return self.move(nextDirection.x, nextDirection.y);
      }
    }else{
      self.log("No destination");
    }

    return null;
  }
};

export default prophetHelper;
