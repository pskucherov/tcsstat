import { useCallback, useEffect, useState } from 'react';
import { Spinner } from 'reactstrap';
import styles from './SelectAccount.module.css';

const Account = props => {
    const {
        socket,
        account,
        onSelect,
        isSelected,
    } = props;

    const [inProgress, setInProgress] = useState(true);
    const [data, setData] = useState();
    const [dataSet, setDataSet] = useState(new Set());

    const saveData = useCallback(data => {
        console.log('sdk:getOperationsCommissionResult_' + account?.id, data); // eslint-disable-line no-console
        const { items, inProgress } = data;

        setInProgress(inProgress);

        const nextData = [];
        const nextDataSet = dataSet;

        items.forEach(i => {
            if (!nextDataSet.has(i.id)) {
                nextDataSet.add(i.id);
                nextData.push(i);
            }
        });

        if (nextData.length) {
            setData(nextData);
            setDataSet(nextDataSet);
        }
    }, [setData, setDataSet, setInProgress, account?.id, dataSet]);

    useEffect(() => {
        if (!socket) {
            return;
        }

        socket.emit('sdk:getOperationsCommission', account?.id);

        socket.on('sdk:getOperationsCommissionResult_' + account?.id, saveData);

        return () => {
            socket.off('sdk:getOperationsCommissionResult');
        };
    }, [socket, saveData, account?.id, dataSet, setDataSet]);

    return <div
        className={styles[isSelected ? 'selectedAccount' : 'account']}
        onClick={() => {
            console.log('selected account', account); // eslint-disable-line
            onSelect(account?.id);
        }}
    >
        <div>{inProgress ? <Spinner color="warning" size="sm" /> : ''} {account.name} ({dataSet.size})</div>
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
        <Account
            key={k}
            socket={socket}
            onSelect={onSelect}
            account={a}
            isSelected={a.id === selectedId}
        />,
    );
}
