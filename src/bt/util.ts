import { concatBytes, hexToBytes } from "bytes.ts";
import mitt from "mitt";

function calcCrc(messageBytes: Uint8Array): number {
    return messageBytes.reduce((acc, byte) => acc + byte, 0) & 0xff;
}

function dalyCommandMessage(command: number, extra = ""): Buffer {
    // 95 -> a58095080000000000000000c2

    if (typeof command !== "number") {
        throw new Error("Command must be a number");
    }

    const address = 8; // 4 = USB, 8 = Bluetooth

    let message = `a5${address}0${command
        .toString(16)
        .padStart(2, "0")}08${extra}`;
    message = message.padEnd(24, "0");
    const messageBytes = hexToBytes(message);

    const crc = Buffer.from([calcCrc(messageBytes)]);
    return concatBytes(messageBytes, crc);
}

export type DalyMosfetStatusResponse = {
    mode: "stationary" | "charging" | "discharging";
    charging_mosfet: number;
    discharging_mosfet: number;
    capacity_ah: number;
};

function unpackResponse_0x93(parts: DataView): DalyMosfetStatusResponse {
    let mode: string;
    if (parts.getInt8(0) === 0) {
        mode = "stationary";
    } else if (parts.getInt8(0) === 1) {
        mode = "charging";
    } else {
        mode = "discharging";
    }

    let status = {
        mode: mode,
        charging_mosfet: parts.getUint8(1),
        discharging_mosfet: parts.getUint8(2), // TODO this is NOT the actual switch state
        capacity_ah: parts.getInt32(4) / 1000, // this is the current charge
    };

    return status as DalyMosfetStatusResponse;
}

export type DalySocResponse = {
    voltage: number;
    current: number;
    soc: number;
};

const unpackResponse_0x90 = (parts: DataView): DalySocResponse => {
    const sample = {
        voltage: parts.getInt16(0) / 10,
        // negative=charging, positive=discharging
        current: (parts.getInt16(4) - 30000) / 10,
        soc: parts.getInt16(6) / 10,
    };

    if (sample.soc < 0 || sample.soc > 100) {
        console.warn(`soc ${sample.soc} out of range, bin data: ${parts}`);
        throw new Error(`unexpected soc ${sample.soc}`);
    }

    return sample;
};

export type DalyStatusResponse = {
    num_cells: number;
    num_temps: number;
    charger_running: boolean;
    load_running: boolean;
    num_cycles: number;
};

const unpackResponse_0x94 = (parts: DataView): DalyStatusResponse => {
    let data = {
        num_cells: parts.getInt8(0),
        num_temps: parts.getInt8(1),
        charger_running: Boolean(parts.getInt8(2)),
        load_running: Boolean(parts.getInt8(3)),
        num_cycles: parts.getInt16(5),
    };

    return data;
};

export type DalyTemperatureResponse = {
    highest_temperature: number;
    highest_sensor: number;
    lowest_temperature: number;
    lowest_sensor: number;
};

const unpackResponse_0x92 = (view: DataView): DalyTemperatureResponse => {
    let parts = [
        view.getInt8(0),
        view.getInt8(1),
        view.getInt8(2),
        view.getInt8(3),
    ];

    let data = {
        highest_temperature: parts[0] - 40,
        highest_sensor: parts[1],
        lowest_temperature: parts[2] - 40,
        lowest_sensor: parts[3],
    };

    return data;
};

export type Response =
    | ({ command: 0x90 } & DalySocResponse)
    | ({ command: 0x92 } & DalyTemperatureResponse)
    | ({ command: 0x93 } & DalyMosfetStatusResponse)
    | ({ command: 0x94 } & DalyStatusResponse);

export function unpackResponses(data: DataView): Response[] {
    const RESP_LEN = 13;
    let responses: Uint8Array[] = [];
    for (let i = 0; i < data.byteLength; i += RESP_LEN) {
        responses.push(new Uint8Array(data.buffer, i, RESP_LEN));
    }

    return responses
        .filter((r) => {
            const crc = calcCrc(r.slice(0, 12));
            return crc === r[12]; // sometimes it does not match... no idea if those commands are good
        })
        .map((r) => {
            const command = r[2];
            const response_bytes = r.slice(4, RESP_LEN - 1);
            switch (command) {
                case 0x90:
                    return {
                        command,
                        ...unpackResponse_0x90(new DataView(response_bytes.buffer)),
                    };
                case 0x92:
                    return {
                        command,
                        ...unpackResponse_0x92(new DataView(response_bytes.buffer)),
                    };
                case 0x93:
                    return {
                        command,
                        ...unpackResponse_0x93(new DataView(response_bytes.buffer)),
                    };
                case 0x94:
                    return {
                        command,
                        ...unpackResponse_0x94(new DataView(response_bytes.buffer)),
                    };
                default:
                    console.log(`skipping unknown command ${command}`);
                    return undefined;
            }
        })
        .filter((r) => r !== undefined) as Response[];
}

export type DalyEvent =
    | "soc"
    | "cell_voltage_range"
    | "max_min_temperature"
    | "mosfet_status"
    | "status"
    | "cell_status"
    | "balancing_status"
    | "errors";

const commandMap: { [key: number]: DalyEvent } = {
    0x90: "soc",
    0x91: "cell_voltage_range",
    0x92: "max_min_temperature",
    0x93: "mosfet_status",
    0x94: "status",
    0x95: "cell_status",
    0x96: "balancing_status",
    0x97: "errors",
};

// https://github.com/dreadnought/python-daly-bms/blob/main/dalybms/daly_bms_bluetooth.py
export class Daly {
    tx: BluetoothRemoteGATTCharacteristic;
    rx: BluetoothRemoteGATTCharacteristic;
    emitter = mitt();
    started: boolean = false;

    constructor(
        tx: BluetoothRemoteGATTCharacteristic,
        rx: BluetoothRemoteGATTCharacteristic,
    ) {
        this.tx = tx;
        this.rx = rx;

        rx.startNotifications().then(() => {
            this.started = true;
            rx.addEventListener("characteristicvaluechanged", (event: any) => {
                const data = event.target.value;
                const responses = unpackResponses(data);
                for (const response of responses) {
                    const command = response.command;
                    const event = commandMap[command];
                    this.emitter.emit(event, response);
                }
            });
        });
    }

    on(event: DalyEvent, callback: (data: any) => void) {
        this.emitter.on(event, callback);
    }

    off(event: DalyEvent, callback: (data: any) => void) {
        this.emitter.off(event, callback);
    }

    private async query(command: number): Promise<void> {
        const cmd = dalyCommandMessage(command);
        await this.tx.writeValue(cmd);
    }

    async get_soc(): Promise<void> {
        return await this.query(0x90);
    }

    async get_mosfet_status(): Promise<void> {
        return await this.query(0x93);
    }

    async get_status(): Promise<void> {
        return await this.query(0x94);
    }

    async get_temperature(): Promise<void> {
        return await this.query(0x92);
    }
}

export function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
