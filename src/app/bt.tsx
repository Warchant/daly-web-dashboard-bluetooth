"use client";

import React, { useRef, useState } from "react";
import { useEffect } from "react";
import { useBluetooth } from "./bt_provider";
import {
	Daly,
	DalyMosfetStatusResponse,
	DalySocResponse,
	DalyStatusResponse,
	DalyTemperatureResponse,
} from "@/bt/util";
import { Dashboard, DashboardProps } from "./dashboard";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "@/components/ui/use-toast";

export function Bluetooth() {
	const { tx, rx } = useBluetooth();
	const [logs, setLogs] = useState<any[]>([]);

	const daly = new Daly(tx, rx);
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

	const writeLog = (res: any) => {
		setLogs((logs) => [res, ...logs].slice(0, 20));
	};

	const wrapLogs = (fn: any) => {
		return (res: any) => {
			writeLog(res);
			fn(res);
		};
	};

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
	}, [daly.started]);

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
	}, [daly.started]);

	return (
		<div>
			<Dashboard
				soc={soc}
				status={status}
				mosfet_status={mosfetStatus}
				temperature={temperature}
			/>
			<Collapsible>
				<CollapsibleTrigger>Debug logs</CollapsibleTrigger>
				<CollapsibleContent>
					<pre>
						{logs.length === 0 && "No logs yet"}
						{logs.map((log, i) => (
							<div key={i}>{JSON.stringify(log)}</div>
						))}
					</pre>
				</CollapsibleContent>
			</Collapsible>
		</div>
	);
}
