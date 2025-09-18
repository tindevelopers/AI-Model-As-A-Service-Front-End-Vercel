import { Metadata } from 'next'
import ApiManagementDashboard from '@/components/admin/api-management-dashboard'

export const metadata: Metadata = {
  title: 'API Management | AI-as-a-Service',
  description: 'Manage API providers, keys, and assignments for the AI-as-a-Service platform',
}

export default function ApiManagementPage() {
  return (
    <div className="container mx-auto py-6">
      <ApiManagementDashboard />
    </div>
  )
}
