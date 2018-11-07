//@ts-ignore
import {Error as BundesstrasseError} from "@creatdevsolutions/bundesstrasse";

enum Errors {
    NOT_AUTHENTICATED = new BundesstrasseError("wamp.error.not_authenticated"),
    NOT_AUTHORIZED = new BundesstrasseError("wamp.error.not_authorized"),
    INVALID_ARGUMENT = new BundesstrasseError("wamp.error.invalid_argument"),
    NO_SUCH_ITEM = new BundesstrasseError("wamp.error.no_such_item")
}

export {
    Errors
};