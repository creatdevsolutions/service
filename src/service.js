/**
 * Service is the main class, which communicates with the Interconnect.
 */

const bundesstrasse = require('@creatdevsolutions/bundesstrasse');
const Logger = require('logplease');
const logger = Logger.create('service.js');
const _ = require('lodash');

class Service {

    constructor(serviceConfiguration) {
        this._serviceConfiguration = serviceConfiguration;
        this._bundesstrasseConnection = null;
        this._bundesstrasseSession = null;

        logger.info('Created Service.')

    }

    onChallenge(session, method, extra) {

        // Ticket Authentication
        if (method === 'ticket') {
            return this._serviceConfiguration.password;
        } else if (method === 'tls') {
            return "";
        } else {
            throw Error(`No Challenge for Authentication Method ${method}`)
        }

    }

    /**
     * Generates a valid autobahn configuration object, which is controlled by the serviceConfiguration.
     */
    getBundesstrasseConfiguration() {
        const bundesstrasseConfiguration = {
            url: this._serviceConfiguration.url,
            realm: this._serviceConfiguration.realm,
        };

        const {useAuth, useTLS} = this._serviceConfiguration;

        if(useAuth && useTLS) {
            logger.error('You cannot use TLS Authentication and Ticket Authentication at the same time.')
            throw Error('Wrong Authentication Methods.')
        }

        if (this._serviceConfiguration.useAuth) {
            bundesstrasseConfiguration.onchallenge = this.onChallenge.bind(this);
            bundesstrasseConfiguration.authid = this._serviceConfiguration.user;
            bundesstrasseConfiguration.authmethods = ["ticket"];
        }

        if (this._serviceConfiguration.useTLS) {
            bundesstrasseConfiguration.onchallenge = this.onChallenge.bind(this);
            bundesstrasseConfiguration.authid = "tls";
            bundesstrasseConfiguration.authmethods = ["tls"];
            bundesstrasseConfiguration.tlsConfiguration = this._serviceConfiguration.tlsConfiguration;
        }


        return bundesstrasseConfiguration;
    }

    registerAll(registerProcedures) {

        if (!this._bundesstrasseSession) {
            throw Error('No Autobahn Session.')
        }

        _.forEach(registerProcedures, procedure => {
            const {name, handler, options} = procedure;
            logger.info(`Registering RPC ${name}.`)
            this._bundesstrasseSession.register(name, handler, options);

        })
    }

    subscribeAll(subscribeProcedures) {

        if (!this._bundesstrasseSession) {
            throw Error('No Autobahn Session.')
        }

        _.forEach(subscribeProcedures, procedure => {
            const {name, handler, options} = procedure;
            logger.info(`Subscribing RPC ${name}.`)
            this._bundesstrasseSession.subscribe(name, handler, options);
        });

    }


    connect() {
        logger.info('Trying to connect to Router.');

        const bundesstrasseConfiguration = this.getBundesstrasseConfiguration();
        this._bundesstrasseConnection = new bundesstrasse.Connection(bundesstrasseConfiguration);

        return new Promise((resolve, reject) => {

            this._bundesstrasseConnection.onopen = (session) => {
                logger.info('Connected To Broker.');
                this._bundesstrasseSession = session;
                resolve(session);
            };

            this._bundesstrasseConnection.onerror = (...errorList) => {
                console.error(errorList);
                reject(...errorList);
            };

            this._bundesstrasseConnection.open();

        })
    }

}

module.exports = Service;
