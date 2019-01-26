import unitHelper from './unit.js';
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
        self.task = "guard_castle";
    }

    // Current positions
    let location = {x: self.me.x, y: self.me.y};
    let distanceToDestination = Infinity;
    // let randomKarb = unitHelper.getRandomKarbonite(self.getKarboniteMap());

    if (!self.lastDestination) self.lastDestination = {x:-1, y:-1};
    if (lowtime) self.destination = {x: location.x, y: location.y};

    if (self.destination) {
      distanceToDestination = unitHelper.sqDist(location, self.destination);
    }

    let visibleRobotMap = self.getVisibleRobotMap();

    // Set new destination if none exist
    if ((!self.destination || !Object.keys(self.destination).length)) {
      if (self.task === "attack_opponent") {
        // self.log("Adding mirrored position as destination!");
        self.destination = unitHelper.reflect(self.me, self.getPassableMap(), self.me.id % 2 === 0);
      } else if (self.task === "guard_castle") {
        // self.log("Just woke up. Adding guard position as destination!");
        self.destination = unitHelper.getCastleGuardPosition(location, self.castle, self.map, visibleRobotMap, self.karbonite_map, self.fuel_map);
        // self.log(self.destination);
      }
      distanceToDestination = unitHelper.sqDist(location, self.destination);
    }

    // Find nearby robots
    let robotsInView = self.getVisibleRobots().filter(r => r.team !== self.me.team);
    let robotsInRange = robotsInView.filter(r => unitHelper.sqDist(location, r) >= 16);

    // Attack if opponent nearby!
    if (robotsInRange.length) {
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
        let nextDirection = unitHelper.getNextDirection(location, 4, self.vision, populatedDistanceMap, [], true);
        self.destination = {x: previousDestination.x, y: previousDestination.y};
        return self.move(nextDirection.x, nextDirection.y);
      }
    }

    if (self.task === "guard_castle") {
      // If at destination and no enemy to attack or walk towards,
      // go to new guard position
      if (distanceToDestination === 0) {
        if ((self.me.x + self.me.y) % 2 !== (self.castle.x + self.castle.y) % 2) {
          self.destination = unitHelper.getCastleGuardPosition(location, self.castle, self.map, visibleRobotMap, self.karbonite_map, self.fuel_map);
        } else {
          // // self.log("At guard position now");
          return null; // stand in guard position
        }
      } else if (distanceToDestination <= 8 && visibleRobotMap[self.destination.y][self.destination.x]) {
          // self.log("Location to guard is occupied")
          // If destination occupied, get new closest source
          self.destination = unitHelper.getCastleGuardPosition(location, self.castle, self.map, visibleRobotMap, self.karbonite_map, self.fuel_map);
      }
    } else if (self.task === "attack_opponent") {

      // TODO: If there is a Message from other robot saying help, go there!

      // If at destination and no enemy to attack or walk towards,
      // go to guard position
      if (distanceToDestination === 0) {
        self.task = "guard_castle";
        // self.log("Adding guard position as destination!");
        self.destination = unitHelper.getCastleGuardPosition(location, self.castle, self.map, visibleRobotMap, self.karbonite_map, self.fuel_map);
        // self.log(self.destination);
      }
    }

    // Walk towards destination
    if (Object.keys(self.destination).length) {
      if (self.destination.y !== self.lastDestination.y && self.destination.x !== self.lastDestination.x) {
        // self.log(self.destination);
        self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map);
        self.lastDestination.x = self.destination.x;
        self.lastDestination.y = self.destination.y;
      }

      if (self.distanceMap) {
        let populatedDistanceMap = unitHelper.addUnitsToDistanceMap(self.distanceMap, visibleRobotMap, location);
        let nextDirection = unitHelper.getNextDirection(location, 4, self.vision, populatedDistanceMap);
        // self.log("Moving Prophet to: (" + (location.x + nextDirection.x) + ", " + (location.y + nextDirection.y) + ")");
        if (self.fuel > self.SF) return self.move(nextDirection.x, nextDirection.y);
      }
    } else {
      // walk away from castle in search of guard position
      if (!self.castleMap) self.castleMap = unitHelper.createDistanceMap(self.castle, self.map);
      let populatedDistanceMap = unitHelper.addUnitsToDistanceMap(self.castleMap, visibleRobotMap, location);
      let nextDirection = unitHelper.getNextDirection(location, 4, self.vision, populatedDistanceMap, [], true);
      if (self.fuel > self.SF) return self.move(nextDirection.x, nextDirection.y);
    }

    return null;
  }
};

export default prophetHelper;
