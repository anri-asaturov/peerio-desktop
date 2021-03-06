import os from 'os';
import isDevEnv from '~/helpers/is-dev-env';

import { send as internalSend, EventObject, EventProperties } from 'peerio-icebear/dist/telemetry';

// Main client-side functionality is here, i.e. converting objects into send()
// functions, and the send() function itself

type TelemetryPayload = [string] | [string, { [key: string]: string | number | boolean }];

interface TelemetryConfig {
    [methodName: string]: TelemetryPayload | ((...args: any[]) => false | TelemetryPayload);
}

export function setup<T extends TelemetryConfig>(
    config: T
): {
    [K in keyof T]: T[K] extends ((...args: infer U) => false | TelemetryPayload)
        ? (...args: U) => void
        : () => void
} {
    const ret = {} as { [K in keyof T]: any };

    Object.entries(config).forEach(([key, value]) => {
        // Each item in this object is either the event we want to send, or a
        // function that returns the event that we want to send based on an
        // argument (e.g. if a property can change based on app state).
        ret[key] =
            typeof value === 'function'
                ? (...arg) => {
                      const result = value(...arg);
                      if (result) send(result);
                  }
                : () => {
                      send(value);
                  };
    });

    return ret;
}

function send(ev: TelemetryPayload): void {
    // Basic properties to send with all events. There are additional baseProps
    // on SDK. These are desktop-specific (e.g. `window` doesn't exist on
    // mobile)
    const baseProps = {
        operatingSystem: os.type(),
        osVersion: os.release(),
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight
    };

    const [event, maybeProperties] = ev;

    const combinedProperties: EventProperties = {
        ...(maybeProperties as EventProperties),
        ...baseProps
    };

    const obj: EventObject = {
        event,
        properties: combinedProperties
    };

    // `send` here will check if user is still in signup, and store events for bulk send if so
    internalSend(obj);

    if (isDevEnv) {
        console.log(obj);
    }
}
