import { useState } from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import useAuth from '../hooks/useAuth';
import useDashboard from '../hooks/useDashboard';
import reportApi from '../api/reportApi';
import useResource from '../hooks/useResource';
import GoalOverview from '../components/dashboard/GoalOverview';
import UpcomingBills from '../components/dashboard/UpcomingBills';
import {
  Card,
  Button,
  Loading,
  ErrorState,
  Modal,
  Input
} from '../components/common/UI';
import PageContainer from '../components/layout/PageContainer';
import HeroCard from '../components/dashboard/HeroCard';
import {
  IncomeCard,
  ExpenseCard,
  SavingsCard
} from '../components/dashboard/SummaryCards';
import SpendingRhythm from '../components/dashboard/SpendingRhythm';
import InsightCard from '../components/dashboard/InsightCard';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import BudgetCheckIn from '../components/dashboard/BudgetCheckIn';
import TopCategories from '../components/dashboard/TopCategories';
import MonthlyOverview from '../components/dashboard/MonthlyOverview';
import BudgetVsActual from '../components/dashboard/BudgetVsActual';
import SavingTipsWidget from '../components/dashboard/SavingTipsWidget';
import BudgetAlerts from '../components/dashboard/BudgetAlerts';
import TransactionForm from '../components/transactions/TransactionForm';
import transactionApi from '../api/transactionApi';
import { today } from '../utils/formatDate';
import { buildYearMonths } from '../utils/chartData';
import { useApp } from '../context/AppContext';
import { StaggerGroup, StaggerItem, ScaleIn, ViewportReveal } from '../components/ui/Nova';
import { itemVariants } from '../motion/variants';

export default function Dashboard() {
  const { user } = useAuth();
  const { notify } = useApp();
  const [month, setMonth] = useState(today().slice(0, 7)),
    [add, setAdd] = useState(false);
  const year = Number(month.slice(0, 4)),
    monthNum = Number(month.slice(5, 7));
  const { data: d, loading, error, refresh } = useDashboard({ month });
  const annual = useResource(reportApi, {
    from: `${year}-01-01`,
    to: `${year}-12-31`
  });
  const yearReport = annual.data;
  const currency = d?.currency || user?.currency || 'PKR';
  const daily = d?.daily || [];
  return (
    <PageContainer
      eyebrow="YOUR FINANCIAL WORKSPACE"
      title={`A little clarity, ${user?.name?.split(' ')[0] || 'friend'}.`}
      description="Your money. Your momentum. All in one place."
      actions={
        <>
          <Input
            label="Overview month"
            type="month"
            value={month}
            onChange={(e) => {
              if (e.target.value) setMonth(e.target.value);
            }}
          />
          <Button onClick={() => setAdd(true)}>
            <Plus size={17} />
            Add transaction
          </Button>
        </>
      }
    >
      {loading ? (
        <Card>
          <Loading />
        </Card>
      ) : error ? (
        <Card>
          <ErrorState error={error} onRetry={refresh} />
        </Card>
      ) : (
        d && (
          <StaggerGroup className="stagger">
            {/* Hierarchy 1 — hero balance + bills */}
            <div className="dashboard-top">
              <StaggerItem variants={itemVariants}>
                <HeroCard balance={d.balance} currency={currency} />
              </StaggerItem>
              <StaggerItem variants={itemVariants} className="h-full">
                <UpcomingBills items={d.upcomingBills} currency={currency} />
              </StaggerItem>
            </div>

            {/* Hierarchy 2 — metric strip */}
            <div className="dashboard-summary">
              {[
                <IncomeCard key="inc" value={d.income} currency={currency} daily={daily} />,
                <ExpenseCard key="exp" value={d.expense} currency={currency} daily={daily} />,
                <SavingsCard
                  key="sav"
                  rate={d.savings_rate}
                  value={d.savings}
                  currency={currency}
                  daily={daily}
                />
              ].map((el, i) => (
                <ScaleIn key={el.key} delay={i}>
                  {el}
                </ScaleIn>
              ))}
            </div>

            {/* Hierarchy 3 — cash flow + insights + ledger */}
            <div className="dashboard-grid">
              <ViewportReveal className="span-eight">
                {annual.loading ? (
                  <Card className="span-eight">
                    <Loading label="Loading your annual cash flow…" />
                  </Card>
                ) : annual.error ? (
                  <Card className="span-eight">
                    <ErrorState error={annual.error} onRetry={annual.refresh} />
                  </Card>
                ) : (
                  <SpendingRhythm
                    months={yearReport ? buildYearMonths(yearReport, year) : []}
                    currency={currency}
                    badge={String(year)}
                  />
                )}
              </ViewportReveal>
              <ViewportReveal className="span-four">
                <InsightCard insight={d.insight} month={monthNum} year={year} />
              </ViewportReveal>
              <ViewportReveal className="span-eight">
                <RecentTransactions
                  items={d.recentTransactions}
                  currency={currency}
                  onAdd={() => setAdd(true)}
                />
              </ViewportReveal>
              <ViewportReveal className="span-four">
                <BudgetCheckIn summary={d.budgetSummary} budgets={d.budgets} currency={currency} />
              </ViewportReveal>
              {d.alerts?.length > 0 && (
                <motion.div variants={itemVariants} initial="initial" animate="animate" className="span-two">
                  <BudgetAlerts alerts={d.alerts} />
                </motion.div>
              )}
            </div>

            {/* Hierarchy 4 — deeper analysis */}
            <div className="lower-grid">
              <ViewportReveal>
                <TopCategories data={d.categories} currency={currency} />
              </ViewportReveal>
              <ViewportReveal>
                <MonthlyOverview data={d.monthlyOverview} currency={currency} />
              </ViewportReveal>
              <ViewportReveal>
                <BudgetVsActual data={d.budgetActual} currency={currency} />
              </ViewportReveal>
              <ViewportReveal>
                <SavingTipsWidget tips={d.tips} />
              </ViewportReveal>
            </div>

            <ViewportReveal>
              <GoalOverview items={d.activeGoals} currency={currency} />
            </ViewportReveal>
          </StaggerGroup>
        )
      )}
      <Modal open={add} title="A new transaction" onClose={() => setAdd(false)}>
        <TransactionForm
          onCancel={() => setAdd(false)}
          onSubmit={async (values) => {
            await transactionApi.create(values);
            setAdd(false);
            notify('Transaction added.');
            refresh();
          }}
        />
      </Modal>
    </PageContainer>
  );
}
