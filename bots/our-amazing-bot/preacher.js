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
      // get position from castle to go to
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
      if(self.target){
        self.destination = self.target;
      }else{
        self.destination = unitHelper.getCastleGuardPosition(self.castle, self.map);
      }

      self.task = "go_to_enemy";
      self.log("Going towards enemy position given by castle:");
      self.log(location);
      self.log(self.destination);
      self.log("next direction");
      self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
      let nextDirection = unitHelper.getNextDirection(location, 2, self.vision, self.distanceMap);
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
      let nextDirection = unitHelper.getNextDirection(location, 2, self.vision, self.distanceMap);
      return self.move(nextDirection.x, nextDirection.y);
    }

    // If at destination and no enemies nearby
    let newGuardPosition = unitHelper.getCastleGuardPosition(self.castle, self.map);

    if(location.x === self.destination.x && location.y === self.destination.y){
      if(self.task==="go_to_enemy"){

        self.task = "go_to_castle";
        self.destination = newGuardPosition;
        self.log("going to guard castle instead");
        self.log(self.destination);
        self.log("castle position: (" + self.castle.x + ", " + self.castle.y + ")");
        self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
        let nextDirection = unitHelper.getNextDirection(location, 2, self.vision, self.distanceMap);
        self.log("Moving preacher towards castle: (" +(location.x+nextDirection.x) + ", " +(location.y+nextDirection.y) + ")");
        return self.move(nextDirection.x, nextDirection.y);

      }else if(self.task==="go_to_castle"){
        self.log("Standing still");
        return null;
        if(self.target){
          // TODO: Get new position from castle? then go there!
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
    } else if(distanceToDestination<=4){
      if (self.getVisibleRobotMap()[self.destination.y][self.destination.x]) {
        self.log("Location to guard is occupied")
        if (self.waitTurn) self.waitTurn = 0;
        // If destination occupied, get new closest source
        self.destination = unitHelper.getCastleGuardPosition(self.castle, self.map);
      }
    }
    self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
    let nextDirection = unitHelper.getNextDirection(location, 1, self.distanceMap);
    if(nextDirection.x > 1 || nextDirection.y <-1 || nextDirection.y > 1 || nextDirection.x <-1){
      self.destination = unitHelper.getCastleGuardPosition(self.castle, self.map);
      self.distanceMap = unitHelper.createDistanceMap(self.destination, self.map, self.getVisibleRobotMap());
      let nextDirection = unitHelper.getNextDirection(location, 2, self.vision, self.distanceMap);
      self.log("Just moving preacher: (" +(location.x+nextDirection.x) + ", " +(location.y+nextDirection.y) + ")");
      return self.move(nextDirection.x, nextDirection.y);
    }
    self.log(nextDirection);
    self.log("Just moving preacher one step closer to: (" +(self.destination.x) + ", " +(self.destination.y) + ")");
    return self.move(nextDirection.x, nextDirection.y);
  }
};

export default preacherHelper;
