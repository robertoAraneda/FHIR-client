import axios, { type AxiosInstance } from 'axios';

interface FHIRserverParams {
  baseFhirUrl: string;
  accessToken: string;
}

interface FHIRserverUrl {
  mode: 'search' | 'read' | 'create';
  resourceType?: string;
  where?: any[];
}
class FHIRserver {
  private accessToken = '';
  private url: FHIRserverUrl = {} as FHIRserverUrl;
  private http: AxiosInstance;
  private baseFhirUrl: string;

  constructor({ baseFhirUrl, accessToken }: FHIRserverParams) {
    this.http = axios.create({
      baseURL: baseFhirUrl,
    });
    this.baseFhirUrl = baseFhirUrl;
  }

  asList = async () => {
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
        });
      }
    }

    const response = await this.http.get(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

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
      asList: this.asList,
      withParam: this.withParam,
    };
  };

  forResource = (resourceType: string) => {
    this.url = {
      ...this.url,
      resourceType,
    };

    if (this.url.mode === 'create') {
      return {
        body: this.body,
      };
    }
    return {
      withParam: this.withParam,
      asList: this.asList,
    };
  };

  body = (body: any) => {
    return body;
  };

  search = () => {
    this.url = {
      mode: 'search',
    };
    return {
      forResource: this.forResource,
    };
  };

  create = () => {
    this.url = {
      mode: 'create',
    };
    return {
      forResource: this.forResource,
    };
  };

  async getPatient(id: string) {
    const response = await fetch(`${this.baseFhirUrl}/Patient/${id}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });
    return await response.json();
  }
}

export = {
  FHIRserver,
};
