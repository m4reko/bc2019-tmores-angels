import unitHelper from './unit.js';
import {BCAbstractRobot, SPECS} from 'battlecode';

var preacherHelper = {
  turn: self => {
    self.log("Preacher:");
    // we do stuff
    if (!self.castle) {
        self.castle = self.getVisibleRobots()
        .filter(robot => robot.team === self.me.team && robot.unit === SPECS.CASTLE)[0];
    }

    let location = {x: self.me.x, y: self.me.y};
    let distanceToDestination = 10000;

    if (self.destination) {
      distanceToDestination = unitHelper.sqDist(location, self.destination);
      self.log("distance from destination: " + distanceToDestination);
    }

    if (self.isRadioing(self.castle)) {
      if (self.castle.signal_radius === 1) {
        let signal = self.castle.signal;
        signal = signal.toString();
        let xPos = 0;
        let yPos = 0;
        if (signal.length === 2) {
          xPos = parseInt(signal.substring(0, 1), 10);
          yPos = parseInt(signal.substring(1), 10);
        } else if (signal.length === 3) {
          xPos = parseInt(signal.substring(0, 1), 10);
          yPos = parseInt(signal.substring(1), 10);
          let testpos1 = [xPos, yPos];
          let xPos2 = parseInt(signal.substring(0, 2), 10);
          let yPos2 = parseInt(signal.substring(2), 10);
          let testpos2 = [xPos2, yPos2];
          let dist1 = unitHelper.nav.sqDist({x: self.me.x, y: self.me.y}, {x: testpos1[0], y: testpos1[1]});
          let dist2 = unitHelper.nav.sqDist({x: self.me.x, y: self.me.y}, {x: testpos2[0], y: testpos2[1]});
          if (dist1 > dist2) {
            xPos = xPos2;
            yPos = yPos2;
          }
        } else {
          xPos = parseInt(signal.substring(0, 2), 10);
          yPos = parseInt(signal.substring(2), 10);
        }
        if(!self.target){
          self.target = {x: xPos, y: yPos};
        }
      }
    }

    if(!self.destination){
      // Start by going towards an enemy
      self.task = "go_to_enemy";
      if(self.target){
        self.destination = self.target;
      }else{
        self.destination = location;
      }

      self.log("Going to enemy position given by castle:");
      self.log(self.destination);
      self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
      let nextDirection = unitHelper.getNextDirection(location, 1, self.distanceMap);
      return self.move(nextDirection.x, nextDirection.y);
    }

    const enemies = self.getVisibleRobots().filter(r => r.team !== self.me.team);
    let closestOpponent = unitHelper.getClosestAttackableOpponent(self.me, enemies);

    // Attack if opponent nearby!
    if(closestOpponent){
      self.log("attack closest enemy")
      return self.attack(closestOpponent.x - location.x, closestOpponent.y - location.y);
    }else if(enemies.length>0){
      // Walk towards an enemy within view range
      self.log("walking towards enemy")
      self.task = "go_to_enemy";
      self.destination = enemies[0];
      self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
      let nextDirection = unitHelper.getNextDirection(location, 1, self.distanceMap);
      return self.move(nextDirection.x, nextDirection.y);
    }

    // If at destination and no enemies nearby
    let possibleDirections = unitHelper.getPossibleDirections(self.castle, self.map, self.getVisibleRobotMap());
    let freeSpotNextToCastle = false;
    if(possibleDirections.length>3){
      // destination next to the castle if many spots available
      freeSpotNextToCastle = {x: possibleDirections[0].x + self.castle.x, y: possibleDirections[0].y + self.castle.y};
    }else if(possibleDirections.length>0){
      // destination to steps away from the castle if only 1 or 2 spots is available
      let spotNextToCastle = {x: possibleDirections[0].x + self.castle.x, y: possibleDirections[0].y + self.castle.y};
      let directionsFromNextToCastle = unitHelper.getPossibleDirections(spotNextToCastle, self.map, self.getVisibleRobotMap());
      if(directionsFromNextToCastle.length>0){
        freeSpotNextToCastle = {x: directionsFromNextToCastle[0].x + self.castle.x, y: directionsFromNextToCastle[0].y + self.castle.y};
      }else{
        freeSpotNextToCastle = self.castle;
      }
    }else{
      // destination is the castle itself if no spots are available around it
      freeSpotNextToCastle = self.castle;
    }

    if(distanceToDestination <= 2){
      if(self.task=="go_to_enemy"){
        self.task = "go_to_castle";
        if(freeSpotNextToCastle){
          self.destination = freeSpotNextToCastle;
        }else{
          self.destination = self.castle;
        }
        self.log("going to castle instead");
        self.log(self.destination);
        self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
        let nextDirection = unitHelper.getNextDirection(location, 1, self.distanceMap);
        self.log("Moving preacher towards castle: (" +(location.x+nextDirection.x) + ", " +(location.y+nextDirection.y) + ")");
        return self.move(nextDirection.x, nextDirection.y);

      }else if(self.task=="go_to_castle"){
        if(self.target){
          // self.task="go_to_enemy";
          // self.destination = self.target;
          //
          // self.log("New target gotten from castle, going there");
          // self.log(self.destination);
          //
          // self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
          // let nextDirection = unitHelper.getNextDirection(location, 1, self.distanceMap);
          // self.log("Moving preacher towards enemy: (" +(location.x+nextDirection.x) + ", " +(location.y+nextDirection.y) + ")");
          // return self.move(nextDirection.x, nextDirection.y);
        }
      }
    }else{
      self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
      let nextDirection = unitHelper.getNextDirection(location, 1, self.distanceMap);
      self.log("Moving preacher: (" +(location.x+nextDirection.x) + ", " +(location.y+nextDirection.y) + ")");
      return self.move(nextDirection.x, nextDirection.y);
    }

    // Walk towards destination
    // let nextDirection = unitHelper.getNextDirection(location, 1, self.distanceMap);
    // if(self.getVisibleRobotMap()[location.y + nextDirection.y][location.x + nextDirection.x]){
    //   // Reload map and direction if someone is blocking
    //   self.log("New path because my path was blocked :@");
    //   self.log(self.destination);
    //   self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
    //   nextDirection = unitHelper.getNextDirection(location, 1, self.distanceMap);
    // }
    // self.log("Moving preacher to: (" +(location.x+nextDirection.x) + ", " +(location.y+nextDirection.y) + ")");
    // return self.move(nextDirection.x, nextDirection.y);
  }
};

export default preacherHelper;
