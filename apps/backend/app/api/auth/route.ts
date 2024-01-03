import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { compare, hash } from "bcrypt";
import { sign, verify } from "jsonwebtoken";
import { ObjectId } from "mongodb";
import type { DBUser } from "../../graphql/types/User/model";
import {
  connectMongoClient,
  disconnectMongoClient,
  mongodb,
} from "../../../lib/db";
import { generateAccessToken } from "../../../lib/auth";

const MAX_DEVICES = 2;
export const PUT = async (req: Request) => {
  const user = (await req.json()) as { email?: string; password?: string };
  if (!user.email || !user.password) {
    return new NextResponse("Email and password are required", {
      status: 400,
    });
  }
  if (!process.env.REFRESH_KEY) {
    return new NextResponse("REFRESH_KEY not in server", {
      status: 500,
    });
  }
  await connectMongoClient();
  const old = await mongodb()
    .collection<DBUser>("user")
    .findOne({ email: user.email });
  if (!old)
    return new NextResponse("Wrong credentials", {
      status: 403,
    });
  const pwd = old.password;
  if (pwd && (await compare(user.password, pwd))) {
    const refreshToken = sign({ id: old._id }, process.env.REFRESH_KEY);

    const tokens = old.refreshTokens;
    if (tokens.length === MAX_DEVICES) {
      tokens.shift();
    }
    tokens.push(refreshToken);
    const scopes = old.scopes;
    if (!scopes.includes("email")) scopes.push("email");
    await mongodb()
      .collection<DBUser>("user")
      .updateOne(
        { email: user.email },
        {
          $set: {
            refreshTokens: tokens,
            scopes,
          },
        },
      );
    void disconnectMongoClient();
    const response = new NextResponse(
      generateAccessToken({ id: old._id.toString() }),
      {
        status: 202,
      },
    );
    response.cookies.set("refresh", refreshToken, {
      secure: true,
      httpOnly: true,
    });
    return response;
  }
  return new NextResponse("Wrong credentials", {
    status: 403,
  });
};
export const POST = async (req: Request) => {
  const user = (await req.json()) as {
    email: string;
    password: string;
    name: string;
  };
  if (!user.email || !user.password || !user.name) {
    return new NextResponse("Email password and name are required", {
      status: 400,
    });
  }
  if (!process.env.REFRESH_KEY) {
    return new NextResponse("REFRESH_KEY not in server", {
      status: 500,
    });
  }
  await connectMongoClient();
  const old = await mongodb()
    .collection<DBUser>("user")
    .findOne({ email: user.email });
  if (old)
    return new NextResponse("Already exists", {
      status: 400,
    });
  const encrypted = await hash(user.password, 10);
  const newUser = await mongodb()
    .collection<DBUser>("user")
    .insertOne({
      ...user,
      refreshTokens: [],
      scopes: ["email"],
      password: encrypted,
    });
  const refreshToken = sign(
    { id: newUser.insertedId },
    process.env.REFRESH_KEY,
  );
  await mongodb()
    .collection<DBUser>("user")
    .updateOne(
      { _id: new ObjectId(newUser.insertedId) },
      { $push: { refreshTokens: refreshToken } },
    );
  void disconnectMongoClient();
  const response = new NextResponse(
    generateAccessToken({ id: newUser.insertedId.toString() }),
    {
      status: 201,
    },
  );
  response.cookies.set("refresh", refreshToken, {
    secure: true,
    httpOnly: true,
  });
  return response;
};
export const GET = async () => {
  const refresh = cookies().get("refresh")?.value;
  if (!process.env.REFRESH_KEY) {
    return new NextResponse("REFRESH_KEY not in server", {
      status: 500,
    });
  }
  if (refresh) {
    let payload = null;
    try {
      const decoded = verify(refresh, process.env.REFRESH_KEY);
      if (typeof decoded !== "string") payload = decoded as { id: string };
    } catch (e) {
      payload = null;
    }
    if (payload) {
      await connectMongoClient();
      const old = await mongodb()
        .collection<DBUser>("user")
        .findOne({ _id: new ObjectId(payload.id) });
      void disconnectMongoClient();
      if (old?.refreshTokens.includes(refresh)) {
        return new NextResponse(generateAccessToken({ id: payload.id }), {
          status: 200,
        });
      }
    }
  }

  return new NextResponse(null, {
    status: 200,
  });
};

export const DELETE = () => {
  const res = new NextResponse(null, {
    status: 200,
  });
  res.cookies.set("refresh", "", {
    expires: 0,
    secure: true,
    httpOnly: true,
  });
  return res;
};
