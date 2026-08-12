# SaaS tenancy milestone

The product currently runs as one local business. Tenant isolation must be introduced together with authentication so that the server—not a browser-supplied business ID—decides which business a request belongs to.

## Target ownership model

`User -> BusinessMembership -> Business -> business records`

Every sale, customer, expense, catalog item, inventory movement, supplier, purchase, invoice, payment, and settings record will belong to one business.

## Safe migration order

1. Select and integrate the account provider.
2. Add `User`, `Business`, and `BusinessMembership` records.
3. Create one default business and attach all existing records to it in a data migration.
4. Make `businessId` required on every business-owned record.
5. Resolve the active business from the authenticated membership on the server.
6. Scope every read and write to that resolved business.
7. Change globally unique references such as invoice numbers and SKUs to be unique per business.
8. Add isolation tests proving one business cannot read, update, or delete another business's records.

## Non-negotiable rule

Do not trust a raw `businessId` supplied by the frontend. The server must verify that the signed-in user is an active member of the requested business before any query runs.
