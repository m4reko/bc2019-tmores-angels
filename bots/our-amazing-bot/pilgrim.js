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
        0: 'mine',
        1: 'scout'
    };

    const microTasks = {
      'mine': {
        0: 'mine_fuel',
        1: 'mine_karbonite',
        2: 'build_church',
        3: 'find',
        4: 'flee'
      }
    };

    let initTarget = null;
    if (self.step === 1) {
      if (self.isRadioing(self.castle)) {
        if (self.castle.signal_radius === 1) {
          let signal = self.castle.signal;
          signal = signal.toString().split("").map(i => parseInt(i, 10));
          if (!self.macro && signal.length) {
            self.macro = macroTasks[signal.pop()];
          }
          if (signal.length > 1) {
            initTarget = {y: signal.pop(), x: signal.pop()};
          }
        }
      }
    }

    if (!self.macro) {
      self.macro = macroTasks[0];
    }
    if(!self.task && self.macro === 'mine'){
      if(self.me.id%5 == 0){
        self.task = microTasks[self.macro][2];
      }else if(self.me.id%2 == 0){
        self.task = microTasks[self.macro][0];
      }else{
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
    let randomKarb = unitHelper.getRandomKarbonite(location, self.getKarboniteMap());
    let closestKarbNotOccupied = unitHelper.getClosestUnoccupiedKarbonite(location, self.getKarboniteMap(), self.getVisibleRobotMap());
    let randomFuel = unitHelper.getRandomKarbonite(location, self.getFuelMap());
    let closestFuelNotOccupied = unitHelper.getClosestUnoccupiedKarbonite(location, self.getFuelMap(), self.getVisibleRobotMap());

    let distanceToDestination = null;

    if (self.destination) {
      distanceToDestination = unitHelper.sqDist(location, self.destination);
    } else {
      distanceToDestination = -1;
    }

    if (!self.churchProspectMap) {
      self.churchProspectMap = unitHelper.createChurchProspectMap(self.map, self.getKarboniteMap(), self.getFuelMap());
    };

    // Set new destination if none exist
    if (!self.destination || !self.distanceMap) {
      if(self.task == "build_church") {
        self.log("Adding church as destination!");
        self.destination = unitHelper.getOptimalChurchLocation(location, self.churchProspectMap);
        self.log(self.destination);
        self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
      } else if (self.task == "mine_karbonite") {
        self.destination = closestKarbNotOccupied; // Set closest Karbonite source as first destination
        self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
      } else if (self.task == "mine_fuel") {
        self.destination = closestFuelNotOccupied; // Set random Karbonite source as first destination
        self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
      }
      distanceToDestination = unitHelper.sqDist(location, self.destination);
    }

    // If returning home or returned home
    if (self.task == "return_home") {
      if (distanceToDestination <= 2) {
        if (self.fuel < self.karbonite) {
          self.task = "mine_fuel"
          self.destination = closestFuelNotOccupied; // Set closest Karbonite source as destination
        } else {
          self.task = "mine_karbonite"
          self.destination = closestKarbNotOccupied; // Set closest Karbonite source as destination
        }
        self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
        self.log("Leaving all karbonite and fuel to castle! Going back to the mine.");

        return self.give(
          self.castle.x - location.x,
          self.castle.y - location.y,
          self.me.karbonite,
          self.me.fuel
        );
      }
    // If mining karbonite or on way to mining karbonite
    } else if (self.task == "mine_karbonite") {
      if (distanceToDestination === 0) {
        if (self.me.karbonite > 18 || self.me.fuel > 90) {
          // If inventory full, go to castle
          self.log("Inventory full. Return home.");
          self.task = "return_home"
          self.destination = self.castle;
          self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
        } else {
          // Else mine!
          self.log("Mining 2 karbonite. Having " + self.me.karbonite);
          return self.mine();
        }
      } else if(distanceToDestination <= 4) {
        // Check if mining spot is occupied, in that case go to new random karbonite source
        if (self.getVisibleRobotMap()[self.destination.y][self.destination.x]) {
          self.destination = closestKarbNotOccupied; // Set closest Karbonite source as destination
          self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
          self.log("Going to new karbonite source.");
        }
      }
    } else if (self.task == "mine_fuel") {
      if (distanceToDestination === 0) {
        if (self.me.karbonite > 18 || self.me.fuel > 90) {
          // If inventory full, go to castle
          self.log("Inventory full. Return home.");
          self.task = "return_home"
          self.destination = self.castle;
          self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
        } else {
          // Else mine!
          self.log("Mining 10 fuel. Now has " + self.me.fuel);
          return self.mine();
        }
      } else if (distanceToDestination <= 4) {
        // Check if mining spot is occupied, in that case go to new random karbonite source
        if (self.getVisibleRobotMap()[self.destination.y][self.destination.x]) {
          self.destination = closestFuelNotOccupied; // Set closest Fuel source as destination
          self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
          self.log("Going to new fuel source.");
        }
      }
    } else if (self.task == "build_church") {
      self.log(distanceToDestination + " from future church location");
      if (distanceToDestination <= 2) {

        let buildDirections = [{x:0, y:1}, {x:1, y:0}, {x:0, y:-1}, {x:-1, y:0}];
        // Find direction to build to
        for (var i=0; i<buildDirections.length; i++) {
          if (unitHelper.isPassable({ x:buildDirections[i].x, y:buildDirections[i].y}, self.map, self.getVisibleRobotMap())) {
            self.log("Building church! Direction: {1,0}");
            self.task = "return_home" // Return home after church is built
            self.destination = self.castle;
            self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());

            return self.buildUnit(
              SPECS.CHURCH,
              buildDirections[i].x,
              buildDirections[i].y
            );
          }
        }

      } else if (distanceToDestination <= 4) {
        if (self.getVisibleRobotMap()[self.destination.y][self.destination.x]) {
          self.churchProspectMap[self.destination.y][self.destination.x] = -1;
          self.destination = unitHelper.getOptimalChurchLocation(location, self.churchProspectMap); // Set random Karbonite source as destination
          self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
          self.log("Going to new church prospect location, last one was occupied.");
          self.log(self.destination);
        }
      }
    }


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
};

export default pilgrimHelper;
