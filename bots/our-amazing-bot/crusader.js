import unitHelper from './unit.js';
import nav from './nav.js';
import {BCAbstractRobot, SPECS} from 'battlecode';

var crusaderHelper = {
  turn: self => {
    // On the first turn, find out our base
    if (!self.castle) {
      // Set castle as home if castle
        self.castle = self.getVisibleRobots()
        .filter(robot => robot.team === self.me.team && robot.unit === SPECS.CASTLE)[0];
        if(!self.castle){
          // Set church as home if church
          self.castle = self.getVisibleRobots()
          .filter(robot => robot.team === self.me.team && robot.unit === SPECS.CHURCH)[0];
        }
    }

    if(!self.task){
      if(self.me.id%3 == 0){
        self.task = "guard_castle";
      }else{
        self.task = "attack_opponent";
      }
      self.task = "attack_opponent";
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
      self.mapIsHorizontal = 1;
      if(nav.isVertical(self.map)){
        self.mapIsHorizontal = 0;
        self.log("Map is vertically mirrored");
      }else{
        self.log("Map is horizontally mirrored");
      }
      self.spawnPoint = location;
      self.mirroredSpawn = unitHelper.reflect(self.me, self.getPassableMap(), self.mapIsHorizontal);

      // Init positions
      let interestingLocations = [];

      if(self.task === "attack_opponent"){
        self.log("Adding mirrored spawn as destination!");
        self.log(self.spawnPoint);
        self.log(self.mirroredSpawn);
        self.destination = self.mirroredSpawn;
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
          let previousDestination = self.destination;
          self.destination = nearbyRobots[i];
          self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
          let nextDirection = unitHelper.getNextDirection(location, 2, self.distanceMap);
          self.destination = previousDestination;
          self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
          return self.move(nextDirection.x, nextDirection.y);
        }
      }
    }

    if(self.task === "guard_castle"){
      // If at destination and no enemy to attack or walk towards,
      // go to new guard position
      if(distanceToDestination<=2){
        return;
      }
    }else if(self.task === "attack_opponent"){
      // TODO: If there is a Message from other robot saying help, go there!

      if(distanceToDestination<=2){
          self.log("Go back to spawn!");
          self.task = "go_to_castle";
          self.destination = self.spawnPoint;
          self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
      }
    }else if(self.task === "go_to_castle"){
      if(distanceToDestination<=2){
        self.task = "attack_opponent";
        self.log("Go back to mirroredSpawn!");
        self.destination = self.mirroredSpawn;
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
