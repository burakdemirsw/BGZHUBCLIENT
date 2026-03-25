import { Integration } from './integration.models';
import { IntegrationProperty } from './integration-property.models';

export interface IntegrationUserSummary {
  id: string;
  photoUrl?: string;
  integrationDescription?: string;
}

export interface CompanyIntegrationsResponse {
  integrations: Integration[];
  integrationUsers: IntegrationUserSummary[];
  integrationProperties: IntegrationProperty[];
}
