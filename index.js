const { createSdk } = require('tinkoff-sdk-grpc-js');

const TOKEN = 't.YOURTOKEN';

// Имя приложения, по которому вас смогут найти в логах ТКС.
const appName = 'tcsstat';

const sdk = createSdk(TOKEN, appName);

(async () => {
	console.log(await sdk.users.getAccounts());
})();