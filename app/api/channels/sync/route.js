import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

const APP_ID = process.env.NEXT_PUBLIC_APP_ID;
const MASTER_API_TOKEN = process.env.NEXT_PUBLIC_MASTER_API_TOKEN;

export async function POST(req) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ success: false, message: "userId is required" }, { status: 400 });
    }
    // fetch channels from Sendbird
    const res = await fetch(
      `https://api-${APP_ID}.sendbird.com/v3/users/${userId}/my_group_channels`,
      {
        method: "GET",
        headers: {
          "Api-Token": MASTER_API_TOKEN,
          "Content-Type": "application/json",
        },
      }
    );
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Sendbird API error: ${res.status} - ${errorText}`);
    }
    const data = await res.json();
    const channels = data.channels || [];

    for (const ch of channels) {
      // check if channel exists in database
      //   const { rows } = await pool.query("SELECT 1 FROM channels WHERE channel_url = $1 LIMIT 1", [
      //     ch.channel_url,
      //   ]);

      //   if (rows.length > 0) {
      //     console.log("Channel already exists:", ch.channel_url);
      //     return NextResponse.json(
      //       { success: false, message: "Channel already exists in database" },
      //       { status: 409 }
      //     );
      //   }
      if (ch.member_count === 2) {
        const creator = ch.creator?.user_id || userId;

        // Get members list
        const membersRes = await fetch(
          `https://api-${APP_ID}.sendbird.com/v3/group_channels/${ch.channel_url}/members`,
          { headers: { "Api-Token": MASTER_API_TOKEN } }
        );
        const { members } = await membersRes.json();
        let chatmate = members.find((m) => m.user_id !== creator).user_id;

        // Get message count
        const countRes = await fetch(
          `https://api-${APP_ID}.sendbird.com/v3/group_channels/${ch.channel_url}/messages/total_count`,
          { headers: { "Api-Token": MASTER_API_TOKEN } }
        );
        const { total } = await countRes.json();

        // check if channel is deleted in Sendbird
        if (ch.channel_url) {
          const channelStatusRep = await fetch(
            `https://api-${APP_ID}.sendbird.com/v3/group_channels/${ch.channel_url}`,
            { headers: { "Api-Token": MASTER_API_TOKEN } }
          );

          // isChannelExist
          let isDeleted = false;

          if (!channelStatusRep.ok) {
            const errorJson = await channelStatusRep.json().catch(async () => {
              return { message: await res.text() };
            });

            if (errorJson.code === 400201) {
              console.log(errorJson.message);
              isDeleted = true;

              //   const channelStatus = true;
              //   await pool.query(
              //     `INSERT INTO channels
              //  (channel_url, created_by, chatmate_id, is_deleted, message_count, created_at, updated_at)
              //  VALUES ($1, $2, $3, $4, $5, to_timestamp($6 / 1000.0), NOW())
              //   ON CONFLICT (channel_url) DO NOTHING`,
              //     [ch.channel_url, creator, chatmate, channelStatus, total, ch.created_at]
              //   );
            }
          }
          await pool.query(
            `INSERT INTO channels
             (channel_url, created_by, chatmate_id, is_deleted, message_count, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, to_timestamp($6 / 1000.0), NOW())
           ON CONFLICT (channel_url) DO UPDATE
             SET chatmate_id   = EXCLUDED.chatmate_id,
                 is_deleted    = EXCLUDED.is_deleted,
                 message_count = EXCLUDED.message_count,
                 updated_at    = NOW()`,
            [ch.channel_url, creator, chatmate, isDeleted, total, ch.created_at]
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Channel retrived and inserted in Database successfully",
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
    });
  }
}
