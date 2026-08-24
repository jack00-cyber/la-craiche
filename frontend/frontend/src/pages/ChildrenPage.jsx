import { useCallback, useEffect, useState } from 'react'
import { createChild, deleteChild, listChildren, updateChild } from '../api/endpoints'
import { Button, Card, ErrorBanner, EmptyState, Field, Input, Loader, Select, Textarea, Badge } from '../components/ui'
import { getErrorMessage } from '../utils/errors'
import { omitEmptyValues, normalizeNumberInput } from '../utils/forms'
import { formatDate, getFullName } from '../utils/formatters'

const emptyForm = {
  nom: '',
  prenom: '',
  date_naissance: '',
  sexe: 'M',
  nb_freres_soeurs: 0,
  maladies: '',
  remarques: '',
  type_enfant: 'Tps',
}

const initialFilters = {
  type_enfant: '',
  sexe: '',
  code_unique: '',
}

export default function ChildrenPage() {
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [filters, setFilters] = useState(initialFilters)
  const [appliedFilters, setAppliedFilters] = useState(initialFilters)

  const loadChildren = useCallback(async (filterValues = appliedFilters) => {
    setLoading(true)
    setError('')

    try {
      const data = await listChildren(omitEmptyValues(filterValues))
      setChildren(data)
    } catch (fetchError) {
      setError(getErrorMessage(fetchError))
    } finally {
      setLoading(false)
    }
  }, [appliedFilters])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadChildren(appliedFilters)
  }, [appliedFilters, loadChildren])

  function handleFilterChange(event) {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
  }

  function applyFilters(event) {
    event.preventDefault()
    setAppliedFilters(filters)
  }

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm)
  }

  function startEdit(child) {
    setEditingId(child.id)
    setForm({
      nom: child.nom || '',
      prenom: child.prenom || '',
      date_naissance: child.date_naissance || '',
      sexe: child.sexe || 'M',
      nb_freres_soeurs: child.nb_freres_soeurs ?? 0,
      maladies: child.maladies || '',
      remarques: child.remarques || '',
      type_enfant: child.type_enfant || 'Tps',
    })
  }

  function updateForm(event) {
    const { name, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: name === 'nb_freres_soeurs' ? normalizeNumberInput(value) : value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      ...form,
      nb_freres_soeurs: Number(form.nb_freres_soeurs) || 0,
    }

    try {
      if (editingId) {
        await updateChild(editingId, payload)
      } else {
        await createChild(payload)
      }

      resetForm()
      await loadChildren()
    } catch (submitError) {
      setError(getErrorMessage(submitError))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(child) {
    if (!window.confirm(`Delete ${getFullName(child)}?`)) {
      return
    }

    setSaving(true)
    setError('')

    try {
      await deleteChild(child.id)
      if (editingId === child.id) {
        resetForm()
      }
      await loadChildren()
    } catch (deleteError) {
      setError(getErrorMessage(deleteError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-grid page-grid--split">
      <div className="stack">
        <Card>
          <div className="card__header">
            <div>
              <p className="eyebrow">Filter children</p>
              <h2>Search the child registry</h2>
            </div>
          </div>

          <form className="grid-form grid-form--filters" onSubmit={applyFilters}>
            <Field label="Type">
              <Select name="type_enfant" value={filters.type_enfant} onChange={handleFilterChange}>
                <option value="">All types</option>
                <option value="Tps">Tps</option>
                <option value="Ps">Ps</option>
                <option value="Ms">Ms</option>
                <option value="Gsm">Gsm</option>
              </Select>
            </Field>

            <Field label="Sex">
              <Select name="sexe" value={filters.sexe} onChange={handleFilterChange}>
                <option value="">All</option>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </Select>
            </Field>

            <Field label="Code unique">
              <Input name="code_unique" value={filters.code_unique} onChange={handleFilterChange} placeholder="Search by code" />
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

        <Card>
          <div className="card__header">
            <div>
              <p className="eyebrow">Children list</p>
              <h2>{children.length} records</h2>
            </div>
          </div>

          {loading ? (
            <Loader label="Loading children..." />
          ) : children.length ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Child</th>
                    <th>Code</th>
                    <th>Birth date</th>
                    <th>Type</th>
                    <th>Sex</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {children.map((child) => (
                    <tr key={child.id}>
                      <td>
                        <strong>{getFullName(child)}</strong>
                        <div className="table-subtext">{child.remarques || 'No remarks'}</div>
                      </td>
                      <td>{child.code_unique || 'Pending'}</td>
                      <td>{formatDate(child.date_naissance)}</td>
                      <td>{child.type_enfant}</td>
                      <td>
                        <Badge tone={child.sexe === 'F' ? 'rose' : 'blue'}>{child.sexe}</Badge>
                      </td>
                      <td>
                        <div className="row-actions">
                          <Button type="button" variant="ghost" onClick={() => startEdit(child)}>
                            Edit
                          </Button>
                          <Button type="button" variant="danger" onClick={() => handleDelete(child)} disabled={saving}>
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No children found" description="Try changing the filters or create the first child record." />
          )}
        </Card>
      </div>

      <Card className="form-panel">
        <div className="card__header">
          <div>
            <p className="eyebrow">{editingId ? 'Edit child' : 'New child'}</p>
            <h2>{editingId ? 'Update the record' : 'Register a child'}</h2>
          </div>
          {editingId ? (
            <Button type="button" variant="secondary" onClick={resetForm}>
              Cancel
            </Button>
          ) : null}
        </div>

        <ErrorBanner message={error} />

        <form className="stack" onSubmit={handleSubmit}>
          <div className="grid-form grid-form--two">
            <Field label="Last name" required>
              <Input name="nom" value={form.nom} onChange={updateForm} required />
            </Field>
            <Field label="First name" required>
              <Input name="prenom" value={form.prenom} onChange={updateForm} required />
            </Field>
          </div>

          <div className="grid-form grid-form--two">
            <Field label="Date of birth" required>
              <Input type="date" name="date_naissance" value={form.date_naissance} onChange={updateForm} required />
            </Field>
            <Field label="Sex" required>
              <Select name="sexe" value={form.sexe} onChange={updateForm} required>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </Select>
            </Field>
          </div>

          <div className="grid-form grid-form--two">
            <Field label="Number of siblings">
              <Input type="number" min="0" name="nb_freres_soeurs" value={form.nb_freres_soeurs} onChange={updateForm} />
            </Field>
            <Field label="Type" required>
              <Select name="type_enfant" value={form.type_enfant} onChange={updateForm} required>
                <option value="Tps">Tps</option>
                <option value="Ps">Ps</option>
                <option value="Ms">Ms</option>
                <option value="Gsm">Gsm</option>
              </Select>
            </Field>
          </div>

          <Field label="Illnesses">
            <Textarea name="maladies" value={form.maladies} onChange={updateForm} rows="3" />
          </Field>

          <Field label="Remarks">
            <Textarea name="remarques" value={form.remarques} onChange={updateForm} rows="3" />
          </Field>

          <Field label="Generated code">
            <Input value={editingId ? children.find((child) => child.id === editingId)?.code_unique || '' : 'Will be generated automatically'} readOnly />
          </Field>

          <Button type="submit" className="button--full" disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Update child' : 'Create child'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
