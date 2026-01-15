"use client";

import React, { useRef, useState, useMemo, useCallback } from "react";
import { useEffect } from "react";
import { useBluetooth } from "./bt_provider";
import {
	Daly,
	DalyMosfetStatusResponse,
	DalySocResponse,
	DalyStatusResponse,
	DalyTemperatureResponse,
} from "@/bt/util";
import { Dashboard } from "./dashboard";
import { toast } from "@/components/ui/use-toast";

export function Bluetooth() {
	const { tx, rx } = useBluetooth();
	const [logs, setLogs] = useState<any[]>([]);
	const [showLogs, setShowLogs] = useState(false);
	const logsContainerRef = useRef<HTMLDivElement>(null);
	const prevLogsLengthRef = useRef(0);

	const daly = useMemo(() => new Daly(tx, rx), [tx, rx]);
	const [soc, setSoc] = useState<DalySocResponse>({
		current: 0,
		soc: 0,
		voltage: 0,
	});
	const [status, setStatus] = useState<DalyStatusResponse>({
		charger_running: false,
		load_running: false,
		num_cells: 0,
		num_cycles: 0,
		num_temps: 0,
	});
	const [mosfetStatus, setMosfetStatus] = useState<DalyMosfetStatusResponse>({
		capacity_ah: 0,
		charging_mosfet: 0,
		discharging_mosfet: 0,
		mode: "stationary",
	});

	const [temperature, setTemperature] = useState<DalyTemperatureResponse>({
		highest_sensor: 0,
		highest_temperature: 0,
		lowest_sensor: 0,
		lowest_temperature: 0,
	});

	const writeLog = useCallback((res: any) => {
		setLogs((logs) => [res, ...logs].slice(0, 100));
	}, []);

	const wrapLogs = useCallback((fn: any) => {
		return (res: any) => {
			writeLog(res);
			fn(res);
		};
	}, [writeLog]);

	const initialized = useRef(false);
	useEffect(() => {
		if (!initialized.current) {
			initialized.current = true;

			writeLog("subscribing on events");

			daly.on("soc", wrapLogs(setSoc));
			daly.on("status", wrapLogs(setStatus));
			daly.on("mosfet_status", wrapLogs(setMosfetStatus));
			daly.on("max_min_temperature", wrapLogs(setTemperature));
		}
	}, [daly, wrapLogs, writeLog]);

	useEffect(() => {
		writeLog("starting polling");

		const id = setInterval(() => {
			async function query() {
				await daly.get_soc();
				await daly.get_mosfet_status();
				await daly.get_status();
				await daly.get_temperature();
			}

			query()
				.then(() => {
					writeLog("queried");
				})
				.catch((e) => {
					toast({
						title: "Query error",
						description: e.toString(),
					});
				});
		}, 1000);

		return () => {
			clearInterval(id);
		};
	}, [daly, writeLog]);

	useEffect(() => {
		if (showLogs && logsContainerRef.current && logs.length > prevLogsLengthRef.current) {
			// Only auto-scroll if user is near the top (within 100px)
			if (logsContainerRef.current.scrollTop < 100) {
				logsContainerRef.current.scrollTop = 0;
			}
		}
		prevLogsLengthRef.current = logs.length;
	}, [logs, showLogs]);

	if (showLogs) {
		return (
			<div 
				ref={logsContainerRef}
				className="fixed inset-0 bg-black text-green-400 overflow-auto font-mono"
			>
				<div className="flex justify-between items-center p-4 sticky top-0 bg-black border-b border-gray-800 z-10">
					<h1 className="text-lg md:text-xl font-bold">Debug Logs ({logs.length})</h1>
					<button
						onClick={() => setShowLogs(false)}
						className="px-3 py-1.5 md:px-4 md:py-2 bg-gray-800 hover:bg-gray-700 rounded text-white text-sm font-medium"
					>
						Close
					</button>
				</div>
				<div className="p-2 md:p-4">
					{logs.length === 0 && <div className="text-gray-500 text-center py-8">No logs yet</div>}
					{logs.map((log, i) => (
						<div key={i} className="mb-3 p-2 md:p-3 bg-gray-900 rounded border border-gray-800">
							<div className="text-xs text-gray-500 mb-1">#{logs.length - i}</div>
							<pre className="text-xs md:text-sm whitespace-pre-wrap break-words overflow-x-auto">
								{JSON.stringify(log, null, 2)}
							</pre>
						</div>
					))}
				</div>
			</div>
		);
	}

	return (
		<div>
			<div className="fixed bottom-4 right-4 z-50">
				<button
					onClick={() => setShowLogs(true)}
					className="px-3 py-2 md:px-4 md:py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg shadow-lg text-xs md:text-sm font-medium transition-colors"
				>
					<span className="hidden sm:inline">Show Logs</span>
					<span className="sm:hidden">Logs</span>
				</button>
			</div>
			<Dashboard
				soc={soc}
				status={status}
				mosfet_status={mosfetStatus}
				temperature={temperature}
			/>
		</div>
	);
}
