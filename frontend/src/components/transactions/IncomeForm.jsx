import TransactionForm from './TransactionForm';export default function IncomeForm({initial={},...props}){return <TransactionForm initial={{...initial,type:'income'}} {...props}/>;}
