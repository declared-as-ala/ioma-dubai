/**
 * Inventory rules shared by cart, checkout and catalogue.
 *
 * `trackInventory === false` means the variant is made to order or managed outside the app:
 * it is always sellable and its quantity is never decremented. Anything else is tracked
 * (including legacy variants that never had the flag): stock is enforced unless backorder is allowed.
 */
export interface StockFacts {
  quantityOnHand?: number | null;
  quantityReserved?: number | null;
  backorderAllowed?: boolean | null;
  trackInventory?: boolean | null;
}

export const isTracked = (v: StockFacts) => v.trackInventory !== false;

export const availableUnits = (v: StockFacts) =>
  (v.quantityOnHand ?? 0) - (v.quantityReserved ?? 0);

/** True when `qty` units can be sold now. */
export const canFulfil = (v: StockFacts, qty: number) =>
  !isTracked(v) || !!v.backorderAllowed || availableUnits(v) >= qty;

/** Storefront "in stock" flag. */
export const isInStock = (v: StockFacts) =>
  !isTracked(v) || availableUnits(v) > 0 || !!v.backorderAllowed;
