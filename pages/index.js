import Head from 'next/head'
import styles from '@/styles/Home.module.css'
import { useCallback, useEffect, useState } from 'react'
import io from 'Socket.IO-client'

export default function Home() {
  const [socket, setSocket] = useState();

  const socketInitializer = useCallback(async () => {
    await fetch('/api/socket')
    const socket = io()

    socket.on('connect', () => {
      console.log('connected');
    })

    setSocket(socket);
  }, [setSocket]);

  useEffect(() => {
    socketInitializer()
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
  )
}
