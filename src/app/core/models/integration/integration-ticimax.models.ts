export interface ConnectTicimaxRequest {
  companyId: string;
  userId: string;
  integrationId: string;
  xmlUrl: string;
  webServisKodu: string;
  site: string;
  kargoFirmaId?: number;
}

export interface ConnectTicimaxResponse {
  integrationUserId: string;
  integrationConnectionId: string;
  webServisKoduPropertyId: string;
  alanAdiPropertyId: string;
}

export interface UpdateTicimaxRequest {
  companyId: string;
  userId: string;
  integrationId: string;
  integrationUserId: string;
  kargoId: string;
  xmlUrl: string;
  webServisKodu: string;
  site: string;
}

export interface TicimaxShipmentDto {
  kargoFirmaId: number;
  kargoFirmaTanim: string;
}
