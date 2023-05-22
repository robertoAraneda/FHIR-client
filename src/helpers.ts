import axios, { type AxiosInstance } from 'axios';

interface FHIRserverUrl {
  mode: 'search' | 'read' | 'create' | 'operation';
  resourceType?: string;
  resourceId?: number;
  operation?: string;
  subjectId?: number;
  where?: any[];
}

export class Helpers {
  static url: FHIRserverUrl;
  static baseFhirUrl: string;
  static accessToken: string;
  static http: any = axios.create({
    baseURL: Helpers.baseFhirUrl,
  });

  static resourceId = (resourceId: number) => {
    Helpers.url = {
      ...Helpers.url,
      resourceId,
    };

    return {
      execute: Helpers.execute,
    };
  };

  static execute = async () => {
    let url = '';
    if (Helpers.url.mode === 'search') {
      url = `${Helpers.baseFhirUrl}/${Helpers.url.resourceType}?`;
      if (Helpers.url.where) {
        Helpers.url.where.forEach((w, index) => {
          let query = '';

          if (w.system) {
            query = `${w.key}=${w.system}%7C${w.value}`;
          } else {
            query = `${w.key}=${w.value}`;
          }

          if (index === Helpers.url.where!.length - 1) {
            url = `${url}${query}`;
          } else {
            url = `${url}${query}&`;
          }
        });
      }
    } else if (Helpers.url.mode === 'operation') {
      if (Helpers.url.operation === '$document' && Helpers.url.subjectId) {
        url = `${Helpers.baseFhirUrl}/Composition?subject=Patient/${Helpers.url.subjectId}`;

        const response = await Helpers.http.get(url, {
          headers: {
            Authorization: `Bearer ${Helpers.accessToken}`,
          },
        });

        if (response.data.total > 1) {
          throw new Error('Multiple compositions found for this patient');
        } else if (response.data.total === 0) {
          throw new Error('No composition found for this patient');
        }

        url = `${Helpers.baseFhirUrl}/Composition/${response.data.entry[0].resource.id}/${Helpers.url.operation}`;
      } else {
        url = `${Helpers.baseFhirUrl}/Composition/${Helpers.url.resourceId}/${Helpers.url.operation}`;
      }
    }
    const response = await Helpers.http.get(url, {
      headers: {
        Authorization: `Bearer ${Helpers.accessToken}`,
      },
    });

    if (Helpers.url.mode === 'operation') {
      return response.data;
    }

    if (response.data.total) {
      return response.data.entry.map((e: any) => e.resource);
    } else {
      return [];
    }
  };

  static withParam = (key: string, system: string, value: string) => {
    if (!Helpers.url.where) {
      Helpers.url = {
        ...Helpers.url,
        where: [],
      };
    }

    if (value === undefined) {
      value = system;
      Helpers.url = {
        ...Helpers.url,
        where: [...Helpers.url.where!, { key, value }],
      };
    } else {
      Helpers.url = {
        ...Helpers.url,
        where: [...Helpers.url.where!, { key, system, value }],
      };
    }

    return {
      execute: Helpers.execute,
      withParam: Helpers.withParam,
    };
  };

  static forResource = (resourceType: string) => {
    Helpers.url = {
      ...Helpers.url,
      resourceType,
    };

    if (Helpers.url.mode === 'create') {
      return {
        body: Helpers.body,
      };
    }
    return {
      withParam: Helpers.withParam,
      execute: Helpers.execute,
    };
  };

  static body = (body: any) => {
    return body;
  };

  static forSubject = (subjectId: number) => {
    Helpers.url = {
      ...Helpers.url,
      subjectId,
    };

    return {
      execute: Helpers.execute,
    };
  };
}
