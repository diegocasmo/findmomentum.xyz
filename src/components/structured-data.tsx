export function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Momentum",
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Web",
    description:
      "Celebrate daily progress and build momentum with small wins. Track your activities, visualize your progress, and stay motivated every day.",
    url: "https://www.findmomentum.xyz",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
      }}
    />
  );
}
