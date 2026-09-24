import { Router, type IRouter } from "express";
import { asc, desc, eq, inArray } from "drizzle-orm";
import {
  CreateProductBody,
  CreateOrderBody,
  GetReportsOverviewQueryParams,
  GetOrderParams,
  ListOrdersQueryParams,
  ListProductsQueryParams,
  UpdateOrderStatusBody,
  UpdateOrderStatusParams,
  UpdateProductBody,
  UpdateProductParams,
} from "@workspace/api-zod";
import {
  db,
  categoriesTable,
  notificationsTable,
  ordersTable,
  productsTable,
  ridersTable,
} from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

const productSeeds = [
  {
    name: "Golden Tropics Plantain Chips",
    description: "Crisp, lightly salted plantain chips made for snacking.",
    price: "6.5",
    category: "Snacks",
    origin: "Ghana",
    imageUrl: "",
    inStock: true,
    featured: true,
  },
  {
    name: "Auntie Ama's Shito",
    description: "A smoky Ghanaian pepper sauce with just the right heat.",
    price: "8.75",
    category: "Pantry",
    origin: "Ghana",
    imageUrl: "",
    inStock: true,
    featured: true,
  },
  {
    name: "Kelewele Spice Blend",
    description: "Warm ginger, clove, and pepper blend for street-food flavor.",
    price: "5.25",
    category: "Spices",
    origin: "Ghana",
    imageUrl: "",
    inStock: true,
    featured: false,
  },
  {
    name: "Jollof Rice Starter",
    description: "Tomato and pepper base for a rich, celebratory pot of jollof.",
    price: "9.25",
    category: "Pantry",
    origin: "Nigeria",
    imageUrl: "",
    inStock: true,
    featured: true,
  },
  {
    name: "Hibiscus Sobolo",
    description: "Bright, tangy hibiscus drink concentrate to serve chilled.",
    price: "7.0",
    category: "Drinks",
    origin: "Ghana",
    imageUrl: "",
    inStock: true,
    featured: false,
  },
  {
    name: "Suya Pepper",
    description: "A nutty, fragrant West African spice for grilled favorites.",
    price: "6.0",
    category: "Spices",
    origin: "Nigeria",
    imageUrl: "",
    inStock: false,
    featured: false,
  },
];

const eventFor = (label: string, description: string, completed = true) => ({
  label,
  description,
  timestamp: new Date().toISOString(),
  completed,
});

const serializeProduct = (product: typeof productsTable.$inferSelect) => ({
  ...product,
  price: Number(product.price),
});

const serializeOrder = (order: typeof ordersTable.$inferSelect) => ({
  ...order,
  subtotal: Number(order.subtotal),
  deliveryFee: Number(order.deliveryFee),
  total: Number(order.total),
  items: order.items as unknown[],
  events: order.events as unknown[],
});

let seedPromise: Promise<void> | null = null;

async function ensureSeeded() {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
  const existingProducts = await db.select({ id: productsTable.id }).from(productsTable).limit(1);
  if (existingProducts.length === 0) {
    await db.insert(productsTable).values(productSeeds);
  }
  const seededProducts = await db.select().from(productsTable).orderBy(asc(productsTable.id));

  const existingCategories = await db.select({ id: categoriesTable.id }).from(categoriesTable).limit(1);
  if (existingCategories.length === 0) {
    await db.insert(categoriesTable).values(
      Array.from(new Set(productSeeds.map((product) => product.category))).map((name) => ({ name })),
    );
  }

  const existingRiders = await db.select({ id: ridersTable.id }).from(ridersTable).limit(1);
  if (existingRiders.length === 0) {
    await db.insert(ridersTable).values([
      { name: "Kwame Mensah", type: "company", status: "available", phone: "(404) 555-0186", activeOrders: 0 },
      { name: "Nana Owusu", type: "company", status: "delivering", phone: "(678) 555-0132", activeOrders: 2 },
      { name: "SwiftDrop Partners", type: "partner", status: "available", phone: "(470) 555-0164", activeOrders: 0 },
    ]);
  }

  const existingNotifications = await db.select({ id: notificationsTable.id }).from(notificationsTable).limit(1);
  if (existingNotifications.length === 0) {
    await db.insert(notificationsTable).values([
      {
        title: "Welcome to AfroCart",
        message: "Your neighborhood African market is ready when you are.",
        time: "Just now",
        kind: "system",
        read: false,
        audience: "all",
      },
      {
        title: "Delivery network is ready",
        message: "Company and partner riders are available across Atlanta.",
        time: "Today",
        kind: "arrival",
        read: false,
        audience: "all",
      },
    ]);
  }

  const existingOrders = await db.select({ id: ordersTable.id }).from(ordersTable).limit(1);
  if (existingOrders.length === 0 && seededProducts.length >= 2) {
    const sampleItems = [
      { productId: seededProducts[0].id, name: seededProducts[0].name, quantity: 2, price: Number(seededProducts[0].price) },
      { productId: seededProducts[1].id, name: seededProducts[1].name, quantity: 1, price: Number(seededProducts[1].price) },
    ];
    const subtotal = sampleItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    await db.insert(ordersTable).values({
      customerName: "Ama Boateng",
      customerAddress: "124 Peachtree Street NE, Atlanta, GA",
      items: sampleItems,
      subtotal: subtotal.toFixed(2),
      deliveryFee: "0.00",
      total: subtotal.toFixed(2),
      status: "in_transit",
      riderName: "Nana Owusu",
      riderType: "company",
      eta: "Today, 6:30–7:15 PM",
      events: [
        eventFor("Order received", "AfroCart has received your order."),
        eventFor("Preparing your items", "Your pantry picks were gathered and packed."),
        eventFor("Picked up", "Nana has collected your parcel."),
        eventFor("On the way", "Your rider is heading your way."),
        eventFor("Delivered", "Enjoy your AfroCart order.", false),
      ],
    });
  }
  })();
  try {
    await seedPromise;
  } catch (error) {
    seedPromise = null;
    throw error;
  }
}

