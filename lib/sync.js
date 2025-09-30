export async function handleProfileEdit(updatedUser) {
  console.log("Profile updated in Sendbird:", updatedUser);

  try {
    const res = await fetch("/api/users/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: updatedUser.userId,
        nickname: updatedUser.nickname,
        profileUrl: updatedUser.profileUrl,
      }),
    });
    const data = await res.json();
    // console.log("Synced profile to DB:", data);
  } catch (err) {
    console.error("Failed to sync profile:", err);
  }
}
