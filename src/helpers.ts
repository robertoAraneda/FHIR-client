import axios, { type AxiosInstance } from 'axios';

export interface FHIRserverUrl {
  mode: 'search' | 'read' | 'create' | 'operation';
  resourceType?: string;
  resourceId?: number;
  operation?: string;
  subjectId?: number;
  where?: any[];
}

export interface FHIRserverParams {
  baseFhirUrl: string;
  accessToken: string;
}

export class Helpers {
  private url: FHIRserverUrl;
  private baseFhirUrl: string;
  private accessToken: string;
  private http: AxiosInstance;

  constructor({ baseFhirUrl, accessToken }: FHIRserverParams) {
    this.accessToken = accessToken;
    this.baseFhirUrl = baseFhirUrl;
    this.url = {} as FHIRserverUrl;
    this.http = axios.create({
      baseURL: baseFhirUrl,
    });
  }

  setUrl = (url: FHIRserverUrl) => {
    this.url = {
      ...this.url,
      ...url,
    };
  };

  resourceId = (resourceId: number) => {
    this.url = {
      ...this.url,
      resourceId,
    };

    return {
      getQuery: this.getQuery,
      execute: this.execute,
    };
  };

  withId = (resourceId: number) => {
    this.url = {
      ...this.url,
      resourceId,
    };

    return {
      getQuery: this.getQuery,
      execute: this.execute,
    };
  };

  execute = async () => {
    let url = '';
    let urls = await this.getQuery();

    if (urls.length > 1) {
      url = urls[url.length - 1];
    } else {
      url = urls[0];
    }

    let response = null;
    try {
      response = await this.http.get(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });
    } catch (error: any) {
      if (error.response.status === 404) {
        return error.response.data;
      }
      throw new Error(error);
    }

    if (this.url.mode === 'operation' || this.url.mode === 'read') {
      return response.data;
    }

    if (response.data.total) {
      return response.data.entry.map((e: any) => e.resource);
    } else {
      return [];
    }
  };

  withParam = (key: string, system: string, value: string) => {
    if (!this.url.where) {
      this.url = {
        ...this.url,
        where: [],
      };
    }

    if (value === undefined) {
      value = system;
      this.url = {
        ...this.url,
        where: [...this.url.where!, { key, value }],
      };
    } else {
      this.url = {
        ...this.url,
        where: [...this.url.where!, { key, system, value }],
      };
    }

    return {
      execute: this.execute,
      withParam: this.withParam,
      getQuery: this.getQuery,
    };
  };

  getQuery = async () => {
    const multipleUrl: string[] = [];
    let url = '';
    if (this.url.mode === 'search') {
      url = `${this.baseFhirUrl}/${this.url.resourceType}?`;
      if (this.url.where) {
        this.url.where.forEach((w, index) => {
          let query = '';

          if (w.system) {
            query = `${w.key}=${w.system}%7C${w.value}`;
          } else {
            query = `${w.key}=${w.value}`;
          }

          if (index === this.url.where!.length - 1) {
            url = `${url}${query}`;
          } else {
            url = `${url}${query}&`;
          }
          multipleUrl.push(url);
        });
      }
    } else if (this.url.mode === 'operation') {
      if (this.url.operation === '$document' && this.url.subjectId) {
        url = `${this.baseFhirUrl}/Composition?subject=Patient/${this.url.subjectId}`;
        multipleUrl.push(url);

        const res = await this.http.get(url, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        });

        multipleUrl.push(`${this.baseFhirUrl}/Composition/${res.data.entry[0].resource.id}/${this.url.operation}`);
      } else {
        url = `${this.baseFhirUrl}/Composition/${this.url.resourceId}/${this.url.operation}`;
        multipleUrl.push(url);
      }
    } else if (this.url.mode === 'read') {
      url = `${this.baseFhirUrl}/${this.url.resourceType}/${this.url.resourceId}`;
      multipleUrl.push(url);
    }

    return multipleUrl;
  };

  forResourceCreate = (resourceType: string) => {
    this.url = {
      ...this.url,
      resourceType,
    };

    return {
      body: this.body,
    };
  };

  forResourceRead = (resourceType: string) => {
    this.url = {
      ...this.url,
      resourceType,
    };

    return {
      getQuery: this.getQuery,
      withId: this.withId,
    };
  };

  forResourceDefault = (resourceType: string) => {
    this.url = {
      ...this.url,
      resourceType,
    };

    return {
      getQuery: this.getQuery,
      withParam: this.withParam,
      execute: this.execute,
    };
  };

  body = (body: any) => {
    return body;
  };

  forSubject = (subjectId: number) => {
    this.url = {
      ...this.url,
      subjectId,
    };

    return {
      getQuery: this.getQuery,
      execute: this.execute,
    };
  };
}
