// Idempotent: links every public partner profile to its professional profile (one business, one record).
// Matching uses stable identifiers only: partner.professionalAccountId == profile.userId, or the
// professional application's email == partner.email. Nothing is deleted or overwritten:
// already-linked records are skipped and ambiguous matches are reported, not guessed.
// Run:  mongosh <db> --eval 'var APPLY=true' infrastructure/scripts/migrate-unify-professionals.js
const APPLY = typeof globalThis.APPLY !== "undefined" ? globalThis.APPLY : false;
const out = { apply: APPLY, linked: [], skipped: [], ambiguous: [] };
db.professionalprofiles.find({ partnerId: { $in: [null, undefined] } }).forEach((profile) => {
  const app = db.professionalapplications.findOne({ _id: profile.applicationId });
  const candidates = db.partners
    .find({
      professionalProfileId: { $in: [null, undefined] },
      $or: [
        { professionalAccountId: profile.userId },
        ...(app && app.email ? [{ email: String(app.email).toLowerCase() }] : []),
      ],
    })
    .toArray();
  if (candidates.length === 0) return out.skipped.push(String(profile.companyName));
  if (candidates.length > 1) return out.ambiguous.push(String(profile.companyName));
  const partner = candidates[0];
  out.linked.push({ professional: profile.companyName, partner: partner.name });
  if (APPLY) {
    db.professionalprofiles.updateOne({ _id: profile._id }, { $set: { partnerId: partner._id } });
    db.partners.updateOne(
      { _id: partner._id },
      { $set: { professionalProfileId: profile._id, professionalAccountId: profile.userId } },
    );
  }
});
print(JSON.stringify(out));
