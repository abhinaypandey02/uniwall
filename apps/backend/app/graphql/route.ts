import type { NextRequest } from "next/server";
import { ApolloServer } from "@apollo/server";
import {
  ApolloServerPluginLandingPageLocalDefault,
  ApolloServerPluginLandingPageProductionDefault,
} from "@apollo/server/plugin/landingPage/default";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { connectMongoClient, disconnectMongoClient } from "../../lib/db";
import resolvers, { context } from "./controller";
import typeDefs from "./model";
// or as an es module:
// import { MongoClient } from 'mongodb'

// Connection URL
const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [
    process.env.NEXT_PUBLIC_DEVELOPMENT
      ? ApolloServerPluginLandingPageLocalDefault()
      : ApolloServerPluginLandingPageProductionDefault(),
  ],
  introspection: true,
});
const handler = startServerAndCreateNextHandler(server, {
  context,
});

export async function GET(request: NextRequest) {
  await connectMongoClient();
  const res = await handler(request);
  void disconnectMongoClient();
  return res;
}

export async function POST(request: NextRequest) {
  await connectMongoClient();
  const res = await handler(request);
  void disconnectMongoClient();
  return res;
}
