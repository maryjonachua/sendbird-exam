"use client";

import React, { useState, useEffect, use } from "react";
import { v4 as uuidv4 } from "uuid";
import dynamic from "next/dynamic";
import SendBird from "sendbird";

import "@sendbird/uikit-react/dist/index.css";
import { handleProfileEdit } from "@/lib/sync";

const SendbirdApp = dynamic(() => import("@sendbird/uikit-react/App").then((mod) => mod.default), {
  ssr: false,
});

export default function SendbirdWrapper() {
  const [sdk, setSdk] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  // console.log("Current User:", currentUser);

  // connected User
  useEffect(() => {
    const sb = new SendBird({ appId: process.env.NEXT_PUBLIC_APP_ID });
    sb.connect(process.env.NEXT_PUBLIC_USER_ID, process.env.NEXT_PUBLIC_USER_TOKEN, (user, err) => {
      if (!err) {
        setSdk(sb);
        setCurrentUser(user);
        // console.log("Connected user:", user);
      } else {
        console.error(err);
      }
    });
  }, []);

  // auto create user and sync channels first load
  useEffect(() => {
    if (!currentUser) return;

    const randomId = uuidv4().split("-")[0];
    const userID = "user_" + randomId;
    const autoNickname = "Guest_" + randomId;

    const syncUserAndChannels = async () => {
      try {
        const userRes = await fetch("/api/users/auto-create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Api-Token": process.env.NEXT_PUBLIC_MASTER_API_TOKEN,
          },
          body: JSON.stringify({
            userId: currentUser.userId || userID,
            nickname: currentUser?.nickname || autoNickname,
            profileUrl: currentUser.profileUrl || "",
          }),
        });
        const userData = await userRes.json();
        // console.log("User:", userData);

        const channelRes = await fetch("/api/channels/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUser.userId }),
        });
        const channelData = await channelRes.json();
        // console.log("Synced channels:", channelData);
      } catch (err) {
        console.error(" Error:", err);
      }
    };

    syncUserAndChannels();
  }, [currentUser]);

  // every user created new channel syncing
  useEffect(() => {
    if (!sdk || !currentUser) return;

    const handler = new sdk.ChannelHandler();

    handler.onChannelChanged = async (channel) => {
      // console.log("New channel created", channel.url);

      const channelResyncRes = await fetch("/api/channels/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.userId }),
      });
      const channelReyncData = await channelResyncRes.json();
      // console.log("New channel Response:", channelReyncData);
    };

    sdk.addChannelHandler("SYNC_HANDLER", handler);

    return () => {
      sdk.removeChannelHandler("SYNC_HANDLER");
    };
  }, [sdk, currentUser]);

  return (
    <div style={{ height: "100vh" }}>
      <SendbirdApp
        appId={process.env.NEXT_PUBLIC_APP_ID}
        userId={process.env.NEXT_PUBLIC_USER_ID}
        accessToken={process.env.NEXT_PUBLIC_USER_TOKEN}
        allowProfileEdit={true}
        onProfileEditSuccess={handleProfileEdit}
      />
    </div>
  );
}
