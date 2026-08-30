export const SITE_KEY = 'california';

export const SITE_LOCATION_SLUGS = {
  california: ['california'],
  montreal: ['montreal'],
  rangde: ['rangde'],
  restobar: ['restobar'],
  ottawa: ['stittsville', 'wellington'],
};

export function filterSiteLocations(locations) {
  const allowed = SITE_LOCATION_SLUGS[SITE_KEY] || [];
  return (locations || []).filter((location) => {
    const slug = location.location_slug || location.slug;
    return allowed.includes(String(slug || '').toLowerCase());
  });
}