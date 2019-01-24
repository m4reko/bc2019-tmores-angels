import unitHelper from './unit.js';
import {BCAbstractRobot, SPECS} from 'battlecode';

var pilgrimHelper = {
  turn: self => {
    self.log("Pilgrim");
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

    self.log("My castle is located at: " + self.castle.x + ", " + self.castle.y);

    let initTarget = null;
    if (self.step === 1) {
      self.log("Hi I'm new");
      self.waitTurn = 0;
      if (self.isRadioing(self.castle)) {
        self.log("My castle is sending radio");
        if (self.castle.signal_radius === 2) {
          let signal = self.castle.signal;
          self.log("I recieved a signal");
          self.log("signal: " + signal);
          signal = signal.toString().split("").map(i => parseInt(i, 10)).reverse();
          if (!self.macro && signal.length) {
            self.macro = macroTasks[signal.pop() - 1];
          }
          if (signal.length && signal.length > 1) {
            signal = parseInt(signal.reverse().join(""), 10);
            initTarget = {x: signal % self.map.length, y: (signal - signal % self.map.length) / self.map.length};
            self.log("I'm going to " + initTarget.x + ", " + initTarget.y);
            self.task = microTasks[self.macro][0]; // mine
            self.log("my task is " + self.task);
          }
        }
      }
    }

    if (!self.targetarea) {
      self.targetarea = {x: self.castle.x, y: self.castle.y};
    }

    if (!self.seenChurches) {
      self.seenChurches = {};
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

    let enemies = self.getVisibleRobots().filter(r => r.team !== self.me.team);

    // Set new destination if none exist
    if (initTarget !== null) {
      //self.targetarea = unitHelper.posTo12Bit(self.map, initTarget);
      self.targetarea = initTarget;
      self.destination = self.targetarea;
    }
    // if ((!self.destination || !self.distanceMap) && (self.macro === 'mine_karbonite' || self.macro === 'mine_fuel')) {
    //   if (self.task == 'build_church') {
    //     self.log("Adding church as destination!");
    //     self.destination = unitHelper.getChurchBuildPosition(location, self.map, self.fuel_map, self.karbonite_map, self.getVisibleRobotMap());
    //     self.log(self.destination);
    //   } else if (self.task == 'mine') {
    //     if (self.macro === 'mine_karbonite') {
    //       let closestKarbNotOccupied = unitHelper.getClosestUnoccupiedKarbonite(location, self.getKarboniteMap(), self.getVisibleRobotMap());
    //       self.destination = closestKarbNotOccupied;
    //     } else if (self.macro === 'mine_fuel') {
    //       let closestFuelNotOccupied = unitHelper.getClosestUnoccupiedKarbonite(location, self.getFuelMap(), self.getVisibleRobotMap());
    //       self.destination = closestFuelNotOccupied;
    //     }
    //   }
    // }

    let distanceToDestination = Infinity;

    if (self.destination) {
      distanceToDestination = unitHelper.sqDist(location, self.destination);
    }

    // return with mined stuff
    if (self.destination && self.task == 'stash') {
      self.log("I'm trying to stash at: " + self.destination.x + ", " + self.destination.y + ". I'm at: " + location.x + ", " + location.y);
      if (distanceToDestination <= 2) {
        let oldDest = self.destination;
        self.task = microTasks[self.macro][0]; // mine
        self.destination = self.targetarea;
        return self.give(
          oldDest.x - location.x,
          oldDest.y - location.y,
          self.me.karbonite,
          self.me.fuel
        );
      }
    }

    // find stuff
    // if (self.destination && self.task === 'find') {
    //   self.log("my target is: " + self.destination.x + ", " + self.destination.y + ". I'm at: " + location.x + ", " + location.y);
    //   if (distanceToDestination <= 2) {
    //     self.task = microTasks[self.macro][0];
    //     let distanceToCastle = unitHelper.sqDist(location, self.castle);
    //     let distanceToChurch = unitHelper.sqDist(location, unitHelper.getClosestChurch(location, self.getVisibleRobots().filter(r => r.team === self.me.team && r.unit === SPECS.CHURCH)));
    //     if (isNaN(distanceToChurch)) distanceToChurch = Infinity;
    //     if (distanceToCastle >= 25 && distanceToChurch >= 25) {
    //       self.task = microTasks[self.macro][1]; // build church
    //       self.destination = unitHelper.unitHelper.getChurchBuildPosition(location, self.map, self.fuel_map, self.karbonite_map, self.getVisibleRobotMap());
    //     } else {
    //       self.task = microTasks[self.macro][0]; // mine
    //       self.destination = self.targetarea;
    //     }
    //     self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap(), enemies);
    //   }
    // }

    // mine stuff
    if (self.destination && self.task === 'mine') {
      self.log("I'm trying to mine at: " + self.destination.x + ", " + self.destination.y + ". I'm at: " + location.x + ", " + location.y);
      if (location.x === self.destination.x && location.y === self.destination.y) {
        if (self.waitTurn) self.waitTurn = 0;
        // If at destination
        if (self.me.karbonite > 18 || self.me.fuel > 90) {
          self.task = microTasks[self.macro][2]; // stash
          let distanceToCastle = unitHelper.sqDist(location, self.castle);
          self.log("I see these churces: " + self.getVisibleRobots().filter(r => r.team === self.me.team && r.unit === SPECS.CHURCH));
          let target = unitHelper.getClosestChurch(location, self.getVisibleRobots().filter(r => r.team === self.me.team && r.unit === SPECS.CHURCH));
          self.log("This is my closest church");
          if (!target) {
            if (self.karbonite >= 50 && self.fuel >= 200) {
              if (distanceToCastle > 25) {
                self.task = microTasks[self.macro][0]; // build church
                target = unitHelper.getChurchBuildPosition(location, self.map, self.fuel_map, self.karbonite_map, self.getVisibleRobotMap());
                self.log("I'm trying to build here: " + target.x + ", " + target.y);
                return self.buildUnit(SPECS.CHURCH, target.x - location.x, target.y - location.y);
              }
            }
          }
          if (!target) target = self.castle;
          let distanceToChurch = unitHelper.sqDist(location, target);
          if (distanceToCastle <= distanceToChurch) {
            self.task = microTasks[self.macro][2]; // stash
            target = self.castle;
          }
          if (unitHelper.sqDist(location, target) > 2) {
            self.destination = target;
          } else {
            self.task = microTasks[self.macro][0]; // keep mining
            return self.give(target.x - location.x, target.y - location.y, self.me.karbonite, self.me.fuel);
          }
        } else {
          return self.mine();
        }
      } else if (distanceToDestination <= 2) {
        if (!unitHelper.isPassable({x: self.destination.x, y: self.destination.y}, self.map, self.getVisibleRobotMap())) {
          if (self.waitTurn < 2) {
            self.waitTurn++;
            return null;
          }
        }
        if (self.getVisibleRobotMap()[self.destination.y][self.destination.x]) {
          if (self.waitTurn) self.waitTurn = 0;
          // If destination occupied, get new closest source
          // self.destination = unitHelper.getClosestUnoccupiedKarbonite(location, self.getKarboniteMap(), self.getVisibleRobotMap());
        }
      }
    }

    if (self.destination && self.task === 'build_church') {
      self.log("I'm trying to build at: " + self.destination.x + ", " + self.destination.y + ". I'm at: " + location.x + ", " + location.y);
      if (distanceToDestination <= 2) {
        let passable = unitHelper.isPassable({x: self.destination.x, y: self.destination.y}, self.map, self.getVisibleRobotMap());
        // TODO: check if detination is alraedy a church

        if (self.karbonite >= 50 && self.fuel >= 200 && passable) {
          if (self.waitTurn) self.waitTurn = 0;
          if (self.me.karbonite > 18 || self.me.fuel > 90) {
            self.task = microTasks[self.macro][2]; // stash
          } else {
            self.task = microTasks[self.macro][0]; // mine
            self.destination = self.targetarea;
          }

          return self.buildUnit(
            SPECS.CHURCH,
            self.destination.x - location.x,
            self.destination.y - location.y
          );
        } else if (self.waitTurn < 2) {
          self.waitTurn++;
          return null;
        } else {
          if (self.waitTurn) self.waitTurn = 0;
          if (self.me.karbonite > 18 || self.me.fuel > 90) {
            // stash at castle instead
            self.task = microTasks[self.macro][2]; // stash
            self.destination = {x: self.castle.x, y: self.castle.y};
          } else {
            // we can mine some more instead
            self.task = microTasks[self.macro][0];
            self.destination = self.targetarea;
          }
        }
      } else {
        let closestChurch = unitHelper.getClosestChurch(location, self.getVisibleRobots().filter(r => r.team === self.me.team && r.unit === SPECS.CHURCH));
        if (unitHelper.sqDist(location, closestChurch) <= 25) {
          // there's another church nearby
          if (self.me.karbonite > 18 || self.me.fuel > 90) {
            // stash at the nearby castle
            self.task = microTasks[self.macro][2]; // stash
            self.destination = closestChurch;
          } else {
            // go mine instead
            self.task = microTasks[self.macro][0]; // mine
            self.destination = self.targetarea;
          }
        }
      }
    }

    if (self.destination) {
      self.log("My task is: " + self.task);
      self.log("My destination is: " + self.destination.x + ", " + self.destination.y);
      self.log("Trying to create distance map");
      self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap(), enemies);
      // for (let y = 0; y < self.map.length; y++) {
      //   let row = "";
      //   for (let x = 0; x < self.map[y].length; x++) {
      //     row += "| " + (self.map[y][x] ? "O" : "X") + " ";
      //   }
      //   self.log(row);
      // }
      // for (const y of self.getVisibleRobotMap()) {
      //   let row = "";
      //   for (const x of y) {
      //     row += "| " + (x < 1000 ? " " : "") + (x < 100 ? " " : "") + (x < 10 && x >= 0 ? " " : "") + x + " ";
      //   }
      //   self.log(row);
      // }
      // for (const y of self.distanceMap) {
      //   let row = "";
      //   for (const x of y) {
      //     row += "| " + (x < 1000 ? " " : "") + (x < 100 ? " " : "") + (x < 10 && x >= 0 ? " " : "") + x + " ";
      //   }
      //   self.log(row);
      // }
      let nextDirection = unitHelper.getNextDirection(location, 4, self.vision, self.distanceMap);
      //  if (!unitHelper.isPassable({x: location.x + nextDirection.x, y: location.y + nextDirection.y}, self.map, self.getVisibleRobotMap())) {
      //   // Reload map and direction if someone is blocking
      //   self.log("Trying to make distance map from 314");
      //   self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap(), enemies, self);
      //   nextDirection = unitHelper.getNextDirection(location, 1, self.distanceMap);
      //   self.log("New path because my path was blocked :@");
      // }

      self.log("Moving pilgrim to: (" + (location.x + nextDirection.x) + ", " + (location.y + nextDirection.y) + ")");
      // self.log("Passable: " + self.map[location.y + nextDirection.y][location.x + nextDirection.x]);
      // self.log("Robots: " + self.getVisibleRobotMap()[location.y + nextDirection.y][location.x + nextDirection.x]);
      return self.move(nextDirection.x, nextDirection.y);
    }

    return null;
  }
};

export default pilgrimHelper;
