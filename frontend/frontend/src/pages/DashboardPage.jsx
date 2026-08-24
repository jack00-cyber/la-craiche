import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCarnetDetail, listCarnets, listChildren, listParents } from '../api/endpoints'
import { ErrorBanner, Loader, StatCard, Card, Badge, Button, EmptyState } from '../components/ui'
import { getErrorMessage } from '../utils/errors'
import { formatAmount, formatDate, getFullName } from '../utils/formatters'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [overview, setOverview] = useState({
    children: [],
    parents: [],
    carnets: [],
    payments: [],
  })

  useEffect(() => {
    let cancelled = false

    async function loadDashboard() {
      setLoading(true)
      setError('')

      try {
        const [children, parents, carnets] = await Promise.all([
          listChildren(),
          listParents(),
          listCarnets(),
        ])

        const carnetDetails = await Promise.all(
          carnets.map(async (carnet) => ({
            carnet,
            detail: await getCarnetDetail(carnet.id),
          })),
        )

        const payments = carnetDetails.flatMap(({ carnet, detail }) =>
          (detail?.paiements || []).map((payment) => ({
            ...payment,
            carnet,
            parentId: detail?.parent,
          })),
        )

        if (!cancelled) {
          setOverview({ children, parents, carnets, payments })
        }
      } catch (dashboardError) {
        if (!cancelled) {
          setError(getErrorMessage(dashboardError))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadDashboard()

    return () => {
      cancelled = true
    }
  }, [])

  const totalChildren = overview.children.length
  const totalParents = overview.parents.length
  const totalCarnets = overview.carnets.length
  const paidPayments = overview.payments.filter((payment) => payment.status === 'paid').length
  const unpaidPayments = overview.payments.filter((payment) => payment.status === 'unpaid').length
  const totalCredit = overview.parents.reduce((sum, parent) => sum + Number(parent.credit || 0), 0)

  if (loading) {
    return (
      <div className="section-state">
        <Loader label="Loading your center overview..." />
      </div>
    )
  }

  return (
    <div className="dashboard">
      <ErrorBanner message={error} />

      <section className="hero-panel">
        <div>
          <p className="eyebrow">Center snapshot</p>
          <h2>One place to keep families, children, and payments in sync.</h2>
          <p>
            Everything on this screen comes from the live Django API. No mock data, no placeholders.
          </p>
        </div>
        <div className="hero-panel__actions">
          <Button as={Link} to="/children" variant="secondary">
            Manage children
          </Button>
          <Button as={Link} to="/parents" variant="secondary">
            Manage parents
          </Button>
          <Button as={Link} to="/carnets" variant="primary">
            Open carnets
          </Button>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard label="Children" value={totalChildren} detail="Registered children" tone="peach" />
        <StatCard label="Parents" value={totalParents} detail="Family accounts" tone="sage" />
        <StatCard label="Carnets" value={totalCarnets} detail="Active yearly booklets" tone="sand" />
        <StatCard label="Payments" value={overview.payments.length} detail={`${paidPayments} paid · ${unpaidPayments} unpaid`} tone="sky" />
        <StatCard label="Credit total" value={formatAmount(totalCredit)} detail="Outstanding parent credit" tone="amber" />
      </section>

      <section className="dashboard-grid">
        <Card>
          <div className="card__header">
            <div>
              <p className="eyebrow">Recent children</p>
              <h3>Latest registrations</h3>
            </div>
            <Button as={Link} to="/children" variant="ghost">
              Open list
            </Button>
          </div>

          {overview.children.length ? (
            <div className="mini-list">
              {overview.children.slice(0, 5).map((child) => (
                <div className="mini-row" key={child.id}>
                  <div>
                    <strong>{getFullName(child)}</strong>
                    <span>
                      {child.type_enfant} · {child.code_unique || 'Pending code'}
                    </span>
                  </div>
                  <Badge tone={child.sexe === 'F' ? 'rose' : 'blue'}>{child.sexe}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No children yet" description="Add the first child from the Children page." />
          )}
        </Card>

        <Card>
          <div className="card__header">
            <div>
              <p className="eyebrow">Parents</p>
              <h3>Family accounts</h3>
            </div>
            <Button as={Link} to="/parents" variant="ghost">
              Open list
            </Button>
          </div>

          {overview.parents.length ? (
            <div className="mini-list">
              {overview.parents.slice(0, 5).map((parent) => (
                <div className="mini-row" key={parent.id}>
                  <div>
                    <strong>{getFullName(parent)}</strong>
                    <span>{parent.email}</span>
                  </div>
                  <Badge tone="neutral">{(parent.enfants || []).length} children</Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No parents yet" description="Create parent records before assigning children." />
          )}
        </Card>

        <Card>
          <div className="card__header">
            <div>
              <p className="eyebrow">Payments</p>
              <h3>Payment rhythm</h3>
            </div>
            <Button as={Link} to="/payments" variant="ghost">
              Open list
            </Button>
          </div>

          {overview.payments.length ? (
            <div className="mini-list">
              {overview.payments.slice(0, 6).map((payment) => (
                <div className="mini-row" key={payment.id}>
                  <div>
                    <strong>
                      Carnet {payment.carnet?.id} · Tranche {payment.numero_tranche}
                    </strong>
                    <span>{formatDate(payment.date_paiement)}</span>
                  </div>
                  <div className="mini-row__meta">
                    <span>{formatAmount(payment.montant)}</span>
                    <Badge tone={payment.status === 'paid' ? 'success' : 'warning'}>{payment.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No payments yet" description="Create a carnet to automatically generate payment entries." />
          )}
        </Card>
      </section>

      <section className="dashboard-footer">
        <Card className="callout-card">
          <p className="eyebrow">Quick facts</p>
          <h3>Live status</h3>
          <div className="callout-grid">
            <div>
              <strong>{overview.payments.length}</strong>
              <span>Total payment rows</span>
            </div>
            <div>
              <strong>{paidPayments}</strong>
              <span>Paid entries</span>
            </div>
            <div>
              <strong>{unpaidPayments}</strong>
              <span>Pending entries</span>
            </div>
            <div>
              <strong>{overview.parents.filter((parent) => (parent.enfants || []).length > 0).length}</strong>
              <span>Parents linked to children</span>
            </div>
          </div>
        </Card>
      </section>
    </div>
  )
}
