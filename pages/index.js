import Head from 'next/head';
import styles from '@/styles/Home.module.css';
import { useCallback, useEffect, useState } from 'react';
import sIo from 'socket.io-client';
import SelectAccount from '@/components/SelectAccount/SelectAccount';
import 'bootstrap/dist/css/bootstrap.css';

export default function Home() {
    const [accounts, setAccounts] = useState();
    const [accountId, setAccountId] = useState();
    const [socket, setSocket] = useState();

    const socketInitializer = useCallback(async () => {
        await fetch('/api/investapi');
        const socket = sIo();

        setSocket(socket);

        socket.on('connect', () => {
            console.log('connected'); // eslint-disable-line no-console
            socket.emit('sdk:getAccountId');
        });

        socket.on('sdk:error', e => {
            e && console.log(e); // eslint-disable-line no-console
        });

        socket.on('sdk:getAccountIdResult', data => {
            setAccounts(data);
        });

        return () => {
            socket.off('sdk:error');
            socket.off('sdk:getAccountIdResult');
        };
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
                    socket={socket}
                    accounts={accounts}
                    selectedId={accountId}
                    onSelect={id => setAccountId(id)}
                />}
            </main>
        </>
    );
}
