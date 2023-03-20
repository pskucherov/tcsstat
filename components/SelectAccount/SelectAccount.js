import styles from './SelectAccount.module.css';

const Account = props => {
    const { account, onSelect, isSelected } = props;

    return <div
        className={styles[isSelected ? 'selectedAccount' : 'account']}
        onClick={() => {
            console.log('selected account', account); // eslint-disable-line
            onSelect(account?.id);
        }}
    >
        {account.name}
    </div>;
};

export default function SelectAccount(props) {
    const {
        accounts,
        selectedId,
        onSelect,
    } = props;

    return accounts?.map((a, k) =>
        <Account
            key={k}
            onSelect={onSelect}
            account={a}
            isSelected={a.id === selectedId}
        />,
    );
}
