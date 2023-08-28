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

export const initializeApi = () => {
  OpenAPI.BASE = `${Config.baseUri}/api/v3`

  if (Config.apiToken) {
    OpenAPI.HEADERS = {
      'api-token': Config.apiToken,
    }
  } else {
    OpenAPI.HEADERS = undefined
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
