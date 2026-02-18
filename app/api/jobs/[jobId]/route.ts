import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getAsyncJob, saveAsyncJob } from "@/lib/async-jobs";
import { importBankStatement } from "@/app/actions/bank";

export async function GET(_: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { jobId } = await params;
  const job = await getAsyncJob(jobId);
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  if (job.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (job.status === "queued" && job.type === "bank_import") {
    job.status = "processing";
    job.startedAt = new Date().toISOString();
    await saveAsyncJob(job);

    try {
      const result = await importBankStatement(job.payload.rows, job.payload.fileName, job.payload.idempotencyKey);
      if (!result.success) {
        throw new Error(result.error || "Import failed");
      }

      job.status = "completed";
      job.completedAt = new Date().toISOString();
      job.result = {
        totalRows: result.totalRows,
        importedIncome: result.importedIncome,
        importedExpense: result.importedExpense,
        duplicates: result.duplicates,
        skipped: result.skipped,
      };
    } catch (error) {
      job.status = "failed";
      job.completedAt = new Date().toISOString();
      job.error = error instanceof Error ? error.message : "Unknown error";
    }

    await saveAsyncJob(job);
  }

  return NextResponse.json({
    id: job.id,
    type: job.type,
    status: job.status,
    createdAt: job.createdAt,
    startedAt: job.startedAt || null,
    completedAt: job.completedAt || null,
    error: job.error || null,
    result: job.result || null,
  });
}
