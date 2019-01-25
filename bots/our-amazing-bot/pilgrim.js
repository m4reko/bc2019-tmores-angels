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

    const tasks = {
      0: 'mine',
      1: 'stash'
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
          if (signal) {
            initTarget = {x: signal % self.map.length, y: (signal - signal % self.map.length) / self.map.length};
            self.log("I'm going to " + initTarget.x + ", " + initTarget.y);
            self.task = tasks[0]; // mine
            self.log("my task is " + self.task);
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

    let enemies = self.getVisibleRobots().filter(r => r.team !== self.me.team);

    // Set new destination if none exist
    if (initTarget !== null) {
      //self.targetarea = unitHelper.posTo12Bit(self.map, initTarget);
      self.targetarea = initTarget;
      self.destination = self.targetarea;
    }

    if (!self.lastDestination) self.lastDestination = {x: -1, y: -1};
    if (!self.stashTarget) self.stashTarget = null;

    let distanceToDestination = Infinity;

    if (self.destination) {
      distanceToDestination = unitHelper.sqDist(location, self.destination);
    }

    // return with mined stuff
    if (self.destination && self.task == 'stash') {
      self.log("I'm trying to stash at: " + self.destination.x + ", " + self.destination.y + ". I'm at: " + location.x + ", " + location.y);
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
      }
    }

    // mine stuff
    if (self.destination && self.task === 'mine') {
      self.log("I'm trying to mine at: " + self.destination.x + ", " + self.destination.y + ". I'm at: " + location.x + ", " + location.y);
      if (location.x === self.destination.x && location.y === self.destination.y) {
        if (self.waitTurn) self.waitTurn = 0;
        // If at destination
        if (self.me.karbonite > 18 || self.me.fuel > 90) {
          let target = {x: 0, y: 0};
          if (self.stashTarget === null) {
            let distanceToCastle = unitHelper.sqDist(location, self.castle);
            self.log("I see these churces: " + self.getVisibleRobots().filter(r => r.team === self.me.team && r.unit === SPECS.CHURCH));
            target = unitHelper.getClosestChurch(location, self.getVisibleRobots().filter(r => r.team === self.me.team && r.unit === SPECS.CHURCH));
            self.log("This is my closest church " + target);
            if (!target) {
              if (self.karbonite >= 50 && self.fuel >= 200) {
                if (distanceToCastle > 25) {
                  target = unitHelper.getChurchBuildPosition(location, self.map, self.fuel_map, self.karbonite_map, self.getVisibleRobotMap());
                  self.log("I'm trying to build here: " + target.x + ", " + target.y);
                  if (target.x !== -1 && target.y !== -1) {
                    self.stashTarget = {x:target.x, y:target.y};
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
            self.stashTarget = {x:target.x, y:target.y};
          } else {
            target = {x:self.stashTarget.x, y:self.stashTarget.y};
          }
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

    if (self.destination && Object.keys(self.destination).length) {
      self.log("My task is: " + self.task);
      self.log("My destination is: " + self.destination.x + ", " + self.destination.y);
      self.log("My last destination was: " + self.lastDestination.x + ", " + self.lastDestination.y );
      self.log("Trying to create distance map");
      if (!(self.destination.x === self.lastDestination.x && self.destination.y === self.lastDestination.y)) {
        self.log("Created distance map");
        self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap(), enemies);
        self.lastDestination = {x: self.destination.x, y: self.destination.y};
      }

      for(let y=location.y-1; y<=location.y+1; y++){
        for(let x=location.x-1; x<=location.x+1; x++){
          if(y>=0 && x>=0 && y<self.distanceMap.length && x<self.distanceMap.length){
            self.log("My neighbour at " + x + ", " + y + " is " + self.distanceMap[y][x]);
          }
        }
      }

      let maxWalk = (self.fuel >= Math.pow(4, 2) ? 4 : 2);
      let nextDirection = unitHelper.getNextDirection(location, maxWalk, self.vision, self.distanceMap, self.getVisibleRobotMap());
      if (nextDirection) {
        self.log("Moving pilgrim to: (" + (location.x + nextDirection.x) + ", " + (location.y + nextDirection.y) + ")");
        // self.log("Passable: " + self.map[location.y + nextDirection.y][location.x + nextDirection.x]);
        // self.log("Robots: " + self.getVisibleRobotMap()[location.y + nextDirection.y][location.x + nextDirection.x]);
        if (self.fuel > self.SF)
          return self.move(nextDirection.x, nextDirection.y);
      } else {
        self.log("No space to move to");
      }
    }

    return null;
  }
};

export default pilgrimHelper;
