export type ServiceConfiguration = {
    realm: String,
    url: String,
    enableRetry?: boolean,
    isPingEnabled?: boolean,
    isDebug?: boolean
};

export type Procedure = {
    name: string,
    handler: (args: any[], kwagrs: any, details: any) => any,
    options: Object,
};

export type BundesstrasseConfiguration = {
    realm: String,
    url: String,
    max_retries: Number,

    onchallenge?: (session: any, method: String, extra: Object) => any[] | string,
    authid?: string,
    authmethods?: string[],
    tlsConfiguration?: {
        ca: String | Buffer,
        cert: String | Buffer,
        key: String | Buffer
    }


};

export type ChallengeExtra = {
    "generate-token"?: boolean
};
