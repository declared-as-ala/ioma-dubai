import { Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";
import { ConfigService } from "@nestjs/config";
import type { JwtPayload } from "../auth/strategies/jwt.strategy";
import { requireAdmin } from "./admin-permissions";
import { dashboardPeriod, comparison } from "./dashboard-period";

@Injectable()
export class AdminDashboardService {
  private cache = new Map<string, { until: number; data: Record<string, any> }>();
  constructor(
    @InjectConnection() private readonly db: Connection,
    private readonly config: ConfigService,
  ) {}
  invalidate() {
    this.cache.clear();
  }
  async overview(user: JwtPayload, from?: string, to?: string) {
    const permissions = requireAdmin(user);
    const period = dashboardPeriod(from, to);
    const key = `${permissions.join(",")}:${period.from}:${period.to}`;
    const cached = this.cache.get(key);
    if (cached && cached.until > Date.now()) return cached.data;
    const can = (domain: string) =>
      permissions.includes(`${domain}.view` as (typeof permissions)[number]);
    const aggregate = (name: string, pipeline: any[]) =>
      this.db.collection(name).aggregate(pipeline).toArray();
    const current = { $gte: period.start, $lt: period.end };
    const previous = { $gte: period.previousStart, $lt: period.start };
    const paid = {
      paymentStatus: "paid",
      fulfillmentStatus: { $ne: "cancelled" },
      currency: "AED",
    };
    const dateKey = {
      $dateToString: {
        date: "$createdAt",
        format: period.interval === "month" ? "%Y-%m" : "%Y-%m-%d",
        timezone: "Asia/Dubai",
      },
    };
    const sum = (field: string) => ({ $sum: field });
    const counted = [{ $count: "count" }];
    const groupStatus = (field: string) => [
      { $group: { _id: `$${field}`, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ];
    const now = new Date();
    const today = dashboardPeriod(undefined, undefined, now).to;
    const todayStart = new Date(`${today}T00:00:00+04:00`);
    const todayEnd = new Date(todayStart.getTime() + 86400000);
    const tasks: Record<string, Promise<any[]>> = {};
    if (can("commerce"))
      tasks.commerce = aggregate("orders", [
        { $match: { createdAt: { $gte: period.previousStart, $lt: period.end } } },
        {
          $facet: {
            current: [
              { $match: { createdAt: current } },
              {
                $group: {
                  _id: null,
                  orders: { $sum: 1 },
                  revenue: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            { $eq: ["$paymentStatus", "paid"] },
                            { $ne: ["$fulfillmentStatus", "cancelled"] },
                            { $eq: ["$currency", "AED"] },
                          ],
                        },
                        "$totalMinor",
                        0,
                      ],
                    },
                  },
                  paidOrders: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            { $eq: ["$paymentStatus", "paid"] },
                            { $ne: ["$fulfillmentStatus", "cancelled"] },
                            { $eq: ["$currency", "AED"] },
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                },
              },
            ],
            previous: [
              { $match: { createdAt: previous } },
              {
                $group: {
                  _id: null,
                  orders: { $sum: 1 },
                  revenue: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            { $eq: ["$paymentStatus", "paid"] },
                            { $ne: ["$fulfillmentStatus", "cancelled"] },
                            { $eq: ["$currency", "AED"] },
                          ],
                        },
                        "$totalMinor",
                        0,
                      ],
                    },
                  },
                  paidOrders: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            { $eq: ["$paymentStatus", "paid"] },
                            { $ne: ["$fulfillmentStatus", "cancelled"] },
                            { $eq: ["$currency", "AED"] },
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                },
              },
            ],
            revenue: [
              { $match: { ...paid, createdAt: current } },
              {
                $group: {
                  _id: { date: dateKey, channel: "$type" },
                  revenue: sum("$totalMinor"),
                  orders: { $sum: 1 },
                },
              },
              { $sort: { "_id.date": 1 } },
            ],
            previousRevenue: [
              { $match: { ...paid, createdAt: previous } },
              {
                $group: {
                  _id: { date: dateKey, channel: "$type" },
                  revenue: sum("$totalMinor"),
                  orders: { $sum: 1 },
                },
              },
              { $sort: { "_id.date": 1 } },
            ],
            statuses: [
              { $match: { createdAt: current } },
              ...groupStatus("fulfillmentStatus"),
            ],
            payments: [
              { $match: { createdAt: current } },
              ...groupStatus("paymentStatus"),
            ],
            channels: [
              { $match: { ...paid, createdAt: current } },
              {
                $group: {
                  _id: "$type",
                  revenue: sum("$totalMinor"),
                  orders: { $sum: 1 },
                },
              },
            ],
            products: [
              { $match: { ...paid, createdAt: current } },
              { $unwind: "$items" },
              {
                $group: {
                  _id: "$items.sku",
                  name: { $first: "$items.productNameSnapshot" },
                  units: sum("$items.qty"),
                  revenue: sum("$items.totalMinor"),
                },
              },
              { $sort: { revenue: -1 } },
              { $limit: 10 },
              {
                $lookup: {
                  from: "productvariants",
                  localField: "_id",
                  foreignField: "sku",
                  as: "variant",
                },
              },
              { $set: { variant: { $first: "$variant" } } },
              {
                $lookup: {
                  from: "products",
                  localField: "variant.productId",
                  foreignField: "_id",
                  as: "product",
                },
              },
              { $set: { product: { $first: "$product" } } },
              {
                $project: {
                  name: 1,
                  units: 1,
                  revenue: 1,
                  image: { $first: "$product.images" },
                  productId: "$product._id",
                  rangeId: "$product.rangeId",
                  stock: {
                    $subtract: ["$variant.quantityOnHand", "$variant.quantityReserved"],
                  },
                },
              },
            ],
            ranges: [
              { $match: { ...paid, createdAt: current } },
              { $unwind: "$items" },
              {
                $lookup: {
                  from: "productvariants",
                  localField: "items.variantId",
                  foreignField: "_id",
                  as: "variant",
                },
              },
              { $unwind: { path: "$variant", preserveNullAndEmptyArrays: true } },
              {
                $lookup: {
                  from: "products",
                  localField: "variant.productId",
                  foreignField: "_id",
                  as: "product",
                },
              },
              { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
              {
                $group: {
                  _id: "$product.rangeId",
                  revenue: sum("$items.totalMinor"),
                  units: sum("$items.qty"),
                },
              },
              {
                $lookup: {
                  from: "productranges",
                  localField: "_id",
                  foreignField: "_id",
                  as: "range",
                },
              },
              { $set: { name: { $first: "$range.name" } } },
              { $project: { range: 0 } },
              { $sort: { revenue: -1 } },
            ],
            recent: [
              { $match: { createdAt: current } },
              { $sort: { createdAt: -1 } },
              { $limit: 8 },
              {
                $project: {
                  orderNumber: 1,
                  type: 1,
                  createdAt: 1,
                  totalMinor: 1,
                  paymentStatus: 1,
                  fulfillmentStatus: 1,
                  customer: "$shippingAddress.fullName",
                },
              },
            ],
            returning: [
              { $match: { ...paid, createdAt: current, userId: { $ne: null } } },
              { $group: { _id: "$userId" } },
              {
                $lookup: {
                  from: "orders",
                  let: { buyer: "$_id" },
                  pipeline: [
                    {
                      $match: {
                        ...paid,
                        createdAt: { $lt: period.start },
                        $expr: { $eq: ["$userId", "$$buyer"] },
                      },
                    },
                    { $limit: 1 },
                    { $project: { _id: 1 } },
                  ],
                  as: "earlier",
                },
              },
              { $match: { "earlier.0": { $exists: true } } },
              ...counted,
            ],
          },
        },
      ]);
    if (can("commerce"))
      tasks.inventory = aggregate("productvariants", [
        { $set: { available: { $subtract: ["$quantityOnHand", "$quantityReserved"] } } },
        {
          $facet: {
            health: [
              {
                $group: {
                  _id: null,
                  inStock: {
                    $sum: {
                      $cond: [{ $gt: ["$available", "$lowStockThreshold"] }, 1, 0],
                    },
                  },
                  lowStock: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            { $gt: ["$available", 0] },
                            { $lte: ["$available", "$lowStockThreshold"] },
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                  outOfStock: { $sum: { $cond: [{ $lte: ["$available", 0] }, 1, 0] } },
                  reserved: sum("$quantityReserved"),
                },
              },
            ],
            low: [
              { $match: { $expr: { $lte: ["$available", "$lowStockThreshold"] } } },
              { $sort: { available: 1 } },
              { $limit: 8 },
              {
                $lookup: {
                  from: "products",
                  localField: "productId",
                  foreignField: "_id",
                  as: "product",
                },
              },
              {
                $project: {
                  sku: 1,
                  productId: 1,
                  available: 1,
                  quantityReserved: 1,
                  lowStockThreshold: 1,
                  name: { $first: "$product.name" },
                },
              },
            ],
          },
        },
      ]);
    if (can("customers"))
      tasks.customers = aggregate("users", [
        { $match: { roles: "customer", status: { $ne: "deleted" } } },
        {
          $facet: {
            total: counted,
            current: [{ $match: { createdAt: current } }, ...counted],
            previous: [{ $match: { createdAt: previous } }, ...counted],
            withOrders: [
              {
                $lookup: {
                  from: "orders",
                  localField: "_id",
                  foreignField: "userId",
                  pipeline: [{ $limit: 1 }, { $project: { _id: 1 } }],
                  as: "records",
                },
              },
              { $match: { "records.0": { $exists: true } } },
              ...counted,
            ],
            withDiagnosis: [
              {
                $lookup: {
                  from: "standarddiagnoses",
                  localField: "_id",
                  foreignField: "userId",
                  pipeline: [{ $limit: 1 }, { $project: { _id: 1 } }],
                  as: "standard",
                },
              },
              {
                $lookup: {
                  from: "aianalyses",
                  localField: "_id",
                  foreignField: "userId",
                  pipeline: [
                    { $match: { deletedAt: null } },
                    { $limit: 1 },
                    { $project: { _id: 1 } },
                  ],
                  as: "ai",
                },
              },
              {
                $match: {
                  $or: [
                    { "standard.0": { $exists: true } },
                    { "ai.0": { $exists: true } },
                  ],
                },
              },
              ...counted,
            ],
          },
        },
      ]);
    if (can("b2b"))
      tasks.b2bLeads = aggregate("professionalleads", [
        {
          $facet: {
            pending: [{ $match: { status: "pending" } }, ...counted],
            attention: [
              { $match: { status: "pending" } },
              { $sort: { createdAt: 1 } },
              { $limit: 6 },
              { $project: { companyName: 1, status: 1, createdAt: 1 } },
            ],
          },
        },
      ]);
    if (can("b2b"))
      tasks.b2b = aggregate("professionalapplications", [
        {
          $facet: {
            pipeline: [{ $match: { createdAt: current } }, ...groupStatus("status")],
            pending: [
              {
                $match: {
                  status: { $in: ["submitted", "pending_review", "documents_requested"] },
                },
              },
              ...counted,
            ],
            approved: [{ $match: { status: "approved" } }, ...counted],
            attention: [
              {
                $match: {
                  status: { $in: ["submitted", "pending_review", "documents_requested"] },
                },
              },
              { $sort: { submittedAt: 1 } },
              { $limit: 6 },
              {
                $project: {
                  companyName: 1,
                  businessType: 1,
                  emirate: 1,
                  status: 1,
                  submittedAt: 1,
                },
              },
            ],
          },
        },
      ]);
    if (can("partners"))
      tasks.partners = aggregate("partners", [
        {
          $facet: {
            total: counted,
            types: groupStatus("type"),
            emirates: groupStatus("emirate"),
          },
        },
      ]);
    if (can("partners"))
      tasks.appointments = aggregate("appointments", [
        {
          $facet: {
            statuses: [{ $match: { startsAt: current } }, ...groupStatus("status")],
            today: [
              { $match: { startsAt: { $gte: todayStart, $lt: todayEnd } } },
              ...counted,
            ],
            upcoming: [
              {
                $match: {
                  startsAt: { $gte: now },
                  status: { $in: ["confirmed", "rescheduled"] },
                },
              },
              ...counted,
            ],
            schedule: [
              { $match: { startsAt: { $gte: todayStart, $lt: todayEnd } } },
              { $sort: { startsAt: 1 } },
              { $limit: 8 },
              {
                $lookup: {
                  from: "users",
                  localField: "userId",
                  foreignField: "_id",
                  as: "user",
                },
              },
              {
                $lookup: {
                  from: "partners",
                  localField: "partnerId",
                  foreignField: "_id",
                  as: "partner",
                },
              },
              {
                $lookup: {
                  from: "services",
                  localField: "serviceId",
                  foreignField: "_id",
                  as: "service",
                },
              },
              {
                $project: {
                  startsAt: 1,
                  status: 1,
                  customer: { $first: "$user.firstName" },
                  partner: { $first: "$partner.name" },
                  service: { $first: "$service.name" },
                },
              },
            ],
          },
        },
      ]);
    if (can("training"))
      tasks.training = aggregate("trainingsessions", [
        {
          $facet: {
            upcoming: [
              { $match: { startsAt: { $gte: now } } },
              {
                $group: {
                  _id: null,
                  sessions: { $sum: 1 },
                  booked: sum("$seatsBooked"),
                  available: {
                    $sum: { $max: [0, { $subtract: ["$capacity", "$seatsBooked"] }] },
                  },
                },
              },
            ],
            completed: [
              {
                $match: {
                  endsAt: {
                    $gte: period.start,
                    $lt: new Date(Math.min(period.end.getTime(), now.getTime())),
                  },
                },
              },
              ...counted,
            ],
            sessions: [
              { $match: { startsAt: { $gte: now } } },
              { $sort: { startsAt: 1 } },
              { $limit: 6 },
              {
                $lookup: {
                  from: "trainings",
                  localField: "trainingId",
                  foreignField: "_id",
                  as: "course",
                },
              },
              {
                $lookup: {
                  from: "users",
                  localField: "course.trainerId",
                  foreignField: "_id",
                  as: "trainer",
                },
              },
              {
                $project: {
                  startsAt: 1,
                  capacity: 1,
                  seatsBooked: 1,
                  name: { $first: "$course.name" },
                  trainer: { $first: "$trainer.firstName" },
                },
              },
            ],
          },
        },
      ]);
    if (can("training"))
      tasks.trainingBookings = aggregate("trainingbookings", [
        {
          $facet: {
            statuses: [{ $match: { createdAt: current } }, ...groupStatus("status")],
            certificates: [
              { $match: { status: "attended", certificateDocumentId: { $ne: null } } },
              ...counted,
            ],
          },
        },
      ]);
    if (can("training"))
      tasks.documents = aggregate("documentrecords", [
        { $match: { deletedAt: null, ownerType: { $in: ["training", "protocol"] } } },
        ...groupStatus("ownerType"),
      ]);
    if (can("training"))
      tasks.protocols = aggregate("protocols", [
        { $match: { isPublished: true } },
        ...counted,
      ]);
    if (can("ai"))
      tasks.ai = aggregate("aianalyses", [
        { $match: { deletedAt: null } },
        {
          $facet: {
            statuses: [{ $match: { createdAt: current } }, ...groupStatus("status")],
            timing: [
              {
                $match: {
                  createdAt: current,
                  processingMs: { $type: "number" },
                  status: "completed",
                },
              },
              {
                $group: {
                  _id: null,
                  averageMs: { $avg: "$processingMs" },
                  measured: { $sum: 1 },
                },
              },
            ],
            consultations: [
              {
                $match: {
                  createdAt: current,
                  "consultationAnswers.0": { $exists: true },
                },
              },
              ...counted,
            ],
            latest: [
              {
                $match: { isSimulated: false, status: { $in: ["completed", "failed"] } },
              },
              { $sort: { completedAt: -1, updatedAt: -1 } },
              { $limit: 1 },
              { $project: { provider: 1, status: 1, completedAt: 1, updatedAt: 1 } },
            ],
          },
        },
      ]);
    if (can("audit"))
      tasks.activity = aggregate("auditlogs", [
        { $match: { createdAt: current } },
        { $sort: { createdAt: -1 } },
        { $limit: 8 },
        {
          $project: {
            actorEmail: 1,
            action: 1,
            resource: 1,
            resourceId: 1,
            createdAt: 1,
          },
        },
      ]);
    const entries = await Promise.all(
      Object.entries(tasks).map(async ([name, task]) => [name, await task] as const),
    );
    const raw = Object.fromEntries(entries);
    const data: Record<string, any> = { period, generatedAt: now, permissions };
    for (const [name, rows] of entries)
      data[name] = ["activity", "documents", "protocols"].includes(name) ? rows : rows[0];
    // Trade-access leads waiting for a call join the "pending applications" figures.
    if (data.b2bLeads) {
      if (data.b2b) {
        const legacy = data.b2b.pending?.[0]?.count ?? 0;
        const leads = data.b2bLeads.pending?.[0]?.count ?? 0;
        data.b2b.pending = [{ count: legacy + leads }];
        data.b2b.attention = [
          ...(data.b2bLeads.attention ?? []).map((l: any) => ({
            companyName: l.companyName,
            businessType: null,
            emirate: null,
            status: "pending",
            submittedAt: l.createdAt,
          })),
          ...(data.b2b.attention ?? []),
        ].slice(0, 6);
      }
      delete data.b2bLeads;
    }
    if (data.commerce) {
      const c = data.commerce.current[0] ?? { orders: 0, revenue: 0, paidOrders: 0 };
      const p = data.commerce.previous[0] ?? { orders: 0, revenue: 0, paidOrders: 0 };
      data.commerce.metrics = {
        revenue: comparison(c.revenue, p.revenue),
        orders: comparison(c.orders, p.orders),
        aov: comparison(
          c.paidOrders ? Math.round(c.revenue / c.paidOrders) : 0,
          p.paidOrders ? Math.round(p.revenue / p.paidOrders) : 0,
        ),
      };
      const series = (start: Date, end: Date, rows: any[]) => {
        const keys: string[] = [];
        for (let day = start.getTime(); day < end.getTime(); day += 86400000) {
          const key = new Date(day + 14400000)
            .toISOString()
            .slice(0, period.interval === "month" ? 7 : 10);
          if (keys[keys.length - 1] !== key) keys.push(key);
        }
        return keys.map((date) => {
          const b2c = rows.find((r) => r._id.date === date && r._id.channel === "b2c");
          const b2b = rows.find((r) => r._id.date === date && r._id.channel === "b2b");
          return {
            date,
            b2c: b2c?.revenue ?? 0,
            b2b: b2b?.revenue ?? 0,
            total: (b2c?.revenue ?? 0) + (b2b?.revenue ?? 0),
            orders: (b2c?.orders ?? 0) + (b2b?.orders ?? 0),
          };
        });
      };
      data.commerce.series = series(period.start, period.end, data.commerce.revenue);
      data.commerce.previousSeries = series(
        period.previousStart,
        period.start,
        data.commerce.previousRevenue,
      );
    }
    if (data.customers)
      data.customers.newCustomers = comparison(
        data.customers.current[0]?.count ?? 0,
        data.customers.previous[0]?.count ?? 0,
      );
    if (data.ai) {
      const statuses = data.ai.statuses as { _id: string; count: number }[];
      data.ai.started = statuses.reduce((total, row) => total + row.count, 0);
      const completed = statuses.find((row) => row._id === "completed")?.count ?? 0;
      data.ai.completionRate = data.ai.started
        ? (completed / data.ai.started) * 100
        : null;
      const configured = !!(
        this.config.get("AI_PROVIDER_API_KEY") || process.env.GEMINI_API_KEY
      );
      const latest = raw.ai?.[0]?.latest?.[0];
      data.ai.providers = {
        gemini: {
          configured,
          status: !configured
            ? "not_configured"
            : latest
              ? latest.status === "completed"
                ? "last_success"
                : "last_error"
              : "unverified",
          checkedAt: latest?.completedAt ?? latest?.updatedAt ?? null,
        },
        voice: {
          configured: !!process.env.ELEVENLABS_API_KEY,
          status: process.env.ELEVENLABS_API_KEY ? "unverified" : "not_configured",
        },
        avatar: {
          configured: !!(
            process.env.HEYGEN_API_KEY ||
            process.env.DID_API_KEY ||
            process.env.TAVUS_API_KEY
          ),
          status:
            process.env.HEYGEN_API_KEY ||
            process.env.DID_API_KEY ||
            process.env.TAVUS_API_KEY
              ? "unverified"
              : "not_configured",
        },
      };
    }
    if (this.cache.size > 100) this.cache.clear();
    this.cache.set(key, { until: Date.now() + 30000, data });
    return data;
  }
}
