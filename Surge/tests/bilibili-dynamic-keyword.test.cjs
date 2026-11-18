const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const scriptPath = path.join(__dirname, '../scripts/bilibili.protobuf.response.js');
const script = fs.readFileSync(scriptPath, 'utf8');
const url = 'https://grpc.biliapi.net/bilibili.app.dynamic.v2.Dynamic/DynAll';

function varint(value) {
    const bytes = [];
    do {
        let byte = value & 0x7f;
        value = Math.floor(value / 128);
        if (value) byte |= 0x80;
        bytes.push(byte);
    } while (value);
    return Buffer.from(bytes);
}

function field(no, value) {
    const bytes = Buffer.isBuffer(value) ? value : Buffer.from(value);
    return Buffer.concat([varint(no * 8 + 2), varint(bytes.length), bytes]);
}

function numberField(no, value) {
    return Buffer.concat([varint(no * 8), varint(value)]);
}

function item(id, title, fillerLength = 0) {
    const data = JSON.stringify({ title, filler: 'x'.repeat(fillerLength) });
    return field(1, Buffer.concat([numberField(1, id), field(30, data)]));
}

function grpc(items) {
    const payload = field(1, Buffer.concat(items));
    const header = Buffer.alloc(5);
    header.writeUInt32BE(payload.length, 1);
    return Buffer.concat([header, payload]);
}

function parseFields(bytes) {
    let offset = 0;
    const result = [];
    function readVarint() {
        let value = 0;
        let multiplier = 1;
        while (offset < bytes.length) {
            const byte = bytes[offset++];
            value += (byte & 0x7f) * multiplier;
            if (!(byte & 0x80)) return value;
            multiplier *= 128;
        }
        throw new Error('truncated varint');
    }
    while (offset < bytes.length) {
        const tag = readVarint();
        const wire = tag & 7;
        if (wire === 0) {
            readVarint();
        } else if (wire === 2) {
            const length = readVarint();
            const end = offset + length;
            if (end > bytes.length) throw new Error('truncated field');
            result.push({ no: tag >>> 3, value: bytes.subarray(offset, end) });
            offset = end;
        } else {
            throw new Error(`unsupported wire type ${wire}`);
        }
    }
    return result;
}

function titles(body) {
    const payload = Buffer.from(body).subarray(5);
    const list = parseFields(payload).find(entry => entry.no === 1)?.value;
    return list ? parseFields(list).filter(entry => entry.no === 1).map(entry => {
        const json = parseFields(entry.value).find(value => value.no === 30)?.value;
        return JSON.parse(json.toString()).title;
    }) : [];
}

async function run(body, argument) {
    return await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('script did not call $done')), 3000);
        const context = {
            URL, TextDecoder, TextEncoder, Uint8Array, ArrayBuffer,
            console: { log(...messages) { process.stderr.write(`${messages.join(' ').slice(0, 400)}\n`); } },
            $request: { url, method: 'POST', headers: {} },
            $response: { body: Uint8Array.from(body), headers: {}, status: 200 },
            $argument: JSON.stringify(argument),
            $persistentStore: { read() { return null; }, write() { return true; } },
            $done(result) {
                clearTimeout(timer);
                if (!result?.body) return reject(new Error('script returned no response body'));
                resolve(result.body);
            },
        };
        try {
            vm.runInNewContext(script, context, { filename: scriptPath, timeout: 3000 });
        } catch (error) {
            clearTimeout(timer);
            reject(error);
        }
    });
}

test('动态内容词过滤超过 2048 字节文本字段中的标题', async () => {
    const body = grpc([
        item(7, '仅标题命中词', 2100),
        item(8, '普通动态'),
    ]);
    assert.deepEqual(titles(await run(body, { dynamicKeywords: '仅标题命中词', titleKeywords: '' })), ['普通动态']);
});

test('动态内容词继续过滤短字段标题，视频标题词不扩展到动态', async () => {
    const body = grpc([item(7, '仅标题命中词'), item(8, '普通动态')]);
    assert.deepEqual(titles(await run(body, { dynamicKeywords: '仅标题命中词' })), ['普通动态']);
    assert.deepEqual(titles(await run(body, { titleKeywords: '仅标题命中词' })), ['仅标题命中词', '普通动态']);
});
