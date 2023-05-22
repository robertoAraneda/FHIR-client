import { Helpers } from './helpers';

interface FHIRserverParams {
  baseFhirUrl: string;
  accessToken: string;
}

class FHIRserver {
  constructor({ baseFhirUrl, accessToken }: FHIRserverParams) {
    if (!accessToken) throw new Error('No access token provided');
    if (!baseFhirUrl) throw new Error('No base FHIR url provided');

    Helpers.accessToken = accessToken;
    Helpers.baseFhirUrl = baseFhirUrl;
  }

  search = () => {
    Helpers.url = {
      mode: 'search',
    };
    return {
      forResource: Helpers.forResource,
    };
  };

  create = () => {
    Helpers.url = {
      mode: 'create',
    };
    return {
      forResource: Helpers.forResource,
    };
  };

  operation = (operation: string) => {
    Helpers.url = {
      ...Helpers.url,
      mode: 'operation',
      operation,
    };

    return {
      resourceId: Helpers.resourceId,
      forSubject: Helpers.forSubject,
    };
  };
}

const FHIR = new FHIRserver({
  baseFhirUrl: 'https://r4.smarthealthit.org',
  accessToken: 'access',
});

export = {
  FHIRserver,
};
