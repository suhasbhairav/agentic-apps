import { NextResponse } from "next/server";
import { ingestFiles } from "@/lib/brain";

export async function POST() {
  try {
    const count = await ingestFiles();
    return NextResponse.json({ message: `Successfully ingested ${count} documents into SB Brain` });
  } catch (error) {
    console.error("Ingestion error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
