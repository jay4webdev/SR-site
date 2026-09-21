import Link from "next/link";
import BookingsTable from "@/components/dashboard/BookingsTable";
import { PageHeader, StatusPill } from "@/components/dashboard/ui";
import {
  getBookingsGroupedByStatus,
  getDashboardStats,
  getRecentBookings,
} from "@/lib/queries";
import type { BookingStatus } from "@/db/schema";

export const dynamic = "force-dynamic";

const STATUS_ORDER: BookingStatus[] = [
  "NEW",
  "CONTACTED",
  "CONFIRMED",
  "COMPLETED",
  "DECLINED",
];

export default async function OverviewPage() {
  const [stats, recent, grouped] = await Promise.all([
    getDashboardStats(),
    getRecentBookings(7),
    getBookingsGroupedByStatus(),
  ]);

  const cards = [
    { label: "Total Requests", value: stats.totalBookings },
    { label: "New Requests", value: stats.newBookings },
    { label: "Community Members", value: stats.subscribers },
    { label: "Active Trip Types", value: stats.activeTrips },
  ];

  return (
    <>
      <PageHeader
        title="Overview"
        description="Your charter operation at a glance — new requests, community growth and active experiences."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="border border-navy-900/10 bg-white p-6">
            <p className="font-display text-5xl text-navy-900">{c.value}</p>
            <p className="mt-2 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-stone">
              {c.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="border border-navy-900/10 bg-white p-7">
          <p className="eyebrow text-[0.65rem] text-stone">Requests by status</p>
          <div className="mt-6 space-y-4">
            {STATUS_ORDER.map((status) => {
              const n = grouped.find((g) => g.status === status)?.n ?? 0;
              const pct =
                stats.totalBookings > 0
                  ? Math.round((n / stats.totalBookings) * 100)
                  : 0;
              return (
                <div key={status}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <StatusPill status={status} />
                    <span className="font-bold text-navy-900">{n}</span>
                  </div>
                  <div className="h-1.5 bg-navy-900/8">
                    <div
                      className="h-full bg-ocean-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-navy-900">
              Latest Requests
            </h2>
            <Link
              href="/dashboard/bookings"
              className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-ocean-500 hover:text-navy-900"
            >
              View all →
            </Link>
          </div>
          <BookingsTable bookings={recent} compact />
        </div>
      </div>
    </>
  );
}
