import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { useState, useEffect } from 'react';
import { contractView, getBalance } from '../utils/near-provider';
import { formatNearAmount } from 'near-api-js/lib/utils/format';
import Overlay from '../components/Overlay';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function Home() {
    const [message, setMessage] = useState('');
    const [accountId, setAccountId] = useState();
    const [balance, setBalance] = useState({ available: '0' });

    const setMessageHide = async (message, dur = 3000) => {
        setMessage(message);
        await sleep(dur);
        setMessage('');
    };

    const getBalanceSleep = async (accountId) => {
        await sleep(1000);
        const balance = await getBalance(accountId);

        if (balance.available === '0') {
            getBalanceSleep(accountId);
            return;
        }
        setBalance(balance);
    };

    const deriveAccount = async () => {
        const res = await fetch('/api/derive').then((r) => r.json());
        setAccountId(res.accountId);
        getBalanceSleep(res.accountId);
    };

    useEffect(() => {
        deriveAccount();
    }, []);

    return (
        <div className={styles.container}>
            <Head>
                <title>Based Agent Template</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <Overlay message={message} />

            <main className={styles.main}>
                <h1 className={styles.title}>Based Agent Template</h1>
                <ol>
                    <li>
                        This worker agent app is designed to run on Phala Cloud
                        inside a TEE and be verified by the worker's smart
                        contract.
                    </li>
                    <li>
                        The app derives a key that is unique to the running
                        instance and TEE hardware.
                    </li>
                    <li>
                        The app calls the worker smart contract and registers
                        itself by using the remote attestation quote.
                    </li>
                    <li>Follow the steps below to verify your app.</li>
                </ol>
                <div className={styles.grid}>
                    <div className={styles.card}>
                        <h3>Step 1.</h3>
                        <p>
                            Fund Worker Agent account:
                            <br />
                            <br />
                            {accountId?.length >= 24
                                ? accountId?.substring(0, 24) + '...'
                                : accountId}
                            <br />
                            <button
                                className={styles.btn}
                                onClick={() => {
                                    try {
                                        if(navigator.clipboard && navigator.clipboard.writeText) {
                                            navigator.clipboard.writeText(accountId);
                                            setMessageHide('Copied', 500);
                                        } else {
                                            setMessageHide('Clipboard not supported');
                                        }
                                    } catch (e) {
                                        setMessageHide('Copy failed');
                                    }
                                }}
                            >
                                copy
                            </button>
                            <br />
                            <br />
                            balance:{' '}
                            {balance
                                ? formatNearAmount(balance.available, 4)
                                : 0}
                        </p>
                    </div>

                    {balance.available !== '0' && (
                        <>
                            <a
                                href="#"
                                className={styles.card}
                                onClick={async () => {
                                    setMessage('Registering Worker');

                                    let res;
                                    try {
                                        res = await fetch('/api/register').then(
                                            (r) => r.json(),
                                        );
                                    } catch (e) {
                                        console.log(e);
                                        setMessageHide(
                                            'register_worker error: ' +
                                                JSON.stringify(e, 4),
                                        );
                                    }

                                    setMessageHide(
                                        <>
                                            <p>register_worker response:</p>
                                            <p className={styles.code}>
                                                registered:{' '}
                                                {JSON.stringify(res.registered)}
                                            </p>
                                        </>,
                                    );
                                }}
                            >
                                <h3>Step 2.</h3>
                                <p>
                                    Register the Worker Agent in the smart
                                    contract:
                                    <br />
                                    <br />
                                    {process.env.NEXT_PUBLIC_contractId}
                                </p>
                            </a>

                            <a
                                href="#"
                                className={styles.card}
                                onClick={async () => {
                                    setMessage('Calling get_worker');

                                    let res;
                                    try {
                                        res = await contractView({
                                            accountId: accountId,
                                            methodName: 'get_worker',
                                            args: {
                                                account_id: accountId,
                                            },
                                        });

                                        console.log(res);
                                    } catch (e) {
                                        console.log(e);
                                        setMessageHide(
                                            'get_worker error: ' +
                                                JSON.stringify(e, 4),
                                        );
                                    }

                                    setMessageHide(
                                        <>
                                            <p>get_worker response:</p>
                                            <p className={styles.code}>
                                                checksum: {res.checksum}
                                            </p>
                                            <p className={styles.code}>
                                                codehash: {res.codehash}
                                            </p>
                                        </>,
                                    );
                                }}
                            >
                                <h3>Get Worker Info</h3>
                                <p>(registered only)</p>
                            </a>

                            <a
                                href="#"
                                className={styles.card}
                                onClick={async () => {
                                    setMessage(
                                        'Calling is_verified_by_codehash',
                                    );

                                    // we need to call the contract from the TEE through the backend API
                                    // the TEE keyPair is never exposed to the browser
                                    // this method will not throw
                                    // returns { verified: true|false }
                                    const res = await fetch(
                                        '/api/isVerified',
                                    ).then((r) => r.json());

                                    setMessageHide(
                                        <>
                                            <p>
                                                is_verified_by_codehash
                                                response:
                                            </p>
                                            <p className={styles.code}>
                                                verified:{' '}
                                                {JSON.stringify(res.verified)}
                                            </p>
                                        </>,
                                    );
                                }}
                            >
                                <h3>Call Protected Method</h3>
                                <p>(registered only)</p>
                            </a>
                        </>
                    )}
                </div>
            </main>

            <footer className={styles.footer}>
                <a
                    href="https://proximity.dev"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Powered by{' '}
                    <img
                        src="/symbol.svg"
                        alt="Proximity Logo"
                        className={styles.logo}
                    />
                    <img
                        src="/wordmark_black.svg"
                        alt="Proximity Logo"
                        className={styles.wordmark}
                    />
                </a>
            </footer>
        </div>
    );
}
