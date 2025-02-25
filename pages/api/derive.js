import 'dotenv/config';
import { TappdClient } from '../../utils/tappd';
import { generateSeedPhrase } from 'near-seed-phrase';
import { setKey, getImplicit, getAccount } from '../../utils/near-provider';

const endpoint = process.env.DSTACK_SIMULATOR_ENDPOINT;
export const dynamic = 'force-dynamic';

// in-memory randomness only available to this instance of TEE
const randomArray = new Uint8Array(32);
crypto.getRandomValues(randomArray);

export default async function derive(req, res) {
    // env dev
    if (process.env.NEXT_PUBLIC_accountId !== undefined) {
        res.status(200).json({
            accountId: process.env.NEXT_PUBLIC_accountId,
        });
        return;
    }

    // env prod in TEE
    const client = new TappdClient(endpoint);
    // Add this check to prevent TEE operations in local dev
    if (process.env.NODE_ENV !== 'production') {
        throw new Error('TEE operations only available in production');
    }
    // entropy from TEE hardware
    const randomString = Buffer.from(randomArray).toString('hex');
    const keyFromTee = await client.deriveKey(randomString, randomString);
    // hash of in-memory and TEE entropy
    const hash = await crypto.subtle.digest(
        'SHA-256',
        Buffer.concat([randomArray, keyFromTee.asUint8Array(32)]),
    );
    // !!! data.secretKey should not be exfiltrated anywhere !!! no logs or debugging tools !!!
    const data = generateSeedPhrase(hash);
    const accountId = getImplicit(data.publicKey);
    // set the secretKey (inMemoryKeyStore only)
    setKey(accountId, data.secretKey);

    res.status(200).json({
        accountId,
    });
}
