// Idempotent. Makes per-variant inventory tracking explicit without changing any behaviour:
//  - a variant that was never stocked and is sellable on backorder was already treated as "not tracked":
//    it gets trackInventory:false;
//  - every other variant without the flag gets trackInventory:true.
// Variants that already carry the flag, and archived variants, are not touched. Stock quantities are never changed.
// Run:  mongosh <db> --eval 'var APPLY=true' infrastructure/scripts/migrate-track-inventory.js   (without APPLY it only reports)
const APPLY = typeof globalThis.APPLY !== "undefined" ? globalThis.APPLY : false;
const base = { trackInventory: { $exists: false }, archivedAt: null };
const untracked = { ...base, backorderAllowed: true, quantityOnHand: { $lte: 0 }, quantityReserved: { $lte: 0 } };
const out = {
  apply: APPLY,
  willSetUntracked: db.productvariants.countDocuments(untracked),
  willSetTracked: db.productvariants.countDocuments(base) - db.productvariants.countDocuments(untracked),
};
if (APPLY) {
  out.untrackedSet = db.productvariants.updateMany(untracked, { $set: { trackInventory: false } }).modifiedCount;
  out.trackedSet = db.productvariants.updateMany(base, { $set: { trackInventory: true } }).modifiedCount;
}
print(JSON.stringify(out));
