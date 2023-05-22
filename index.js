const axios = require("axios");

class FHIRserver {
  accessToken = "";
  url = null;
  http = null;
  constructor({ baseFhirUrl, baseAuthUrl, clientId, clientSecret, scope }) {
    this.http = axios.create({
      baseURL: this.baseFhirUrl,
    });
    this.baseFhirUrl = baseFhirUrl;
    this.baseAuthUrl = baseAuthUrl;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.scope = scope;
  }

  getUrl = () => {
    return this.url;
  };

  getAccessToken = () => {
    return this.accessToken;
  };

  asList = async () => {
    let url = "";
    if (this.url.mode === "search") {
      url = `${this.baseFhirUrl}/${this.url.resourceType}?`;
      if (this.url.where) {
        this.url.where.forEach((w, index) => {
          console.log(index, w);

          let query = "";

          if (w.system) {
            query = `${w.key}=${w.system}%7C${w.value}`;
          } else {
            query = `${w.key}=${w.value}`;
          }

          if (index === this.url.where.length - 1) {
            url = `${url}${query}`;
          } else {
            url = `${url}${query}&`;
          }
        });
      }
    } else if (this.url.mode === "read") {
      url = `${this.baseFhirUrl}/${this.url.resourceType}/${this.url.id}`;
    }

    //get access token by client id and secret
    const res = await this.http.post(
      `${this.baseAuthUrl}/oauth2/token`,
      {
        grant_type: "client_credentials",
        scope: this.scope,
      },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            `${this.clientId}:${this.clientSecret}`
          ).toString("base64")}`,
        },
      }
    );

    this.accessToken = res.data.access_token;

    const response = await this.http.get(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (response.data.total) {
      return response.data.entry.map((e) => e.resource);
    } else {
      return [];
    }
  };

  withParam = (key, system, value) => {
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
        where: [...this.url.where, { key, value }],
      };
    } else {
      this.url = {
        ...this.url,
        where: [...this.url.where, { key, system, value }],
      };
    }

    return {
      asList: this.asList,
      withParam: this.withParam,
    };
  };

  forResource = (resourceType) => {
    this.url = {
      ...this.url,
      resourceType,
    };

    if (this.url.mode === "create") {
      return {
        body: this.body,
      };
    }
    return {
      withParam: this.withParam,
      asList: this.asList,
    };
  };

  body = (body) => {
    console.log(body);
    return "create";
  };

  search = () => {
    this.url = {
      mode: "search",
    };
    return {
      forResource: this.forResource,
    };
  };

  create = () => {
    this.url = {
      mode: "create",
    };
    return {
      forResource: this.forResource,
    };
  };

  async getPatient(id) {
    const response = await fetch(`${this.baseFhirUrl}/Patient/${id}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });
    return await response.json();
  }
}

module.exports = {
  FHIRserver,
};

/*
(async () => {
  const FHIR = new FHIRserver();

  const patient = await FHIR.search()
    .forResource("Patient")
    .withParam("name", "Donald")
    .withParam("identifier", "http://acme.org/mrns", "2216120")
    .asList();

  const createPatient = FHIR.create()
    .forResource("Patient")
    .body({
      resourceType: "Patient",
      name: [
        {
          use: "official",
          family: "Chalmers",
          given: ["Peter", "James"],
        },
      ],
    });

  console.log(patient);
  console.log(createPatient);
})();
*/
