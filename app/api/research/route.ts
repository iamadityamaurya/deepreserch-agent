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
          sendEvent({
            type: "status",
            message: `Graph initialized: Starting multi-cycle research on "${topic}"...`,
          });

          let accumulatedToolOutputs: unknown[] = [];
          let accumulatedCalculations: unknown[] = [];
          let accumulatedNotes: string[] = [];
          let initialAnswer = "";
          let lastReport = "";
          let lastReasoning = "";
          let isEnough = false;

          const graphStream = await researchAgentGraph.stream(
            { topic },
            { streamMode: "updates" }
          );

          for await (const chunk of graphStream) {
            for (const [nodeName, nodeOutput] of Object.entries(chunk)) {
              sendEvent({
                type: "node_start",
                node: nodeName,
              });

              const out = nodeOutput as Record<string, any>;
              if (typeof out.initialAnswer === "string" && out.initialAnswer) {
                initialAnswer = out.initialAnswer;
              }
              if (typeof out.isEnough === "boolean") {
                isEnough = out.isEnough;
              }
              if (Array.isArray(out.toolOutputs)) {
                accumulatedToolOutputs = accumulatedToolOutputs.concat(out.toolOutputs);
              }
              if (Array.isArray(out.calculations)) {
                accumulatedCalculations = accumulatedCalculations.concat(out.calculations);
              }
              if (Array.isArray(out.notes)) {
                accumulatedNotes = accumulatedNotes.concat(out.notes);
              }
              if (typeof out.finalReport === "string" && out.finalReport) {
                lastReport = out.finalReport;
              }
              if (typeof out.planReasoning === "string" && out.planReasoning) {
                lastReasoning = out.planReasoning;
              }

              sendEvent({
                type: "progress",
                node: nodeName,
                statusMessage: out.statusMessage || `Completed ${nodeName}`,
                iterationCount: out.iterationCount,
                initialAnswer,
                isEnough,
                planReasoning: lastReasoning,
                notesCount: accumulatedNotes.length,
                calculationsCount: accumulatedCalculations.length,
                toolOutputsCount: accumulatedToolOutputs.length,
                toolOutputs: accumulatedToolOutputs,
                calculations: accumulatedCalculations,
                notes: accumulatedNotes,
                finalReport: lastReport,
              });
            }
          }

          sendEvent({
            type: "complete",
            statusMessage: "Multi-tool research completed successfully!",
            initialAnswer,
            isEnough,
            finalReport: lastReport,
            notes: accumulatedNotes,
            calculations: accumulatedCalculations,
            toolOutputs: accumulatedToolOutputs,
            planReasoning: lastReasoning,
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