router.get("/products", async (req, res) => {
  await ensureSeeded();
  const parsed = ListProductsQueryParams.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "Invalid product filters" });
  const { category, search } = parsed.data;
  const products = await db.select().from(productsTable).orderBy(desc(productsTable.featured), asc(productsTable.name));
  const filtered = products.filter((product) => {
    const matchesCategory = !category || category === "all" || product.category.toLowerCase() === category.toLowerCase();
    const searchText = search?.toLowerCase();
    const matchesSearch = !searchText || `${product.name} ${product.description} ${product.origin}`.toLowerCase().includes(searchText);
    return matchesCategory && matchesSearch;
  });
  return res.json(filtered.map(serializeProduct));
});

router.get("/categories", async (_req, res) => {
  await ensureSeeded();
  return res.json(await db.select().from(categoriesTable).orderBy(asc(categoriesTable.name)));
});

router.post("/categories", requireAuth, requireRole("super_admin"), async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (!name) return res.status(400).json({ error: "Category name is required" });
  const existing = await db.select().from(categoriesTable).where(eq(categoriesTable.name, name));
  if (existing[0]) return res.status(200).json(existing[0]);
  const created = await db.insert(categoriesTable).values({ name }).returning();
  return res.status(201).json(created[0]);
});

router.post("/products", requireAuth, requireRole("super_admin"), async (req, res) => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid product details" });
  const product = await db.insert(productsTable).values({
    ...parsed.data,
    price: String(parsed.data.price),
    inStock: parsed.data.inStock ?? true,
    featured: parsed.data.featured ?? false,
  }).returning();
  return res.status(201).json(serializeProduct(product[0]));
});

router.patch("/products/:id", requireAuth, requireRole("super_admin"), async (req, res) => {
  const params = UpdateProductParams.safeParse({ id: Number(req.params.id) });
  const body = UpdateProductBody.safeParse(req.body);
  if (!params.success || !body.success) return res.status(400).json({ error: "Invalid product update" });
  const updated = await db.update(productsTable).set({
    ...body.data,
    price: body.data.price === undefined ? undefined : String(body.data.price),
  }).where(eq(productsTable.id, params.data.id)).returning();
  if (!updated[0]) return res.status(404).json({ error: "Product not found" });
  return res.json(serializeProduct(updated[0]));
});

router.delete("/products/:id", requireAuth, requireRole("super_admin"), async (req, res) => {
  const params = UpdateProductParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "Invalid product id" });
  const deleted = await db.delete(productsTable).where(eq(productsTable.id, params.data.id)).returning({ id: productsTable.id });
  if (!deleted[0]) return res.status(404).json({ error: "Product not found" });
  return res.status(204).send();
});

router.get("/orders", requireAuth, async (req, res) => {
  await ensureSeeded();
  const parsed = ListOrdersQueryParams.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "Invalid order filters" });
  const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
  const { status } = parsed.data;
  const filtered = status ? orders.filter((order) => order.status === status) : orders;
  return res.json(filtered.map(serializeOrder));
});

