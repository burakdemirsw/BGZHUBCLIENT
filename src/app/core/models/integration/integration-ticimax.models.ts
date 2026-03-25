export interface ConnectTicimaxRequest {
  companyId: string;
  userId: string;
  integrationId: string;
  xmlUrl: string;
  webServisKodu: string;
  site: string;
}

export interface ConnectTicimaxResponse {
  integrationUserId: string;
  integrationConnectionId: string;
  webServisKoduPropertyId: string;
  alanAdiPropertyId: string;
}
