import FinancialChart from './FinancialChart';export default function SpendingTrendChart(props){return <FinancialChart type="area" series={[{key:'amount',name:'Spending'}]} {...props}/>;}
