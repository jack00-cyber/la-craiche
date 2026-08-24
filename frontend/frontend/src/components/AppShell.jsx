import { useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Avatar, Button } from './ui'

const NAV_ITEMS = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Children', to: '/children' },
  { label: 'Parents', to: '/parents' },
  { label: 'Carnets', to: '/carnets' },
  { label: 'Payments', to: '/payments' },
]

function getTitle(pathname) {
  return NAV_ITEMS.find((item) => pathname.startsWith(item.to))?.label || 'Dashboard'
}

export default function AppShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const currentTitle = useMemo(() => getTitle(location.pathname), [location.pathname])

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  function handleNavigate() {
    setMenuOpen(false)
  }

  return (
    <div className={`shell ${menuOpen ? 'shell--menu-open' : ''}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand__mark">LC</div>
          <div>
            <p className="eyebrow">La Craiche</p>
            <h2>Care Manager</h2>
          </div>
        </div>

        <nav className="nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav__link ${isActive ? 'nav__link--active' : ''}`}
              onClick={handleNavigate}
            >
              <span className="nav__dot" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__user">
            <Avatar name={user?.username || 'La Craiche'} />
            <div>
              <strong>{user?.username || 'User'}</strong>
              <span>{user?.role || 'member'}</span>
            </div>
          </div>
          <Button variant="secondary" type="button" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </aside>

      <div className="shell__backdrop" onClick={() => setMenuOpen(false)} role="presentation" />

      <div className="content">
        <header className="topbar">
          <div className="topbar__title">
            <Button variant="ghost" type="button" className="topbar__menu-button" onClick={() => setMenuOpen((value) => !value)}>
              Menu
            </Button>
            <div>
              <p className="eyebrow">Childcare operations</p>
              <h1>{currentTitle}</h1>
            </div>
          </div>

          <div className="topbar__meta">
            <div className="topbar__profile">
              <Avatar name={user?.username || 'LC'} />
              <div>
                <strong>{user?.username || 'Account'}</strong>
                <span>{user?.role || 'role not set'}</span>
              </div>
            </div>
            <Button variant="secondary" type="button" onClick={handleLogout}>
              Log out
            </Button>
          </div>
        </header>

        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
