const envSiteUrl = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_SITE_URL)
  ? process.env.REACT_APP_SITE_URL.replace(/\/$/, '')
  : null;

export const siteSeo = {
  siteName: "Masakali Indian Cuisine California",
  siteUrl: envSiteUrl || "https://masakalicalifornia.com",
  brandShort: "Masakali Cupertino",
  defaultTitle: "Masakali Indian Cuisine | Indian Restaurant in Cupertino, CA",
  defaultDescription: "Authentic Indian dining at Masakali in Cupertino, California (10310 S De Anza Blvd). View the menu, reserve a table, and order catering.",
  locale: "en_US",
  ogLocale: "en_US",
  htmlLang: 'en',
  cuisine: "Indian",
  priceRange: "$$",
  email: "masakalicalifornia@gmail.com",
  servesCuisine: ["Indian"],
  areaServed: "Cupertino, California",
  ogImage: '/logo192.png',
  openingHours: ['Mo-Su 11:30-22:00'],
  restaurants: [
  {
    name: "Masakali Indian Cuisine – California",
    streetAddress: "10310 S De Anza Blvd",
    addressLocality: "Cupertino",
    addressRegion: "CA",
    postalCode: "95014",
    addressCountry: "US",
    telephone: "+1-408-352-5097",
  }
  ],
};

export const pages = {
  home: {
    path: "/",
    title: "Masakali Indian Cuisine | Cupertino, CA",
    description: "Masakali Indian Cuisine in Cupertino — authentic Indian dishes, reservations, and catering in Silicon Valley.",
  },
  about: {
    path: "/about",
    title: "About Us | Masakali Cupertino",
    description: "Learn about Masakali Indian Cuisine and our Cupertino, California restaurant.",
  },
  menu: {
    path: "/menu",
    title: "Menu | Masakali Indian Cuisine Cupertino",
    description: "Browse the Masakali Cupertino menu — Indian curries, biryani, tandoor, and vegetarian dishes.",
  },
  locations: {
    path: "/locations",
    title: "Location | Masakali Cupertino",
    description: "Visit Masakali at 10310 S De Anza Blvd, Cupertino, CA 95014. Directions and contact information.",
  },
  reservations: {
    path: "/reservations",
    title: "Reservations | Masakali Cupertino",
    description: "Reserve a table at Masakali Indian Cuisine in Cupertino, California.",
  },
  catering: {
    path: "/catering",
    title: "Catering | Masakali Cupertino",
    description: "Indian catering in Cupertino and surrounding Silicon Valley from Masakali.",
  },
  cateringByTray: {
    path: "/catering-by-tray",
    title: "Catering by the Tray | Masakali Cupertino",
    description: "Order Indian catering by the tray from Masakali Cupertino for events and gatherings.",
  },
  contact: {
    path: "/contact",
    title: "Contact | Masakali Cupertino",
    description: "Contact Masakali Cupertino at (408) 352-5097 or masakalicalifornia@gmail.com.",
  }
};

export function absoluteUrl(path = '/') {
  const normalized = path.startsWith('http') ? path : `${siteSeo.siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
  return normalized;
}

export function buildRestaurantJsonLd() {
  return siteSeo.restaurants.map((restaurant) => ({
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    '@id': `${absoluteUrl('/')}#restaurant-${restaurant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    name: restaurant.name,
    image: absoluteUrl(siteSeo.ogImage),
    url: absoluteUrl('/'),
    telephone: restaurant.telephone,
    email: siteSeo.email,
    servesCuisine: siteSeo.servesCuisine,
    priceRange: siteSeo.priceRange,
    menu: absoluteUrl('/menu'),
    acceptsReservations: true,
    address: {
      '@type': 'PostalAddress',
      streetAddress: restaurant.streetAddress,
      addressLocality: restaurant.addressLocality,
      addressRegion: restaurant.addressRegion,
      postalCode: restaurant.postalCode,
      addressCountry: restaurant.addressCountry,
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '11:30',
      closes: '22:00',
    },
    areaServed: siteSeo.areaServed,
  }));
}

export function buildWebSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${absoluteUrl('/')}#website`,
    name: siteSeo.siteName,
    url: absoluteUrl('/'),
    description: siteSeo.defaultDescription,
    publisher: {
      '@type': 'Organization',
      name: siteSeo.siteName,
      url: absoluteUrl('/'),
      logo: absoluteUrl(siteSeo.ogImage),
      email: siteSeo.email,
    },
    potentialAction: {
      '@type': 'ReserveAction',
      target: absoluteUrl('/reservations'),
      name: 'Reserve a table',
    },
  };
}

export function buildMenuItemJsonLd(item, path) {
  if (!item) return null;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'MenuItem',
    name: item.name,
    description: item.description || undefined,
    url: absoluteUrl(path),
    image: item.image_url || item.imageUrl || undefined,
    offers: item.price != null && item.price !== '' ? {
      '@type': 'Offer',
      priceCurrency: "USD",
      price: String(item.price),
      availability: 'https://schema.org/InStock',
    } : undefined,
  };
  return data;
}

export const siteFaqs = [["Where is Masakali California located?", "Masakali Indian Cuisine is at 10310 S De Anza Blvd, Cupertino, CA 95014, USA."], ["What is the phone number?", "Call (408) 352-5097."], ["Do you take reservations?", "Yes. You can book online through the Reservations page."], ["Do you offer catering?", "Yes. Masakali Cupertino offers catering and catering-by-the-tray options."]];

export function pageSeo(key, overrides = {}) {
  const page = pages[key] || {};
  return {
    title: overrides.title || page.title,
    description: overrides.description || page.description,
    path: overrides.path || page.path,
  };
}
