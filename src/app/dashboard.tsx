import {
	DalyMosfetStatusResponse,
	DalySocResponse,
	DalyStatusResponse,
	DalyTemperatureResponse,
} from "@/bt/util";
import { CardContent, Card } from "@/components/ui/card";
import { formatHours, MovingAverage } from "./util";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export interface DashboardProps {
	soc: DalySocResponse;
	status: DalyStatusResponse;
	mosfet_status: DalyMosfetStatusResponse;
	temperature: DalyTemperatureResponse;
}

export function Dashboard({ soc, status, mosfet_status, temperature }: DashboardProps) {
	const [current] = useState(new MovingAverage(10))
	current.push(soc.current);

	const avg = current.average();

	let remaining: string = "∞"
	let additional = undefined
	let currentColor = "text-gray-900"
	if (avg > 0) {
		// charging
		const totalCapacity = mosfet_status.capacity_ah / (soc.soc / 100);
		const remainingToChargeAh = totalCapacity - mosfet_status.capacity_ah;
		const remainingToChargeHours = remainingToChargeAh / avg; // hours
		remaining = formatHours(remainingToChargeHours)
		additional = "charged"
		currentColor = "text-green-800"
	} else if (avg < 0) {
		// discharging
		const remainingToDischargeAh = mosfet_status.capacity_ah;
		const remainingToDischargeHours = remainingToDischargeAh / avg; // hours
		remaining = formatHours(remainingToDischargeHours)
		additional = "empty"
		currentColor = "text-red-800"
	}


	return (
		<div className="flex flex-col gap-6 md:gap-8 px-4 md:px-6 py-12">
			<div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8">
				<div className="grid gap-1">
					<h1 className="text-2xl font-bold tracking-tight">
						Battery Dashboard
					</h1>
					<p className="text-gray-500 dark:text-gray-400">
						Real-time monitoring of your battery&apos;s vital stats.
					</p>
				</div>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 xl:gap-8">
				<Card>
					<CardContent className="flex flex-col items-center justify-center gap-4 p-6">
						<div className="text-4xl font-bold">{soc.voltage}V</div>
						<p className="text-gray-500 dark:text-gray-400">Voltage</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="flex flex-col items-center justify-center gap-4 p-6">
						{status.charger_running && (
							<BoltIcon className="w-8 h-8 text-green-500" />
						)}
						{status.load_running && (
							<BoltIcon className="w-8 h-8 text-red-500" />
						)}

						<div className={`text-4xl font-bold ${currentColor}`}>{avg.toFixed(2)}A</div>
						<p className="text-gray-500 dark:text-gray-400">Current</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="flex flex-col items-center justify-center gap-4 p-6">
						<div className="text-4xl font-bold">{soc.soc}%</div>
						<p className="text-gray-500 dark:text-gray-400">State of charge</p>
					</CardContent>
				</Card>
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6 xl:gap-8">
				<Card>
					<CardContent className="flex flex-col items-center justify-center gap-4 p-6">
						<div className="text-2xl font-bold">
							{temperature.highest_temperature}°C
						</div>
						<p className="text-gray-500 dark:text-gray-400">Temperature</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="flex flex-col items-center justify-center gap-4 p-6">
						<div className="text-2xl font-bold">{remaining}</div>
						<p className="text-gray-500 dark:text-gray-400">Remaining time {additional && `until ${additional}`}</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="flex flex-col items-center justify-center gap-4 p-6">
						<div className="text-2xl font-bold">
							{mosfet_status.capacity_ah}A
						</div>
						<p className="text-gray-500 dark:text-gray-400">Remaining capacity</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="flex flex-col items-center justify-center gap-4 p-6">
						<div className="text-2xl font-bold">{status.num_cycles}</div>
						<p className="text-gray-500 dark:text-gray-400">Cycles</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

function BoltIcon(props: any) {
	return (
		<svg
			{...props}
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
			<circle cx="12" cy="12" r="4" />
		</svg>
	);
}
