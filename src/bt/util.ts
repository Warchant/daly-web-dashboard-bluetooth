import { concatBytes, hexToBytes } from "bytes.ts";


export function calcCrc(messageBytes: Uint8Array): number {
    return messageBytes.reduce((acc, byte) => acc + byte, 0) & 0xff
}

export function fromHex(hex: string): Buffer {
    return hexToBytes(hex)
}


export function dalyCommandMessage(command: number, extra = ""): Buffer {
    // 95 -> a58095080000000000000000c2

    if (typeof command !== 'number') {
      throw new Error('Command must be a number');
    }

    const address = 8; // 4 = USB, 8 = Bluetooth

    let message = `a5${address}0${command.toString(16).padStart(2, '0')}08${extra}`;
    message = message.padEnd(24, "0");
    const messageBytes = hexToBytes(message);

    const crc = Buffer.from([calcCrc(messageBytes)]);
    return concatBytes(messageBytes, crc);
}


export function unpackResponse_0x93(parts: DataView): any {
    let mode: string;
    if (parts.getInt8(0) === 0) {
        mode = "stationary";
    } else if (parts.getInt8(0) === 1) {
        mode = "charging";
    } else {
        mode = "discharging";
    }

    let status = {
        "mode": mode,
        "charging_mosfet": parts.getUint8(1),
        "discharging_mosfet": parts.getUint8(2),  // TODO this is NOT the actual switch state
        // "bms_cycles": parts.getUint8(3), unstable result
        "capacity_ah": parts.getInt32(4) / 1000,  // this is the current charge
    };

    return status;
}

export const unpackResponse_0x90 = (parts: DataView): object => {
    const timestamp = Date.now() / 1000;

    const sample = {
        voltage: parts.getInt16(0) / 10,
        current: (parts.getInt16(4) - 30000) / 10,
        soc: parts.getInt16(6) / 10,
        // numCycles: await this.getStatesCached('num_cycles'),
        timestamp: timestamp,
    }

    if (sample.soc < 0 || sample.soc > 100) {
        console.warn(`soc ${sample.soc} out of range, bin data: ${parts}`);
        throw new Error(`unexpected soc ${sample.soc}`);
    }

    return sample;
}

export const unpackResponse_0x94 = (parts: DataView): object => {
    let data = {
        "num_cells": parts.getInt8(0),
        "num_temps": parts.getInt8(1),
        "charging": Boolean(parts.getInt8(2)),
        "discharging": Boolean(parts.getInt8(3)),
        "num_cycles": parts.getInt16(5),
    };

    return data;
}

export function unpackResponse(data: DataView): object[] {
    const RESP_LEN = 13;
    let responses: Uint8Array[] = [];
    for (let i = 0; i < data.byteLength; i += RESP_LEN) {
        responses.push(new Uint8Array(data.buffer, i, RESP_LEN));
    }

    return responses.filter((r) => {
        const crc = calcCrc(r.slice(0, 12));
        return crc === r[12];
    }).map((r) => {
        const command = r[2];
        const response_bytes = r.slice(4, RESP_LEN - 1)
        switch (command) {
            case 0x90:
                return {command, ...unpackResponse_0x90(new DataView(response_bytes.buffer))};
            case 0x93:
                return {command, ...unpackResponse_0x93(new DataView(response_bytes.buffer))};
            case 0x94:
                return {command, ...unpackResponse_0x94(new DataView(response_bytes.buffer))};
            default:
                throw new Error("Unknown command")
        }
    })
}

export function query(tx: BluetoothRemoteGATTCharacteristic, rx: BluetoothRemoteGATTCharacteristic, command: number): Promise<object[]> {
    const cmd = dalyCommandMessage(command);
    return new Promise((resolve, reject) => {
        const handler = (event: any) => {
            tx.stopNotifications();
            const data = event.target.value;
            const responses = unpackResponse(data);
            if (responses.length > 0) {
                resolve(responses)
            } else {
                reject(new Error("Empty responses"))
            }
        }

        rx.addEventListener('characteristicvaluechanged', handler)
        rx.startNotifications();

        tx.writeValue(cmd).catch(reject)
    })
}
