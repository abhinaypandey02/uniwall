import type { WithId } from "mongodb";
import { ObjectId } from "mongodb";
import { mongodb } from "../../../../lib/db";
import type { DBNote } from "../Note/model";
import type { DBWall } from "./model";

const QueryResolvers = {
  async getWall(_: null, args: { id?: string }): Promise<DBWall | null> {
    if (args.id) {
      return mongodb()
        .collection<DBWall>("wall")
        .findOne({ _id: new ObjectId(args.id) });
    }
    return null;
  },
  async getWalls(): Promise<DBWall[]> {
    return mongodb().collection<DBWall>("wall").find({}).toArray();
  },
};

const MutationResolvers = {
  async addWall(
    _: unknown,
    { collegeDomain }: { collegeDomain: string },
  ): Promise<string | null> {
    const newWall = await mongodb().collection<DBWall>("wall").insertOne({
      collegeDomain,
    });
    return newWall.insertedId.toString();
  },
};

const TypeResolvers = {
  notes(parent: WithId<DBWall>): Promise<DBNote[] | null> {
    return mongodb()
      .collection<DBNote>("note")
      .find({
        wallID: new ObjectId(parent._id),
      })
      .toArray();
  },
};

const GQLResolvers = {
  query: QueryResolvers,
  mutation: MutationResolvers,
  type: TypeResolvers,
};

export default GQLResolvers;
