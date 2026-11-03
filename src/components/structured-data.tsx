export function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Momentum",
    applicationCategory: "ProductivityApplication",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5",
      ratingCount: "1",
    },
    operatingSystem: "Web",
    description:
      "Celebrate daily progress and build momentum with small wins. Track your activities, visualize your progress, and stay motivated every day.",
    url: "https://www.findmomentum.xyz",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
