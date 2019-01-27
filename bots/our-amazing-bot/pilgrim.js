import unitHelper from './unit.js';
import {BCAbstractRobot, SPECS} from 'battlecode';

var pilgrimHelper = {
  turn: self => {
    // self.log("Pilgrim");

    let map = self.getPassableMap();
    // On the first turn, find out our base
    if (!self.castle || !self.enemyCastle) {
        let visibleRobots = self.getVisibleRobots();
        self.castle = visibleRobots
        .filter(robot => robot.team === self.me.team && robot.unit === SPECS.CASTLE)[0];

        if (!self.castle) {
          self.castle = visibleRobots
          .filter(robot => robot.team === self.me.team && robot.unit === SPECS.CHURCH)[0];
        }

        let vertical = unitHelper.nav.isVertical(map);
        if (vertical) {
          self.enemyCastle = {x: map.length - self.castle.x, y: self.castle.y, unit: self.castle.unit};
        } else {
          self.enemyCastle = {x: self.castle.x, y: map.length - self.castle.y, unit: self.castle.unit};
        }
        // self.log("Enemy castle is at: " + self.enemyCastle.x + ", " + self.enemyCastle.y);
    }

    const tasks = {
      0: 'mine',
      1: 'stash'
    };

    // self.log("My castle is located at: " + self.castle.x + ", " + self.castle.y);

    let initTarget = null;
    if (self.step === 1) {
      // self.log("Hi I'm new");
      self.waitTurn = 0;
      if (self.isRadioing(self.castle)) {
        // self.log("My castle is sending radio");
        if (self.castle.signal_radius === 2) {
          let signal = self.castle.signal;
          // self.log("I recieved a signal");
          // self.log("signal: " + signal);
          if (signal) {
            initTarget = {x: signal % map.length, y: (signal - signal % map.length) / map.length};
            self.log("I'm going to " + initTarget.x + ", " + initTarget.y);
            self.task = tasks[0]; // mine
            // self.log("my task is " + self.task);
          }
        }
      }
    }

    if (!self.task) {
      self.task = tasks[0];
    }

    if (!self.targetarea) {
      self.targetarea = {x: self.castle.x, y: self.castle.y};
    }

    if (!self.seenChurches) {
      self.seenChurches = {};
    }

    // Current positions
    let location = {x: self.me.x, y: self.me.y};
    let destination = false;

    // Set new destination if none exist
    if (initTarget !== null) {
      //self.targetarea = unitHelper.posTo12Bit(map, initTarget);
      self.targetarea = {x: initTarget.x, y: initTarget.y};
      self.destination = {x: self.targetarea.x, y: self.targetarea.y};
      self.resourceDistanceMap = unitHelper.createDistanceMap(self.targetarea, map, self.enemyCastle);
    }

    if (!self.lastDestination) self.lastDestination = {x: -1, y: -1};
    //if (!self.stashTarget) self.stashTarget = null;

    let distanceToDestination = Infinity;

    if (self.destination) {
      distanceToDestination = unitHelper.sqDist(location, self.destination);
    }

    // return with mined stuff
    if (self.destination && self.task == 'stash') {
      // self.log("I'm trying to stash at: " + self.destination.x + ", " + self.destination.y + ". I'm at: " + location.x + ", " + location.y);
      if (distanceToDestination <= 2) {
        let oldDest = {x:self.destination.x, y:self.destination.y};
        self.task = tasks[0]; // mine
        self.destination = {x:self.targetarea.x, y:self.targetarea.y};
        return self.give(
          oldDest.x - location.x,
          oldDest.y - location.y,
          self.me.karbonite,
          self.me.fuel
        );
      } else {
        let target = unitHelper.getClosestChurch(location, self.getVisibleRobots().filter(r => r.team === self.me.team && r.unit === SPECS.CHURCH));
        if(target){
          if(unitHelper.sqDist(location, target) < unitHelper.sqDist(location, self.destination)){
            self.destination = {x: target.x, y: target.y};
          }
        }
      }
    }

    // mine stuff
    if (self.destination && self.task === 'mine') {
      // self.log("I'm trying to mine at: " + self.destination.x + ", " + self.destination.y + ". I'm at: " + location.x + ", " + location.y);
      if (location.x === self.destination.x && location.y === self.destination.y) {
        if (self.waitTurn) self.waitTurn = 0;
        // If at destination
        if (self.me.karbonite > 18 || self.me.fuel > 90) {
          let target = {x: 0, y: 0};
          // if (self.stashTarget === null) {
          let distanceToCastle = unitHelper.sqDist(location, self.castle);
          // self.log("I see these churces: " + self.getVisibleRobots().filter(r => r.team === self.me.team && r.unit === SPECS.CHURCH));
          target = unitHelper.getClosestChurch(location, self.getVisibleRobots().filter(r => r.team === self.me.team && r.unit === SPECS.CHURCH));
          // self.log("This is my closest church " + target);
          if (!target) {
            if (self.karbonite >= 50 && self.fuel >= 200) {
              if (distanceToCastle > 25) {
                target = unitHelper.getChurchBuildPosition(location, map, self.getFuelMap(), self.getKarboniteMap(), self.getVisibleRobotMap());
                // self.log("I'm trying to build here: " + target.x + ", " + target.y);
                if (target.x !== -1 && target.y !== -1) {
                  // self.stashTarget = {x:target.x, y:target.y};
                  return self.buildUnit(SPECS.CHURCH, target.x - location.x, target.y - location.y);
                } else {
                  target = false;
                }
              }
            }
          }

          if (!target) target = {x:self.castle.x, y:self.castle.y};
          let distanceToChurch = unitHelper.sqDist(location, target);

          if (distanceToCastle <= distanceToChurch) {
            target = {x:self.castle.x, y:self.castle.y};
          }
          // self.stashTarget = {x:target.x, y:target.y};
          // } else {
          //
          //   target = {x:self.stashTarget.x, y:self.stashTarget.y};
          //
          // }
          if (unitHelper.sqDist(location, target) > 2) {
            self.task = tasks[1]; // stash
            self.destination = {x:target.x, y:target.y};
          } else {
            self.task = tasks[0]; // keep mining
            return self.give(target.x - location.x, target.y - location.y, self.me.karbonite, self.me.fuel);
          }
        } else {
          return self.mine();
        }
      } else if (distanceToDestination <= 2) {
        let visibleRobotMap = self.getVisibleRobotMap();
        if (!unitHelper.isPassable({x: self.destination.x, y: self.destination.y}, map, visibleRobotMap)) {
          if (self.waitTurn < 2) {
            self.waitTurn++;
            return null;
          }
        }
        if (visibleRobotMap[self.destination.y][self.destination.x]) {
          if (self.waitTurn) self.waitTurn = 0;
          // If destination occupied, get new closest source
          // self.destination = unitHelper.getClosestUnoccupiedKarbonite(location, self.getKarboniteMap(), self.getVisibleRobotMap());
        }
      }
    }

    if (self.destination && Object.keys(self.destination).length) {
      if (self.waitTurn) self.waitTurn = 0;
      // self.log("My task is: " + self.task);
      // self.log("My destination is: " + self.destination.x + ", " + self.destination.y);
      // self.log("My last destination was: " + self.lastDestination.x + ", " + self.lastDestination.y );
      // self.log("Trying to create distance map");
      if (!(self.destination.x === self.lastDestination.x && self.destination.y === self.lastDestination.y)) {
        // self.log("Created distance map");
        if (self.destination.x === self.targetarea.x && self.destination.y === self.targetarea.y) {
          self.distanceMap = self.resourceDistanceMap;
        } else {
          self.distanceMap = unitHelper.createDistanceMap(self.destination, map, self.enemyCastle);
        }
        self.lastDestination = {x: self.destination.x, y: self.destination.y};
      }

      // for (let y = 0; y < self.distanceMap.length; y++) {
      //   let row = "";
      //   for (let x = 0; x < self.distanceMap.length; x++) {
      //     row += "| " + (self.distanceMap[y][x] !== null ? " " : "") + (self.distanceMap[y][x] < 100 && self.distanceMap[y][x] !== null ? " " : "") + (self.distanceMap[y][x] < 10 && self.distanceMap[y][x] !== null && self.distanceMap[y][x] >= 0 ? " " : "")  + self.distanceMap[y][x] + " |";
      //   }
      //   self.log(row);
      // }

      let enemies = self.getVisibleRobots().filter(r => r.team !== self.me.team && r.unit !== SPECS.PILGRIM && r.unit !== SPECS.CHURCH);
      let maxWalk = (self.fuel >= 4 * 4 ? 4 : 2);
      let populatedDistanceMap = unitHelper.addUnitsToDistanceMap(self.distanceMap, self.getVisibleRobotMap(), location);

      // for (let y = 0; y < populatedDistanceMap.length; y++) {
      //   let row = "";
      //   for (let x = 0; x < populatedDistanceMap.length; x++) {
      //     row += "| " + (populatedDistanceMap[y][x] !== null ? " " : "") + (populatedDistanceMap[y][x] < 100 && populatedDistanceMap[y][x] !== null ? " " : "") + (populatedDistanceMap[y][x] < 10 && populatedDistanceMap[y][x] !== null && populatedDistanceMap[y][x] >= 0 ? " " : "")  + populatedDistanceMap[y][x] + " |";
      //   }
      //   self.log(row);
      // }

      let nextDirection = unitHelper.getNextDirection(location, maxWalk, self.vision, populatedDistanceMap);

      if (nextDirection) {
        self.log("Moving pilgrim to: (" + (location.x + nextDirection.x) + ", " + (location.y + nextDirection.y) + ")");
        // // self.log("Passable: " + map[location.y + nextDirection.y][location.x + nextDirection.x]);
        // // self.log("Robots: " + self.getVisibleRobotMap()[location.y + nextDirection.y][location.x + nextDirection.x]);
        if (self.fuel > self.SF) return self.move(nextDirection.x, nextDirection.y);
      } else {
        // self.log("No space to move to");
      }
    }

    return null;
  }
};

export default pilgrimHelper;
