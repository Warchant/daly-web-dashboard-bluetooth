import Image from "next/image";
import { Bluetooth } from "./bt";
import { BluetoothProvider } from "./bt_provider";

export default function Home() {
  return (
    <main>
      <Bluetooth />
    </main>
  );
}
