import unitHelper from './unit.js';
import nav from './nav.js';
import {BCAbstractRobot, SPECS} from 'battlecode';

var crusaderHelper = {
  turn: self => {
    self.log("Crusader:");
    // On the first turn, find out our base
    if (!self.castle) {
      // Set castle as home if castle
        self.castle = self.getVisibleRobots()
        .filter(robot => robot.team === self.me.team && robot.unit === SPECS.CASTLE)[0];
        if (!self.castle) {
          // Set church as home if church
          self.castle = self.getVisibleRobots()
          .filter(robot => robot.team === self.me.team && robot.unit === SPECS.CHURCH)[0];
          self.spawnedByChurch = true;
        }
    }
    if (!self.castle) {
      self.castle = {x: self.me.x, y: self.me.y};
    }

    if (!self.task) {
      if (self.me.id%3 == 0) {
        self.task = "guard_castle";
      } else {
        self.task = "attack_opponent";
      }
      self.task = "attack_opponent";
    }

    // Current positions
    let location = {x: self.me.x, y: self.me.y};
    let distanceToDestination = 1000;
    let randomKarb = unitHelper.getRandomKarbonite(self.getKarboniteMap());

    if (self.destination) {
      distanceToDestination = unitHelper.sqDist(location, self.destination);
    }

    // Set new destination if none exist
    if (!self.destination) {
      self.mapIsHorizontal = 1;
      if (nav.isVertical(self.map)) {
        self.mapIsHorizontal = 0;
        self.log("Map is vertically mirrored");
      } else {
        self.log("Map is horizontally mirrored");
      }
      self.spawnPoint = location;
      self.mirroredSpawn = unitHelper.reflect(self.me, self.getPassableMap(), self.mapIsHorizontal);

      // Init positions
      let interestingLocations = [];

      if (self.task === "attack_opponent") {
        self.log("Adding mirrored spawn as destination! or randomkarb if spawned by church");
        self.destination = self.mirroredSpawn;
        if (self.spawnedByChurch) {
          self.destination = randomKarb;
        }
      }
      else if (self.task === "guard_castle") {
        self.log("Adding guard position as destination!");
        self.destination = unitHelper.getCastleGuardPosition(self.castle, self.map);
      }

      distanceToDestination = unitHelper.sqDist(location, self.destination);
    }

    // Find nearby robots
    let nearbyRobots = self.getVisibleRobots();
    let closestOpponent = unitHelper.getClosestAttackableOpponent(self.me, nearbyRobots);

    // Attack if opponent nearby!
    if (closestOpponent) {
      self.log("Attack opponent!");
      return self.attack(closestOpponent.x - location.x, closestOpponent.y - location.y);
    } else {
      // Walk towards enemies within view range
      for (var i = 0; i < nearbyRobots.length; i++) {
        if (nearbyRobots[i].team != self.me.team) {
          let previousDestination = self.destination;
          self.destination = nearbyRobots[i];
          self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map);
          let nextDirection = unitHelper.getNextDirection(location, 9, self.vision, self.distanceMap, self.getVisibleRobotMap());
          self.destination = previousDestination;
          if (nextDirection) return self.move(nextDirection.x, nextDirection.y);
        }
      }
    }

    if (self.task === "guard_castle") {
      // If at destination and no enemy to attack or walk towards,
      // go to new guard position
      if (distanceToDestination <= 2) {
        return;
      }
    } else if (self.task === "attack_opponent") {
      // TODO: If there is a Message from other robot saying help, go there!

      if (distanceToDestination <= 2) {
          self.log("Go back to spawn!");
          self.task = "go_to_castle";
          self.destination = self.spawnPoint;
      }
    } else if (self.task === "go_to_castle") {
      if (distanceToDestination <= 2) {
        self.task = "attack_opponent";
        self.log("Go back to mirroredSpawn!");
        self.destination = self.mirroredSpawn;
        if (self.spawnedByChurch) {
          self.destination = randomKarb;
        }
      }
    }


    if (self.destination) {
      // Walk towards destination
      self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map);
      let nextDirection = unitHelper.getNextDirection(location, 9, self.vision, self.distanceMap, self.getVisibleRobotMap());
      self.log("Moving crusader to: (" +(location.x+nextDirection.x) + ", " +(location.y+nextDirection.y) + ")");
      if (nextDirection) {
        return self.move(nextDirection.x, nextDirection.y);
      } else {
        self.log("No space to move to");
      }
    }
  }
};

export default crusaderHelper;
