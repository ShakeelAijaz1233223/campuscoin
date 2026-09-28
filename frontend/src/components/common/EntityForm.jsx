import { useEffect, useState } from 'react';
import { Input, Select, Textarea, Checkbox, Button } from './UI';
import categoryApi from '../../api/categoryApi';
import accountApi from '../../api/accountApi';
import AiCategorySuggestion from '../ai/AiCategorySuggestion';
export default function EntityForm({
  fields,
  initial = {},
  onSubmit,
  onCancel,
  kind
}) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(
      fields.map((f) => [
        f.name,
        initial[f.name] ??
          (f.name === 'categoryId' ? initial.category?.id : undefined) ??
          f.default ??
          (f.type === 'checkbox' ? false : f.options?.[0] || '')
      ])
    )
  );
  const [categories, setCategories] = useState([]),
    [accounts, setAccounts] = useState([]),
    [optionsError, setOptionsError] = useState(''),
    [error, setError] = useState(null),
    [busy, setBusy] = useState(false),
    [optionsLoading, setOptionsLoading] = useState(false),
    [optionsVersion, setOptionsVersion] = useState(0);
  const needsCategories = fields.some((f) => f.type === 'category');
  const needsAccounts = fields.some((f) => f.type === 'account');
  useEffect(() => {
    const controller = new AbortController();
    setOptionsError('');
    setOptionsLoading(needsAccounts || needsCategories);
    Promise.all([
      needsCategories
        ? categoryApi.list({ limit: 500 }, controller.signal)
        : null,
      needsAccounts ? accountApi.list({ limit: 500 }, controller.signal) : null
    ])
      .then(([categoryResult, accountResult]) => {
        if (controller.signal.aborted) return;
        if (categoryResult)
          setCategories(categoryResult.items || categoryResult);
        if (accountResult) {
          const items = accountResult.items || accountResult;
          setAccounts(items);
          if (!initial.id)
            setValues((v) => ({
              ...v,
              accountId:
                v.accountId ||
                (items.find((a) => a.isDefault) || items[0])?.id ||
                ''
            }));
        }
      })
      .catch((e) => {
        if (!controller.signal.aborted) setOptionsError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setOptionsLoading(false);
      });
    return () => controller.abort();
  }, [needsCategories, needsAccounts, initial.id, optionsVersion]);
  const update = (f, v) =>
    setValues((old) => ({
      ...old,
      [f.name]: v,
      ...(f.name === 'type' ? { categoryId: '' } : {})
    }));
  async function submit(e) {
    e.preventDefault();
    setError(null);
    if (
      values.endDate &&
      values.startDate &&
      values.endDate < values.startDate
    ) {
      setError(new Error('End date must be on or after the start date.'));
      return;
    }
    setBusy(true);
    try {
      const body = { ...values };
      fields.forEach((f) => {
        if (body[f.name] === '') body[f.name] = null;
        else if (f.type === 'number') body[f.name] = Number(body[f.name]);
      });
      await onSubmit(body);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="entity-form" aria-busy={busy}>
      {optionsError && (
        <div role="alert" className="inline-alert">
          {optionsError}
          <button type="button" onClick={() => setOptionsVersion((v) => v + 1)}>
            Retry options
          </button>
        </div>
      )}
      {optionsLoading && (
        <p className="muted small-text" role="status">
          Loading your accounts and categories…
        </p>
      )}
      <div className="form-grid">
        {fields.map((f) => {
          const {
            name,
            label,
            type,
            options,
            default: _,
            categoryType,
            ...attrs
          } = f;
          const common = {
            ...attrs,
            ...(initial.id && kind === 'categories' && name === 'type'
              ? { disabled: true }
              : {}),
            ...(initial.id && name === 'startDate' ? { readOnly: true } : {}),
            value: values[name] ?? '',
            onChange: (e) => update(f, e.target.value)
          };
          if (type === 'checkbox')
            return (
              <Checkbox
                key={name}
                label={label}
                checked={!!values[name]}
                onChange={(e) => update(f, e.target.checked)}
              />
            );
          if (['select', 'category', 'account'].includes(type)) {
            const choices =
              type === 'select'
                ? options.map((o) => ({ id: o, name: o }))
                : type === 'category'
                  ? categories.filter(
                      (c) =>
                        !(categoryType || values.type) ||
                        c.type === (categoryType || values.type)
                    )
                  : accounts;
            return (
              <Select key={name} label={label} {...common}>
                <option value="">
                  Select {type === 'select' ? 'an option' : type}
                </option>
                {choices.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            );
          }
          if (type === 'textarea')
            return (
              <div className="full" key={name}>
                <Textarea label={label} {...common} />
              </div>
            );
          return <Input key={name} label={label} type={type} {...common} />;
        })}
      </div>
      {['transactions', 'recurring'].includes(kind) && (
        <AiCategorySuggestion
          key={values.description + '-' + values.type}
          description={values.description}
          type={values.type}
          onAccept={(id) => setValues((v) => ({ ...v, categoryId: id }))}
        />
      )}{' '}
      {error && (
        <div role="alert" className="inline-alert">
          {error.message}
          {error.details && (
            <ul>
              {Object.entries(error.details).map(([k, v]) => (
                <li key={k}>
                  {typeof v === 'object'
                    ? v.message || v.msg || JSON.stringify(v)
                    : String(v)}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <div className="form-actions">
        <Button
          type="button"
          variant="secondary"
          disabled={busy}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={busy}
          disabled={!!optionsError || optionsLoading}
        >
          {initial.id
            ? 'Save changes'
            : 'Create ' + (kind === 'transactions' ? 'transaction' : 'item')}
        </Button>
      </div>
    </form>
  );
}
