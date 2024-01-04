const GraphqlQuery = `
  getWalls: [Wall!]
  getWall(id:ID!):Wall
`;
const GraphqlMutation = `
  addWall(collegeDomain:String!):ID
`;
const GraphqlType = `
  #graphql
  "Wall type"
  type Wall {
    _id:ID!
    collegeDomain:String!
    name:String
    notes:[Note!]
  }
`;
export interface DBWall {
  collegeDomain: string;
  name?: string;
}

const GQLSchema = {
  query: GraphqlQuery,
  mutation: GraphqlMutation,
  type: GraphqlType,
};
export default GQLSchema;
