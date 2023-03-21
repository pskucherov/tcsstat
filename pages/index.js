import Head from 'next/head';
import styles from '@/styles/Home.module.css';
import { useCallback, useEffect, useState } from 'react';
import sIo from 'socket.io-client';
import SelectAccount from '@/components/SelectAccount/SelectAccount';

export default function Home() {
    const [accounts, setAccounts] = useState();
    const [accountId, setAccountId] = useState();

    const socketInitializer = useCallback(async () => {
        await fetch('/api/investapi');
        const socket = sIo();

        socket.on('connect', () => {
            console.log('connected'); // eslint-disable-line no-console
            socket.emit('sdk:getAccountId');
        });

        socket.on('error', e => {
            e && console.log(e); // eslint-disable-line no-console
        });

        socket.on('sdk:getAccountIdResult', data => {
            console.log('sdk:getAccountIdResult', data); // eslint-disable-line no-console
            setAccounts(data);
        });
    }, [setAccounts]);

    useEffect(() => {
        socketInitializer();
    }, [socketInitializer]);

    return (
        <>
            <Head>
                <title>TCS Stat</title>
                <meta name="description" content="https://t.me/opexflow" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <main className={styles.main}>
                {Boolean(accounts?.length) && <SelectAccount
                    accounts={accounts}
                    selectedId={accountId}
                    onSelect={id => setAccountId(id)}
                />}
            </main>
        </>
    );
}