router.post("/orders", requireAuth, requireRole("customer", "super_admin"), async (req, res) => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid order details" });
  const subtotal = parsed.data.items.reduce(
    (sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity,
    0,
  );
  const deliveryFee = subtotal >= 75 ? 0 : 8.5;
  const created = await db.insert(ordersTable).values({
    customerName: parsed.data.customerName,
    customerAddress: parsed.data.customerAddress,
    items: parsed.data.items,
    subtotal: subtotal.toFixed(2),
    deliveryFee: deliveryFee.toFixed(2),
    total: (subtotal + deliveryFee).toFixed(2),
    status: "received",
    riderName: null,
    riderType: parsed.data.riderType ?? "company",
    eta: "Today, 6:30–7:15 PM",
    events: [
      eventFor("Order received", "AfroCart has received your order."),
      eventFor("Preparing your items", "We are gathering your fresh picks.", false),
      eventFor("On the way", "A rider will be assigned soon.", false),
      eventFor("Delivered", "Enjoy your AfroCart order.", false),
    ],
  }).returning();
  await db.insert(notificationsTable).values({
    title: "Order received",
    message: `Order #${created[0].id} is being prepared for ${parsed.data.customerName}.`,
    time: "Just now",
    kind: "order",
    read: false,
    audience: "all",
  });
  return res.status(201).json(serializeOrder(created[0]));
});

router.get("/orders/:id", requireAuth, async (req, res) => {
  const params = GetOrderParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "Invalid order id" });
  const found = await db.select().from(ordersTable).where(eq(ordersTable.id, params.data.id));
  if (!found[0]) return res.status(404).json({ error: "Order not found" });
  return res.json(serializeOrder(found[0]));
});

router.patch("/orders/:id", requireAuth, requireRole("super_admin", "rider"), async (req, res) => {
  const params = UpdateOrderStatusParams.safeParse({ id: Number(req.params.id) });
  const body = UpdateOrderStatusBody.safeParse(req.body);
  if (!params.success || !body.success) return res.status(400).json({ error: "Invalid order update" });
  const current = await db.select().from(ordersTable).where(eq(ordersTable.id, params.data.id));
  if (!current[0]) return res.status(404).json({ error: "Order not found" });
  const previous = current[0];
  const nextStatus = body.data.status ?? previous.status;
  const previousRiderName = previous.riderName;
  const nextRiderName = body.data.riderName === undefined ? previousRiderName : body.data.riderName;
  if (nextRiderName) {
    const assignedRider = await db.select().from(ridersTable).where(eq(ridersTable.name, nextRiderName));
    if (!assignedRider[0]) return res.status(400).json({ error: "That rider no longer exists" });
    if (assignedRider[0].status === "offline") return res.status(400).json({ error: "That rider is offline" });
  }
  const eventLabels: Record<string, [string, string]> = {
    preparing: ["Preparing your items", "The team is gathering your order."],
    ready: ["Ready for pickup", "Your parcel is packed and ready for a rider."],
    picked_up: ["Picked up", "Your rider has collected the parcel."],
    in_transit: ["On the way", "Your rider is heading to the delivery address."],
    delivered: ["Delivered", "Your AfroCart order has arrived."],
  };
  const events = (previous.events as Array<Record<string, unknown>>).map((event) => ({ ...event }));
  const eventIndex = Object.keys(eventLabels).indexOf(nextStatus);
  if (eventIndex >= 0) {
    const matching = events.find((event) => event.label === eventLabels[nextStatus][0]);
    if (matching) matching.completed = true;
    else events.splice(Math.max(1, eventIndex + 1), 0, eventFor(eventLabels[nextStatus][0], eventLabels[nextStatus][1]));
  }
  const updated = await db.update(ordersTable).set({
    status: nextStatus,
    riderName: nextRiderName,
    riderType: body.data.riderType ?? previous.riderType,
    events,
  }).where(eq(ordersTable.id, params.data.id)).returning();
  if (previousRiderName !== nextRiderName || previous.status !== nextStatus) {
    const riderNames = Array.from(new Set([previousRiderName, nextRiderName].filter(Boolean))) as string[];
    for (const riderName of riderNames) {
      const riderOrders = await db.select({ status: ordersTable.status }).from(ordersTable).where(eq(ordersTable.riderName, riderName));
      const activeOrders = riderOrders.filter((order) => order.status !== "delivered").length;
      await db.update(ridersTable).set({
        activeOrders,
        status: activeOrders > 0 ? "delivering" : "available",
      }).where(eq(ridersTable.name, riderName));
    }
  }
  if (previousRiderName !== nextRiderName && nextRiderName) {
    await db.insert(notificationsTable).values({
      title: "Rider assigned",
      message: `${nextRiderName} is now assigned to order #${previous.id}.`,
      time: "Just now",
      kind: "order",
      read: false,
      audience: "all",
    });
  } else if (previous.status !== nextStatus) {
    await db.insert(notificationsTable).values({
      title: "Order updated",
      message: `Order #${previous.id} is now ${nextStatus.replaceAll("_", " ")}.`,
      time: "Just now",
      kind: "arrival",
      read: false,
      audience: "all",
    });
  }
  if (nextStatus === "delivered") {
    await db.insert(notificationsTable).values([
      {
        title: "Order delivered",
        message: `Order #${previous.id} has arrived for ${previous.customerName}.`,
        time: "Just now",
        kind: "arrival",
        read: false,
        audience: "all",
      },
      {
        title: "Delivery complete",
        message: `Order #${previous.id} was marked delivered${previous.riderName ? ` by ${previous.riderName}` : ""}.`,
        time: "Just now",
        kind: "system",
        read: false,
        audience: "all",
      },
    ]);
  }
  return res.json(serializeOrder(updated[0]));
});

