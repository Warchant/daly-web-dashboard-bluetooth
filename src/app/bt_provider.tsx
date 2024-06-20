"use client";

import { Button } from "@/components/ui/button";
import React, { createContext, ReactNode, useContext, useState } from "react";
import { Spinner } from "./spinner";
import { useToast } from "@/components/ui/use-toast";

// Define the shape of the context
interface BluetoothContextData {
	isConnecting: boolean;
	device: BluetoothDevice;
	service: BluetoothRemoteGATTService;
	rx: BluetoothRemoteGATTCharacteristic;
	tx: BluetoothRemoteGATTCharacteristic;
}

// Create the context
const BluetoothContext = createContext<BluetoothContextData | undefined>(
	undefined,
);

interface Props {
	children: ReactNode;
}

const MAX_RECONNECTS = 5;

// Create the provider component
export const BluetoothProvider: React.FC<Props> = ({ children }: Props) => {
	const { toast } = useToast();
	const [isConnecting, setIsConnecting] = useState(false);
	const [ctx, setCtx] = useState<BluetoothContextData | undefined>(undefined);
	const [reconnectCounter, setReconnectCounter] = useState(0);

	const pickDevice = async () => {
		const options = {
			filters: [{ services: ["0000fff0-0000-1000-8000-00805f9b34fb"] }],
		};

		try {
			const d = await window.navigator.bluetooth.requestDevice(options);

			d.addEventListener("gattserverdisconnected", () => {
				console.log("Disconnected...")

				if (reconnectCounter < MAX_RECONNECTS) {
					setTimeout(() => {
						console.log(`[${reconnectCounter + 1}/${MAX_RECONNECTS}] Reconnecting...`)
						connect(d); // reconnect
					}, 1000);
				}
			});

			connect(d);
		} catch (e) {
			toast({
				title: "Cannot pick a device",
				description: `${e}`,
			});

			setReconnectCounter((prev) => prev + 1);
		}
	}


	const connect = async (device: BluetoothDevice) => {
		setIsConnecting(true);
		try {
			if (!device) {
				throw new Error("No device selected");
			}

			if (!device.gatt) {
				throw new Error("device.gatt is undefined, cannot proceed");
			}

			// start to watch advertisements
			const server = await device.gatt.connect();
			const service = await server.getPrimaryService(
				"0000fff0-0000-1000-8000-00805f9b34fb",
			);
			const rx = await service.getCharacteristic(
				"0000fff1-0000-1000-8000-00805f9b34fb",
			);
			const tx = await service.getCharacteristic(
				"0000fff2-0000-1000-8000-00805f9b34fb",
			);

			setCtx({ isConnecting, device, service, rx, tx });
		} catch (e) {
			toast({
				title: "Cannot connect",
				description: `${e}`,
			});

			setReconnectCounter((prev) => prev + 1);
		} finally {
			setIsConnecting(false);
		}
	};

	if (ctx) {
		return (
			<BluetoothContext.Provider value={ctx}>
				{children}
			</BluetoothContext.Provider>
		);
	}

	return (
		<div className="flex h-[100dvh] w-full items-center justify-center">
			<Button
				onClick={pickDevice}
				size="lg"
				className="relative"
				disabled={isConnecting}
			>
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
		throw new Error("useBluetooth must be used within a BluetoothProvider");
	}
	return context;
};
