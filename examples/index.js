const Service = require('../build/index').Service;

const fs = require('fs');
const path = require('path');

let serviceConfiguration = {
    realm: 'slimerp',
    url: 'wss://localhost:8000',
    isPingEnabled: false,
    pingInterval: 5000,
};

if (process.env.USE_AUTH) {
    serviceConfiguration.user = 'example';
    serviceConfiguration.password = 'root';
    serviceConfiguration.useAuth = true;
}

if (process.env.USE_TLS) {

    const caPath = process.env.TLS_CA_CERT || path.join('certs', 'ca.crt');
    const certPath = process.env.TLS_CERT || path.join('certs', 'cert.crt');
    const keyPath = process.env.TLS_KEY || path.join('certs', 'cert.key');

    const ca = fs.readFileSync(caPath);
    const cert = fs.readFileSync(certPath);
    const key = fs.readFileSync(keyPath);

    serviceConfiguration.useTLSAuth = true;
    serviceConfiguration.tlsConfiguration = {
        ca,
        cert,
        key
    }
}

const service = new Service(serviceConfiguration);

service.connect().then(({session, welcomeDict}) => {
    service.registerAll([
        {
            name: 'com.service.test',
            handler: (args, kwArgs, details) => {

                // Do Magic

                return "Whiiiih."
            },
            options: {
                // Options from https://github.com/crossbario/autobahn-js/blob/master/doc/reference.md#subscribe
            }
        }
    ]);

    service.subscribeAll([
        {
            name: 'com.otherservice.test',
            handler: (args, kwArgs, details) => {

                // Do Magic

                return "Magicc..."
            },
            options: {
                // Options from https://github.com/crossbario/autobahn-js/blob/master/doc/reference.md#subscribe
            }
        }
    ]);


    session.call('com.service.test').then((result) => {
        service.closeConnection();
    })
}).catch(({reason, details}) => {
    console.error(reason, details)
});
