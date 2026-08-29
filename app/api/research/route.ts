import { NextRequest, NextResponse } from "next/server";
import { researchAgentGraph } from "@/lib/agent/graph";
import { z } from "zod";

const RequestSchema = z.object({
  topic: z
    .string()
    .min(2, "Topic must be at least 2 characters long")
    .max(500, "Topic must be under 500 characters"),
});

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = RequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { topic } = parseResult.data;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          sendEvent({ type: "status", message: `Starting multi-tool research agent on "${topic}"...` });

          const eventStream = await researchAgentGraph.streamEvents(
            { topic },
            { version: "v2" }
          );

          for await (const event of eventStream) {
            // Stream node state updates
            if (event.event === "on_chain_end" && event.name === "LangGraph") {
              const stateOutput = event.data?.output;
              if (stateOutput) {
                sendEvent({
                  type: "progress",
                  statusMessage: stateOutput.statusMessage,
                  iterationCount: stateOutput.iterationCount,
                  notesCount: stateOutput.notes?.length || 0,
                  calculationsCount: stateOutput.calculations?.length || 0,
                  toolOutputsCount: stateOutput.toolOutputs?.length || 0,
                  finalReport: stateOutput.finalReport || "",
                });
              }
            } else if (event.event === "on_chain_start") {
              if (event.name) {
                sendEvent({
                  type: "node_start",
                  node: event.name,
                });
              }
            }
          }

          // Final snapshot read
          const finalState = await researchAgentGraph.invoke({ topic });
          sendEvent({
            type: "complete",
            statusMessage: "Multi-tool research completed successfully!",
            finalReport: finalState.finalReport,
            notes: finalState.notes,
            calculations: finalState.calculations,
            toolOutputs: finalState.toolOutputs,
          });
        } catch (error: unknown) {
          console.error("Agent execution stream error:", error);
          const errMessage = error instanceof Error ? error.message : "An unexpected error occurred";
          sendEvent({ type: "error", message: errMessage });
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err: unknown) {
    console.error("Research API route error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
