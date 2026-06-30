import PDFDocument from "pdfkit";
import { BRAND } from "@/lib/brand";

interface InvoiceItem {
  title: string;
  size: string;
  quantity: number;
  price: number;
  gstRate: number;
}

interface InvoiceData {
  invoiceNo: string;
  orderId: string;
  createdAt: Date;
  customerName: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  items: InvoiceItem[];
  subtotal: number;
  taxTotal: number;
  shippingFee: number;
  total: number;
  paymentMethod?: string | null;
  discountAmount?: number | null;
}

export function generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const green  = "#006A38";
    const grey   = "#757575";
    const black  = "#212121";
    const light  = "#F5F5F5";
    const W      = 495; // usable width
    const date   = new Date(data.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

    // ── Header bar ──────────────────────────────────────────────
    doc.rect(50, 50, W, 70).fill(green);
    doc.fontSize(22).fillColor("white").font("Helvetica-Bold")
       .text(BRAND.name, 65, 65);
    doc.fontSize(9).font("Helvetica").fillColor("#FFF8E1")
       .text(BRAND.tagline ?? "", 65, 92);
    doc.fontSize(18).fillColor("white").font("Helvetica-Bold")
       .text("TAX INVOICE", 0, 70, { align: "right" });
    doc.fontSize(10).fillColor("#FFF8E1").font("Helvetica")
       .text(data.invoiceNo, 0, 92, { align: "right" });

    // ── Brand details ─────────────────────────────────────────
    doc.moveDown(2);
    const y1 = 135;
    doc.fontSize(8).fillColor(grey).font("Helvetica")
       .text(BRAND.address ?? "", 50, y1)
       .text(`GSTIN: ${BRAND.gstin ?? "N/A"}`, 50, y1 + 11)
       .text(`${BRAND.email ?? ""} · ${BRAND.phone ?? ""}`, 50, y1 + 22);
    doc.fontSize(8).fillColor(grey).font("Helvetica")
       .text(`Date: ${date}`, 0, y1, { align: "right" })
       .text(`Order: #${data.orderId.slice(0, 8).toUpperCase()}`, 0, y1 + 11, { align: "right" });

    // ── Bill To ────────────────────────────────────────────────
    const y2 = 180;
    doc.rect(50, y2, W, 14).fill(light);
    doc.fontSize(8).fillColor(grey).font("Helvetica-Bold")
       .text("BILL TO", 55, y2 + 3);
    doc.fontSize(10).fillColor(black).font("Helvetica-Bold")
       .text(data.customerName, 50, y2 + 20);
    doc.fontSize(8.5).fillColor(grey).font("Helvetica")
       .text(data.email, 50, y2 + 34);
    if (data.phone) doc.text(data.phone, 50, y2 + 46);
    const addrLine = [data.address, data.city, data.state, data.zipCode].filter(Boolean).join(", ");
    if (addrLine) doc.text(addrLine, 50, data.phone ? y2 + 58 : y2 + 46);

    // ── Items table ────────────────────────────────────────────
    const tableTop = 280;
    const cols = { item: 50, qty: 310, rate: 360, gst: 410, amt: 460 };

    doc.rect(50, tableTop, W, 16).fill(green);
    doc.fontSize(8).fillColor("white").font("Helvetica-Bold")
       .text("Item",    cols.item, tableTop + 4)
       .text("Qty",     cols.qty,  tableTop + 4)
       .text("Rate",    cols.rate, tableTop + 4)
       .text("GST",     cols.gst,  tableTop + 4)
       .text("Amount",  cols.amt,  tableTop + 4);

    let rowY = tableTop + 20;
    let rowIdx = 0;
    for (const item of data.items) {
      const baseAmt  = item.price * item.quantity;
      const gstAmt   = baseAmt * (item.gstRate / 100);
      const lineTotal = baseAmt + gstAmt;

      if (rowIdx % 2 === 0) doc.rect(50, rowY - 2, W, 24).fill("#FAFAFA");

      doc.fontSize(9).fillColor(black).font("Helvetica-Bold")
         .text(item.title, cols.item, rowY, { width: 250 });
      doc.fontSize(8).fillColor(grey).font("Helvetica")
         .text(item.size,  cols.item, rowY + 11, { width: 250 });
      doc.fontSize(9).fillColor(black).font("Helvetica")
         .text(String(item.quantity),         cols.qty,  rowY + 4)
         .text(`₹${item.price.toFixed(2)}`,   cols.rate, rowY + 4)
         .text(`${item.gstRate}%`,             cols.gst,  rowY + 4)
         .text(`₹${lineTotal.toFixed(2)}`,    cols.amt,  rowY + 4);

      rowY += 28;
      rowIdx++;
    }

    // ── Totals ─────────────────────────────────────────────────
    rowY += 6;
    doc.moveTo(50, rowY).lineTo(545, rowY).strokeColor("#E0E0E0").stroke();
    rowY += 10;

    const addRow = (label: string, value: string, bold = false) => {
      doc.fontSize(9)
         .fillColor(bold ? black : grey)
         .font(bold ? "Helvetica-Bold" : "Helvetica")
         .text(label, 350, rowY)
         .text(value, 0, rowY, { align: "right" });
      rowY += 16;
    };

    addRow("Subtotal",  `₹${data.subtotal.toFixed(2)}`);
    addRow("GST",       `₹${data.taxTotal.toFixed(2)}`);
    if (data.shippingFee > 0) addRow("Shipping", `₹${data.shippingFee.toFixed(2)}`);
    if (data.discountAmount && data.discountAmount > 0) addRow("Discount", `-₹${data.discountAmount.toFixed(2)}`);
    rowY += 4;
    doc.moveTo(350, rowY).lineTo(545, rowY).strokeColor(green).lineWidth(1).stroke();
    rowY += 6;
    addRow("Total", `₹${data.total.toFixed(2)}`, true);

    // ── Payment + footer ────────────────────────────────────────
    rowY += 20;
    doc.fontSize(8.5).fillColor(grey).font("Helvetica")
       .text(`Payment method: ${(data.paymentMethod ?? "online").replace(/_/g, " ")}`, 50, rowY);
    rowY += 30;
    doc.moveTo(50, rowY).lineTo(545, rowY).strokeColor("#E0E0E0").stroke();
    rowY += 10;
    doc.fontSize(8).fillColor(grey).font("Helvetica")
       .text(`Thank you for shopping with ${BRAND.name}!`, 50, rowY, { align: "center", width: W })
       .text("This is a computer-generated invoice and does not require a signature.", 50, rowY + 12, { align: "center", width: W });

    doc.end();
  });
}
