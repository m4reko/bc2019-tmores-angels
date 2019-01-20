import unitHelper from './unit.js';
import {BCAbstractRobot, SPECS} from 'battlecode';

var pilgrimHelper = {
  turn: self => {
    // On the first turn, find out our base
    if (!self.castle) {
        self.castle = self.getVisibleRobots()
        .filter(robot => robot.team === self.me.team && robot.unit === SPECS.CASTLE)[0];
    }

    const macroTasks = {
        0: 'mine_karbonite',
        1: 'mine_fuel',
        2: 'scout'
    };

    const microTasks = {
      'mine_karbonite': {
        0: 'mine',
        1: 'build_church',
        2: 'stash',
        3: 'find',
        4: 'flee'
      },
      'mine_fuel': {
        0: 'mine',
        1: 'build_church',
        2: 'stash',
        3: 'find',
        4: 'flee'
      },
      'scout': {
        0: 'find',
        1: 'flee',
        2: 'spy',
        3: 'attack'
      }
    };

    let initTarget = null;
    if (self.step === 1) {
      if (self.isRadioing(self.castle)) {
        if (self.castle.signal_radius === 1) {
          let signal = self.castle.signal;
          self.log("I recieved a signal");
          self.log("signal: " + signal);
          signal = signal.toString().split("").map(i => parseInt(i, 10)).reverse();
          if (!self.macro && signal.length) {
            self.macro = macroTasks[signal.pop() - 1];
          }
          if (signal.length && signal.length > 1) {
            initTarget = {x: signal.pop(), y: signal.pop()};
            self.log("I'm going to " + initTarget.x + ", " + initTarget.y);
            self.task = microTasks[self.macro][3];
            self.log("my task is " + self.task);
          }
        }
      }
    }

    if (!self.macro) {
      if (self.karbonite > self.fuel) {
        self.macro = macroTasks[0];
      } else {
        self.macro = macroTasks[1];
      }
      if (self.me.id%5 == 0 && self.karbonite > 50 && self.fuel>200) {
        self.task = microTasks[self.macro][1];
      } else {
        self.task = microTasks[self.macro][1];
      }
    }

    if (self.step === 1 && self.macro === 'scout') {
      // create a danger map
      // this will show the range of the opposing castles as dangerous areas that should be avoided
      if (!self.dangerMap) {
        let dangerMap = [];
        let map = self.map;
        for (const spot in map) {

        }
        self.dangerMap = dangerMap;

      }
    }

    // Current positions
    let location = {x: self.me.x, y: self.me.y};
    let destination = false;

    if (!self.churchProspectMap) {
      self.churchProspectMap = unitHelper.createChurchProspectMap(self.map, self.getKarboniteMap(), self.getFuelMap());
    }

    // Set new destination if none exist
    if (initTarget !== null && self.task === 'find') {
      self.destination = unitHelper.posTo12Bit(self.map, initTarget);
    }
    if ((!self.destination || !self.distanceMap) && (self.macro === 'mine_karbonite' || self.macro === 'mine_fuel')) {
      if (self.task == 'build_church') {
        self.log("Adding church as destination!");
        self.destination = unitHelper.getOptimalChurchLocation(location, self.churchProspectMap);
        self.log(self.destination);
        self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
      } else if (self.task == 'mine') {
        if (self.macro === 'mine_karbonite') {
          let closestKarbNotOccupied = unitHelper.getClosestUnoccupiedKarbonite(location, self.getKarboniteMap(), self.getVisibleRobotMap());
          self.destination = closestKarbNotOccupied;
        } else if (self.macro === 'mine_fuel') {
          let closestFuelNotOccupied = unitHelper.getClosestUnoccupiedKarbonite(location, self.getFuelMap(), self.getVisibleRobotMap());
          self.destination = closestFuelNotOccupied;
        }
      }
    }

    let distanceToDestination = Infinity;

    if (self.destination) {
      distanceToDestination = unitHelper.sqDist(location, self.destination);
      self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
    }

    // return with mined stuff
    if (self.destination && self.task == 'stash') {
      self.log("I'm trying to stash at: " + self.destination.x + ", " + self.destination.y + ". I'm at: " + location.x + ", " + location.y);
      if (distanceToDestination <= 2) {
        let oldDest = self.destination;
        self.task = microTasks[self.macro][0];
        if (self.macro === 'mine_karbonite') {
          self.destination = unitHelper.getClosestUnoccupiedKarbonite(location, self.getKarboniteMap(), self.getVisibleRobotMap());
        } else if (self.macro === 'mine_fuel') {
          self.destination = unitHelper.getClosestUnoccupiedKarbonite(location, self.getFuelMap(), self.getVisibleRobotMap());
        }
        self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
        return self.give(
          oldDest.x - location.x,
          oldDest.y - location.y,
          self.me.karbonite,
          self.me.fuel
        );
      }
    }

    // mine stuff
    if (self.destination && self.task === 'mine') {
      self.log("I'm trying to mine at: " + self.destination.x + ", " + self.destination.y + ". I'm at: " + location.x + ", " + location.y);
      if (distanceToDestination <= 0 || (location.x === self.destination.x && location.y === self.destination.y)) {
        if (self.me.karbonite > 18 || self.me.fuel > 90) {
          self.task = microTasks[self.macro][2];
          let target = unitHelper.getClosestChurch(location, self.getVisibleRobots().filter(r => r.team === self.me.team && r.type === SPECS.CHURCH));
          if (!target) {
            if (self.karbonite > 50 && self.fuel > 200) {
              let distanceToCastle = unitHelper.sqDist(location, self.castle);
              let distanceToChurch = unitHelper.sqDist(location, unitHelper.getClosestChurch(location, self.getVisibleRobots().filter(r => r.team === self.me.team && r.type === SPECS.CHURCH)));
              if (distanceToCastle >= 50 && distanceToChurch >= 16) {
                self.task = microTasks[self.macro][1];
                target = unitHelper.getOptimalChurchLocation(location, self.churchProspectMap);
              }
            } else {
              target = {x: self.castle.x, y: self.castle.y};
            }
          }
          if (!target) target = {x: self.castle.x, y: self.castle.y};
          self.destination = target;
          self.log("I'm trying to get a distance map with: " + self.destination.x + ", " + self.destination.y);
          self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
        } else {
          return self.mine();
        }
      } else if (distanceToDestination <= 4) {
        if (self.getVisibleRobotMap()[self.destination.y][self.destination.x]) {
          if (self.macro === 'mine_karbonite') {
            self.destination = unitHelper.getClosestUnoccupiedKarbonite(location, self.getKarboniteMap(), self.getVisibleRobotMap());
          } else if (self.macro === 'mine_fuel') {
            self.destination = unitHelper.getClosestUnoccupiedKarbonite(location, self.getFuelMap(), self.getVisibleRobotMap());
          }
          self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
        }
      }
    }

    if (self.destination && self.task === 'build_church') {
      self.log("I'm trying to build at: " + self.destination.x + ", " + self.destination.y + ". I'm at: " + location.x + ", " + location.y);
      if (distanceToDestination <= 2) {
        let buildDirections = [{x:0, y:1}, {x:1, y:0}, {x:0, y:-1}, {x:-1, y:0}];

        if (self.karbonite > 50 && self.fuel > 200) {
          // Find direction to build to
          for (var i = 0; i < buildDirections.length; i++) {
            if (unitHelper.isPassable({x: buildDirections[i].x, y: buildDirections[i].y}, self.map, self.getVisibleRobotMap())) {
              self.task = microTasks[self.macro][0];
              if (self.macro === 'mine_karbonite') {
                self.destination = unitHelper.getClosestUnoccupiedKarbonite(location, self.getKarboniteMap(), self.getVisibleRobotMap());
              } else if (self.macro === 'mine_fuel') {
                self.destination = unitHelper.getClosestUnoccupiedKarbonite(location, self.getFuelMap(), self.getVisibleRobotMap());
              }
              self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());

              return self.buildUnit(
                SPECS.CHURCH,
                buildDirections[i].x,
                buildDirections[i].y
              );
            }
          }
        } else {
          if (self.me.karbonite > 18 || self.me.fuel > 90) {
            self.task = microTasks[self.macro][2];
            self.destination = {x: self.castle.x, y: self.castle.y};
            self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
          } else {
            self.task = microTasks[self.macro][0];
            if (self.macro === 'mine_karbonite') {
              self.destination = unitHelper.getClosestUnoccupiedKarbonite(location, self.getKarboniteMap(), self.getVisibleRobotMap());
            } else if (self.macro === 'mine_fuel') {
              self.destination = unitHelper.getClosestUnoccupiedKarbonite(location, self.getFuelMap(), self.getVisibleRobotMap());
            }
            self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
          }
        }
      } else if (unitHelper.sqDist(location, unitHelper.getClosestChurch(location, self.getVisibleRobots().filter(r => r.team === self.me.team && r.type === SPECS.CHURCH))) <= 10) {
        self.task = microTasks[self.macro][0];
        if (self.macro === 'mine_karbonite') {
          self.destination = unitHelper.getClosestUnoccupiedKarbonite(location, self.getKarboniteMap(), self.getVisibleRobotMap());
        } else if (self.macro === 'mine_fuel') {
          self.destination = unitHelper.getClosestUnoccupiedKarbonite(location, self.getFuelMap(), self.getVisibleRobotMap());
        }
        self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
      }
    }

    if (self.destination && self.task === 'find') {
      self.log("my target is: " + self.destination.x + ", " + self.destination.y + ". I'm at: " + location.x + ", " + location.y);
      if (distanceToDestination <= 4) {
        let distanceToCastle = unitHelper.sqDist(location, self.castle);
        let distanceToChurch = unitHelper.sqDist(location, unitHelper.getClosestChurch(location, self.getVisibleRobots().filter(r => r.team === self.me.team && r.type === SPECS.CHURCH)));
        if (isNaN(distanceToChurch)) distanceToChurch = Infinity;
        self.log("I'm this far from my castle: " + distanceToCastle);
        self.log("I'm this far from a church: " + distanceToChurch);
        if (distanceToCastle >= 110 && distanceToChurch >= 40) {
          self.log("I'm building");
          self.task = microTasks[self.macro][1];
          self.destination = unitHelper.getOptimalChurchLocation(location, self.churchProspectMap);
          self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
        } else {
          self.task = microTasks[self.macro][0];
          self.log("I'm mining");
          if (self.macro === 'mine_karbonite') {
            self.destination = unitHelper.getClosestUnoccupiedKarbonite(location, self.getKarboniteMap(), self.getVisibleRobotMap());
          } else if (self.macro === 'mine_fuel') {
            self.destination = unitHelper.getClosestUnoccupiedKarbonite(location, self.getFuelMap(), self.getVisibleRobotMap());
          }
          self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
        }
      }
    }

    if (self.destination) {
      let nextDirection = unitHelper.getNextDirection(location, 1, self.distanceMap);
      if (self.getVisibleRobotMap()[location.y + nextDirection.y][location.x + nextDirection.x]) {
        // Reload map and direction if someone is blocking
        self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
        nextDirection = unitHelper.getNextDirection(location, 1, self.distanceMap);
        self.log("New path because my path was blocked :@");
      }

      self.log("Moving pilgrim to: (" +(location.x+nextDirection.x) + ", " +(location.y+nextDirection.y) + ")");
      return self.move(nextDirection.x, nextDirection.y);
    }
  }
};

export default pilgrimHelper;
