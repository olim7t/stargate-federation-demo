const { ApolloServer, gql } = require("apollo-server");
const { buildFederatedSchema } = require("@apollo/federation");

const typeDefs = gql`

  # Stub of the product entity from Stargate:
  extend type Product @key(fields: "sku") {
    sku: String! @external
  }

  type Order {
    id: Int!
    products: [Product]
  }

  extend type Query {
    order(id: Int): Order
  }

  # This is a custom Stargate directive. Apollo Gateway requires that we
  # redeclare it here.
  directive @atomic on MUTATION
`;

const resolvers = {
  Query: {
    order(_, args) {
      return orders.find(order => order.id == args.id);
    }
  }
};

const server = new ApolloServer({
  schema: buildFederatedSchema([
    {
      typeDefs,
      resolvers
    }
  ])
});

server.listen({ port: 4001 }).then(({ url }) => {
  console.log(`🚀 Orders service ready at ${url}`);
});

const orders = [
  { id: 1, products: [ {sku: "kbd123"}, {sku: "inst12"} ] },
  { id: 2, products: [ {sku: "kbd123"}, {sku: "swtch42"} ] }
];

