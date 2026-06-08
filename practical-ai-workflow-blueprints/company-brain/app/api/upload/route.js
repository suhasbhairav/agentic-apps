import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files");

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status:400 });
    }

    const uploadDir = path.join(process.cwd(), "data", "raw");
    
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const filePath = path.join(uploadDir, file.name);
      await fs.writeFile(filePath, buffer);
    }

    return NextResponse.json({ message: `${files.length} files uploaded successfully` });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
