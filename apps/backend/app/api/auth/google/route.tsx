import { google } from "googleapis";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { sign } from "jsonwebtoken";
import { ObjectId } from "mongodb";
import {
  connectMongoClient,
  disconnectMongoClient,
  mongodb,
} from "../../../../lib/db";
import type { DBUser } from "../../../graphql/types/User/model";
import { oauth2Client } from "./google-oauth";

const MAX_DEVICES = 2;
function errorResponse(redirectURL: string | null) {
  return NextResponse.redirect(
    redirectURL || process.env.NEXT_PUBLIC_FRONTEND_BASE_URL || "",
    {
      status: 500,
    },
  );
}
export const GET = async (req: NextRequest) => {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");
  const state = req.nextUrl.searchParams.get("state") || undefined;
  const redirectURL = req.nextUrl.searchParams.get("redirectURL");
  if (!code && !error) {
    const authorizationUrl = oauth2Client.generateAuthUrl({
      // 'online' (default) or 'offline' (gets refresh_token)
      access_type: "offline",
      // Enable incremental authorization. Recommended as a best practice.
      scope: ["https://www.googleapis.com/auth/userinfo.profile"],
      state,
      include_granted_scopes: true,
    });
    return NextResponse.redirect(authorizationUrl);
  } else if (error) {
    return errorResponse(redirectURL);
  } else if (code) {
    if (!process.env.REFRESH_KEY) return errorResponse(redirectURL);
    const { tokens } = await oauth2Client.getToken(code);

    oauth2Client.setCredentials(tokens);
    const res = await google
      .oauth2({
        auth: oauth2Client,
        version: "v2",
      })
      .userinfo.get();
    const user = res.data;
    if (user.email && tokens.refresh_token) {
      await connectMongoClient();
      const old = await mongodb()
        .collection<DBUser>("user")
        .findOne({ email: user.email });
      let refreshToken;
      if (old) {
        const refreshTokens = old.refreshTokens;
        if (refreshTokens.length === MAX_DEVICES) {
          refreshTokens.shift();
        }
        refreshToken = sign({ id: old._id }, process.env.REFRESH_KEY);
        refreshTokens.push(refreshToken);
        const scopes = old.scopes;
        if (!scopes.includes("google")) scopes.push("google");
        await mongodb().collection<DBUser>("user").updateOne(
          { email: user.email },
          {
            $set: {
              refreshTokens,
              scopes,
            },
          },
        );
      } else if (user.name) {
        const newDoc = await mongodb()
          .collection<DBUser>("user")
          .insertOne({
            email: user.email,
            name: user.name,
            refreshTokens: [],
            scopes: ["google"],
          });
        refreshToken = sign(
          { id: newDoc.insertedId.toString() },
          process.env.REFRESH_KEY,
        );
        await mongodb()
          .collection<DBUser>("user")
          .updateOne(
            { _id: new ObjectId(newDoc.insertedId) },
            { $push: { refreshTokens: refreshToken } },
          );
      }
      void disconnectMongoClient();
      return NextResponse.redirect(
        `${
          process.env.NEXT_PUBLIC_FRONTEND_BASE_URL
        }/api/auth/google?refresh=${refreshToken}&redirectURL=${
          redirectURL || ""
        }&state=${state}`,
      );
    }
  }
  return errorResponse(redirectURL);
};
