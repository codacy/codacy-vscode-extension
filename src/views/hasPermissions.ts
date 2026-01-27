import { Permission } from '../api/client'
import { Api } from '../api'

export const hasPermission = async (
  provider: string,
  organization: string,
  allowedByDefault: Permission,
  repositoryPermission?: Permission
) => {
  const { data: organizationData } = await Api.Organization.getOrganization(provider, organization)
  const minimumPermission = organizationData.analysisConfigurationMinimumPermission

  if (!minimumPermission) return false

  switch (repositoryPermission) {
    case 'read':
      return minimumPermission === 'read' || allowedByDefault === 'read'
    case 'write': {
      const writePermissions = ['read', 'write']
      return writePermissions.includes(minimumPermission) || writePermissions.includes(allowedByDefault)
    }
    case 'admin': {
      const adminPermissions = ['read', 'write', 'admin']
      return adminPermissions.includes(minimumPermission) || adminPermissions.includes(allowedByDefault)
    }
    default:
      return false
  }
}
