import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createCarnet,
  deleteCarnet,
  getCarnetDetail,
  listCarnets,
  listParents,
  updateCarnet,
} from '../api/endpoints'
import { Button, Card, ErrorBanner, EmptyState, Field, Input, Loader, Select, Badge } from '../components/ui'
import { getErrorMessage } from '../utils/errors'
import { formatAmount, formatDate, getFullName } from '../utils/formatters'
import { normalizeNumberInput } from '../utils/forms'

const emptyForm = {
  parent: '',
  annee: new Date().getFullYear(),
  nb_enfants: 1,
}

export default function CarnetsPage() {
  const [carnets, setCarnets] = useState([])
  const [parents, setParents] = useState([])
  const [selectedCarnetId, setSelectedCarnetId] = useState('')
  const [selectedDetail, setSelectedDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const loadDetail = useCallback(async (carnetId) => {
    if (!carnetId) {
      setSelectedDetail(null)
      return
    }

    try {
      const detail = await getCarnetDetail(carnetId)
      setSelectedDetail(detail)
    } catch (detailError) {
      setSelectedDetail(null)
      setError(getErrorMessage(detailError))
    }
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [parentData, carnetData] = await Promise.all([listParents(), listCarnets()])
      setParents(parentData)
      setCarnets(carnetData)

      if (carnetData.length) {
        const nextSelected = String(carnetData[0].id)

        setSelectedCarnetId(nextSelected)
        await loadDetail(nextSelected)
      } else {
        setSelectedDetail(null)
        setSelectedCarnetId('')
      }
    } catch (fetchError) {
      setError(getErrorMessage(fetchError))
    } finally {
      setLoading(false)
    }
  }, [loadDetail])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  }, [loadData])

  useEffect(() => {
    if (selectedCarnetId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadDetail(selectedCarnetId)
    }
  }, [loadDetail, selectedCarnetId])

  function updateForm(event) {
    const { name, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: name === 'annee' || name === 'nb_enfants' ? normalizeNumberInput(value) : value,
    }))
  }

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm)
  }

  function startEdit(carnet) {
    setEditingId(carnet.id)
    setForm({
      parent: carnet.parent,
      annee: carnet.annee,
      nb_enfants: carnet.nb_enfants,
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      parent: Number(form.parent),
      annee: Number(form.annee),
      nb_enfants: Number(form.nb_enfants),
    }

    try {
      if (editingId) {
        await updateCarnet(editingId, payload)
      } else {
        await createCarnet(payload)
      }

      resetForm()
      await loadData()
    } catch (submitError) {
      setError(getErrorMessage(submitError))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(carnet) {
    if (!window.confirm(`Delete carnet ${carnet.annee}?`)) {
      return
    }

    setSaving(true)
    setError('')

    try {
      await deleteCarnet(carnet.id)
      if (editingId === carnet.id) {
        resetForm()
      }
      await loadData()
    } catch (deleteError) {
      setError(getErrorMessage(deleteError))
    } finally {
      setSaving(false)
    }
  }

  const selectedParentName = useMemo(() => {
    if (!selectedDetail) {
      return '—'
    }

    return getFullName(parents.find((parent) => String(parent.id) === String(selectedDetail.parent)))
  }, [parents, selectedDetail])

  const payments = selectedDetail?.paiements || []
  const paidCount = payments.filter((payment) => payment.status === 'paid').length
  const unpaidCount = payments.filter((payment) => payment.status === 'unpaid').length

  return (
    <div className="page-grid page-grid--split">
      <div className="stack">
        <Card>
          <div className="card__header">
            <div>
              <p className="eyebrow">Carnet records</p>
              <h2>{carnets.length} carnet entries</h2>
            </div>
          </div>

          {loading ? (
            <Loader label="Loading carnets..." />
          ) : carnets.length ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Parent</th>
                    <th>Year</th>
                    <th>Children</th>
                    <th>Payments</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {carnets.map((carnet) => {
                    const carnetParent = parents.find((parent) => String(parent.id) === String(carnet.parent))
                    const carnetDetailPayments = selectedDetail && String(selectedDetail.id) === String(carnet.id) ? payments : []
                    const summaryLabel = carnetDetailPayments.length ? `${carnetDetailPayments.filter((payment) => payment.status === 'paid').length}/${carnetDetailPayments.length}` : 'Open to view'

                    return (
                      <tr key={carnet.id}>
                        <td>
                          <strong>{carnetParent ? getFullName(carnetParent) : `Parent #${carnet.parent}`}</strong>
                        </td>
                        <td>{carnet.annee}</td>
                        <td>{carnet.nb_enfants}</td>
                        <td>{summaryLabel}</td>
                        <td>
                          <div className="row-actions">
                            <Button type="button" variant="ghost" onClick={() => setSelectedCarnetId(String(carnet.id))}>
                              View
                            </Button>
                            <Button type="button" variant="ghost" onClick={() => startEdit(carnet)}>
                              Edit
                            </Button>
                            <Button type="button" variant="danger" onClick={() => handleDelete(carnet)} disabled={saving}>
                              Delete
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
            <EmptyState title="No carnets yet" description="Create a carnet to generate the payment schedule automatically." />
          )}
        </Card>

        <Card>
          <div className="card__header">
            <div>
              <p className="eyebrow">Payment detail</p>
              <h2>Carnet {selectedDetail?.annee || '—'}</h2>
            </div>
            {selectedDetail ? <Badge tone="neutral">{selectedParentName}</Badge> : null}
          </div>

          {selectedDetail ? (
            <div className="detail-summary">
              <div>
                <strong>{payments.length}</strong>
                <span>Scheduled payments</span>
              </div>
              <div>
                <strong>{paidCount}</strong>
                <span>Paid</span>
              </div>
              <div>
                <strong>{unpaidCount}</strong>
                <span>Unpaid</span>
              </div>
            </div>
          ) : null}

          {payments.length ? (
            <div className="payment-grid">
              {payments.map((payment) => (
                <article className="payment-card" key={payment.id}>
                  <div className="payment-card__top">
                    <div>
                      <h3>Tranche {payment.numero_tranche}</h3>
                      <p>{formatDate(payment.date_paiement)}</p>
                    </div>
                    <Badge tone={payment.status === 'paid' ? 'success' : 'warning'}>{payment.status}</Badge>
                  </div>
                  <div className="payment-card__meta">Amount: {formatAmount(payment.montant)}</div>
                </article>
              ))}
            </div>
          ) : selectedDetail ? (
            <EmptyState title="No payments available" description="This carnet has no payment schedule yet." />
          ) : (
            <EmptyState title="Select a carnet" description="Choose a carnet from the table to view its payment schedule." />
          )}
        </Card>
      </div>

      <Card className="form-panel">
        <div className="card__header">
          <div>
            <p className="eyebrow">{editingId ? 'Edit carnet' : 'New carnet'}</p>
            <h2>{editingId ? 'Update carnet details' : 'Create a carnet'}</h2>
          </div>
          {editingId ? (
            <Button type="button" variant="secondary" onClick={resetForm}>
              Cancel
            </Button>
          ) : null}
        </div>

        <ErrorBanner message={error} />

        <form className="stack" onSubmit={handleSubmit}>
          <Field label="Parent" required>
            <Select name="parent" value={form.parent} onChange={updateForm} required>
              <option value="">Choose a parent</option>
              {parents.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {getFullName(parent)}
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid-form grid-form--two">
            <Field label="Year" required>
              <Input type="number" name="annee" value={form.annee} onChange={updateForm} required />
            </Field>
            <Field label="Children count" required>
              <Input type="number" min="0" name="nb_enfants" value={form.nb_enfants} onChange={updateForm} required />
            </Field>
          </div>

          <Button type="submit" className="button--full" disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Update carnet' : 'Create carnet'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
