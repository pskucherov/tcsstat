import { createContext, useCallback, useEffect, useState } from 'react';

export const DataGetterContext = createContext();

export default function DataGetter(props) {
    const { socket, accountId } = props;

    const [inProgress, setInProgress] = useState(true);
    const [dataSet, setDataSet] = useState(new Set());
    const [commissionData, setCommissionData] = useState({});

    // const [commissionUnits, setCommissionUnits] = useState(0);
    // const [commissionNano, setCommissionNano] = useState(0);

    const agregateCommission = useCallback(data => {
        try {
            const {
                items,
            } = data;

            const oldSize = dataSet.size;
            const nextDataSet = dataSet;

            const nextData = items
                .filter(i => !nextDataSet.has(i.id))
                .reduce((acc, i) => {
                    try {
                        if (!i?.payment || !i?.name && !i?.description) {
                            return acc;
                        }
                        const { units, nano } = i.payment;

                        if (!acc[i.payment.currency]) {
                            acc[i.payment.currency] = {};
                        }

                        const name = i.description || i.name;

                        if (!acc[i.payment.currency][name]) {
                            acc[i.payment.currency][name] = {
                                units,
                                nano,
                            };
                        } else {
                            acc[i.payment.currency][name].units += units;
                            acc[i.payment.currency][name].nano += nano;
                        }

                        nextDataSet.add(i.id);

                        return acc;
                    } catch (e) {
                        console.log(e); // eslint-disable-line
                    }
                }, commissionData);

            if (oldSize !== nextDataSet.size) {
                setDataSet(nextDataSet);
                setCommissionData(nextData);
            }
        } catch (e) {
            console.log(e); // eslint-disable-line
        }
    }, [
        setDataSet, dataSet,
        commissionData, setCommissionData,
    ]);

    useEffect(() => {
        if (!socket || !accountId) {
            return;
        }

        socket.emit('sdk:getOperationsCommission', accountId);
    }, [socket, accountId]);

    useEffect(() => {
        if (!socket) {
            return;
        }

        const sdkGetByAcc = 'sdk:getOperationsCommissionResult_' + accountId;
        let timeout;

        socket.on(sdkGetByAcc, data => {
            const {
                nextCursor,
                from,
                to,
            } = data;

            setInProgress(true);

            if (nextCursor) {
                socket.emit('sdk:getOperationsCommission', accountId, {
                    cursor: nextCursor,
                    from,
                    to,
                });
            } else {
                setInProgress(false);
            }
        });

        socket.on(sdkGetByAcc, agregateCommission);

        return () => {
            socket.off(sdkGetByAcc);
            timeout && clearTimeout(timeout);
        };
    }, [socket, setInProgress, agregateCommission, accountId]);

    return <DataGetterContext.Provider value={{
        dataSize: dataSet.size,
        inProgress,
        commissionData,
    }}>
        {props.children}
    </DataGetterContext.Provider>;
}
