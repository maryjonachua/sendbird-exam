import { pool } from "@/lib/db";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(req) {
  try {
    const { userId, nickname, profileUrl } = await req.json();

    const randomId = uuidv4().split("-")[0];
    const finalUserId = userId || "user_" + randomId;
    const finalNickname = nickname || "Guest_" + randomId;
    const finalProfileUrl = profileUrl || "";

    const check = await pool.query("SELECT 1 FROM users WHERE user_id = $1 LIMIT 1", [finalUserId]);

    if (check.rowCount > 0) {
      return NextResponse.json(
        { success: false, message: "User already exists in database" },
        { status: 409 }
      );
    }

    const res = await fetch(`https://api-${process.env.NEXT_PUBLIC_APP_ID}.sendbird.com/v3/users`, {
      method: "POST",
      headers: {
        "Api-Token": process.env.NEXT_PUBLIC_MASTER_API_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: finalUserId,
        nickname: nickname || genericNickname,
        profile_url: finalProfileUrl,
        issue_access_token: true,
      }),
    });
    if (!res.ok) {
      const errorJson = await res.json().catch(async () => {
        return { message: await res.text() };
      });

      if (errorJson.code === 400202) {
        console.log("User already exists in Sendbird, proceeding to insert into Database");
        await pool.query(
          `INSERT INTO users (user_id, nickname, profile_url)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id) DO NOTHING`,
          [finalUserId, finalNickname, finalProfileUrl]
        );
        return new Response(
          JSON.stringify({
            success: true,
            message: "User already exists in Sendbird, added to Database",
            user: { finalUserId, finalNickname, finalProfileUrl },
          }),
          { status: 200 }
        );
      }

      throw new Error(
        `Sendbird API error: ${res.status} - Error: ${errorJson.code} ${errorJson.message}`
      );
    }

    const sendbirdUser = await res.json();
    console.log("Created Sendbird user:", sendbirdUser);

    await pool.query(
      `INSERT INTO users (user_id, nickname, profile_url)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO NOTHING`,
      [sendbirdUser.user_id, sendbirdUser.nickname, sendbirdUser.profile_url]
    );

    return new Response(JSON.stringify({ success: true, user: sendbirdUser }), {
      status: 200,
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
    });
  }
}
