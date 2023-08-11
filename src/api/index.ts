import * as vscode from 'vscode'
import {
  AccountService,
  AdminService,
  AnalysisService,
  BillingService,
  CodingStandardsService,
  ConfigurationService,
  CoverageService,
  FileService,
  GatePoliciesService,
  HealthService,
  IntegrationsService,
  LanguagesService,
  OpenAPI,
  OrganizationService,
  PeopleService,
  ReportsService,
  RepositoryService,
  SecurityService,
  ToolsService,
  VersionService,
} from './client'

export const initializeApi = () => {
  OpenAPI.HEADERS = async () => {
    const wsConfig = vscode.workspace.getConfiguration('codacy')
    const token = wsConfig.get<string>('apiToken')

    return token
      ? {
          'api-token': token,
        }
      : undefined
  }
}

export class Api {
  static Account = AccountService
  static Admin = AdminService
  static Analysis = AnalysisService
  static Billing = BillingService
  static CodingStandards = CodingStandardsService
  static Configuration = ConfigurationService
  static Coverage = CoverageService
  static File = FileService
  static GatePolicies = GatePoliciesService
  static Health = HealthService
  static Integrations = IntegrationsService
  static Languages = LanguagesService
  static Organization = OrganizationService
  static People = PeopleService
  static Reports = ReportsService
  static Repository = RepositoryService
  static Security = SecurityService
  static Tools = ToolsService
  static Version = VersionService
}
