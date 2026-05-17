import { DashboardLastUpdated } from "@/components/dashboard/dashboard-last-updated";
import type { DashboardSignals } from "@/lib/domain/dashboard-signals";

type DashboardInsightsProps = {
  signals: DashboardSignals;
  /** Prominent title + subtitle (e.g. dashboard sidebar). */
  showCardHeader?: boolean;
};

export function DashboardInsights({ signals, showCardHeader }: DashboardInsightsProps) {
  const noSalesToday = signals.reminders.some((r) =>
    r.toLowerCase().includes("not recorded any sales today"),
  );
  const usualSellByNow = signals.reminders.some((r) =>
    r.toLowerCase().includes("usually sell by now"),
  );

  const doingBetter =
    signals.revenueDeltaPercent > 0 || signals.countDeltaPercent > 0;

  return (
    <div className="flex h-full min-h-0 flex-col rounded-2xl border border-black/10 bg-white p-5 shadow-sm shadow-black/[0.02]">
      {showCardHeader ? (
        <div className="flex flex-col gap-2 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Insights</h3>
            <p className="mt-0.5 text-xs text-gray-400">
              Highlights and alerts that need attention.
            </p>
          </div>
          <DashboardLastUpdated />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-xs font-medium text-neutral-400">Insights</p>
            <DashboardLastUpdated />
          </div>
          <h3 className="mt-1 text-base font-medium text-black">Quick takeaways</h3>
        </>
      )}

      <div className={showCardHeader ? "mt-0 flex flex-1 flex-col gap-3" : "mt-4 flex flex-1 flex-col gap-3"}>
        {noSalesToday ? (
          <div className="rounded-[10px] bg-rose-200 p-4">
            <p className="text-sm font-medium text-stone-950">No sales today</p>
            <p className="mt-1 text-xs font-medium text-neutral-600">
              You have not recorded any sales today. Log sales as they happen
              to keep your dashboard accurate.
            </p>
          </div>
        ) : null}

        {doingBetter ? (
          <div className="rounded-[10px] bg-green-400/90 p-4">
            <p className="text-sm font-medium text-stone-950">Momentum</p>
            <p className="mt-1 text-xs font-medium text-stone-900/90">
              You are doing better than last week in at least one metric. Keep
              the rhythm going.
            </p>
          </div>
        ) : null}

        {usualSellByNow ? (
          <div className="rounded-[10px] bg-lime-100 p-4">
            <p className="text-sm font-medium text-stone-950">Reminder</p>
            <p className="mt-1 text-xs font-medium text-neutral-600">
              You usually sell by now. Did you forget to log today&apos;s sales?
            </p>
          </div>
        ) : null}

        {signals.isLowActivityAlert ? (
          <div className="rounded-[10px] border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-stone-950">
              Low activity alert
            </p>
            <p className="mt-1 text-xs font-medium text-neutral-600">
              Sales dropped sharply compared to last week. Review your pipeline
              or promotions.
            </p>
          </div>
        ) : null}

        {!noSalesToday && !doingBetter && !usualSellByNow && !signals.isLowActivityAlert ? (
          <div className="rounded-[10px] border border-dashed border-stone-300 bg-white p-3 text-xs font-medium text-neutral-500">
            No urgent insights right now. Check back after more activity.
          </div>
        ) : null}
      </div>
    </div>
  );
}
