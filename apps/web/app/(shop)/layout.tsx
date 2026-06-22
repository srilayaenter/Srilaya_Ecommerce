export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="shop-layout">
      {/* You can add a shop-wide header or sidebar here if you want */}
      <main>{children}</main>
    </div>
  );
}