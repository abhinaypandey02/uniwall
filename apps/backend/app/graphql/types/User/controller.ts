import { ObjectId } from "mongodb";
import { mongodb } from "../../../../lib/db";
import type { DBUser } from "./model";

const QueryResolvers = {
  async user(
    _: null,
    args: { id?: string },
    { userId }: { userId: string },
  ): Promise<DBUser | null> {
    if (args.id) {
      return mongodb()
        .collection<DBUser>("user")
        .findOne({ _id: new ObjectId(args.id) });
    }
    if (userId) {
      return mongodb()
        .collection<DBUser>("user")
        .findOne({ _id: new ObjectId(userId) });
    }
    return null;
  },
  async users(): Promise<DBUser[]> {
    return mongodb().collection<DBUser>("user").find({}).toArray();
  },
};

const MutationResolvers = {
  updateUser(_: unknown, { user }: { user: DBUser }): Promise<DBUser | null> {
    return mongodb()
      .collection<DBUser>("user")
      .findOneAndUpdate(
        { email: user.email },
        { $set: user },
        { returnDocument: "after" },
      );
  },
};

const TypeResolvers = {};

const GQLResolvers = {
  query: QueryResolvers,
  mutation: MutationResolvers,
  type: TypeResolvers,
};

export default GQLResolvers;
