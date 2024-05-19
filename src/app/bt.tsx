"use client";

import React, { useState } from "react";
import { useEffect } from "react";
import { useBluetooth } from "./bt_provider";
import { dalyCommandMessage, query, unpackResponse, unpackResponse_0x90, unpackResponse_0x93, unpackResponse_0x94 } from "@/bt/util";
import { bytesToHex, hexToBytes } from "bytes.ts"
import { Button } from "@/components/ui/button";


export function Bluetooth() {
    const { device, service, tx, rx } = useBluetooth();

    const [data, setData] = useState<object[]>([])

    useEffect(() => {
        const handler = (event: any) => {
            const data = event.target.value;
            const responses = unpackResponse(data);
            responses.forEach((r) => {
                setData((prev) => {
                    return [...prev, r]
                })
            })
        }
        // subscribe
        rx.addEventListener('characteristicvaluechanged', handler)
        rx.startNotifications();

        return () => {
            rx.stopNotifications();
            // rx.removeEventListener('characteristicvaluechanged', handler)
        }
    }, [])

    useEffect(() => {
        const id = setInterval(() => {
            tx.writeValue(dalyCommandMessage(0x90))
        }, 5000)

        return () => {
            clearInterval(id)
        }
    }, [])

    return (
        <div className="flex h-screen w-full items-center justify-center">
            {data.map((r, i) => {
                return (
                    <p key={i}>
                        {JSON.stringify(r)}
                    </p>
                )
            })}
        </div>
    )
}
