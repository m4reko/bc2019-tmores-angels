import unitHelper from './unit.js';
import {BCAbstractRobot, SPECS} from 'battlecode';

var preacherHelper = {
  turn: self => {
    // we do stuff
    if (!self.castle) {
        self.castle = self.getVisibleRobots()
        .filter(robot => robot.team === self.me.team && robot.unit === SPECS.CASTLE)[0];
    }

    if (self.step === 1) {
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

          if (!self.target) {
            self.target = {x: xPos, y: yPos};
          }
        }
      }
    }

    const enemies = self.getVisibleRobots().filter(r => r.team !== self.me.team);
    if (enemies.length > 0) {
      // attack enemies close to the castle
    } else if (self.me.x !== self.castle.x + 1 && self.me.x !== self.castle.x - 1 || self.me.y !== self.castle.y + 1 && self.me.y !== self.castle.y - 1) {
      // not next to the castle
      // move back to the castle
    }

    // no action
    return null;
  }
};

export default preacherHelper;
