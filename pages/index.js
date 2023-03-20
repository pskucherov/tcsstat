import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { useCallback, useEffect, useState } from 'react';
import sIo from 'socket.io-client';

export default function Home() {
    const [socket, setSocket] = useState();

    const socketInitializer = useCallback(async () => {
        await fetch('/api/investapi');
        const socket = sIo();

        socket.on('connect', () => {
            console.log('connected'); // eslint-disable-line no-console
            socket.emit('sdk:getAccountId');
        });

        socket.on('sdk:getAccountIdResult', data => {
            console.log('sdk:getAccountIdResult', data); // eslint-disable-line no-console
        });

        setSocket(socket);
    }, [setSocket]);

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

            </main>
        </>
    );
}
