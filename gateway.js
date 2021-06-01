const { ApolloServer } = require("apollo-server");
const { ApolloGateway, RemoteGraphQLDataSource } = require("@apollo/gateway");

// The Stargate token that Apollo Gateway uses to fetch schema definitions.
// This is required for internal queries when Gateway starts up.
const schemaToken = '225d53b8-886e-4e90-9193-ffc10c93e85a';

class StargateGraphQLDataSource extends RemoteGraphQLDataSource {
  willSendRequest({ request, context }) {
    // TODO only use schemaToken for internal queries, users should always have
    // to provide their own token.
    const token = context.stargateToken || schemaToken;
    request.http.headers.set('x-cassandra-token', token);
  }
}

const gateway = new ApolloGateway({

  serviceList: [

    // Stargate:
    { name: "catalog", url: "http://127.0.0.2:8080/graphql/catalog"},

    // External service (mock):
    { name: "orders", url: "http://localhost:4001/graphql" }
  ],

  buildService({name, url}) {
    if (name == "catalog") {
      return new StargateGraphQLDataSource({url});
    } else {
      return new RemoteGraphQLDataSource({url});
    }
  },

  // Experimental: Enabling this enables the query plan view in Playground.
  __exposeQueryPlanExperimental: true,
});

(async () => {
  const server = new ApolloServer({
    gateway,

    // Apollo Graph Manager (previously known as Apollo Engine)
    // When enabled and an `ENGINE_API_KEY` is set in the environment,
    // provides metrics, schema management and trace reporting.
    engine: false,

    // Subscriptions are unsupported but planned for a future Gateway version.
    subscriptions: false,

    context: ({ req, res }) => {
      return {
        stargateToken: req.headers['x-cassandra-token']
      };
    }
  });

  server.listen().then(({ url }) => {
    console.log(`🚀 Gateway ready at ${url}`);
  });
})();

