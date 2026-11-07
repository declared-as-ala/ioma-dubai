import React from "react";

export function OrganizationJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "IOMA Paris",
    alternateName: "IOMA Paris Dubai",
    url: "https://www.ioma-paris.com",
    logo: "https://www.ioma-paris.com/images/logo.png",
    description:
      "N°1 de la Cosmétique Personnalisée — Custom bespoke high-fashion skincare formulations based on proven skin diagnostics.",
    sameAs: ["https://www.instagram.com/iomaparis", "https://www.facebook.com/iomaparis"],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+971-4-000-0000",
      contactType: "customer service",
      areaServed: ["AE", "FR"],
      availableLanguage: ["en", "ar"],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function LocalBusinessJsonLd({
  name,
  address,
  telephone,
  image,
}: {
  name: string;
  address: string;
  telephone?: string;
  image?: string;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    name,
    address: {
      "@type": "PostalAddress",
      streetAddress: address,
      addressCountry: "AE",
    },
    telephone: telephone || "+971 4 123 4567",
    image: image || "https://www.ioma-paris.com/images/flagship.jpg",
    priceRange: "$$$",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function ProductJsonLd({
  name,
  description,
  image,
  price,
  currency,
  sku,
}: {
  name: string;
  description: string;
  image: string;
  price: number;
  currency: string;
  sku: string;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    image,
    description,
    sku,
    brand: {
      "@type": "Brand",
      name: "IOMA Paris",
    },
    offers: {
      "@type": "Offer",
      url: `https://www.ioma-paris.com/shop/${sku}`,
      priceCurrency: currency,
      price: price.toFixed(2),
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
