import unitHelper from './unit.js';
import {BCAbstractRobot, SPECS} from 'battlecode';

var preacherHelper = {
  turn: self => {
    self.log("Preacher:");
    // we do stuff
    if (!self.castle) {
        self.castle = self.getVisibleRobots()
        .filter(robot => robot.team === self.me.team && robot.unit === SPECS.CASTLE)[0];
    }

    let location = {x: self.me.x, y: self.me.y};
    let distanceToDestination = Infinity;

    if (self.destination) {
      distanceToDestination = unitHelper.sqDist(location, self.destination);
      self.log("distance from destination: " + distanceToDestination);
    }

    let initTarget = null;
    if (self.step === 1) {
      if (self.isRadioing(self.castle)) {
        // get position from castle to go to
        if (self.castle.signal_radius === 2) {
          let signal = self.castle.signal;
          self.log("I recieved a signal");
          self.log("signal: " + signal);
          if (signal.length) {
            initTarget = {x: signal % self.map.length, y: (signal - signal % self.map.length) / self.map.length};
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
      } else {
        self.destination = unitHelper.getCastleGuardPosition(location, self.castle, self.map, self.getVisibleRobotMap());
      }

      self.task = "go_to_enemy";
      self.log("Going towards enemy position given by castle:");
      self.log(location);
      self.log(self.destination);
      self.log("next direction");
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
    let newGuardPosition = unitHelper.getCastleGuardPosition(location, self.castle, self.map, self.getVisibleRobotMap());

    if (location.x === self.destination.x && location.y === self.destination.y) {
      if (self.task==="go_to_enemy") {

        self.task = "go_to_castle";
        self.destination = newGuardPosition;
        self.log("going to guard castle instead");
        self.log(self.destination);
        self.log("castle position: (" + self.castle.x + ", " + self.castle.y + ")");

      } else if (self.task==="go_to_castle") {
        self.log("Standing still");
        return null;
        if (self.target) {
          // TODO: Get new position from castle? then go there!
          // self.task="go_to_enemy";
          // self.destination = self.target;
          //
          // self.log("New target gotten from castle, going there");
          // self.log(self.destination);
          //
          // self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
          // let nextDirection = unitHelper.getNextDirection(location, 1, self.distanceMap);
          // self.log("Moving preacher towards enemy: (" +(location.x+nextDirection.x) + ", " +(location.y+nextDirection.y) + ")");
          // return self.move(nextDirection.x, nextDirection.y);
        }
      }
    } else if(distanceToDestination<=4){
      if (self.getVisibleRobotMap()[self.destination.y][self.destination.x]) {
        self.log("Location to guard is occupied")
        if (self.waitTurn) self.waitTurn = 0;
        // If destination occupied, get new closest source
        self.destination = unitHelper.getCastleGuardPosition(location, self.castle, self.map, self.getVisibleRobotMap());
      }
    }

    if (Object.keys(self.destination).length) {
      self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
      let nextDirection = unitHelper.getNextDirection(location, 4, self.vision, self.distanceMap, self.getVisibleRobotMap());
      self.log("Just moving preacher one step closer to: (" + (self.destination.x) + ", " + (self.destination.y) + ")");

      if (nextDirection) {
        self.log(nextDirection);
        return self.move(nextDirection.x, nextDirection.y);
      } else {
        self.log("No space to move to");
      }
    }

    return null;
  }
};

export default preacherHelper;
