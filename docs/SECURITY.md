# Security Checklist

Enable RLS on every private table. Never expose service-role credentials. Keep resident identity documents in private storage. Validate uploads by type and size. Validate forms server-side. Rate-limit public and authentication endpoints. Mask sensitive identifiers. Audit important mutations. Prevent double bed allocation with database constraints/transactions. Keep financial history immutable or archived. Rotate secrets regularly.
