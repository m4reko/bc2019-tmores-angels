import unitHelper from './unit.js';
import nav from './nav.js';
import {BCAbstractRobot, SPECS} from 'battlecode';

var preacherHelper = {
  turn: self => {
    self.log("Preacher:");
    // we do stuff
    if (!self.castle) {
        self.castle = self.getVisibleRobots()
        .filter(robot => robot.team === self.me.team && robot.unit === SPECS.CASTLE)[0];
    }

    if (!self.lastDestination) self.lastDestination = {x: -1, y: -1};

    let location = {x: self.me.x, y: self.me.y};
    let distanceToDestination = Infinity;

    if (self.destination) {
      distanceToDestination = unitHelper.sqDist(location, self.destination);
      self.log("distance from destination: " + distanceToDestination);
    }

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
      self.destination = self.mirroredSpawn;

      self.log(location);
      self.log(self.destination);
    }

    const enemies = self.getVisibleRobots().filter(r => r.team !== self.me.team);
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
        let newGuardPosition = unitHelper.getCastleGuardPosition(self.castle, self.castle, self.map, self.getVisibleRobotMap(), self.karbonite_map, self.fuel_map);

        self.task = "go_to_castle";
        self.destination = newGuardPosition;
        self.log("going to guard castle instead");
        self.log(self.destination);
        self.log("castle position: (" + self.castle.x + ", " + self.castle.y + ")");

      }
    }

    if (Object.keys(self.destination).length) {

      self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map);
      let populatedDistanceMap = unitHelper.addUnitsToDistanceMap(self.distanceMap, self.getVisibleRobotMap(), location);
      let nextDirection = unitHelper.getNextDirection(location, 4, self.vision, populatedDistanceMap);
      self.log(nextDirection);

      if (nextDirection) {
        self.log(nextDirection);
        return self.move(nextDirection.x, nextDirection.y);
      } else {
        self.log("No space to move to");
      }
    }else{
      self.log("No destination.");
    }

    return null;
  }
};

export default preacherHelper;
