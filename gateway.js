const { ApolloServer } = require("apollo-server");
const { ApolloGateway, RemoteGraphQLDataSource } = require("@apollo/gateway");

const stargateRootUrl = "http://127.0.0.2:8080"

// The Stargate token that Apollo Gateway will use when it fetches the orders
// schema definition from Stargate.
const stargateIntrospectionToken = '<YOUR_STARGATE_TOKEN>';

// Forward the auth token when Apollo Gateway executes federated queries that
// involve Stargate.
//
// This example is set up so that users have to provide the token as a header
// when they query Apollo Gateway.
//
// Alternatively, you could choose to also hard-code the token here, in which
// case the Gateway would not require authentication.
class StargateGraphQLDataSource extends RemoteGraphQLDataSource {
  willSendRequest({ request, context }) {

    // We configure ApolloServer to extract the header and store it here, see
    // line 70.
    const token = context.stargateToken

    if (token != null) {
      request.http.headers.set('x-cassandra-token', token);
    }
  }
}

const gateway = new ApolloGateway({

  serviceList: [

    // Stargate:
    { name: "catalog", url: stargateRootUrl + "/graphql/catalog"},

    // External service (mock):
    { name: "orders", url: "http://localhost:4001/graphql" }
  ],

  introspectionHeaders: {
    'x-cassandra-token': stargateIntrospectionToken
  },

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

