import GQLResolvers from "./controller";
import GQLSchema from "./model";

const name = "User";

const User = {
    name,
    GQLSchema,
    GQLResolvers,
};

export default User;
