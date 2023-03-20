import { Server } from 'socket.io';
import { createSdk } from 'tinkoff-sdk-grpc-js';

// Токен, который можно получить вот так:
// https://articles.opexflow.com/trading-training/kak-poluchit-token-dlya-tinkoff-investicii.htm
const TOKEN = 't.YOURTOKEN';

// Имя приложения, по которому вас смогут найти в логах ТКС.
const appName = 'tcsstat';

/**
 * Метод логирования, который передаётся в sdk для обработки ошибок.
 */
const sdkLogger = (meta, error, descr) => {
    console.log(meta, error, descr); // eslint-disable-line no-console

    // No connection established
    if (Number(error?.code) === 14) {
        throw new Error(error);
    }
};

const sdk = createSdk(TOKEN, appName, sdkLogger);

// Получаем список аккаунтов,
// чтобы в дальнейшем выбрать один из них.
const getAccounts = async sdk => {
    try {
        return await sdk.users.getAccounts();
    } catch (e) {
        console.log(e); // eslint-disable-line no-console
    }
};

// Создаёт socket.io сервер и обрабатывает запросы по работе с sdk.
const InvestApiHandler = (req, res) => {
    try {
        if (!res.socket.server.io) {
            console.log('Socket is initializing'); // eslint-disable-line no-console
            const io = new Server(res.socket.server);

            res.socket.server.io = io;

            io.on('connection', socket => {
                socket.on('sdk:getAccountId', async () => {
                    try {
                        const { accounts } = await getAccounts(sdk);

                        socket.emit('sdk:getAccountIdResult', accounts || []);
                    } catch (e) {
                        sdkLogger(e);
                    }
                });
            });
        }
    } catch (e) {
        sdkLogger(e);
    }

    res.end();
};

export default InvestApiHandler;
