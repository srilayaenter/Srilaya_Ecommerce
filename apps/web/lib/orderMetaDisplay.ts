// Classifies an Order.invoiceNo value for display on the admin order detail
// page. invoiceNo has historically been reused to smuggle non-invoice data
// ("NOTE:" for free-text notes, "COURIER:" as a legacy pre-migration path for
// the checkout-time courier selection) — this keeps that classification in
// one place instead of scattered inline JSX conditionals.
export type InvoiceNoDisplay =
  | { kind: "invoice"; text: string }
  | { kind: "note"; text: string }
  | { kind: "legacy_courier"; text: string }
  | { kind: "none" };

export function classifyInvoiceNo(
  invoiceNo: string | null | undefined,
): InvoiceNoDisplay {
  if (!invoiceNo) return { kind: "none" };
  if (invoiceNo.startsWith("NOTE:")) {
    return { kind: "note", text: invoiceNo.replace("NOTE:", "") };
  }
  if (invoiceNo.startsWith("COURIER:")) {
    return { kind: "legacy_courier", text: invoiceNo.replace("COURIER:", "") };
  }
  return { kind: "invoice", text: invoiceNo };
}
