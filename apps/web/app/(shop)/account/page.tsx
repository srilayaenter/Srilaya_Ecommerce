import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toNum } from "@/lib/decimal";
import AccountClient from "./AccountClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Account",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    // Guest — email lookup form
    return <AccountClient mode="guest" />;
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, phone: true, role: true, createdAt: true },
  });

  if (!dbUser) return <AccountClient mode="guest" />;

  // Fetch orders linked to this user (by userId OR by email/phone for older orders)
  const whereClause = dbUser.email
    ? { OR: [{ userId: dbUser.id }, { email: dbUser.email }] }
    : dbUser.phone
      ? { OR: [{ userId: dbUser.id }, { phone: dbUser.phone }] }
      : { userId: dbUser.id };

  const orders = await prisma.order.findMany({
    where: whereClause,
    include: {
      items: { include: { variant: { include: { product: true } } } },
      shipment: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const serialised = orders.map(o => ({
    id: o.id,
    shortId: o.id.slice(0, 8).toUpperCase(),
    status: o.status,
    fulfillmentStatus: o.fulfillmentStatus,
    orderChannel: o.orderChannel,
    paymentMethod: o.paymentMethod ?? null,
    total: toNum(o.total),
    createdAt: o.createdAt.toISOString(),
    itemCount: o.items.length,
    itemSummary: o.items.map(i => ({
      title: i.variant.product.title,
      size:  i.variant.size,
      quantity: i.quantity,
    })),
    hasShipment: !!o.shipment,
    trackingNumber: o.shipment?.trackingNumber ?? null,
  }));

  return (
    <AccountClient
      mode="authenticated"
      user={{
        id:        dbUser.id,
        email:     dbUser.email ?? null,
        phone:     dbUser.phone ?? null,
        role:      dbUser.role,
        createdAt: dbUser.createdAt.toISOString(),
      }}
      initialOrders={serialised}
    />
  );
}
