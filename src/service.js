/**
 * Service is the main class, which communicates with the Interconnect.
 */

const autobahn = require('autobahn');
const Logger = require('logplease');
const logger = Logger.create('service.js');
const _ = require('lodash');

class Service {

    constructor(serviceConfiguration) {
        this._serviceConfiguration = serviceConfiguration;
        this._autobahnConnection = null;
        this._autobahnSession = null;

        logger.info('Created Service.')

    }

    onChallenge(session, method, extra) {

        // Ticket Authentication
        if(method === 'ticket') {
            return this._serviceConfiguration.password;
        } else {
            throw Error(`No Challenge for Authentication Method ${method}`)
        }

    }

    /**
     * Generates a valid autobahn configuration object, which is controlled by the serviceConfiguration.
     */
    getAutobahnConfiguration () {
        const autobahnConfiguration = {
            url: this._serviceConfiguration.url,
            realm: this._serviceConfiguration.realm,
        };

        if(this._serviceConfiguration.useAuth) {
            autobahnConfiguration.onchallenge = this.onChallenge.bind(this);
            autobahnConfiguration.authid = this._serviceConfiguration.user;
            autobahnConfiguration.authmethods= ["ticket"];
        }


        return autobahnConfiguration;
    }

    registerAll(registerProcedures) {

        if(!this._autobahnSession) {
            throw Error('No Autobahn Session.')
        }

        _.forEach(registerProcedures, procedure => {
            const {name, handler, options} = procedure;
            logger.info(`Registering RPC ${name}.`)
            this._autobahnSession.register(name, handler, options);

        })
    }

    subscribeAll(subscribeProcedures) {

        if(!this._autobahnSession) {
            throw Error('No Autobahn Session.')
        }

        _.forEach(subscribeProcedures, procedure => {
            const {name, handler, options} = procedure;
            logger.info(`Subscribing RPC ${name}.`)
            this._autobahnSession.subscribe(name, handler, options);
        });

    }


    connect() {
        logger.info('Trying to connect to Router.');

        const autobahnConfiguration = this.getAutobahnConfiguration();
        this._autobahnConnection = new autobahn.Connection(autobahnConfiguration);

        return new Promise((resolve, reject) => {

            this._autobahnConnection.onopen = (session) => {
                logger.info('Connected To Broker.');
                this._autobahnSession = session;
                resolve(session);
            };

            this._autobahnConnection.onerror = (...errorList) => {
                console.error(errorList);
                reject(...errorList);
            };

            this._autobahnConnection.open();

        })
    }

}

module.exports = Service;