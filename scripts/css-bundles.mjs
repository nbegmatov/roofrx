/**
 * Список Tailwind-бандлов: те же content-файлы, что и в build-css.mjs.
 */
export const cssBundles = [
  { out: 'css/pages/index.css', content: ['index.html'] },
  { out: 'css/pages/admin.css', content: ['admin/index.html'] },
  {
    out: 'css/pages/portfolio.css',
    content: [
      'portfolio.html',
      'projects/business-plaza-denver.html',
      'projects/custom-home-boulder.html',
      'projects/standing-seam-aurora.html',
      'projects/post-storm-lakewood.html',
      'projects/epdm-warehouse-fort-collins.html',
      'projects/new-roof-colorado-springs.html',
      'projects/townhome-westminster.html',
      'projects/industrial-greeley.html',
      'projects/major-retrofit-pueblo.html',
      'projects/project-media.js',
    ],
  },
  {
    out: 'css/pages/services.css',
    content: [
      'about.html',
      'blog.html',
      'blog/best-roofing-material-colorado.html',
      'blog/roof-replacement-cost-colorado.html',
      'blog/hail-damage-signs-colorado.html',
      'blog/how-long-does-a-roof-last-colorado.html',
      'blog/roof-repair-vs-replacement.html',
      'blog/signs-you-need-a-new-roof.html',
      'reviews.html',
      'service-areas.html',
      'terms.html',
      'Privacy.html',
      'termofservice.html',
      'contacts.html',
      'services.html',
      'services/residential.html',
      'services/commercial.html',
      'services/emergency.html',
      'services/repair.html',
      'services/metal.html',
      'services/flat.html',
    ],
  },
];
