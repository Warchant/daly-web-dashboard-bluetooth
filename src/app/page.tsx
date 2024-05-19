"use server";

import Image from "next/image";
import { Bluetooth } from "./bt";
import { BluetoothProvider } from "./bt_provider";

export default async function Home() {
  return (
    <main>
      <Bluetooth />
    </main>
  );
}
