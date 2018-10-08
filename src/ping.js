const Logger = require('logplease');
const logger = Logger.create('ping.js');

class Ping {
    constructor(service, intervalInMillseconds) {

        this._serviceInst = service;
        this._intervalId = null;

        if (intervalInMillseconds < 1000) {
            logger.warn('Ping interval was under 1s.');
            logger.warn('It is now 1s.');
            this._intervalInMilliseconds = 1000;


        } else {
            this._intervalInMilliseconds = intervalInMillseconds;
        }

    }

    pingAutobahnkreuz() {

        const pingUUID = Math.random().toString(36).substr(3, 8);

        this._serviceInst._bundesstrasseSession.call('ee.ping').then(() => {
            logger.debug(`Ping ${pingUUID} was successful.`);
        }).catch(() => {
            logger.error(`Ping ${pingUUID} could not be send correctly.`);
            this._serviceInst.closeConnection();
        })
    }

    startPing() {

        if (this._intervalId) {
            logger.warn('Tried to start ping interval, but there is a running ping interval.')
            return;
        }

        this._intervalId = setInterval(this.pingAutobahnkreuz.bind(this), this._intervalInMilliseconds);
        logger.debug('Enabled ping interval.');
    }

    endPing() {
        if (this._intervalId) {
            clearInterval(this._intervalId);
            logger.debug('Ended ping interval.')
        } else {
            logger.warn('Tried to end ping interval, but there was none.')
        }


    }
}

module.exports = Ping;
