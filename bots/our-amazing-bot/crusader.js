import unitHelper from './unit.js';

var crusaderHelper = {
  turn: self => {
    if(!self.task){
      self.task = "attack_opponent";
    }

    // Current positions
    let location = {x: self.me.x, y: self.me.y};
    let distanceToDestination = -1;
    let randomKarb = unitHelper.getRandomKarbonite(location, self.getKarboniteMap());

    if(self.destination){
      distanceToDestination = unitHelper.sqDist(location, self.destination);
    }

    // Set new destination if none exist
    if(!self.destination || !self.distanceMap){
      if(self.task == "attack_opponent"){
        self.log("Adding mirrored position as destination!");
        self.destination = unitHelper.reflect(self.me, self.getPassableMap(), self.me.id % 2 === 0);
        self.log(self.destination);
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
    }

    if(distanceToDestination<=2 && !closestOpponent){
      self.destination = randomKarb;
      self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
    }

    // Walk towards destination
    let nextDirection = unitHelper.getNextDirection(location, 2, self.distanceMap);
    if(self.getVisibleRobotMap()[location.y + nextDirection.y][location.x + nextDirection.x]){
      // Reload map and direction if someone is blocking
      self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
      nextDirection = unitHelper.getNextDirection(location, 2, self.distanceMap);
      self.log("New path because my path was blocked :@");
    }
    self.log("Moving crusader to: (" +(location.x+nextDirection.x) + ", " +(location.y+nextDirection.y) + ")");
    return self.move(nextDirection.x, nextDirection.y);
  }
};

export default crusaderHelper;
