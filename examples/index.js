const Service = require('../src/service');

const serviceConfiguration = {
    realm: 'slimerp',
    url: 'ws://localhost:8001',
    user: 'root',
    password: 'root',
    useAuth: true
};

const service = new Service(serviceConfiguration);

service.connect().then((session) => {
    service.registerAll([
        {
            name: 'com.service.test',
            handler: (args, kwagrs, details) => {

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
            handler: (args, kwagrs, details) => {

                // Do Magic

                return "Magicc..."
            },
            options: {
                // Options from https://github.com/crossbario/autobahn-js/blob/master/doc/reference.md#subscribe
            }
        }
    ]);


    session.call('com.service.test').then((result) => {
        console.log(result);
    })
}).catch((err) => {
    // Will be called on Connection Error.
    console.error(err);
});

