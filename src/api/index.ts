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
import { Config } from '../common/config'
import { Tools } from '../codacy/Tools'

export const initializeApi = () => {
  // set up OpenAPI client
  OpenAPI.BASE = `${Config.baseUri}/api/v3`
  OpenAPI.HEADERS = async () => {
    const token = Config.apiToken

    return token
      ? {
          'api-token': token,
          'X-Codacy-Origin': 'vscode',
        }
      : undefined
  }

  // initialize static classes
  Tools.init()
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
