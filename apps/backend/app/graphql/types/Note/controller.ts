import { ObjectId } from "mongodb";
import { mongodb } from "../../../../lib/db";
import type { DBWall } from "../Wall/model";
import type { DBNote } from "./model";

const QueryResolvers = {};

const MutationResolvers = {
  async addNote(
    _: unknown,
    { wallID, content, to }: { wallID: string; content: string; to?: string },
  ): Promise<string | null> {
    const newNote = await mongodb()
      .collection<DBNote>("note")
      .insertOne({
        content,
        to,
        wallID: new ObjectId(wallID),
        createdAt: new Date().toISOString(),
      });
    return newNote.insertedId.toString();
  },
  async deleteNote(_: unknown, { id }: { id: string }): Promise<boolean> {
    const newNote = await mongodb()
      .collection<DBNote>("note")
      .deleteOne({
        _id: new ObjectId(id),
      });
    return newNote.acknowledged;
  },
};

const TypeResolvers = {
  async wall(parent: DBNote): Promise<DBWall | null> {
    return mongodb()
      .collection<DBWall>("wall")
      .findOne({
        _id: new ObjectId(parent.wallID),
      });
  },
};

const GQLResolvers = {
  query: QueryResolvers,
  mutation: MutationResolvers,
  type: TypeResolvers,
};

export default GQLResolvers;
