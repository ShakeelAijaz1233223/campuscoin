import { useState } from 'react';
import GoalContributions from '../goals/GoalContributions';
import { motion } from 'framer-motion';
import useAuth from '../../hooks/useAuth';
import {
  Plus,
  SlidersHorizontal,
  Upload,
  Pencil,
  Trash2,
  Eye
} from 'lucide-react';
import {
  Button,
  Card,
  Modal,
  ConfirmDialog,
  Loading,
  EmptyState,
  ErrorState,
  Pagination,
  IconButton,
  Badge,
  ProgressBar,
  Input
} from './UI';
import PageContainer from '../layout/PageContainer';
import EntityForm from './EntityForm';
import { configs } from './entityConfig';
import useResource from '../../hooks/useResource';
import { useApp } from '../../context/AppContext';
import formatCurrency from '../../utils/formatCurrency';
import formatDate from '../../utils/formatDate';
import TransactionFilters from '../transactions/TransactionFilters';
import CsvImport from '../importExport/CsvImport';
export function displayValue(key, value, currency) {
  if (value === null || value === undefined || value === '') return '—';
  if (
    [
      'amount',
      'spent',
      'targetAmount',
      'savedAmount',
      'remaining',
      'balance',
      'openingBalance'
    ].includes(key)
  )
    return formatCurrency(value, currency);
  if (/date|Date|At$/.test(key)) return formatDate(value);
  if (typeof value === 'boolean') return value ? 'Active' : 'Paused';
  if (typeof value === 'object') return value.name || value.title || '—';
  return String(value);
}
export default function EntityWorkspace({
  kind,
  config: override,
  embedded = false
}) {
  const config = override || configs[kind];
  const [params, setParams] = useState({ page: 1, limit: 20 }),
    [contribute, setContribute] = useState(null),
    [edit, setEdit] = useState(null),
    [detail, setDetail] = useState(null),
    [remove, setRemove] = useState(null),
    [busy, setBusy] = useState(false),
    [filters, setFilters] = useState(false),
    [importing, setImporting] = useState(false);
  const state = useResource(config.api, params);
  const { notify } = useApp();
  const { user } = useAuth();
  const currency = user?.currency || 'PKR';
  const actions = (
    <>
      {kind === 'transactions' && (
        <Button variant="secondary" onClick={() => setImporting(true)}>
          <Upload size={16} />
          Import CSV
        </Button>
      )}
      <Button
        onClick={() =>
          setEdit(
            kind === 'budgets'
              ? { month: params.month || new Date().toISOString().slice(0, 7) }
              : {}
          )
        }
      >
        <Plus size={17} />
        Add {config.singular}
      </Button>
    </>
  );
  const handleSave = async (body) => {
    if (edit.id) await config.api.update(edit.id, body);
    else await config.api.create(body);
    setEdit(null);
    notify(edit.id ? 'Changes saved.' : `${config.singular} created.`);
    state.refresh();
  };
  const deleteItem = async () => {
    setBusy(true);
    try {
      await config.api.remove(remove.id);
      setRemove(null);
      notify('Item deleted.');
      if (state.items.length === 1 && params.page > 1)
        setParams((p) => ({ ...p, page: p.page - 1 }));
      else state.refresh();
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };
  const controls = (item) => (
    <div className="row">
      <IconButton
        label={'View ' + config.singular}
        onClick={() => setDetail(item)}
      >
        <Eye size={16} />
      </IconButton>
      {!item.readOnly && (
        <>
          <IconButton
            label={'Edit ' + config.singular}
            onClick={() => setEdit(item)}
          >
            <Pencil size={15} />
          </IconButton>
          <IconButton
            label={'Delete ' + config.singular}
            onClick={() => setRemove(item)}
          >
            <Trash2 size={15} />
          </IconButton>
        </>
      )}
    </div>
  );
  const content = (
    <>
      <Modal
        open={!!contribute}
        title="Your savings, step by step"
        onClose={() => setContribute(null)}
      >
        {contribute && (
          <GoalContributions
            goal={state.items.find((g) => g.id === contribute.id) || contribute}
            currency={currency}
          />
        )}
      </Modal>
      <motion.div initial={{y:14}} animate={{y:0}} transition={{duration:0.45,ease:[0.22,1,0.36,1]}}><Card className="collection">
        <div className="collection-toolbar">
          <div className="row">
            <span className="status-dot" />
            <h3>{kind === 'transactions' ? 'Your activity' : config.title}</h3>
            {state.data && (
              <Badge>{state.data.total ?? state.items.length}</Badge>
            )}
          </div>
          <div className="row">
            {config.searchable && (
              <input
                className="compact-search"
                aria-label={
                  kind === 'transactions'
                    ? 'Search description'
                    : 'Search ' + config.title
                }
                type="search"
                placeholder="Search…"
                value={params.q || ''}
                onChange={(e) =>
                  setParams((p) => ({ ...p, q: e.target.value, page: 1 }))
                }
              />
            )}{' '}
            {config.filters && (
              <Button
                variant="secondary"
                onClick={() => setFilters(!filters)}
                aria-expanded={filters}
              >
                <SlidersHorizontal size={16} />
                Filters
              </Button>
            )}
          </div>
        </div>
        {filters && (
          <TransactionFilters filters={params} onChange={setParams} />
        )}{' '}
        {kind === 'budgets' && (
          <Input
            label="Budget month"
            type="month"
            value={params.month || new Date().toISOString().slice(0, 7)}
            onChange={(e) =>
              setParams((p) => ({ ...p, month: e.target.value, page: 1 }))
            }
          />
        )}{' '}
        {state.loading ? (
          <Loading />
        ) : state.error ? (
          <ErrorState error={state.error} onRetry={state.refresh} />
        ) : state.items.length === 0 ? (
          <EmptyState
            title={
              params.q
                ? 'No matches found.'
                : `Your ${config.title.toLowerCase()} start here.`
            }
            description={
              params.q
                ? 'Try a different search or clear your filters.'
                : `Add your first ${config.singular} to begin building a clearer financial picture.`
            }
            action={
              <Button
                variant="secondary"
                onClick={() =>
                  setEdit(
                    kind === 'budgets'
                      ? {
                          month:
                            params.month || new Date().toISOString().slice(0, 7)
                        }
                      : {}
                  )
                }
              >
                Add {config.singular}
                <Plus size={16} />
              </Button>
            }
          />
        ) : config.cards ? (
          <div className="resource-cards">
            {state.items.map((item) => (
              <Card key={item.id} className="resource-card glass-secondary">
                <div className="row between">
                  <span className="eyebrow">{config.singular}</span>
                  {controls(item)}
                </div>
                <h3>{item.name || item.title}</h3>
                {kind === 'notes' ? (
                  <p className="note-body">{item.body}</p>
                ) : (
                  <>
                    <strong className="card-amount">
                      {formatCurrency(
                        item.amount ?? item.targetAmount,
                        item.currency || currency
                      )}
                    </strong>
                    {kind === 'budgets' && (
                      <>
                        <div className="row between muted">
                          <span>
                            {formatCurrency(
                              item.spent,
                              item.currency || currency
                            )}{' '}
                            spent
                          </span>
                          <span>
                            {item.amount
                              ? Math.round(
                                  ((item.spent || 0) / item.amount) * 100
                                )
                              : 0}
                            %
                          </span>
                        </div>
                        <ProgressBar
                          value={
                            item.amount
                              ? ((item.spent || 0) / item.amount) * 100
                              : 0
                          }
                        />
                        <p className="muted">
                          {formatCurrency(
                            item.amount - (item.spent || 0),
                            item.currency || currency
                          )}{' '}
                          remaining · {item.month}
                        </p>
                        {Number(item.spent) >= Number(item.amount) ? (
                          <Badge tone="danger">Budget exceeded</Badge>
                        ) : (Number(item.spent) / Number(item.amount)) * 100 >=
                          (item.alertThreshold || 80) ? (
                          <Badge tone="warning">Approaching your limit</Badge>
                        ) : (
                          <Badge>Within budget</Badge>
                        )}
                      </>
                    )}
                    {kind === 'goals' && (
                      <>
                        <ProgressBar
                          intent="goal"
                          label="Savings goal progress"
                          value={
                            item.targetAmount
                              ? (item.savedAmount / item.targetAmount) * 100
                              : 0
                          }
                        />
                        <p className="muted">
                          {formatCurrency(
                            item.savedAmount,
                            item.currency || currency
                          )}{' '}
                          saved · Target {formatDate(item.targetDate)}
                        </p>
                        <Button
                          variant="secondary"
                          className="full-width"
                          onClick={() => setContribute(item)}
                        >
                          {item.status === 'active'
                            ? 'Add savings'
                            : 'View contributions'}
                          <Plus size={15} />
                        </Button>
                      </>
                    )}
                    {kind === 'bills' && (
                      <div className="row between">
                        <span className="muted">
                          Due {formatDate(item.dueDate)}
                        </span>
                        <Badge tone={item.status === 'paid' ? '' : 'warning'}>
                          {item.status}
                        </Badge>
                      </div>
                    )}
                  </>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="table-scroll">
            <table className="nova-table">
              <thead>
                <tr>
                  {config.columns.map((k) => (
                    <th key={k}>
                      {k.replace(/([A-Z])/g, ' $1').replace('Id', '')}
                    </th>
                  ))}
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {state.items.map((item) => (
                  <tr key={item.id}>
                    {config.columns.map((k, i) => (
                      <td
                        key={k}
                        className={
                          k === 'amount'
                            ? item.type === 'income'
                              ? 'positive'
                              : ''
                            : ''
                        }
                      >
                        {['type', 'status', 'enabled'].includes(k) ? (
                          <Badge
                            tone={item.type === 'expense' ? 'neutral' : ''}
                          >
                            {displayValue(k, item[k])}
                          </Badge>
                        ) : i === 0 ? (
                          <button
                            className="table-link"
                            onClick={() => setDetail(item)}
                          >
                            {displayValue(
                              k,
                              item[k],
                              item.currency || currency
                            )}
                          </button>
                        ) : (
                          displayValue(k, item[k], item.currency || currency)
                        )}
                      </td>
                    ))}
                    <td>{controls(item)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!state.loading && !state.error && (
          <Pagination
            page={params.page}
            total={state.data?.total ?? state.items.length}
            limit={params.limit}
            onChange={(page) => setParams((p) => ({ ...p, page }))}
          />
        )}
      </Card></motion.div>
      <Modal
        open={!!edit}
        title={`${edit?.id ? 'Edit' : 'New'} ${config.singular}`}
        onClose={() => !busy && setEdit(null)}
      >
        {edit && (
          <EntityForm
            key={edit.id || 'new'}
            fields={config.fields}
            initial={edit}
            kind={kind}
            onSubmit={handleSave}
            onCancel={() => setEdit(null)}
          />
        )}
      </Modal>
      <Modal
        open={!!detail}
        title={
          detail?.description || detail?.name || detail?.title || 'Details'
        }
        onClose={() => setDetail(null)}
      >
        {detail && (
          <>
            <dl className="details-list">
              {Object.entries(detail)
                .filter(
                  ([k, v]) =>
                    !['id', 'userId'].includes(k) && typeof v !== 'object'
                )
                .map(([k, v]) => (
                  <div key={k}>
                    <dt>{k.replace(/([A-Z])/g, ' $1')}</dt>
                    <dd>{displayValue(k, v, detail.currency || currency)}</dd>
                  </div>
                ))}
            </dl>
            {!detail.readOnly && (
              <Button
                onClick={() => {
                  setEdit(detail);
                  setDetail(null);
                }}
              >
                Edit {config.singular}
                <Pencil size={16} />
              </Button>
            )}
          </>
        )}
      </Modal>
      <ConfirmDialog
        open={!!remove}
        loading={busy}
        onClose={() => !busy && setRemove(null)}
        onConfirm={deleteItem}
      />
      {kind === 'transactions' && (
        <Modal
          open={importing}
          title="Import your transactions"
          onClose={() => setImporting(false)}
        >
          <CsvImport
            onComplete={() => {
              state.refresh();
            }}
          />
        </Modal>
      )}
    </>
  );
  return embedded ? (
    <section>
      <div className="row between embedded-heading">
        <h2>{config.title}</h2>
        {actions}
      </div>
      {content}
    </section>
  ) : (
    <PageContainer
      eyebrow="YOUR FINANCIAL WORKSPACE"
      title={config.title}
      description={config.description}
      actions={actions}
    >
      {content}
    </PageContainer>
  );
}
