/**
 * Service is the main class, which communicates with the Interconnect.
 */

const bundesstrasse = require('@creatdevsolutions/bundesstrasse');
const Logger = require('logplease');
const logger = Logger.create('service.js');
const _ = require('lodash');
const Ping = require('./ping.js');

class Service {

    constructor(serviceConfiguration) {
        this._serviceConfiguration = serviceConfiguration;
        this._bundesstrasseConnection = null;
        this._bundesstrasseSession = null;

        this._pingInstance = new Ping(this, this._serviceConfiguration.pingInterval || 1000);


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
            max_retries: this._serviceConfiguration.enableRetry ? 15 : 0,
            isPingEnabled: this._serviceConfiguration.isPingEnabled,
        };

        const {useAuth, useTLS} = this._serviceConfiguration;

        if (useAuth && useTLS) {
            logger.error('You cannot use TLS Authentication and Ticket Authentication at the same time.');
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

    closeConnection() {
        this._bundesstrasseConnection.close(null, 'User closed connection.');
    }

    registerAll(registerProcedures) {

        if (!this._bundesstrasseSession) {
            throw Error('No Autobahn Session.')
        }

        _.forEach(registerProcedures, procedure => {
            const {name, handler, options} = procedure;
            logger.info(`Registering RPC ${name}.`);
            this._bundesstrasseSession.register(name, handler, options);

        })
    }

    subscribeAll(subscribeProcedures) {

        if (!this._bundesstrasseSession) {
            throw Error('No Autobahn Session.')
        }

        _.forEach(subscribeProcedures, procedure => {
            const {name, handler, options} = procedure;
            logger.info(`Subscribing RPC ${name}.`);
            this._bundesstrasseSession.subscribe(name, handler, options);
        });

    }


    connect() {
        logger.info('Trying to connect to Router.');

        const bundesstrasseConfiguration = this.getBundesstrasseConfiguration();
        this._bundesstrasseConnection = new bundesstrasse.Connection(bundesstrasseConfiguration);


        return new Promise((resolve, reject) => {

            let isPromiseRejected = false;

            this._bundesstrasseConnection.onopen = (session, welcomeDict) => {
                logger.info('Connected is open and healthy.');
                this._bundesstrasseSession = session;

                if (bundesstrasseConfiguration.isPingEnabled) {
                    this._pingInstance.startPing();
                }

                session.welcomeDict = welcomeDict;

                resolve(session);
            };

            this._bundesstrasseConnection.onclose = (reason, details) => {

                /**
                 * There is a bug in autobahn.js, where onclose is called multiple times for god known reasons.
                 * Quick Fix: Just reject the promise once and clean logs.
                 *
                 * TODO: PR to autobahn.js
                 */

                if (isPromiseRejected) {
                    return;
                }

                isPromiseRejected = true;
                if (bundesstrasseConfiguration.isPingEnabled) {
                    this._pingInstance.endPing();
                }

                logger.error('Connection was closed.');
                logger.error('Reason: ', reason);
                reject({
                    reason,
                    details
                });
            };

            this._bundesstrasseConnection.open();

        })
    }

}

module.exports = Service;
