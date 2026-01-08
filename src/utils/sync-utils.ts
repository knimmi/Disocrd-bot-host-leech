import axios from "axios";
import fs from "fs";
import path from "path";

const PC_BASIC =
  "M2Y2OWU1NmM3NjQ5NDkyYzhjYzI5ZjFhZjA4YThhMTI6YjUxZWU5Y2IxMjIzNGY1MGE2OWVmYTY3ZWY1MzgxMmU=";
const USER_AGENT =
  "Fortnite/++Fortnite+Release-14.00-CL-32116959 Windows/10.0.22621.1.768.64bit";

export async function forceSyncMissions() {
  const dailyMissionsPath = path.join(
    process.cwd(),
    "src",
    "daily_missions.json"
  );
  const resetPath = path.join(process.cwd(), "src", "last_reset.json");
  const credsPath = path.join(process.cwd(), "src", "credentials.json");

  try {
    const { accountId, deviceId, secret } = JSON.parse(
      fs.readFileSync(credsPath, "utf8")
    );

    // Authentication
    const authRes = await axios.post(
      "https://account-public-service-prod.ol.epicgames.com/account/api/oauth/token",
      new URLSearchParams({
        grant_type: "device_auth",
        account_id: accountId,
        device_id: deviceId,
        secret,
      }).toString(),
      {
        headers: {
          "User-Agent": USER_AGENT,
          Authorization: `basic ${PC_BASIC}`,
        },
      }
    );

    // Fetch World Data
    const worldRes = await axios.get(
      "https://fortnite-public-service-prod11.ol.epicgames.com/fortnite/api/game/v2/world/info",
      {
        headers: {
          "User-Agent": USER_AGENT,
          Authorization: `Bearer ${authRes.data.access_token}`,
        },
      }
    );

    // Save Data
    fs.writeFileSync(dailyMissionsPath, JSON.stringify(worldRes.data, null, 2));
    fs.writeFileSync(
      resetPath,
      JSON.stringify({ lastRunTimestamp: Date.now() }, null, 2)
    );

    return { success: true };
  } catch (error: any) {
    console.error("Manual Sync Error:", error.message);
    return { success: false, error: error.message };
  }
}
