import { expect, test } from "bun:test";
import { dalyCommandMessage, fromHex } from "@/bt/util";

test('dalyCommandMessage', () => {
    const message = dalyCommandMessage(0x95);
    expect(message).toEqual(fromHex('a58095080000000000000000c2'));
});
