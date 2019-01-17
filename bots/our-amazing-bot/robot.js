import {BCAbstractRobot, SPECS} from 'battlecode';
import prophetHelper from './prophet.js';
import castleHelper from './castle.js';
import churchHelper from './church.js';
import pilgrimHelper from './pilgrim.js';
import crusaderHelper from './crusader.js';
import preacherHelper from './preacher.js';

class MyRobot extends BCAbstractRobot {
    constructor() {
        super();
        this.pendingRecievedMessages = {};
        this.enemyCastles = [];
        this.castleLocations = [
          [-1, -1],
          [-1, -1],
          [-1, -1]
        ];
        this.castleNumber = null;
        this.objectiveMap = null;
        this.helper = null;
        this.step = 0;
    }

    identifyUnit() {
      if (this.me.unit === SPECS.PROPHET) {
        this.helper = prophetHelper;
      } else if (this.me.unit === SPECS.CASTLE) {
        this.helper = castleHelper;
      } else if (this.me.unit === SPECS.CHURCH) {
        this.helper = churchHelper;
      } else if (this.me.unit === SPECS.PILGRIM) {
        this.helper = pilgrimHelper;
      } else if (this.me.unit === SPECS.CRUSADER) {
        this.helper = crusaderHelper;
      } else if (this.me.unit === SPECS.PREACHER) {
        this.helper = preacherHelper;
      }
    }

    turn() {
      if (this.step === 0) this.identifyUnit();
      this.step++;
      const res = this.helper.turn(this);
      if (res !== null) {
        return res;
      }
    }
}
