import unitHelper from './unit.js';
import {BCAbstractRobot, SPECS} from 'battlecode';

var pilgrimHelper = {
  turn: self => {
    // On the first turn, find out our base
    if (!self.castle) {
        self.castle = self.getVisibleRobots()
        .filter(robot => robot.team === self.me.team && robot.unit === SPECS.CASTLE)[0];
    }

    if(!self.task){
      if(self.me.id%5 == 0){
        self.task = "build_church";
      }else if(self.me.id%2 == 0){
        self.task = "mine_karbonite";
      }else{
        self.task = "mine_fuel";
      }
    }

    // Current positions
    let location = {x: self.me.x, y: self.me.y};
    let randomKarb = unitHelper.getRandomKarbonite(location, self.getKarboniteMap());
    let randomFuel = unitHelper.getRandomKarbonite(location, self.getFuelMap());
    let distanceToDestination = null;

    if(self.destination){
      distanceToDestination = unitHelper.sqDist(location, self.destination);
    }else{
      distanceToDestination = -1;
    }

    if(!self.churchProspectMap){
      self.churchProspectMap = unitHelper.createChurchProspectMap(self.map, self.getKarboniteMap(), self.getFuelMap());
    };

    // Set new destination if none exist
    if(!self.destination || !self.distanceMap){
      if(self.task == "build_church"){
        self.log("Adding church as destination!");
        self.destination = unitHelper.getOptimalChurchLocation(location, self.churchProspectMap);
        self.log(self.destination);
        self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
      }else if(self.task == "mine_karbonite"){
        self.destination = randomKarb; // Set random Karbonite source as first destination
        self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
      }else if(self.task == "mine_fuel"){
        self.destination = randomKarb; // Set random Karbonite source as first destination
        self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
      }
      distanceToDestination = unitHelper.sqDist(location, self.destination);
    }

    // If returning home or returned home
    if(self.task == "return_home"){
      if(distanceToDestination <= 2){
        if(self.fuel < self.karbonite){
          self.task = "mine_fuel"
          self.destination = randomFuel; // Set random Karbonite source as destination
        }else{
          self.task = "mine_karbonite"
          self.destination = randomKarb; // Set random Karbonite source as destination
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
    }else if(self.task == "mine_karbonite"){
      if(distanceToDestination === 0){
        if(self.me.karbonite > 18 || self.me.fuel > 90){
          // If inventory full, go to castle
          self.log("Inventory full. Return home.");
          self.task = "return_home"
          self.destination = self.castle;
          self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
        }else{
          // Else mine!
          self.log("Mining 2 karbonite. Having " + self.me.karbonite);
          return self.mine();
        }
      }else if(distanceToDestination <= 4){
        // Check if mining spot is occupied, in that case go to new random karbonite source
        if(self.getVisibleRobotMap()[self.destination.y][self.destination.x]){
          self.destination = randomKarb; // Set random Karbonite source as destination
          self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
          self.log("Going to new karbonite source.");
        }
      }
    }else if(self.task == "mine_fuel"){
      if(distanceToDestination === 0){
        if(self.me.karbonite > 18 || self.me.fuel > 90){
          // If inventory full, go to castle
          self.log("Inventory full. Return home.");
          self.task = "return_home"
          self.destination = self.castle;
          self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
        }else{
          // Else mine!
          self.log("Mining 10 fuel. Now has " + self.me.fuel);
          return self.mine();
        }
      }else if(distanceToDestination <= 4){
        // Check if mining spot is occupied, in that case go to new random karbonite source
        if(self.getVisibleRobotMap()[self.destination.y][self.destination.x]){
          self.destination = randomFuel; // Set random Karbonite source as destination
          self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
          self.log("Going to new fuel source.");
        }
      }
    }else if(self.task == "build_church"){
      self.log(distanceToDestination + " from future church location");
      if(distanceToDestination <= 2){
        self.log("Building church! Direction: {1,0}");
        self.task = "return_home" // Return home after church is built
        self.destination = self.castle;
        self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
        return self.buildUnit(
          SPECS.CHURCH,
          1,
          0
        );
      }else if(distanceToDestination <= 4){
        if(self.getVisibleRobotMap()[self.destination.y][self.destination.x]){
          self.churchProspectMap[self.destination.y][self.destination.x] = -1;
          self.destination = unitHelper.getOptimalChurchLocation(location, self.churchProspectMap); // Set random Karbonite source as destination
          self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
          self.log("Going to new church prospect location, last one was occupied.");
          self.log(self.destination);
        }
      }
    }


    let nextDirection = unitHelper.getNextDirection(location, 1, self.distanceMap);
    if(self.getVisibleRobotMap()[location.y + nextDirection.y][location.x + nextDirection.x]){
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
