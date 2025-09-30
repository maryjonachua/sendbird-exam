import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { userId, nickname, profileUrl } = await req.json();

    if (!userId) {
      return NextResponse.json({ success: false, message: "userId is required" }, { status: 400 });
    }

    const result = await pool.query(
      `UPDATE users
       SET nickname = $2,
           profile_url = $3,
           updated_at = NOW()
       WHERE user_id = $1
       RETURNING *`,
      [userId, nickname, profileUrl]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: result.rows[0],
    });
  } catch (err) {
    // console.error("Update error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
