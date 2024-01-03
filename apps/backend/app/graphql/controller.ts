import type { NextRequest } from "next/server";
import { verify } from "jsonwebtoken";
import type { Context } from "./model";
import types from "./types";

const resolvers = types.reduce(
  (acc, type) => ({
    ...acc,
    [type.name]: type.GQLResolvers.type,
    Query: { ...acc.Query, ...type.GQLResolvers.query },
    Mutation: { ...acc.Mutation, ...type.GQLResolvers.mutation },
  }),
  { Query: {}, Mutation: {} },
);

export function context(req: NextRequest): Context {
  const bearer = req.headers.get("authorization");
  if (bearer && process.env.SIGNING_KEY) {
    const token = bearer.slice(7);
    try {
      const res = verify(token, process.env.SIGNING_KEY);
      return { userId: typeof res !== "string" ? (res.id as string) : null };
    } catch (e) {
      return { userId: null };
    }
  }
  return { userId: null };
}
export default resolvers;
