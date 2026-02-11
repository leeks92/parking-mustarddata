import { MetadataRoute } from 'next';
import { BASE_URL, MAIN_PAGES, REGION_PAGES } from '@/lib/urls';
import {
  getRegions,
  sidoToSlug,
  sigunguToSlug,
  getAllParkingIds,
} from '@/lib/parking-data';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];

  const mainPages: MetadataRoute.Sitemap = MAIN_PAGES.map((page) => ({
    url: `${BASE_URL}${page.path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  const regionPages: MetadataRoute.Sitemap = REGION_PAGES.map((page) => ({
    url: `${BASE_URL}${page.path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Dynamic region/sigungu pages
  const regions = getRegions();
  const sigunguPages: MetadataRoute.Sitemap = [];
  for (const region of regions) {
    for (const sg of region.sigungu) {
      sigunguPages.push({
        url: `${BASE_URL}/region/${sidoToSlug(region.sido)}/${sigunguToSlug(sg.name)}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      });
    }
  }

  // Free parking pages
  const freePages: MetadataRoute.Sitemap = regions.map((region) => ({
    url: `${BASE_URL}/free/${sidoToSlug(region.sido)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  const freeSigunguPages: MetadataRoute.Sitemap = [];
  for (const region of regions) {
    for (const sg of region.sigungu) {
      freeSigunguPages.push({
        url: `${BASE_URL}/free/${sidoToSlug(region.sido)}/${sigunguToSlug(sg.name)}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.5,
      });
    }
  }

  // Individual parking lot pages
  const parkingPages: MetadataRoute.Sitemap = getAllParkingIds().map((id) => ({
    url: `${BASE_URL}/parking/${id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [
    ...staticPages,
    ...mainPages,
    ...regionPages,
    ...sigunguPages,
    ...freePages,
    ...freeSigunguPages,
    ...parkingPages,
  ];
}
