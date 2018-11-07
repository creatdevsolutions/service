import {Service} from "./service";
import Timeout = NodeJS.Timeout;

const Logger = require("logplease");
const logger = Logger.create("ping.js");

class Ping {

    private _serviceInst: Service;
    private _intervalId?: NodeJS.Timeout | null;
    private readonly _intervalInMilliseconds?: number;

    constructor(service: Service, intervalInMilliseconds: number) {

        this._serviceInst = service;
        this._intervalId = null;

        if (intervalInMilliseconds < 1000) {
            logger.warn("Ping interval was under 1s.");
            logger.warn("It is now 1s.");
            this._intervalInMilliseconds = 1000;


        } else {
            this._intervalInMilliseconds = intervalInMilliseconds;
        }

    }

    pingAutobahnkreuz() {

        const pingUUID = Math.random().toString(36).substr(3, 8);

        this._serviceInst._bundesstrasseSession.call("ee.ping").then(() => {
            logger.debug(`Ping ${pingUUID} was successful.`);
        }).catch(() => {
            logger.error(`Ping ${pingUUID} could not be send correctly.`);
            this._serviceInst.closeConnection();
        });
    }

    startPing() {

        if (this._intervalId) {
            logger.warn("Tried to start ping interval, but there is a running ping interval.");
            return;
        }

        this._intervalId = setInterval(this.pingAutobahnkreuz.bind(this), this._intervalInMilliseconds) as any as Timeout;
        logger.debug("Enabled ping interval.");
    }

    endPing() {
        if (this._intervalId) {
            clearInterval(this._intervalId);
            logger.debug("Ended ping interval.");
        } else {
            logger.warn("Tried to end ping interval, but there was none.");
        }
    }
}

export {
    Ping
};
