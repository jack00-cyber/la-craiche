import { Link } from 'react-router-dom'
import { Button, Card } from '../components/ui'

export default function NotFoundPage() {
  return (
    <div className="center-screen">
      <Card className="not-found-card">
        <p className="eyebrow">404</p>
        <h1>Page not found</h1>
        <p>The route you requested does not exist.</p>
        <Button as={Link} to="/dashboard">
          Go to dashboard
        </Button>
      </Card>
    </div>
  )
}