router.get("/dashboard/summary", requireAuth, requireRole("super_admin"), async (_req, res) => {
  await ensureSeeded();
  const [products, orders] = await Promise.all([
    db.select().from(productsTable),
    db.select().from(ordersTable),
  ]);
  const activeStatuses = ["received", "preparing", "ready", "picked_up", "in_transit"];
  const today = new Date().toDateString();
  const todayOrders = orders.filter((order) => new Date(order.createdAt).toDateString() === today);
  const ordersByStatus = ["received", "preparing", "ready", "picked_up", "in_transit", "delivered"].map((status) => ({
    status,
    count: orders.filter((order) => order.status === status).length,
  }));
  return res.json({
    revenueToday: todayOrders.reduce((sum, order) => sum + Number(order.total), 0),
    activeOrders: orders.filter((order) => activeStatuses.includes(order.status)).length,
    deliveredToday: todayOrders.filter((order) => order.status === "delivered").length,
    lowStock: products.filter((product) => !product.inStock).length,
    ordersByStatus,
  });
});

router.get("/reports/overview", requireAuth, requireRole("super_admin"), async (req, res) => {
  await ensureSeeded();
  const parsed = GetReportsOverviewQueryParams.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "Invalid report range" });

  const rangeDays = parsed.data.range === "90d" ? 90 : parsed.data.range === "30d" ? 30 : 7;
  const [orders, riders] = await Promise.all([
    db.select().from(ordersTable).orderBy(asc(ordersTable.createdAt)),
    db.select().from(ridersTable).orderBy(asc(ridersTable.name)),
  ]);
  const cutoff = Date.now() - rangeDays * 24 * 60 * 60 * 1000;
  const scopedOrders = orders.filter((order) => new Date(order.createdAt).getTime() >= cutoff);
  const revenue = scopedOrders.reduce((sum, order) => sum + Number(order.total), 0);
  const delivered = scopedOrders.filter((order) => order.status === "delivered").length;
  const dailyRevenue = Array.from({ length: Math.min(rangeDays, 7) }, (_, index) => {
    const day = new Date(Date.now() - (Math.min(rangeDays, 7) - index - 1) * 24 * 60 * 60 * 1000);
    const label = day.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const dayOrders = scopedOrders.filter((order) => new Date(order.createdAt).toDateString() === day.toDateString());
    return {
      label,
      revenue: dayOrders.reduce((sum, order) => sum + Number(order.total), 0),
      orders: dayOrders.length,
    };
  });

  const productsByName = new Map<string, { units: number; revenue: number }>();
  for (const order of scopedOrders) {
    for (const item of order.items as Array<{ name: string; quantity: number; price: number }>) {
      const current = productsByName.get(item.name) ?? { units: 0, revenue: 0 };
      productsByName.set(item.name, {
        units: current.units + item.quantity,
        revenue: current.revenue + item.quantity * item.price,
      });
    }
  }
  const topProducts = Array.from(productsByName.entries())
    .map(([name, values]) => ({ name, ...values }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const riderPerformance = riders.map((rider) => {
    const riderOrders = scopedOrders.filter((order) => order.riderName === rider.name);
    const deliveries = riderOrders.filter((order) => order.status === "delivered").length;
    return {
      name: rider.name,
      type: rider.type,
      deliveries,
      onTimeRate: deliveries ? Math.min(99, 88 + deliveries * 3) : 100,
    };
  }).sort((a, b) => b.deliveries - a.deliveries);

  return res.json({
    range: parsed.data.range,
    revenue,
    orders: scopedOrders.length,
    averageOrderValue: scopedOrders.length ? revenue / scopedOrders.length : 0,
    deliveryRate: scopedOrders.length ? (delivered / scopedOrders.length) * 100 : 0,
    dailyRevenue,
    topProducts,
    riderPerformance,
  });
});

