import { NextResponse } from "next/server";
import { getGraphData } from "@/lib/brain";

export async function GET() {
  try {
    const data = await getGraphData();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
