# Service Library

[![Build Status](https://travis-ci.org/creatdevsolutions/service.svg?branch=master)](https://travis-ci.org/creatdevsolutions/service)

## Introduction

This is a service library implementation for Interconnect from [Embedded Enterprises](https://github.com/EmbeddedEnterprises).
This is a reimplementation from [service](https://github.com/EmbeddedEnterprises/service) library.

## Usage

See `examples/index.ts` for a usage example.

## Configuration

### General options

+ `url` - String - Router
+ `realm` - String - Realm
+ `enableRetry` - Boolean - Enables automatic reconnect to router. It **does not** reregister any methods.
+ `isPingEnabled` - Boolean - Enables ping to autobahnkreuz to preving disconnects through different proxies.
+ `isDebug` - Boolean - Enables advanced logging.

### Authentication

#### Anonymous Authentication

We are using anonymous authentication by default.

#### Ticket Authentication

+ `useAuth` - Boolean - Enables ticket authentication
+ `user` - String - Username
+ `password` - String - Password
+ `generateResumeToken` - Boolean - Generates a new resume token, if the authentication was successful.

#### Resume Token Authentication

+ `useResumeTokenAuth` - Boolean - Enables resume token authentication
+ `resumeToken` - String - Resume Token, which should be used to authenticate.
+ `generateResumeToken` - Boolean - Generates a new resume token, if the authentication was successful.

#### TLS Client Authentication

+ `useTLSAuth` - Boolean -  Enables TLS client authentication
+ `ca` - Buffer/String - CA
+ `cert` - Buffer/String - Client Cert
+ `key` - Buffer/Stirng - Client Key
