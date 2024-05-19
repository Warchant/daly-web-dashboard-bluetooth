/**
 * v0 by Vercel.
 * @see https://v0.dev/t/fjd8mPCJPRF
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
import { DalyMosfetStatusResponse, DalySocResponse, DalyStatusResponse } from "@/bt/util";
import { CardContent, Card } from "@/components/ui/card"

interface Props {
    soc: DalySocResponse,
    status: DalyStatusResponse,
    mosfet_status: DalyMosfetStatusResponse
}

export function Dashboard({ soc, status, mosfet_status }: Props) {
    return (
        <div className="flex flex-col gap-6 md:gap-8 px-4 md:px-6 py-12">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8">
                <div className="grid gap-1">
                    <h1 className="text-2xl font-bold tracking-tight">Battery Dashboard</h1>
                    <p className="text-gray-500 dark:text-gray-400">Real-time monitoring of your battery&apos;s vital stats.</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 xl:gap-8">
                <Card>
                    <CardContent className="flex flex-col items-center justify-center gap-4 p-6">
                        <div className="text-4xl font-bold">{soc.voltage}</div>
                        <p className="text-gray-500 dark:text-gray-400">Voltage</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex flex-col items-center justify-center gap-4 p-6">
                        <div className="text-4xl font-bold">{soc.current}</div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6 xl:gap-8">
                <Card>
                    <CardContent className="flex flex-col items-center justify-center gap-4 p-6">
                        <BoltIcon className="w-8 h-8 text-green-500" />
                        <div className="text-2xl font-bold">Mode</div>
                        <p className="text-gray-500 dark:text-gray-400">{
                            mosfet_status.mode
                        }</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex flex-col items-center justify-center gap-4 p-6">
                        <div className="text-4xl font-bold">{mosfet_status.capacity_ah}</div>
                        <p className="text-gray-500 dark:text-gray-400">Capacity</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex flex-col items-center justify-center gap-4 p-6">
                        <div className="text-4xl font-bold">{status.num_cycles}</div>
                        <p className="text-gray-500 dark:text-gray-400">Num Cycles</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
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
    )
}
