import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import goalApi from '../../api/goalApi';
import useResource from '../../hooks/useResource';
import {
  Button,
  Input,
  Textarea,
  ErrorState,
  Loading,
  EmptyState,
  ConfirmDialog,
  IconButton
} from '../common/UI';
import { useApp } from '../../context/AppContext';
import formatCurrency from '../../utils/formatCurrency';
import formatDate, { today } from '../../utils/formatDate';

export default function GoalContributions({ goal, currency }) {
  const api = useMemo(
    () => ({ list: (_, signal) => goalApi.contributions(goal.id, signal) }),
    [goal.id]
  );
  const state = useResource(api);
  const { notify } = useApp();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [remove, setRemove] = useState(null);
  const submit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    setBusy(true);
    setError('');
    try {
      await goalApi.contribute(goal.id, {
        ...values,
        amount: Number(values.amount)
      });
      form.reset();
      state.refresh();
      notify('Savings contribution recorded.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="goal-contributions">
      <p className="muted">
        Record money you’ve set aside for <b>{goal.name}</b>. This tracks
        progress; it does not move money between your accounts.
      </p>
      {goal.status === 'active' && (
        <form onSubmit={submit} aria-busy={busy}>
          <div className="form-grid">
            <Input
              label="Contribution amount"
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              required
            />
            <Input
              label="Contribution date"
              name="date"
              type="date"
              defaultValue={today()}
              required
            />
          </div>
          <Textarea
            label="Contribution note (optional)"
            name="notes"
            maxLength={1000}
          />
          {error && (
            <p className="inline-alert" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" loading={busy}>
            <Plus size={16} />
            Add savings
          </Button>
        </form>
      )}
      <h3 className="section-gap">Contribution history</h3>
      {state.loading ? (
        <Loading label="Loading your contributions…" />
      ) : state.error ? (
        <ErrorState error={state.error} onRetry={state.refresh} />
      ) : !state.items.length ? (
        <EmptyState
          title="Your next small step."
          description="No contributions recorded yet. An initial saved amount is tracked separately."
        />
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Note</th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {state.items.map((item) => (
                <tr key={item.id}>
                  <td>{formatDate(item.date)}</td>
                  <td>{formatCurrency(item.amount, currency)}</td>
                  <td>{item.notes || '—'}</td>
                  <td>
                    <IconButton
                      label="Remove contribution"
                      onClick={() => setRemove(item)}
                    >
                      <Trash2 size={15} />
                    </IconButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ConfirmDialog
        open={!!remove}
        title="Remove this contribution?"
        description="Your goal’s saved amount will be adjusted. This does not change your account balances."
        loading={busy}
        onClose={() => !busy && setRemove(null)}
        onConfirm={async () => {
          setBusy(true);
          try {
            await goalApi.removeContribution(goal.id, remove.id);
            setRemove(null);
            state.refresh();
            notify('Contribution removed.');
          } catch (e) {
            notify(e.message, 'error');
          } finally {
            setBusy(false);
          }
        }}
      />
    </div>
  );
}
