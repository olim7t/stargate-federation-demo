# Stargate Federation example

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
Create a `catalog` keyspace and deploy the following schema:
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

Insert sample data (referenced by the mock orders service):
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

Update `stargateIntrospectionToken` in `gateway.js` with a valid token.

Launch the two node services:
```
npm run start-orders
npm run start-gateway
```

