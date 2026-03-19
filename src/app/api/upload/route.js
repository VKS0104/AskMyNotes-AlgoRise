import { NextResponse } from "next/server";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { addDocuments } from "@/lib/vectorStore";
import { createClient } from "@/utils/supabase/server";
import pdf from "pdf-parse";

export const maxDuration = 60;

export async function POST(request) {
    try {
        // Auth gate
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const userId = user.id;
        const formData = await request.formData();
        const file = formData.get("file");
        const subject = formData.get("subject");

        if (!file || !subject) {
            return NextResponse.json(
                { error: "Missing required fields: file, subject" },
                { status: 400 }
            );
        }

        const fileName = file.name;
        let text = "";

        if (fileName.endsWith(".pdf")) {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const pdfData = await pdf(buffer);
            text = pdfData.text;
        } else {
            text = await file.text();
        }

        if (!text.trim()) {
            return NextResponse.json(
                { error: "Could not extract any text from the file" },
                { status: 400 }
            );
        }

        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 500,
            chunkOverlap: 50,
        });

        const rawChunks = await splitter.splitText(text);

        const documents = rawChunks.map(
            (chunk, index) =>
                new Document({
                    pageContent: chunk,
                    metadata: {
                        subject,
                        userId,
                        fileName,
                        chunkId: `${fileName}_chunk_${index}`,
                    },
                })
        );

        await addDocuments(documents);

        return NextResponse.json({
            success: true,
            message: `Uploaded ${documents.length} chunks for "${fileName}" under "${subject}"`,
            chunksCount: documents.length,
        });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: `Upload failed: ${error.message}` },
            { status: 500 }
        );
    }
}
