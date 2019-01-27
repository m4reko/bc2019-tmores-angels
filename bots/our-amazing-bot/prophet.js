import unitHelper from './unit.js';
import {BCAbstractRobot, SPECS} from 'battlecode';

var prophetHelper = {
  turn: self => {
    // // self.log("Prophet:");
    // On the first turn, find out our base
    let visibleRobots = null;
    if (!self.castle) {
      visibleRobots = self.getVisibleRobots();

      self.castle = visibleRobots
      .filter(robot => robot.team === self.me.team && robot.unit === SPECS.CASTLE)[0];

      if (!self.castle) {
        self.castle = visibleRobots
        .filter(robot => robot.team === self.me.team && robot.unit === SPECS.CHURCH)[0];
      }
    }

    const map = self.getPassableMap();

    let initTarget = null;
    if (self.step === 1) {
      self.waitTurn = 0;
      // // self.log("Hi I'm new");
      if (self.isRadioing(self.castle)) {
        // // self.log("My castle is sending radio");
        if (self.castle.signal_radius === 2) {
          let signal = self.castle.signal;
          // // self.log("I recieved a signal");
          // // self.log("signal: " + signal);
          if (signal) {
            initTarget = {x: signal % map.length, y: (signal - signal % map.length) / map.length};
            // self.log("I'm going to " + initTarget.x + ", " + initTarget.y);
            self.task = "guard_castle"; // mine
            // // self.log("my task is " + self.task);
          }
        }
      }
    }

    if (!self.task) {
        self.task = "guard_castle";
    }

    // Current positions
    const location = {x: self.me.x, y: self.me.y};
    let distanceToDestination = Infinity;
    // let randomKarb = unitHelper.getRandomKarbonite(self.getKarboniteMap());

    if (!self.lastDestination) self.lastDestination = {x: -1, y: -1};

    if (initTarget) {
      self.destination = {x: initTarget.x, y: initTarget.y};
    }

    if (self.destination) {
      distanceToDestination = unitHelper.sqDist(location, self.destination);
    }

    if (self.time < 30) return null;

    const visibleRobotMap = self.getVisibleRobotMap();

    // Set new destination if none exist
    if ((!self.destination || !Object.keys(self.destination).length)) {
      if (self.task === "attack_opponent") {
        // // self.log("Adding mirrored position as destination!");
        self.destination = unitHelper.reflect(self.me, self.getPassableMap(), self.me.id % 2 === 0);
      } else if (self.task === "guard_castle") {
        // // self.log("Just woke up. Adding guard position as destination!");
        self.destination = unitHelper.getCastleGuardPosition(location, self.castle, map, visibleRobotMap, self.getKarboniteMap(), self.getFuelMap());
        // // self.log(self.destination);
      }
      distanceToDestination = unitHelper.sqDist(location, self.destination);
    }

    // Find nearby robots
    if (!visibleRobots) visibleRobots = self.getVisibleRobots();
    const robotsInView = visibleRobots.filter(r => r.team !== self.me.team);
    const robotsInRange = robotsInView.filter(r => unitHelper.sqDist(location, r) > 16);

    if (robotsInRange.length) {
      // Attack if opponent in shooting range!
      let closestAttackableOpponent = unitHelper.getClosestAttackableOpponent(self.me, robotsInRange);
      // // self.log("Attack closest attackable opponent!");
      return self.attack(closestAttackableOpponent.x - location.x, closestAttackableOpponent.y - location.y);
    } else if (robotsInView.length) {
      let closestOpponent = unitHelper.getClosestOpponent(self.me, robotsInView);

      if (closestOpponent) {
        // Move in opposite direction from enemy if enemy too close
        let previousDestination = {x: self.destination.x, y: self.destination.y};
        self.destination = {x: closestOpponent.x, y: closestOpponent.y};
        // // self.log(self.destination);
        self.distanceMap = unitHelper.createDistanceMap(self.destination, map);
        let populatedDistanceMap = unitHelper.addUnitsToDistanceMap(self.distanceMap, visibleRobotMap, location);
        let nextDirection = unitHelper.getNextDirection(location, 4, self.vision, populatedDistanceMap, true);
        self.destination = {x: previousDestination.x, y: previousDestination.y};
        if (nextDirection) return self.move(nextDirection.x, nextDirection.y);
      }
    }

    if (self.task === "guard_castle") {
      // If at destination and no enemy to attack or walk towards,
      // go to new guard position
      //if (distanceToDestination !== 0) self.log("Distance to destination: " + distanceToDestination);
      if (distanceToDestination <= 4) {
        let karbMap = self.getKarboniteMap();
        let fuelMap = self.getFuelMap();
        if (distanceToDestination === 0) {
          if ((self.me.x + self.me.y) % 2 !== 1) {
            self.destination = unitHelper.getCastleGuardPosition(location, self.castle, map, visibleRobotMap, karbMap, fuelMap);
          } else {
            return null; // stand in guard position
          }
        } else if (visibleRobotMap[self.destination.y][self.destination.x] !== 0 || karbMap[self.destination.y][self.destination.x] || fuelMap[self.destination.y][self.destination.x]) {
          if (self.waitTurn < 2) {
            self.waitTurn++;
            return null;
          }
          self.waitTurn = 0;
          // // self.log("Location to guard is occupied")
          // If destination occupied, get new closest guard position
          self.destination = unitHelper.getCastleGuardPosition(location, self.castle, map, visibleRobotMap, karbMap, fuelMap);
        }
      }
    } else if (self.task === "attack_opponent") {

      // TODO: If there is a Message from other robot saying help, go there!

      // If at destination and no enemy to attack or walk towards,
      // go to guard position
      if (distanceToDestination === 0) {
        self.task = "guard_castle";
        // // self.log("Adding guard position as destination!");
        self.destination = unitHelper.getCastleGuardPosition(location, self.castle, map, visibleRobotMap, self.getKarboniteMap(), self.getFuelMap());
        // // self.log(self.destination);
      }
    }

    // Walk towards destination
    if (Object.keys(self.destination).length) {
      //self.log("I want to go here: " + self.destination.x + ", " + self.destination.y + " I'm at: " + location.x + ", " + location.y);
      if (!(self.destination.y === self.lastDestination.y && self.destination.x === self.lastDestination.x)) {
        // // self.log(self.destination);
        self.distanceMap = unitHelper.createDistanceMap(self.destination, map);
        self.lastDestination.x = self.destination.x;
        self.lastDestination.y = self.destination.y;
      }

      if (self.distanceMap) {
        let populatedDistanceMap = unitHelper.addUnitsToDistanceMap(self.distanceMap, visibleRobotMap, location);
        let nextDirection = unitHelper.getNextDirection(location, 4, self.vision, populatedDistanceMap);
        if (nextDirection) {
          if (populatedDistanceMap[location.y][location.x] === populatedDistanceMap[location.y + nextDirection.y][location.x + nextDirection.x]) {
            self.distanceMap = unitHelper.createDistanceMap(self.destination, map, null, visibleRobotMap);
            nextDirection = unitHelper.getNextDirection(location, 4, self.vision, self.distanceMap);
          }
          // if (self.waitTurn) self.waitTurn = 0;
          // for (let y = location.y - 1; y <= location.y + 1; y++) {
          //   for (let x = location.x - 1; x <= location.x + 1; x++) {
          //     if (y >= 0 && x >= 0 && y < self.distanceMap.length && x < self.distanceMap.length) {
          //       // self.log("My neighbour at " + x + ", " + y + " is " + populatedDistanceMap[y][x]);
          //     }
          //   }
          // }

          //self.log("Moving Prophet to: (" + (location.x + nextDirection.x) + ", " + (location.y + nextDirection.y) + ")");
          if (self.fuel > self.SF) return self.move(nextDirection.x, nextDirection.y);
        }
      }
    } else {
      // walk away from castle in search of guard position
      // self.log("I want to walk away from my castle");
      if (!self.castleMap) self.castleMap = unitHelper.createDistanceMap(self.castle, map);
      let populatedDistanceMap = unitHelper.addUnitsToDistanceMap(self.castleMap, visibleRobotMap, location);
      let nextDirection = unitHelper.getNextDirection(location, 4, self.vision, populatedDistanceMap, true);
      if (nextDirection) {
        if (self.waitTurn) self.waitTurn = 0;
        if (self.fuel > self.SF - 30) return self.move(nextDirection.x, nextDirection.y);
      }
    }

    return null;
  }
};

export default prophetHelper;
