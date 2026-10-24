import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { buttonStyles } from '../components/ui/buttonStyles'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'

export function NotFoundPage() {
  return (
    <Card>
      <EmptyState
        headingLevel={1}
        icon={Compass}
        title="Page not found"
        description="Error 404. The page you are looking for doesn't exist or has been moved."
        action={
          <Link to="/" className={buttonStyles()}>
            Back to dashboard
          </Link>
        }
      />
    </Card>
  )
}