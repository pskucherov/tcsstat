const { createSdk } = require('tinkoff-sdk-grpc-js');

const TOKEN = 't.YOURTOKEN';

// Имя приложения, по которому вас смогут найти в логах ТКС.
const appName = 'tcsstat';

const sdk = createSdk(TOKEN, appName);

// Получаем дату вычетая дни от текущей.
const getDateSubDay = (subDay = 5, start = true) => {
	const date = new Date();
	date.setUTCDate(date.getUTCDate() - subDay);

	if (start) {
		date.setUTCHours(0, 0, 0, 0);
	} else {
		date.setUTCHours(23, 59, 59, 999);
	}

	return date;
};

const printBrokerReport = report => {
	console.log(JSON.stringify(report, null, 4));
};

const timer = async time => {
	return new Promise(resolve => setTimeout(resolve, time));
}

// Получаем отчёт по taskId с ожиданием отчёта.
// Если в коде будет ошибка не про ожидание отчёта,
// то он всё равно будет повторять запрос.
const getBrokerResponseByTaskId = async (taskId, page = 0) => {
	try {
        return await (sdk.operations.getBrokerReport)({
            getBrokerReportRequest: {
                taskId,
                page,
            },
        });
    } catch (e) {
		console.log('wait', e);
		await timer(10000);
		return await getBrokerResponseByTaskId(taskId, page);
    }
};

(async () => {
	const { accounts } = await sdk.users.getAccounts();

	if (!accounts?.length) {
		console.log('Нет счетов.');
		return;
	}

	// Берём первый счёт из списка
	const { id: accountId } = accounts.find(a => a.type === sdk.AccountType.ACCOUNT_TYPE_TINKOFF);

	if (!accountId) {
		console.log('Проверьте доступность счёта для API.');
		return;
	}

	const from = getDateSubDay(12, true);
	const to = getDateSubDay(5);

	console.log('accountId', accountId);
	console.log('from', from.toISOString());
	console.log('to', to.toISOString());

	const brokerReport = await (sdk.operations.getBrokerReport)({
		generateBrokerReportRequest: {
			accountId,
			from,
			to,
		},
	});

	if (brokerReport?.getBrokerReportResponse?.brokerReport) {
		console.log('Отчёт уже сформирован');
		printBrokerReport(brokerReport?.getBrokerReportResponse?.brokerReport);
		return;
	}

	if (brokerReport?.generateBrokerReportResponse?.taskId) {
		console.log('Ждём отчёт');
		const report = await getBrokerResponseByTaskId(brokerReport?.generateBrokerReportResponse?.taskId);
		printBrokerReport(report);
	}
})();