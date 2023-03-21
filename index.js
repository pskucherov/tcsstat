const { createSdk } = require('tinkoff-sdk-grpc-js');

const TOKEN = 't.YOURTOKEN';

// Имя приложения, по которому вас смогут найти в логах ТКС.
const appName = 'tcsstat';

const sdk = createSdk(TOKEN, appName);

const printBrokerReport = report => {
	console.log(JSON.stringify(report, null, 4));
};

const timer = async time => {
	return new Promise(resolve => setTimeout(resolve, time));
}

const getOperationsByCursor = async (sdk, accountId, from, to, cursor = '') => {
	try {
		const reqData = {
			accountId,
			from,
			to,
			limit: 1000,
			state: sdk.OperationState.OPERATION_STATE_EXECUTED,
			withoutCommissions: false,
			withoutTrades: false,
			withoutOvernights: false,
			cursor,
		};

		return await sdk.operations.getOperationsByCursor(reqData);
	} catch (e) {
		await timer(60000);
		return await getOperationsByCursor(sdk, accountId, from, to, cursor = '');
	}
};

(async () => {
	const { accounts } = await sdk.users.getAccounts();

	if (!accounts?.length) {
		console.log('Нет счетов.');
		return;
	}

	// Берём первый счёт из списка
	const {
		id: accountId,
		openedDate,
		closedDate,
	} = accounts.find(a => a.type === sdk.AccountType.ACCOUNT_TYPE_TINKOFF);

	if (!accountId) {
		console.log('Проверьте доступность счёта для API.');
		return;
	}

	const from = new Date(openedDate);
	const to = new Date(closedDate).getTime() ? closedDate : new Date();
	let nextCursor = '';

	do {
		const data = await getOperationsByCursor(sdk, accountId, from, to, nextCursor);
		nextCursor = data?.nextCursor;

		if (data?.items?.length) {
			printBrokerReport(data);
		}
	} while(nextCursor)
})();
