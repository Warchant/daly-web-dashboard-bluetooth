"use client";

import React, { useState } from "react";
import { useEffect } from "react";
import { useBluetooth } from "./bt_provider";
import { Daly, DalyMosfetStatusResponse, DalySocResponse, DalyStatusResponse } from "@/bt/util";
import { Dashboard } from "./dashboard";


export function Bluetooth() {
    const { tx, rx } = useBluetooth();

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

    useEffect(() => {
        daly.on("soc", setSoc)
        daly.on("status", setStatus)
        daly.on("mosfet_status", setMosfetStatus)
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
        <Dashboard soc={soc} status={status} mosfet_status={mosfetStatus} />
    )
}
