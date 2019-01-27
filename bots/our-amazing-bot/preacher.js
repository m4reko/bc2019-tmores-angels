import unitHelper from './unit.js';
import {BCAbstractRobot, SPECS} from 'battlecode';

var preacherHelper = {
  turn: self => {
    // self.log("Preacher:");
    // we do stuff
    let visibleRobots = self.getVisibleRobots();
    if (!self.castle) {
        self.castle = visibleRobots
        .filter(robot => robot.team === self.me.team && robot.unit === SPECS.CASTLE)[0];

        if (!self.castle) {
          self.castle = visibleRobots
          .filter(robot => robot.team === self.me.team && robot.unit === SPECS.CHURCH)[0];
        }
    }

    if (!self.lastDestination) self.lastDestination = {x: -1, y: -1};

    let location = {x: self.me.x, y: self.me.y};
    let distanceToDestination = Infinity;

    let map = self.getPassableMap();

    if (self.destination) {
      distanceToDestination = unitHelper.sqDist(location, self.destination);
      // self.log("distance from destination: " + distanceToDestination);
    }

    let initTarget = null;
    if (self.step === 1) {
      if (self.isRadioing(self.castle)) {
        // get position from castle to go to
        if (self.castle.signal_radius === 2) {
          let signal = self.castle.signal;
          self.log("I recieved a signal");
          self.log("signal: " + signal);
          if (signal) {
            initTarget = {x: signal % map.length, y: (signal - signal % map.length) / map.length};
            self.log("I'm going to " + initTarget.x + ", " + initTarget.y);
          }
        }
      }
    }

    if (initTarget !== null) {
      self.target = initTarget;
    }

    if (!self.destination) {
      // Start by going towards an enemy
      if (self.target) {
        self.destination = self.target;
        self.task = "go_to_enemy";
      } else {
        self.destination = unitHelper.getCastleGuardPosition(self.castle, self.castle, map, self.getVisibleRobotMap(), self.getKarboniteMap(), self.getFuelMap());
        self.task = "go_to_castle";
      }

      self.log("Going towards enemy position given by castle:");
      self.log(location);
      self.log(self.destination);
      self.log("next direction");
    }

    const enemies = visibleRobots.filter(r => r.team !== self.me.team);
    let closestOpponent = unitHelper.getClosestAttackableOpponent(self.me, enemies);

    // Attack if opponent nearby!
    if (closestOpponent) {
      self.log("attack closest enemy")
      return self.attack(closestOpponent.x - location.x, closestOpponent.y - location.y);
    } else if (enemies.length > 0) {
      // Walk towards an enemy within view range
      self.log("walking towards enemy")
      self.task = "go_to_enemy";
      self.destination = enemies[0];
    }

    // If at destination and no enemies nearby

    if (location.x === self.destination.x && location.y === self.destination.y) {
      if (self.task==="go_to_enemy") {
        let newGuardPosition = unitHelper.getCastleGuardPosition(self.castle, self.castle, map, self.getVisibleRobotMap(), self.getKarboniteMap(), self.getFuelMap());

        self.task = "go_to_castle";
        self.destination = newGuardPosition;
        self.log("going to guard castle instead");
        self.log(self.destination);
        self.log("castle position: (" + self.castle.x + ", " + self.castle.y + ")");

      } else if (self.task==="go_to_castle") {

        if (self.isRadioing(self.castle) && unitHelper.sqDist(location, self.castle) <= 8 && self.castle.signal_radius === 8) {
          // get position from castle to go to
          let signal = self.castle.signal;
          self.log("I recieved a signal");
          self.log("signal: " + signal);
          if (signal) {
            self.destination = {x: signal % map.length, y: (signal - signal % map.length) / map.length};
            self.task = "go_to_enemy";
          } else {
            return null;
          }
        } else {
          // self.log("Standing still");
          return null;
        }
      }
    } else if (distanceToDestination <= 16) {
      let visibleRobotMap = self.getVisibleRobotMap();
      if (visibleRobotMap[self.destination.y][self.destination.x]) {
        self.log("Location to guard is occupied");
        if (self.waitTurn) self.waitTurn = 0;
        // If destination occupied, get new closest source
        self.destination = unitHelper.getCastleGuardPosition(self.castle, self.castle, map, visibleRobotMap, self.getKarboniteMap(), self.getFuelMap());
      }
    }

    if (Object.keys(self.destination).length) {

      if (!(self.destination.x === self.lastDestination.x && self.destination.y === self.lastDestination.y)) {
        self.log("Created distance map");
        self.distanceMap = unitHelper.createDistanceMap(self.destination, map);
        self.lastDestination = {x: self.destination.x, y: self.destination.y};
      }

      let populatedDistanceMap = unitHelper.addUnitsToDistanceMap(self.distanceMap, self.getVisibleRobotMap(), location);
      let nextDirection = unitHelper.getNextDirection(location, 4, self.vision, populatedDistanceMap);
      self.log(nextDirection);

      if (nextDirection) {
        self.log("distance map value on my position: " + self.distanceMap[location.y][location.x]);
        self.log("distance map value on next position: " + self.distanceMap[location.y + nextDirection.y][location.x + nextDirection.x]);
        self.log("direction:" + nextDirection.y + ", " + nextDirection.x)
        self.log("Just moving preacher one step closer to: (" + (self.destination.x) + ", " + (self.destination.y) + ")");

        self.log(nextDirection);
        if (self.fuel > self.SF) return self.move(nextDirection.x, nextDirection.y);
      } else {
        self.log("No space to move to");
      }
    }

    return null;
  }
};

export default preacherHelper;
