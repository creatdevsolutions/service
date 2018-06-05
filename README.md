# Service Library

## Introduction

This is a service library implementation for Interconnect from [Embedded Enterprises](https://github.com/EmbeddedEnterprises).
This is a reimplementation from [service](https://github.com/EmbeddedEnterprises/service) library.

## Usage

```js
const Service = require('../src/service');

const serviceConfiguration = {
    realm: 'slimerp',
    url: 'ws://localhost:8001',
    user: 'root',
    password: 'root',
    useAuth: true
};

const service = new Service(serviceConfiguration);

service.connect();

service.registerAll([
    {
        name: 'com.service.test',
        handler: (args, kwagrs, details) => {

            // Do Magic

            return {
                ...
            }
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

            return {
                ...
            }
        },
        options: {
            // Options from https://github.com/crossbario/autobahn-js/blob/master/doc/reference.md#subscribe
        }
    }
]);
```

## Feature List

Feature | Implemented
--------|------------
Ticket Auth | Yes
TLS Client Auth | No
WSS | No
