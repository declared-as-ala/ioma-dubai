// Run with mongosh against the application database before enabling account checkout.
// Keep real guest tokens unique; explicit nulls on authenticated orders are not tokens.
// Create the replacement before removing the defective sparse unique index. No records change.
const orders = db.getCollection("orders");
orders.createIndex(
  { guestToken: 1 },
  {
    name: "unique_guest_order_token",
    unique: true,
    partialFilterExpression: { guestToken: { $type: "string" } },
  },
);
const legacy = orders.getIndexes().find((index) => index.name === "guestToken_1");
if (legacy) {
  if (legacy.key.guestToken !== 1 || !legacy.unique || !legacy.sparse) {
    throw new Error("Unexpected legacy index definition; review before migration.");
  }
  orders.dropIndex("guestToken_1");
}
print("Authenticated orders accept null guestToken; real guest tokens remain unique.");
