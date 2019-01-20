import unitHelper from './unit.js';
import {BCAbstractRobot, SPECS} from 'battlecode';

var crusaderHelper = {
  turn: self => {
    // On the first turn, find out our base
    if (!self.castle) {
        self.castle = self.getVisibleRobots()
        .filter(robot => robot.team === self.me.team && robot.unit === SPECS.CASTLE)[0];
        if(!self.castle){
          self.castle = self.getVisibleRobots()
          .filter(robot => robot.team === self.me.team && robot.unit === SPECS.CHURCH)[0];
        }
    }
    if (!self.castle) {
      self.castle = {x: self.me.x, y: self.me.y};
    }

    if(!self.task){
      if(self.me.id%3 == 0){
        self.task = "guard_castle";
      }else{
        self.task = "attack_opponent";
      }
    }

    // Current positions
    let location = {x: self.me.x, y: self.me.y};
    let distanceToDestination = 1000;
    let randomKarb = unitHelper.getRandomKarbonite(self.getKarboniteMap());

    if(self.destination){
      distanceToDestination = unitHelper.sqDist(location, self.destination);
    }

    // Set new destination if none exist
    if(!self.destination || !self.distanceMap){
      if(self.task === "attack_opponent"){
        self.log("Adding mirrored position as destination!");
        self.destination = unitHelper.reflect(self.me, self.getPassableMap(), self.me.id % 2 === 0);
        self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
      }
      else if(self.task === "guard_castle"){
        self.log("Adding guard position as destination!");
        self.destination = unitHelper.getCastleGuardPosition(self.castle, self.map);
        self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
      }

      distanceToDestination = unitHelper.sqDist(location, self.destination);
    }

    // Find nearby robots
    let nearbyRobots = self.getVisibleRobots();
    let closestOpponent = unitHelper.getClosestAttackableOpponent(self.me, nearbyRobots);

    // Attack if opponent nearby!
    if(closestOpponent){
      self.log("Attack opponent!");
      return self.attack(closestOpponent.x - location.x, closestOpponent.y - location.y);
    }else{
      // Walk towards enemies within view range
      for(var i = 0; i<nearbyRobots.length; i++){
        if(nearbyRobots[i].team != self.me.team){
          self.destination = nearbyRobots[i];
          self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
          let nextDirection = unitHelper.getNextDirection(location, 2, self.distanceMap);
          return self.move(nextDirection.x, nextDirection.y);
        }
      }
    }

    if(self.task === "guard_castle"){
      // If at destination and no enemy to attack or walk towards,
      // go to new guard position
      if(distanceToDestination<=2){
        self.destination = unitHelper.getCastleGuardPosition(self.castle, self.map);
        self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
      }
    }else if(self.task === "attack_opponent"){
      // TODO: If there is a Message from other robot saying help, go there!

      // If at destination and no enemy to attack or walk towards,
      // go to random karbonite source just for fun
      if(distanceToDestination<=2){
        self.log("Adding random karb as destination!");
        self.destination = randomKarb;
        self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
      }
    }


    // Walk towards destination
    let nextDirection = unitHelper.getNextDirection(location, 1, self.distanceMap);
    if(self.getVisibleRobotMap()[location.y + nextDirection.y][location.x + nextDirection.x]){
      // Reload map and direction if someone is blocking
      self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
      nextDirection = unitHelper.getNextDirection(location, 1, self.distanceMap);
      self.log("New path because my path was blocked :@");
    }
    self.log("Moving crusader to: (" +(location.x+nextDirection.x) + ", " +(location.y+nextDirection.y) + ")");
    return self.move(nextDirection.x, nextDirection.y);
  }
};

export default crusaderHelper;
