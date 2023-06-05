import { FHIRserverParams, FHIRserverUrl, Helpers } from './helpers';

class FHIRserver {
  private helpers: Helpers;

  constructor({ baseFhirUrl, accessToken }: FHIRserverParams) {
    // if (!accessToken) throw new Error('No access token provided');
    if (!baseFhirUrl) throw new Error('No base FHIR url provided');

    this.helpers = new Helpers({ baseFhirUrl, accessToken });
  }

  search = () => {
    this.helpers.setUrl({ mode: 'search' });

    return {
      forResource: this.helpers.forResourceDefault,
    };
  };

  read = () => {
    this.helpers.setUrl({ mode: 'read' });

    return {
      forResource: this.helpers.forResourceRead,
    };
  };

  create = () => {
    this.helpers.setUrl({ mode: 'create' });
    return {
      forResource: this.helpers.forResourceCreate,
    };
  };

  operation = (operation: string) => {
    this.helpers.setUrl({ mode: 'operation', operation });

    return {
      resourceId: this.helpers.resourceId,
      forSubject: this.helpers.forSubject,
    };
  };
}

export = {
  FHIRserver,
};
