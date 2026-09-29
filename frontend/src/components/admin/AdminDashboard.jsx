import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Activity, ReceiptText, Shapes, Megaphone, Lightbulb, ChartNoAxesCombined, ArrowUpRight } from 'lucide-react';
import useResource from '../../hooks/useResource';
import adminApi from '../../api/adminApi';
import { Card, Loading, ErrorState } from '../common/UI';
import PageContainer from '../layout/PageContainer';
import FinancialChart from '../charts/FinancialChart';
import { MetricCard, StaggerGroup, StaggerItem, SpotlightCard } from '../ui/Nova';

const api = { list: () => adminApi.stats() };

const shortcuts = [
  ['users', 'Users', Users],
  ['categories', 'Categories', Shapes],
  ['announcements', 'Announcements', Megaphone],
  ['tips', 'System tips', Lightbulb],
  ['statistics', 'Statistics', ChartNoAxesCombined]
];

export default function AdminDashboard({ statistics = false }) {
  const s = useResource(api);
  return (
    <PageContainer
      eyebrow="CAMPUSCOIN ADMINISTRATION"
      title={statistics ? 'Usage & statistics' : 'The campus overview.'}
      description="A real-time view of your CampusCoin community."
    >
      {s.loading ? (
        <Loading />
      ) : s.error ? (
        <Card>
          <ErrorState error={s.error} onRetry={s.refresh} />
        </Card>
      ) : (
        s.data && (
          <StaggerGroup>
            <div className="nova-bento">
              <MetricCard
                index={0}
                span={4}
                label="Registered users"
                value={s.data.totalUsers}
                caption="Across your deployment"
                icon={Users}
                tone="aurora"
              />
              <MetricCard
                index={1}
                span={4}
                label="Active users"
                value={s.data.activeUsers}
                caption={s.data.activePeriod || 'Reported active period'}
                icon={Activity}
                tone="jade"
              />
              <MetricCard
                index={2}
                span={4}
                label="Total transactions"
                value={s.data.totalTransactions}
                caption="Recorded financial activity"
                icon={ReceiptText}
                tone="gold"
              />
            </div>

            <div className="two-grid section-gap">
              <SpotlightCard>
                <div style={{ padding: 22 }}>
                  <h2>Most-used categories</h2>
                  <FinancialChart
                    valueType="count"
                    data={s.data.topCategories || []}
                    type="bar"
                    series={[{ key: 'count', name: 'Transactions' }]}
                  />
                </div>
              </SpotlightCard>
              <SpotlightCard>
                <div style={{ padding: 22 }}>
                  <h2>Platform activity</h2>
                  <FinancialChart
                    valueType="count"
                    data={s.data.activity || []}
                    series={[{ key: 'count', name: 'Activity' }]}
                  />
                </div>
              </SpotlightCard>
            </div>

            {!statistics && (
              <SpotlightCard className="section-gap">
                <div style={{ padding: 24 }}>
                  <h2>Manage your community</h2>
                  <div className="row wrap" style={{ gap: 10, marginTop: 14 }}>
                    {shortcuts.map(([slug, label, Icon], i) => (
                      <motion.div
                        key={slug}
                        initial={{ y: 12 }}
                        animate={{ y: 0 }}
                        transition={{ delay: 0.1 + i * 0.06, duration: 0.4 }}
                        whileHover={{ y: -3 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <Link
                          className="nova-btn nova-btn-ghost"
                          to={'/admin/' + slug}
                          style={{ textDecoration: 'none' }}
                        >
                          <Icon size={16} /> {label} <ArrowUpRight size={14} />
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </SpotlightCard>
            )}
          </StaggerGroup>
        )
      )}
    </PageContainer>
  );
}