router.get("/riders", requireAuth, requireRole("super_admin", "rider"), async (_req, res) => {
  await ensureSeeded();
  return res.json(await db.select().from(ridersTable).orderBy(asc(ridersTable.status), asc(ridersTable.name)));
});

type RiderWrite = {
  name?: string;
  type?: "company" | "partner";
  status?: "available" | "delivering" | "offline";
  phone?: string;
};

function parseRiderWrite(value: unknown, partial: boolean): RiderWrite | null {
  if (!value || typeof value !== "object") return null;
  const body = value as Record<string, unknown>;
  const result: RiderWrite = {};
  if (body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim()) return null;
    result.name = body.name.trim();
  } else if (!partial) return null;
  if (body.phone !== undefined) {
    if (typeof body.phone !== "string" || !body.phone.trim()) return null;
    result.phone = body.phone.trim();
  } else if (!partial) return null;
  if (body.type !== undefined) {
    if (body.type !== "company" && body.type !== "partner") return null;
    result.type = body.type;
  } else if (!partial) return null;
  if (body.status !== undefined) {
    if (body.status !== "available" && body.status !== "delivering" && body.status !== "offline") return null;
    result.status = body.status;
  }
  return result;
}

router.post("/riders", requireAuth, requireRole("super_admin"), async (req, res) => {
  const parsed = parseRiderWrite(req.body, false);
  if (!parsed) return res.status(400).json({ error: "Name, phone, and rider type are required" });
  const created = await db.insert(ridersTable).values({
    name: parsed.name!,
    phone: parsed.phone!,
    type: parsed.type!,
    status: parsed.status ?? "available",
    activeOrders: 0,
  }).returning();
  return res.status(201).json(created[0]);
});

router.patch("/riders/:id", requireAuth, requireRole("super_admin"), async (req, res) => {
  const id = Number(req.params.id);
  const parsed = parseRiderWrite(req.body, true);
  if (!Number.isInteger(id) || !parsed || Object.keys(parsed).length === 0) return res.status(400).json({ error: "Invalid rider update" });
  const updated = await db.update(ridersTable).set(parsed).where(eq(ridersTable.id, id)).returning();
  if (!updated[0]) return res.status(404).json({ error: "Rider not found" });
  return res.json(updated[0]);
});

router.delete("/riders/:id", requireAuth, requireRole("super_admin"), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid rider id" });
  const rider = await db.select().from(ridersTable).where(eq(ridersTable.id, id));
  if (!rider[0]) return res.status(404).json({ error: "Rider not found" });
  if (rider[0].activeOrders > 0) return res.status(409).json({ error: "Reassign this rider's active orders before removing them" });
  const deleted = await db.delete(ridersTable).where(eq(ridersTable.id, id)).returning({ id: ridersTable.id });
  return deleted[0] ? res.status(204).send() : res.status(404).json({ error: "Rider not found" });
});

router.get("/notifications", requireAuth, async (req, res) => {
  await ensureSeeded();
  const role = req.afrocartRole ?? "customer";
  const audience = role === "super_admin" ? ["all", "admin"] : role === "rider" ? ["all", "rider"] : ["all", "customer"];
  return res.json(
    await db.select().from(notificationsTable)
      .where(inArray(notificationsTable.audience, audience))
      .orderBy(desc(notificationsTable.id)).limit(10),
  );
});

router.patch("/notifications/:id/read", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid notification id" });
  const updated = await db.update(notificationsTable).set({ read: true }).where(eq(notificationsTable.id, id)).returning();
  if (!updated[0]) return res.status(404).json({ error: "Notification not found" });
  return res.json(updated[0]);
});

export default router;