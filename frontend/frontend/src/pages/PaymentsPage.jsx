import { useEffect, useMemo, useState } from 'react'
import { getCarnetDetail, listCarnets, listParents, updatePayment } from '../api/endpoints'
import { Button, Card, ErrorBanner, EmptyState, Field, Input, Loader, Select, Badge } from '../components/ui'
import { getErrorMessage } from '../utils/errors'
import { formatAmount, formatDate, getFullName } from '../utils/formatters'
import { normalizeNumberInput } from '../utils/forms'

const initialFilters = {
  status: 'all',
  parentId: '',
  year: '',
}

export default function PaymentsPage() {
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [error, setError] = useState('')
  const [parents, setParents] = useState([])
  const [payments, setPayments] = useState([])
  const [drafts, setDrafts] = useState({})
  const [filters, setFilters] = useState(initialFilters)
  const [appliedFilters, setAppliedFilters] = useState(initialFilters)

  useEffect(() => {
    loadData()
  }, [])

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const matchesStatus = appliedFilters.status === 'all' || payment.status === appliedFilters.status
      const matchesParent = !appliedFilters.parentId || String(payment.parentId) === String(appliedFilters.parentId)
      const matchesYear = !appliedFilters.year || String(payment.carnet?.annee) === String(appliedFilters.year)
      return matchesStatus && matchesParent && matchesYear
    })
  }, [appliedFilters, payments])

  async function loadData() {
    setLoading(true)
    setError('')

    try {
      const [parentData, carnetData] = await Promise.all([listParents(), listCarnets()])
      setParents(parentData)

      const detailPairs = await Promise.all(
        carnetData.map(async (carnet) => ({
          carnet,
          detail: await getCarnetDetail(carnet.id),
        })),
      )

      const paymentData = detailPairs.flatMap(({ carnet, detail }) =>
        (detail?.paiements || []).map((payment) => ({
          ...payment,
          carnet,
          parentId: detail?.parent,
        })),
      )

      setPayments(paymentData)
      setDrafts(
        Object.fromEntries(
          paymentData.map((payment) => [
            payment.id,
            {
              status: payment.status,
              montant: payment.montant,
            },
          ]),
        ),
      )
    } catch (fetchError) {
      setError(getErrorMessage(fetchError))
    } finally {
      setLoading(false)
    }
  }

  function handleFilterChange(event) {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
  }

  function applyFilters(event) {
    event.preventDefault()
    setAppliedFilters(filters)
  }

  function updateDraft(paymentId, field, value) {
    setDrafts((current) => ({
      ...current,
      [paymentId]: {
        ...current[paymentId],
        [field]: field === 'montant' ? normalizeNumberInput(value) : value,
      },
    }))
  }

  async function savePayment(payment) {
    const draft = drafts[payment.id] || payment
    setSavingId(payment.id)
    setError('')

    try {
      await updatePayment(payment.carnet.id, payment.id, {
        status: draft.status,
        montant: Number(draft.montant),
      })
      await loadData()
    } catch (submitError) {
      setError(getErrorMessage(submitError))
    } finally {
      setSavingId(null)
    }
  }

  const summary = useMemo(() => {
    const paid = payments.filter((payment) => payment.status === 'paid').length
    const unpaid = payments.filter((payment) => payment.status === 'unpaid').length
    const totalAmount = payments.reduce((sum, payment) => sum + Number(payment.montant || 0), 0)

    return { paid, unpaid, totalAmount }
  }, [payments])

  return (
    <div className="stack">
      <Card>
        <div className="card__header">
          <div>
            <p className="eyebrow">Payments overview</p>
            <h2>Review every payment row</h2>
          </div>
        </div>

        <div className="stats-grid stats-grid--compact">
          <div className="mini-stat">
            <strong>{payments.length}</strong>
            <span>Total payments</span>
          </div>
          <div className="mini-stat">
            <strong>{summary.paid}</strong>
            <span>Paid</span>
          </div>
          <div className="mini-stat">
            <strong>{summary.unpaid}</strong>
            <span>Unpaid</span>
          </div>
          <div className="mini-stat">
            <strong>{formatAmount(summary.totalAmount)}</strong>
            <span>Combined amount</span>
          </div>
        </div>
      </Card>

      <Card>
        <div className="card__header">
          <div>
            <p className="eyebrow">Filter payments</p>
            <h2>Search by status, parent, or year</h2>
          </div>
        </div>

        <form className="grid-form grid-form--filters" onSubmit={applyFilters}>
          <Field label="Status">
            <Select name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="all">All</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </Select>
          </Field>
          <Field label="Parent">
            <Select name="parentId" value={filters.parentId} onChange={handleFilterChange}>
              <option value="">All parents</option>
              {parents.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {getFullName(parent)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Year">
            <Input name="year" value={filters.year} onChange={handleFilterChange} placeholder="2026" />
          </Field>
          <div className="grid-form__actions">
            <Button type="submit">Apply filters</Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setFilters(initialFilters)
                setAppliedFilters(initialFilters)
              }}
            >
              Reset
            </Button>
          </div>
        </form>
      </Card>

      <ErrorBanner message={error} onRetry={loadData} />

      {loading ? (
        <Card>
          <Loader label="Loading payments..." />
        </Card>
      ) : filteredPayments.length ? (
        <div className="table-wrap">
          <table className="data-table data-table--payments">
            <thead>
              <tr>
                <th>Parent</th>
                <th>Carnet</th>
                <th>Tranche</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Payment date</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => {
                const parent = parents.find((item) => String(item.id) === String(payment.parentId))
                const draft = drafts[payment.id] || payment

                return (
                  <tr key={payment.id}>
                    <td>
                      <strong>{parent ? getFullName(parent) : `Parent #${payment.parentId}`}</strong>
                    </td>
                    <td>
                      Carnet {payment.carnet?.id} · {payment.carnet?.annee}
                    </td>
                    <td>{payment.numero_tranche}</td>
                    <td>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={draft.montant}
                        onChange={(event) => updateDraft(payment.id, 'montant', event.target.value)}
                      />
                    </td>
                    <td>
                      <Select value={draft.status} onChange={(event) => updateDraft(payment.id, 'status', event.target.value)}>
                        <option value="paid">Paid</option>
                        <option value="unpaid">Unpaid</option>
                      </Select>
                    </td>
                    <td>
                      <div className="table-subtext">{formatDate(payment.date_paiement)}</div>
                    </td>
                    <td>
                      <div className="row-actions">
                        <Badge tone={payment.status === 'paid' ? 'success' : 'warning'}>{payment.status}</Badge>
                        <Button type="button" onClick={() => savePayment(payment)} disabled={savingId === payment.id}>
                          {savingId === payment.id ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <Card>
          <EmptyState title="No payments match these filters" description="Try widening the search criteria." />
        </Card>
      )}
    </div>
  )
}
