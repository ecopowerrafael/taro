import { Helmet } from 'react-helmet-async'
import { buildAbsoluteImageUrl, buildAbsoluteUrl, siteConfig } from '../data/siteConfig'

export function SeoHead({
  title,
  description,
  keywords = [],
  path = '/',
  image = siteConfig.defaultImage,
  type = 'website',
  noindex = false,
  structuredData = [],
}) {
  const canonicalUrl = buildAbsoluteUrl(path)
  const imageUrl = buildAbsoluteImageUrl(image)
  const normalizedTitle = title || siteConfig.defaultTitle
  const normalizedDescription = description || siteConfig.defaultDescription
  const normalizedKeywords = [...new Set([...(keywords || []), ...siteConfig.defaultKeywords])]
  const robotsContent = noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
  const schemas = Array.isArray(structuredData) ? structuredData.filter(Boolean) : [structuredData].filter(Boolean)

  return (
    <Helmet>
      <title>{normalizedTitle}</title>
      <meta name="description" content={normalizedDescription} />
      <meta name="keywords" content={normalizedKeywords.join(', ')} />
      <meta name="robots" content={robotsContent} />
      <meta property="og:locale" content="pt_BR" />
      <meta property="og:site_name" content={siteConfig.name} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={normalizedTitle} />
      <meta property="og:description" content={normalizedDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:alt" content={normalizedTitle} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={normalizedTitle} />
      <meta name="twitter:description" content={normalizedDescription} />
      <meta name="twitter:image" content={imageUrl} />
      <link rel="canonical" href={canonicalUrl} />
      {schemas.map((schema, index) => (
        <script key={`${canonicalUrl}-schema-${index}`} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  )
}