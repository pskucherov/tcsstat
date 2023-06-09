import { Server } from 'socket.io';
import { createSdk } from 'tinkoff-sdk-grpc-js';

// Здесь нужно задать Токен, который можно получить вот так:
// https://articles.opexflow.com/trading-training/kak-poluchit-token-dlya-tinkoff-investicii.htm
const TOKEN = '';

// Имя приложения, по которому вас смогут найти в логах ТКС.
const appName = 'tcsstat';

/**
 * Метод логирования, который передаётся в sdk для обработки ошибок.
 */
const sdkLogger = (meta, error, descr) => {
    console.log(meta || '', error || '', descr || ''); // eslint-disable-line no-console

    // No connection established
    if (Number(error?.code) === 14) {
        throw new Error(error);
    }
};

const socketLogger = (socket, error) => {
    socket?.emit('sdk:error', error);
    sdkLogger(error);
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

// Таймер приостанова, если вышел лимит на запросы.
const timer = async time => {
    return new Promise(resolve => setTimeout(resolve, time));
};

// Запрос выполненных операций.
const getOperationsByCursor = async (accountId, from, to, cursor = '') => {
    try {
        const reqData = {
            accountId,
            from,
            to,
            limit: 1000,
            state: sdk?.OperationState.OPERATION_STATE_EXECUTED,

            // Фильтр по типам запрашиваемых операций.
            operationTypes: [
                sdk?.OperationType.OPERATION_TYPE_BOND_TAX,
                sdk?.OperationType.OPERATION_TYPE_TAX,
                sdk?.OperationType.OPERATION_TYPE_DIVIDEND_TAX,
                sdk?.OperationType.OPERATION_TYPE_BROKER_FEE,
                sdk?.OperationType.OPERATION_TYPE_TAX_CORRECTION,
                sdk?.OperationType.OPERATION_TYPE_SERVICE_FEE,
                sdk?.OperationType.OPERATION_TYPE_BENEFIT_TAX,
                sdk?.OperationType.OPERATION_TYPE_MARGIN_FEE,
                sdk?.OperationType.OPERATION_TYPE_SUCCESS_FEE,
                sdk?.OperationType.OPERATION_TYPE_TRACK_MFEE,
                sdk?.OperationType.OPERATION_TYPE_TRACK_PFEE,
                sdk?.OperationType.OPERATION_TYPE_CASH_FEE,
                sdk?.OperationType.OPERATION_TYPE_OUT_FEE,
                sdk?.OperationType.OPERATION_TYPE_OUT_STAMP_DUTY,
            ],
            withoutCommissions: false,
            withoutTrades: false,
            withoutOvernights: false,
            cursor,
        };

        return await sdk?.operations?.getOperationsByCursor(reqData);
    } catch (e) {
        await timer(60000);

        return await getOperationsByCursor(accountId, from, to, cursor);
    }
};

let allAccounts;

const getAccount = async socket => {
    try {
        const { accounts } = await getAccounts(sdk);

        allAccounts = accounts;
        socket.emit('sdk:getAccountIdResult', accounts || []);
    } catch (e) {
        socketLogger(socket, e);
    }
};

const getOperationsCommission = async (socket, id, options) => {
    try {
        if (!id) {
            return;
        }

        const {
            id: accountId,
            openedDate,
            closedDate,
        } = allAccounts?.find(a => a.id === id);

        if (!accountId) {
            return;
        }

        let from;
        let to;

        if (options?.from) {
            from = new Date(options?.from);
        } else {
            from = new Date(openedDate);
        }

        if (options?.to) {
            to = new Date(options?.to);
        } else {
            to = new Date(closedDate).getTime() ? new Date(closedDate) : new Date();
        }

        const data = await getOperationsByCursor(accountId, from, to, options?.cursor);
        const nextCursor = data?.nextCursor;

        socket.emit('sdk:getOperationsCommissionResult_' + accountId, {
            items: data?.items,
            nextCursor,
            from,
            to,
        });
    } catch (e) {
        socketLogger(socket, e);
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
                if (!TOKEN) {
                    socketLogger(socket, 'Укажите токен TOKEN в pages/api/investapi.js:6');

                    return;
                }

                socket.on('sdk:getAccountId', getAccount.bind(this, socket));
                socket.on('sdk:getOperationsCommission', getOperationsCommission.bind(this, socket));
            });
        }
    } catch (e) {
        sdkLogger(e);
    }

    res.end();
};

export default InvestApiHandler;
