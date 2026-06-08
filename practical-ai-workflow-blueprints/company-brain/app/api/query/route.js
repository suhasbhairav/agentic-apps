import { NextResponse } from "next/server";
import { queryBrain } from "@/lib/brain";

export async function POST(request) {
  try {
    const { query } = await request.json();
    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const response = await queryBrain(query);
    return NextResponse.json({ response });
  } catch (error) {
    console.error("Query error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
