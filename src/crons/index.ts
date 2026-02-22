import { CronStatus } from './cronStatus';

class Crons {
    private cronStatus: CronStatus;

    constructor() {
        this.cronStatus = new CronStatus();
    }

    start() {
        this.cronStatus.start();
        console.log('Crons initialized.');
    }
}

export default new Crons();
