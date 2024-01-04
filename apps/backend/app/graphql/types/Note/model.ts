import type { ObjectId } from "mongodb";

const GraphqlQuery = `
  
`;
const GraphqlMutation = `
  addNote( wallID:ID!, content:String!, to:String ):ID
  deleteNote( id:ID! ):Boolean!
`;
const GraphqlType = `
  #graphql
  "Note type"
  type Note {
    _id:ID!
    content:String!
    createdAt:String!
    to:String
    wall: Wall
  }
`;
export interface DBNote {
  wallID: ObjectId;
  content: string;
  to?: string;
  createdAt: string;
  // id and createdAt automatically
}

const GQLSchema = {
  query: GraphqlQuery,
  mutation: GraphqlMutation,
  type: GraphqlType,
};
export default GQLSchema;
