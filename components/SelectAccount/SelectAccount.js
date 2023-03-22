import { useContext } from 'react';
import { Spinner } from 'reactstrap';
import DataGetter, { DataGetterContext } from './DataGetter';
import styles from './SelectAccount.module.css';

const Account = props => {
    const {
        account,
        onSelect,
        isSelected,
    } = props;

    const {
        inProgress = true,
        dataSize = 0,
        commissionData,
    } = useContext(DataGetterContext);

    return <div
        className={styles[isSelected ? 'selectedAccount' : 'account']}
        onClick={() => {
            console.log('selected account', account); // eslint-disable-line
            onSelect(account?.id);
        }}
    >
        <div><b>{inProgress ? <Spinner color="warning" size="sm" /> : ''} {account.name} ({dataSize})</b></div>
        {Object.keys(commissionData).length ?

            Object.keys(commissionData)
                .map((currency, k) => {
                    return <div key={k} >
                        {Object.keys(commissionData[currency]).map((name, j) => {
                            const { units: u, nano: n } = commissionData[currency][name];

                            return <div
                                key={j}
                            >
                                {name}: {u + n / 1e9} {currency}
                            </div>;
                        })}
                    </div>;
                }) :
            ''}
    </div>;
};

export default function SelectAccount(props) {
    const {
        socket,
        accounts,
        selectedId,
        onSelect,
    } = props;

    return accounts?.map((a, k) =>
        <DataGetter
            key={k}
            socket={socket}
            accountId={a.id}
        >
            <Account
                socket={socket}
                onSelect={onSelect}
                account={a}
                isSelected={a.id === selectedId}
            />
        </DataGetter>,
    );
}
