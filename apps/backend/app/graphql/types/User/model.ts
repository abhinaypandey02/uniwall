const GraphqlQuery = `
  "[Authenticated] Get a user by email"
  user(id:String):User
  "[Admin] Get all users"
  users:[User!]
  
`;
const GraphqlMutation = `
  "[Authenticated] Update user details"
  updateUser(user:UpdateUserInput!): User
`;
const GraphqlType = `
  #graphql
  "Arguments to update user"
  input UpdateUserInput{
    email:String
    name:String
  }
  "User type"
  type User {
    _id:ID!
    name:String!
    email:String!
    refreshTokens:[String!]
  }
`;
export interface DBUser {
  name: string;
  email: string;
  password?: string;
  refreshTokens: string[];
  scopes: ("google" | "email")[];
}

const GQLSchema = {
  query: GraphqlQuery,
  mutation: GraphqlMutation,
  type: GraphqlType,
};
export default GQLSchema;
