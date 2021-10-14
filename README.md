# Stargate Federation example

This is a small example demonstrating how Stargate GraphQL can be
federated with another service using Apollo Gateway:

```
                    +--------------------+
                    |  Federated schema  |
                    |  (Apollo Gateway)  |
                    +--------------------+
                              |
                 +------------+-----------+
                 |                        |
        +--------+---------+     +--------+---------+
        |  Catalog schema  |     |  Orders schema   |
        |    (Stargate)    |     |  (mock Node.js)  |
        +------------------+     +------------------+
```

## Building
```
npm install
```

## Creating the Stargate schema
Create a `catalog` keyspace.

To deploy the catalog schema, execute the following mutation on the
Stargate admin service (`<STARGATE_ROOT_URL>/graphql-admin`):

```graphql
mutation {
  deploySchema(
    keyspace: "catalog"
    schema: """
    type Product @key @cql_input {
      sku: String! @cql_column(partitionKey: true)
      name: String
      category: String @cql_index
    }
    type Mutation {
      insertProduct(product: ProductInput): Product
    }
    type Query {
      productsBySkus(
        skus: [String] @cql_where(field: "sku", predicate: IN)
      ): [Product]
      productsByCategory(
        category: String
      ): [Product]
    }
    """
  ) {
    version
  }
}
```

To insert sample data, execute the following mutations on the newly
created catalog service (`<STARGATE_ROOT_URL>/graphql/catalog`):

```graphql
mutation {
  p1: insertProduct(
    product: {
      name: "Mechanical keyboard"
      sku: "kbd123"
      category: "Electronics"
    }
  ) {
    sku
  }
  p2: insertProduct(
    product: {
      name: "Nintendo Switch"
      sku: "swtch42"
      category: "Electronics"
    }
  ) {
    sku
  }
  p3: insertProduct(
    product: { name: "Instant Pot", sku: "inst12", category: "Kitchen" }
  ) {
    sku
  }
}
```
## Running
Make sure Stargate is running.

Edit `gateway.js`, adapt `stargateRootUrl` if necessary, and update
`stargateIntrospectionToken` with a valid token.

Launch the two node services:
```
npm run start-orders
npm run start-gateway
```

## Querying
Access the federated GraphQL schema on the Gateway:
http://localhost:4000. You'll need to provide an `x-cassandra-token`
HTTP header for any request that involves Stargate (the Gateway will
forward it).

Access an order:
```graphql
{
  order(id: 1) {
    products {
      sku
      name
      category
    }
  }
}
```
The list of skus is fetched from the orders service. The name and
category of each product are fetched from Stargate.

