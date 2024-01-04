import GQLResolvers from "./controller";
import GQLSchema from "./model";

const name = "Note";

const Note = {
  name,
  GQLSchema,
  GQLResolvers,
};

export default Note;
