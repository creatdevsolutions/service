/**
 * Service is the main class, which communicates with the Interconnect.
 */
import {Ping} from "./ping";

// @ts-ignore
import bundesstrasse from "@creatdevsolutions/bundesstrasse";

const Logger = require("logplease");
const logger = Logger.create("service.js");
const _ = require("lodash");


type ServiceConfiguration = {
    realm: String,
    url: String,
    enableRetry?: boolean,
    isPingEnabled?: boolean,
    isDebug?: boolean
};

type Procedure = {
    name: string,
    handler: (args: [any], kwagrs: any, details: any) => any,
    options: Object,
};

type BundesstrasseConfiguration = {
    realm: String,
    url: String,
    max_retries: Number,

    onchallenge?: (session: any, method: String, extra: Object) => [any] | string,
    authid?: string,
    authmethods?: [string],
    tlsConfiguration?: {
        ca: String | Buffer,
        cert: String | Buffer,
        key: String | Buffer
    }


};

type ChallengeExtra = {
    "generate-token"?: boolean
};

class Service {

    private readonly _serviceConfiguration: any;
    private _bundesstrasseConnection: any;
    public _bundesstrasseSession: any;
    private _pingInstance: Ping;

    constructor(serviceConfiguration: ServiceConfiguration) {
        this._serviceConfiguration = serviceConfiguration;
        this._bundesstrasseConnection = null;
        this._bundesstrasseSession = null;

        this._pingInstance = new Ping(this, this._serviceConfiguration.pingInterval || 1000);


        const isDebug = !!this._serviceConfiguration.isDebug;

        if (isDebug) {
            Logger.setLogLevel("DEBUG");
        } else {
            Logger.setLogLevel("WARN");
        }

        logger.info("Created Service.");

    }

    onChallenge(session: any, method: String) {

        const challengeExtra: ChallengeExtra = {};

        if (this._serviceConfiguration.generateResumeToken) {
            challengeExtra["generate-token"] = true;
        }


        // Ticket Authentication
        if (method === "ticket") {
            return [this._serviceConfiguration.password, challengeExtra];
        } else if (method === "tls") {
            return "";
        } else if (method === "resume") {
            return [this._serviceConfiguration.resumeToken, challengeExtra];
        } else {
            throw Error(`No Challenge for Authentication Method ${method}`);
        }

    }

    /**
     * Generates a valid autobahn configuration object, which is controlled by the serviceConfiguration.
     */
    getBundesstrasseConfiguration() {
        const bundesstrasseConfiguration: BundesstrasseConfiguration = {
            url: this._serviceConfiguration.url,
            realm: this._serviceConfiguration.realm,
            max_retries: this._serviceConfiguration.enableRetry ? 15 : 0,
        };

        if (this._serviceConfiguration.useTLS) {
            logger.warn("Using useTLS is outdated. Use useTLSAuth instead.");
            logger.info("useTLS only defines the authentication method and has no effect for using ws or wss.");
        }

        const {useAuth, useTLS, useTLSAuth, useResumeTokenAuth} = this._serviceConfiguration;

        if (useAuth && useTLS && useTLSAuth && useResumeTokenAuth) {
            logger.error("You cannot use multiple authentications at the same time.");
            throw Error("Wrong Authentication Methods.");
        }


        if (this._serviceConfiguration.useAuth) {
            bundesstrasseConfiguration.onchallenge = this.onChallenge.bind(this);
            bundesstrasseConfiguration.authid = this._serviceConfiguration.user;
            bundesstrasseConfiguration.authmethods = ["ticket"];
        }

        if (this._serviceConfiguration.useTLS || this._serviceConfiguration.useTLSAuth) {
            bundesstrasseConfiguration.onchallenge = this.onChallenge.bind(this);
            bundesstrasseConfiguration.authid = "tls";
            bundesstrasseConfiguration.authmethods = ["tls"];
            bundesstrasseConfiguration.tlsConfiguration = this._serviceConfiguration.tlsConfiguration;
        }

        if (this._serviceConfiguration.useResumeTokenAuth) {
            bundesstrasseConfiguration.onchallenge = this.onChallenge.bind(this);
            bundesstrasseConfiguration.authid = "resume";
            bundesstrasseConfiguration.authmethods = ["resume"];
        }

        return bundesstrasseConfiguration;
    }

    closeConnection() {
        this._bundesstrasseConnection.close(null, "User closed connection.");
    }

    registerAll(registerProcedures: [Procedure]) {

        if (!this._bundesstrasseSession) {
            throw Error("No Autobahn Session.");
        }

        _.forEach(registerProcedures, (procedure: Procedure) => {
            const {name, handler, options} = procedure;
            logger.info(`Registering RPC ${name}.`);
            this._bundesstrasseSession.register(name, handler, options);

        });
    }

    subscribeAll(subscribeProcedures: [Procedure]) {

        if (!this._bundesstrasseSession) {
            throw Error("No Autobahn Session.");
        }

        _.forEach(subscribeProcedures, (procedure: Procedure) => {
            const {name, handler, options} = procedure;
            logger.info(`Subscribing RPC ${name}.`);
            this._bundesstrasseSession.subscribe(name, handler, options);
        });

    }


    connect() {
        logger.info("Trying to connect to Router.");

        const bundesstrasseConfiguration = this.getBundesstrasseConfiguration();
        this._bundesstrasseConnection = new bundesstrasse.Connection(bundesstrasseConfiguration);


        return new Promise((resolve, reject) => {

            let isPromiseRejected = false;

            this._bundesstrasseConnection.onopen = (session: any, welcomeDict: any) => {
                logger.info("Connected is open and healthy.");
                this._bundesstrasseSession = session;

                if (this._serviceConfiguration.isPingEnabled) {
                    this._pingInstance.startPing();
                }

                logger.debug("welcomeDict", welcomeDict);
                logger.debug("session: ", session);

                resolve({
                    session,
                    welcomeDict
                });
            };

            this._bundesstrasseConnection.onclose = (reason: String, details: Object) => {

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
                if (this._serviceConfiguration.isPingEnabled) {
                    this._pingInstance.endPing();
                }

                logger.error("Connection was closed.");
                logger.error("Reason: ", reason);
                logger.error("Details: ", details);
                reject({
                    reason,
                    details
                });
            };

            this._bundesstrasseConnection.open();

        });
    }

}

export {
    Service
};
