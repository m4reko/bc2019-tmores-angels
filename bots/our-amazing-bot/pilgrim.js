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
      self.task = "mine_karbonite";
    }

    // Current position
    let location = {x: self.me.x, y: self.me.y};
    let randomKarb = unitHelper.getRandomKarbonite(location, self.getKarboniteMap());
    let distanceToDestination = null;
    if(self.destination){
      distanceToDestination = unitHelper.sqDist(location, self.destination);
    }else{
      distanceToDestination = -1;
    }
    // Set new destination if none exist
    if(!self.destination || !self.distanceMap){
      self.destination = randomKarb; // Set random Karbonite source as first destination
      self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
      distanceToDestination = unitHelper.sqDist(location, self.destination);
    }

    if(self.task == "return_home"){
      if(distanceToDestination <= 2){
        self.task = "mine_karbonite"
        self.destination = randomKarb; // Set random Karbonite source as destination
        self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
        self.log("Leaving all karbonite and fuel to castle! Going back to the mine.");

        return self.give(
          self.castle.x - self.me.x,
          self.castle.y - self.me.y,
          self.me.karbonite,
          self.me.fuel);
      }
    }else if(self.task == "mine_karbonite"){
      if(distanceToDestination === 0){
        if(self.me.karbonite > 18){
          // If inventory full, go to castle
          self.log("Inventory full of karbonite. Return home.");
          self.task = "return_home"
          self.destination = self.castle;
          self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
        }else{
          // Else mine!
          self.log("Mining 2 karbonite.");
          return self.mine();
        }
      }else if(distanceToDestination <= 4){
        // Check if it is occupied, then go to new random karbonite source
        if(self.getVisibleRobotMap()[self.destination.y][self.destination.x]){
          self.destination = randomKarb; // Set random Karbonite source as destination
          self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
          self.log("Going to new carbonite source.");
        }
      }
    }

    let nextDirection = unitHelper.getNextDirection(location, 1, self.distanceMap);

    if(self.getVisibleRobotMap()[location.y + nextDirection.y][location.x + nextDirection.x]){
      // Reload map and direction if someone is blocking
      self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
      nextDirection = unitHelper.getNextDirection(location, 1, self.distanceMap);
      self.log("New path because my path was blocked :(");
    }

    self.log("Current location: (" +(location.x) + ", " +(location.y) + ")");
    self.log("Next location: (" +(location.x+nextDirection.x) + ", " +(location.y+nextDirection.y) + ")");
    self.log("moving pilgrim");
    return self.move(nextDirection.x, nextDirection.y);
  }
};

export default pilgrimHelper;
