import { Briefcase } from 'lucide-react';
import { useId, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import Card from '../common/Card';
import formatCurrency from '../../utils/formatCurrency';
export default function SpendingRhythm({
  months = [],
  currency,
  className = '',
  badge
}) {
  const data = months;
  const hasData = data.some((d) => d.expense > 0 || d.income > 0);
  const reduced =
    typeof matchMedia === 'function' &&
    matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gid = useId().replaceAll(':', '') + 'rhythm';
  const peak = useMemo(
    () =>
      data.reduce(
        (m, d, i) => (d.expense > m.expense ? { ...d, index: i } : m),
        { expense: 0, index: -1 }
      ),
    [data]
  );
  return (
    <Card className={'glass-primary ' + className}>
      <div className="panel-heading">
        <div className="row">
          <span className="panel-icon">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 17 L9 11 L13 14 L21 6"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M15 6 h6 v6"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div>
            <p className="eyebrow">THE FULL YEAR</p>
            <h2>Spending rhythm</h2>
          </div>
        </div>
        {badge && <span className="rhythm-badge">{badge}</span>}
      </div>
      {!hasData ? (
        <div className="rhythm-empty">
          <svg
            className="rhythm-skeleton"
            viewBox="0 0 340 190"
            fill="none"
            aria-hidden="true"
          >
            <g stroke="var(--chart-grid)" strokeWidth="1">
              {[38, 72, 106, 140].map((y) => (
                <line key={y} x1="34" x2="332" y1={y} y2={y} />
              ))}
            </g>
            <line
              x1="34"
              x2="34"
              y1="16"
              y2="158"
              stroke="var(--border-strong)"
              strokeWidth="1.4"
            />
            <line
              x1="34"
              x2="332"
              y1="158"
              y2="158"
              stroke="var(--border-strong)"
              strokeWidth="1.4"
            />
            <path
              d="M34 128 C70 118 96 138 128 130 C160 122 186 134 218 124 C250 114 284 128 318 118"
              stroke="var(--accent-line)"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeDasharray="1 7"
            />
            {[
              'Jan',
              'Feb',
              'Mar',
              'Apr',
              'May',
              'Jun',
              'Jul',
              'Aug',
              'Sep',
              'Oct',
              'Nov',
              'Dec'
            ].map((m, i) => (
              <text
                key={m}
                x={38 + i * 25.6}
                y="176"
                fontSize="8.6"
                fill="var(--dim)"
              >
                {m}
              </text>
            ))}
          </svg>
          <div className="rhythm-copy">
            <span className="rhythm-brief">
              <Briefcase size={26} />
            </span>
            <h3>The picture builds with you.</h3>
            <p>
              Your chart will appear once the backend has activity for this
              period.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="rhythm-chart-wrap">
            <ResponsiveContainer width="100%" height={252}>
              <AreaChart
                data={data}
                margin={{ top: 12, right: 8, bottom: 0, left: -8 }}
              >
                <defs>
                  <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--purple)"
                      stopOpacity=".26"
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--accent)"
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--dim)', fontSize: 11 }}
                  tickMargin={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  width={62}
                  tick={{ fill: 'var(--dim)', fontSize: 11 }}
                  tickFormatter={(v) =>
                    v >= 1000 ? (v / 1000).toFixed(v % 1000 ? 1 : 0) + 'k' : v
                  }
                />
                <Tooltip
                  formatter={(v, k) => [
                    formatCurrency(v, currency),
                    k === 'Expenses' ? 'Expenses' : 'Income'
                  ]}
                  labelFormatter={(l) => l}
                  cursor={{
                    stroke: 'var(--border-strong)',
                    strokeDasharray: '4 4'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  name="Expenses"
                  stroke="var(--purple)"
                  strokeWidth={2.6}
                  fill={`url(#${gid})`}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
                  isAnimationActive={!reduced}
                  animationDuration={1100}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  name="Income"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  fill="none"
                  activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
                  isAnimationActive={!reduced}
                  animationDuration={1300}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="rhythm-legend">
            <span>
              <i style={{ background: 'var(--purple)' }} />
              Expenses
            </span>
            <span>
              <i style={{ background: 'var(--accent)' }} />
              Income
            </span>
            {peak.index > -1 && peak.expense > 0 && (
              <span className="muted">
                Peak month · {peak.label} (
                {formatCurrency(peak.expense, currency)})
              </span>
            )}
          </div>
        </>
      )}
      {hasData && (
        <details className="chart-data">
          <summary>View cash flow data</summary>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Income</th>
                  <th>Expenses</th>
                </tr>
              </thead>
              <tbody>
                {data.map((d) => (
                  <tr key={d.label}>
                    <td>{d.label}</td>
                    <td>{formatCurrency(d.income, currency)}</td>
                    <td>{formatCurrency(d.expense, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </Card>
  );
}
