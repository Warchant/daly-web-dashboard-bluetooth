"use client";

import { dalyCommandMessage } from '@/bt/util';
import { Button } from '@/components/ui/button';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Spinner } from './spinner';

// Define the shape of the context
interface BluetoothContextData {
    isConnecting: boolean;
    device: BluetoothDevice;
    service: BluetoothRemoteGATTService;
    rx: BluetoothRemoteGATTCharacteristic;
    tx: BluetoothRemoteGATTCharacteristic;
}

// Create the context
const BluetoothContext = createContext<BluetoothContextData | undefined>(undefined);

interface Props {
    children: ReactNode;
}

// Create the provider component
export const BluetoothProvider: React.FC<Props> = ({ children }: Props) => {
    const [isConnecting, setIsConnecting] = useState(false);
    const [ctx, setCtx] = useState<BluetoothContextData | undefined>(undefined);

    const connect = async () => {
        setIsConnecting(true)
        const options = {
            filters: [
                { services: ['0000fff0-0000-1000-8000-00805f9b34fb'] }
            ]
        };

        const device = await window.navigator.bluetooth.requestDevice(options);

        device.addEventListener('gattserverdisconnected', () => {
            alert("Disconnected")
            setCtx(undefined)
        })

        if (!device.gatt) {
            alert("device.gatt is undefined, cannot proceed")
            setIsConnecting(false)
            return
        }

        // start to watch advertisements
        const server = await device.gatt.connect();
        const service = await server.getPrimaryService('0000fff0-0000-1000-8000-00805f9b34fb');
        const rx = await service.getCharacteristic('0000fff1-0000-1000-8000-00805f9b34fb');
        const tx = await service.getCharacteristic('0000fff2-0000-1000-8000-00805f9b34fb');

        setIsConnecting(false)
        setCtx({ isConnecting, device, service, rx, tx });
    }

    if (ctx) {
        return (
            <BluetoothContext.Provider value={ctx}>
                {children}
            </BluetoothContext.Provider>
        )
    }

    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Button onClick={connect} className="relative" disabled={isConnecting}>
                {isConnecting && <Spinner />} Connect to Daly BMS
                <span className="absolute inset-0 flex items-center justify-center transition-opacity " />
            </Button>
        </div>
    );
};

// Create a custom hook for using the context
export const useBluetooth = (): BluetoothContextData => {
    const context = useContext(BluetoothContext);
    if (!context) {
        throw new Error('useBluetooth must be used within a BluetoothProvider');
    }
    return context;
};
