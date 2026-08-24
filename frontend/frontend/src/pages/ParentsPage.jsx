import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  addChildToParent,
  createParent,
  deleteParent,
  listChildren,
  listParents,
  removeChildFromParent,
  updateParent,
} from '../api/endpoints'
import { Button, Card, ErrorBanner, EmptyState, Field, Input, Loader, Select, Textarea, Badge } from '../components/ui'
import { getErrorMessage } from '../utils/errors'
import { omitEmptyValues, normalizeNumberInput } from '../utils/forms'
import { formatAmount, getFullName } from '../utils/formatters'

const emptyForm = {
  nom: '',
  prenom: '',
  email: '',
  telephone: '',
  credit: 0,
  address: '',
  profession: '',
}

const initialFilters = {
  nom: '',
  prenom: '',
}

export default function ParentsPage() {
  const [parents, setParents] = useState([])
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [filters, setFilters] = useState(initialFilters)
  const [appliedFilters, setAppliedFilters] = useState(initialFilters)
  const [linkParentId, setLinkParentId] = useState('')
  const [linkChildId, setLinkChildId] = useState('')

  const loadData = useCallback(async (filterValues = appliedFilters) => {
    setLoading(true)
    setError('')

    try {
      const [parentData, childData] = await Promise.all([
        listParents(omitEmptyValues(filterValues)),
        listChildren(),
      ])

      setParents(parentData)
      setChildren(childData)

      if (parentData.length) {
        setLinkParentId((current) => current || String(parentData[0].id))
      }

      if (childData.length) {
        setLinkChildId((current) => current || String(childData[0].id))
      }
    } catch (fetchError) {
      setError(getErrorMessage(fetchError))
    } finally {
      setLoading(false)
    }
  }, [appliedFilters])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData(appliedFilters)
  }, [appliedFilters, loadData])

  function handleFilterChange(event) {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
  }

  function applyFilters(event) {
    event.preventDefault()
    setAppliedFilters(filters)
  }

  function updateForm(event) {
    const { name, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: name === 'credit' ? normalizeNumberInput(value) : value,
    }))
  }

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm)
  }

  function startEdit(parent) {
    setEditingId(parent.id)
    setForm({
      nom: parent.nom || '',
      prenom: parent.prenom || '',
      email: parent.email || '',
      telephone: parent.telephone || '',
      credit: parent.credit ?? 0,
      address: parent.address || '',
      profession: parent.profession || '',
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      ...form,
      credit: Number(form.credit) || 0,
    }

    try {
      if (editingId) {
        await updateParent(editingId, payload)
      } else {
        await createParent(payload)
      }

      resetForm()
      await loadData()
    } catch (submitError) {
      setError(getErrorMessage(submitError))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(parent) {
    if (!window.confirm(`Delete ${getFullName(parent)}?`)) {
      return
    }

    setSaving(true)
    setError('')

    try {
      await deleteParent(parent.id)
      if (editingId === parent.id) {
        resetForm()
      }
      await loadData()
    } catch (deleteError) {
      setError(getErrorMessage(deleteError))
    } finally {
      setSaving(false)
    }
  }

  async function handleAddChild(parentId, childId) {
    if (!parentId || !childId) {
      return
    }

    setSaving(true)
    setError('')

    try {
      await addChildToParent(parentId, childId)
      await loadData()
    } catch (relationshipError) {
      setError(getErrorMessage(relationshipError))
    } finally {
      setSaving(false)
    }
  }

  async function handleRemoveChild(parentId, childId) {
    setSaving(true)
    setError('')

    try {
      await removeChildFromParent(parentId, childId)
      await loadData()
    } catch (relationshipError) {
      setError(getErrorMessage(relationshipError))
    } finally {
      setSaving(false)
    }
  }

  const linkedParentCount = useMemo(
    () => parents.filter((parent) => (parent.enfants || []).length > 0).length,
    [parents],
  )

  return (
    <div className="page-grid page-grid--split">
      <div className="stack">
        <Card>
          <div className="card__header">
            <div>
              <p className="eyebrow">Parent-child relationships</p>
              <h2>Attach children to the right family</h2>
            </div>
          </div>

          <div className="grid-form grid-form--three">
            <Field label="Parent">
              <Select value={linkParentId} onChange={(event) => setLinkParentId(event.target.value)}>
                <option value="">Choose a parent</option>
                {parents.map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    {getFullName(parent)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Child">
              <Select value={linkChildId} onChange={(event) => setLinkChildId(event.target.value)}>
                <option value="">Choose a child</option>
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {getFullName(child)}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid-form__actions grid-form__actions--stacked">
              <Button type="button" onClick={() => handleAddChild(linkParentId, linkChildId)} disabled={saving}>
                Add child
              </Button>
              <Button type="button" variant="secondary" onClick={() => handleRemoveChild(linkParentId, linkChildId)} disabled={saving}>
                Remove child
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <div className="card__header">
            <div>
              <p className="eyebrow">Filter parents</p>
              <h2>{parents.length} parent records</h2>
            </div>
          </div>

          <form className="grid-form grid-form--filters" onSubmit={applyFilters}>
            <Field label="Last name">
              <Input name="nom" value={filters.nom} onChange={handleFilterChange} placeholder="Search last name" />
            </Field>
            <Field label="First name">
              <Input name="prenom" value={filters.prenom} onChange={handleFilterChange} placeholder="Search first name" />
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
              <p className="eyebrow">Family directory</p>
              <h2>{linkedParentCount} linked families</h2>
            </div>
          </div>

          {loading ? (
            <Loader label="Loading parents..." />
          ) : parents.length ? (
            <div className="stack">
              {parents.map((parent) => (
                <article className="family-card" key={parent.id}>
                  <div className="family-card__top">
                    <div>
                      <h3>{getFullName(parent)}</h3>
                      <p>
                        {parent.email} · {parent.telephone}
                      </p>
                    </div>
                    <div className="family-card__meta">
                      <Badge tone="neutral">Credit {formatAmount(parent.credit)}</Badge>
                      <Badge tone="sage">{(parent.enfants || []).length} children</Badge>
                    </div>
                  </div>

                  <div className="family-card__grid">
                    <div>
                      <span className="family-card__label">Address</span>
                      <p>{parent.address || 'No address provided'}</p>
                    </div>
                    <div>
                      <span className="family-card__label">Profession</span>
                      <p>{parent.profession || 'Not set'}</p>
                    </div>
                  </div>

                  <div className="chips-row">
                    {(parent.enfants || []).length ? (
                      parent.enfants.map((child) => (
                        <span className="chip chip--interactive" key={child.id}>
                          {getFullName(child)}
                          <button type="button" onClick={() => handleRemoveChild(parent.id, child.id)} aria-label={`Remove ${getFullName(child)}`}>
                            ×
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="muted-text">No linked children yet</span>
                    )}
                  </div>

                  <div className="row-actions">
                    <Button type="button" variant="ghost" onClick={() => startEdit(parent)}>
                      Edit
                    </Button>
                    <Button type="button" variant="danger" onClick={() => handleDelete(parent)} disabled={saving}>
                      Delete
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="No parents found" description="Create the first parent account from the form on the right." />
          )}
        </Card>
      </div>

      <Card className="form-panel">
        <div className="card__header">
          <div>
            <p className="eyebrow">{editingId ? 'Edit parent' : 'New parent'}</p>
            <h2>{editingId ? 'Update family information' : 'Register a parent'}</h2>
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

          <Field label="Email" required>
            <Input type="email" name="email" value={form.email} onChange={updateForm} required />
          </Field>

          <div className="grid-form grid-form--two">
            <Field label="Phone" required>
              <Input name="telephone" value={form.telephone} onChange={updateForm} required />
            </Field>
            <Field label="Credit">
              <Input type="number" step="0.01" min="0" name="credit" value={form.credit} onChange={updateForm} />
            </Field>
          </div>

          <Field label="Address">
            <Textarea name="address" value={form.address} onChange={updateForm} rows="3" />
          </Field>

          <Field label="Profession">
            <Input name="profession" value={form.profession} onChange={updateForm} />
          </Field>

          <Button type="submit" className="button--full" disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Update parent' : 'Create parent'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
