// Derives a short display SKU from the product id (UUID). The database has no
// SKU field, so this is a presentation-only value.
export const formatSku = (id?: string | null): string | null => {
  if (!id) return null;
  const compact = id.replace(/-/g, "").slice(0, 8).toUpperCase();
  return compact.length > 0 ? compact : null;
};
