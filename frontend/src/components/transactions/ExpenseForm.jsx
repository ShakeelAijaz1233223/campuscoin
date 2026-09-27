import TransactionForm from './TransactionForm';export default function ExpenseForm({initial={},...props}){return <TransactionForm initial={{...initial,type:'expense'}} {...props}/>;}
