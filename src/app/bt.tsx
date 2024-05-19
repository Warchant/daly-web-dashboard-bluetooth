"use client";

import React, { useState } from "react";
import { useEffect } from "react";
import { useBluetooth } from "./bt_provider";
import { Daly, DalyMosfetStatusResponse, DalySocResponse, DalyStatusResponse } from "@/bt/util";
import { Dashboard } from "./dashboard";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";


export function Bluetooth() {
    const { tx, rx } = useBluetooth();
    const [logs, setLogs] = useState<any[]>([])

    const daly = new Daly(tx, rx);
    const [soc, setSoc] = useState<DalySocResponse>({
        current: 0,
        soc: 0,
        voltage: 0
    });
    const [status, setStatus] = useState<DalyStatusResponse>({
        charger_running: false,
        load_running: false,
        num_cells: 0,
        num_cycles: 0,
        num_temps: 0
    });
    const [mosfetStatus, setMosfetStatus] = useState<DalyMosfetStatusResponse>({
        capacity_ah: 0,
        charging_mosfet: 0,
        discharging_mosfet: 0,
        mode: "stationary"
    });

    const wrapLogs = (fn: any) => {
        return (res: any) => {
            setLogs((logs) => [res, ...logs])
            fn(res)
        }
    }

    useEffect(() => {
        daly.on("soc", wrapLogs(setSoc))
        daly.on("status", wrapLogs(setStatus))
        daly.on("mosfet_status", wrapLogs(setMosfetStatus))
    }, [])

    useEffect(() => {
        const id = setInterval(() => {
            async function query() {
                await daly.get_soc()
                await daly.get_mosfet_status()
                await daly.get_status()
            }

            query()
        }, 2000)

        return () => {
            clearInterval(id)
        }
    }, [])

    return (
        <div>
            <Dashboard soc={soc} status={status} mosfet_status={mosfetStatus} />
            <Collapsible>
                <CollapsibleTrigger>Logs...</CollapsibleTrigger>
                <CollapsibleContent>
                    <pre>
                        {logs.map((log, i) => (
                            <div key={i}>{JSON.stringify(log)}</div>
                        ))}
                    </pre>
                </CollapsibleContent>
            </Collapsible>
        </div>
    )
}
