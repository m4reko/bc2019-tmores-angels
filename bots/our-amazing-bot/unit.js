import {BCAbstractRobot, SPECS} from 'battlecode';

// eslint-disable-next-line no-unused-vars
class Unit extends BCAbstractRobot {
    constructor() {
        super();
        this.pendingRecievedMessages = {};
        this.enemyCastles = [];
    }

    turn() {
        if (this.me.unit === SPECS.PROPHET) {

        }
        else if (this.me.unit === SPECS.CASTLE) {

        }

    }
}
