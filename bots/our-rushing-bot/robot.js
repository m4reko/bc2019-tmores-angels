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
        this.oppCastleLocations = [
          [-1, -1],
          [-1, -1],
          [-1, -1]
        ];
        this.SK = 60;
        this.SF = 130;
        this.vision = 0;
        this.castleAmount = 0;
        this.castleNumber = null;
        this.heatMap = [];
        this.mapFragments = 8;
        this.helper = null;
        this.step = 0;
    }

    identifyUnit() {
      if (this.me.unit === SPECS.PROPHET) {
        this.helper = prophetHelper;
        this.vision = SPECS.PROPHET.VISION_RADIUS;
      } else if (this.me.unit === SPECS.CASTLE) {
        this.helper = castleHelper;
        this.vision = SPECS.CASTLE.VISION_RADIUS;
      } else if (this.me.unit === SPECS.CHURCH) {
        this.helper = churchHelper;
        this.vision = SPECS.CHURCH.VISION_RADIUS;
      } else if (this.me.unit === SPECS.PILGRIM) {
        this.helper = pilgrimHelper;
        this.vision = SPECS.PILGRIM.VISION_RADIUS;
      } else if (this.me.unit === SPECS.CRUSADER) {
        this.helper = crusaderHelper;
        this.vision = SPECS.CRUSADER.VISION_RADIUS;
      } else if (this.me.unit === SPECS.PREACHER) {
        this.helper = preacherHelper;
        this.vision = SPECS.PREACHER.VISION_RADIUS;
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
