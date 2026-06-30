import { NextResponse } from "next/server";
import { getZone, getZoneLabel, COURIERS } from "@/lib/shipping";

type Params = Promise<{ pin: string }>;

// First-2-digit prefix → Indian state
const PREFIX_TO_STATE: Record<string, string> = {
  "11": "Delhi",
  "12": "Haryana", "13": "Haryana",
  "14": "Punjab", "15": "Punjab", "16": "Punjab",
  "17": "Himachal Pradesh",
  "18": "Jammu and Kashmir", "19": "Jammu and Kashmir",
  "20": "Uttar Pradesh", "21": "Uttar Pradesh", "22": "Uttar Pradesh",
  "23": "Uttar Pradesh", "24": "Uttar Pradesh", "25": "Uttar Pradesh",
  "26": "Uttar Pradesh", "27": "Uttar Pradesh", "28": "Uttar Pradesh",
  "29": "Uttar Pradesh",
  "30": "Rajasthan", "31": "Rajasthan", "32": "Rajasthan",
  "33": "Rajasthan", "34": "Rajasthan",
  "36": "Gujarat", "37": "Gujarat", "38": "Gujarat", "39": "Gujarat",
  "40": "Maharashtra", "41": "Maharashtra", "42": "Maharashtra",
  "43": "Maharashtra", "44": "Maharashtra",
  "45": "Madhya Pradesh", "46": "Madhya Pradesh", "47": "Madhya Pradesh",
  "48": "Madhya Pradesh", "49": "Chhattisgarh",
  "50": "Telangana", "51": "Telangana",
  "52": "Andhra Pradesh", "53": "Andhra Pradesh",
  "54": "Karnataka", "55": "Karnataka", "56": "Karnataka",
  "57": "Karnataka", "58": "Karnataka", "59": "Karnataka",
  "60": "Tamil Nadu", "61": "Tamil Nadu", "62": "Tamil Nadu",
  "63": "Tamil Nadu", "64": "Tamil Nadu",
  "65": "Tamil Nadu", "66": "Tamil Nadu",
  "67": "Kerala", "68": "Kerala", "69": "Kerala",
  "70": "West Bengal", "71": "West Bengal", "72": "West Bengal",
  "73": "West Bengal", "74": "West Bengal",
  "75": "Odisha", "76": "Odisha", "77": "Odisha",
  "78": "Assam",
  "79": "Assam",
  "80": "Bihar", "81": "Bihar", "82": "Bihar",
  "83": "Bihar", "84": "Bihar", "85": "Jharkhand",
  "86": "Jharkhand", "87": "Jharkhand",
};

export async function GET(_req: Request, { params }: { params: Params }) {
  const { pin } = await params;

  if (!/^\d{6}$/.test(pin)) {
    return NextResponse.json({ serviceable: false, message: "Invalid pincode" }, { status: 400 });
  }

  const prefix = pin.slice(0, 2);
  const state = PREFIX_TO_STATE[prefix];

  if (!state) {
    return NextResponse.json({ serviceable: false, message: "Pincode not recognised" });
  }

  const zone = getZone(state);
  const zoneLabel = getZoneLabel(zone);
  const etaDays = zone === "local" ? "2–4 days" : zone === "regional" ? "3–5 days" : "5–8 days";

  const couriers = COURIERS.map(c => ({ name: c.name, etaDays: c.etaDays }));

  return NextResponse.json({
    serviceable: true,
    state,
    zone,
    zoneLabel,
    etaDays,
    couriers,
  });
}
