import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const SUPABASE_URL = 'https://hwiilzqgnrzzphccbfyl.supabase.co';
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3aWlsenFnbnJ6enBoY2NiZnlsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTk0NDExNiwiZXhwIjoyMDk1NTIwMTE2fQ.GX-9JCVYpQs_C4eefo1tvjd5cbkjKWSJE7Pz6JIaiUA';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  realtime: { transport: ws },
});

const now = new Date('2026-05-28T00:00:00Z');

function daysFromNow(days) {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

const sections = [
  {
    name: 'Store Foundation',
    tag: 'store-foundation',
    priority: 'High',
    deadlineDays: [7, 7, 8, 8, 9, 9, 10, 10, 11, 12, 13, 14],
    tasks: [
      'Create Shopify store',
      'Connect custom domain',
      'Configure Shopify Payments',
      'Configure Razorpay/PayU backup',
      'Setup GST settings',
      'Configure shipping zones',
      'Setup shipping rates',
      'Configure return/refund policy',
      'Setup legal pages',
      'Translations',
      'Setup order email notifications',
      'Buy theme',
    ],
  },
  {
    name: 'Brand Setup',
    tag: 'brand-setup',
    priority: 'High',
    deadlineDays: [14, 15, 15, 16, 17, 18],
    tasks: [
      'Upload logo',
      'Define brand colors',
      'Define typography',
      'Create favicon',
      'Create brand style guide',
      'Create announcement bar text',
    ],
  },
  {
    name: 'Navigation',
    tag: 'navigation',
    priority: 'High',
    deadlineDays: [14, 15, 16, 17, 17, 18, 19, 20],
    tasks: [
      'Create header',
      'Create mega menu',
      'Create mobile menu',
      'Create footer',
      'Add footer links',
      'Add social links',
      'Add search bar',
      'Add predictive search',
    ],
  },
  {
    name: 'Homepage',
    tag: 'homepage',
    priority: 'High',
    deadlineDays: [14, 15, 16, 17, 18, 18, 19, 19, 20, 21, 21, 21, 21],
    tasks: [
      'Hero banner',
      'Secondary banner',
      'Featured collections',
      'Shop by intention',
      'Best sellers section',
      'New arrivals section',
      'Crystal benefits section',
      'Testimonials',
      'Why Tirtam section',
      'Instagram feed',
      'FAQ section',
      'Newsletter signup',
      'Footer',
    ],
  },
  {
    name: 'Collections / Catalog',
    tag: 'collections-catalog',
    priority: 'High',
    deadlineDays: [21, 22, 23, 24, 25, 25, 27, 28, 29, 30],
    tasks: [
      'Create all collections',
      'Create collection hierarchy',
      'Setup collection banners',
      'Setup collection descriptions',
      'Configure filters',
      'Configure sorting',
      'Setup collection templates',
      'Add SEO metadata',
      'Setup breadcrumbs',
      'Configure pagination/load more',
    ],
  },
  {
    name: 'Product Setup',
    tag: 'product-setup',
    priority: 'High',
    deadlineDays: [
      21, 21, 22, 22, 23, 23, 24, 24, 25, 25, 26, 26, 27, 27, 28, 28, 29, 29,
      30, 30, 31, 31, 32, 32, 33, 33, 34, 34, 35, 35, 35, 35, 35,
    ],
    tasks: [
      'Create product titles',
      'Create product descriptions',
      'Upload product images',
      'Upload lifestyle images',
      'Add videos',
      'Add pricing',
      'Add compare price',
      'Configure variants',
      'Configure SKU',
      'Configure barcode',
      'Configure inventory',
      'Configure weight',
      'Configure shipping profile',
      'Configure product type',
      'Configure vendor',
      'Configure tags',
      'Configure collections',
      'Add metafields',
      'Add stone benefits',
      'Add care instructions',
      'Add authenticity info',
      'Add FAQ section',
      'Add trust badges',
      'Add related products',
      'Add upsell products',
      'Add cross sell products',
      'Configure SEO title',
      'Configure SEO description',
      'Configure URL handle',
    ],
  },
  {
    name: 'PDP',
    tag: 'pdp',
    priority: 'High',
    deadlineDays: [
      21, 22, 22, 23, 23, 24, 24, 25, 25, 26, 26, 27, 27, 28, 28, 29, 29, 30,
      30, 31, 31, 32, 32, 33,
    ],
    tasks: [
      'Product gallery',
      'Variant selector',
      'Price section',
      'Discount badge',
      'Add to cart button',
      'Buy now button',
      'Sticky ATC',
      'Product description',
      'Product tabs',
      'Stone benefits section',
      'Intention section',
      'Trust badges',
      'Shipping info',
      'Return policy',
      'Customer reviews',
      'Related products',
      'Recently viewed',
      'FAQ accordion',
      'Size guide',
      'Inventory status',
      'Estimated delivery',
      'Social sharing',
      'WhatsApp support button',
    ],
  },
  {
    name: 'Cart',
    tag: 'cart',
    priority: 'High',
    deadlineDays: [28, 29, 30, 31, 32, 33, 35, 36, 37, 38],
    tasks: [
      'Drawer cart',
      'Cart page',
      'Quantity update',
      'Remove item',
      'Coupon field',
      'Shipping estimator',
      'Upsell products',
      'Free shipping progress bar',
      'Trust badges',
      'Checkout CTA',
    ],
  },
  {
    name: 'Checkout',
    tag: 'checkout',
    priority: 'High',
    deadlineDays: [28, 30, 32, 34, 36, 42],
    tasks: [
      'Branding customization',
      'Payment methods',
      'COD setup',
      'Shipping methods',
      'Abandoned cart recovery',
      'Checkout upsells',
    ],
  },
  {
    name: 'Inventory Management',
    tag: 'inventory-management',
    priority: 'Medium',
    deadlineDays: [42, 43, 44, 45, 46, 47],
    tasks: [
      'Inventory tracking',
      'Low stock alerts',
      'SKU management',
      'Warehouse location setup',
      'Stock sync',
      'Bulk inventory upload',
    ],
  },
  {
    name: 'Apps & Integrations',
    tag: 'apps-integrations',
    priority: 'Medium',
    deadlineDays: [
      42, 42, 43, 43, 44, 44, 45, 45, 46, 46, 47, 47, 48, 48,
    ],
    tasks: [
      'Reviews app',
      'Wishlist app',
      'Loyalty/rewards app',
      'WhatsApp chat',
      'Email marketing',
      'SMS marketing',
      'Analytics app',
      'SEO app',
      'Speed optimization app',
      'Instagram integration',
      'Facebook pixel',
      'Google Analytics',
      'Google Search Console',
      'Meta Commerce setup',
    ],
  },
  {
    name: 'SEO',
    tag: 'seo',
    priority: 'Medium',
    deadlineDays: [42, 43, 44, 45, 46, 47, 48, 49, 50],
    tasks: [
      'Homepage SEO',
      'Product SEO',
      'Collection SEO',
      'Image alt tags',
      'Schema markup',
      'Sitemap submission',
      'Robots.txt check',
      'Internal linking',
      'Blog SEO',
    ],
  },
  {
    name: 'Performance',
    tag: 'performance',
    priority: 'Medium',
    deadlineDays: [45, 46, 47, 48, 49, 50],
    tasks: [
      'Compress images',
      'Lazy loading',
      'Remove unused apps',
      'Optimize scripts',
      'Mobile optimization',
      'Core Web Vitals optimization',
    ],
  },
  {
    name: 'Trust Building',
    tag: 'trust-building',
    priority: 'Medium',
    deadlineDays: [42, 43, 44, 45, 46, 47, 48],
    tasks: [
      'Customer reviews',
      'UGC content',
      'Testimonials',
      'Secure payment badges',
      'Authenticity certificates',
      'About founder section',
      'Brand story page',
    ],
  },
  {
    name: 'Marketing',
    tag: 'marketing',
    priority: 'Medium',
    deadlineDays: [45, 46, 47, 48, 49, 50, 51, 52, 53],
    tasks: [
      'Email flows',
      'Abandoned cart flow',
      'Welcome email flow',
      'Instagram content',
      'Pinterest setup',
      'Meta ads setup',
      'Google ads setup',
      'Influencer outreach',
      'Affiliate program',
    ],
  },
  {
    name: 'Analytics & Tracking',
    tag: 'analytics-tracking',
    priority: 'Medium',
    deadlineDays: [48, 49, 50, 51, 52, 53],
    tasks: [
      'Conversion tracking',
      'Funnel tracking',
      'Heatmaps',
      'Session recordings',
      'Add to cart tracking',
      'Purchase tracking',
    ],
  },
  {
    name: 'Final QA',
    tag: 'final-qa',
    priority: 'Medium',
    deadlineDays: [52, 53, 54, 55, 56, 57, 58, 58, 59, 59],
    tasks: [
      'Mobile testing',
      'Tablet testing',
      'Desktop testing',
      'Browser testing',
      'Payment testing',
      'Shipping testing',
      'Inventory testing',
      'Speed testing',
      'SEO audit',
      'Broken links check',
    ],
  },
  {
    name: 'Launch',
    tag: 'launch',
    priority: 'High',
    deadlineDays: [60, 60, 60, 60, 60, 60, 60, 60],
    tasks: [
      'Remove password protection',
      'Final backup',
      'Launch announcement',
      'Send launch email',
      'Start ads',
      'Monitor orders',
      'Monitor bugs',
      'Monitor analytics',
    ],
  },
];

function buildTasks() {
  const tasks = [];
  for (const section of sections) {
    section.tasks.forEach((taskName, i) => {
      const dayOffset =
        section.deadlineDays[i] ?? section.deadlineDays[section.deadlineDays.length - 1];
      tasks.push({
        name: `${section.name} - ${taskName}`,
        description: '',
        owner: null,
        department: 'Website',
        priority: section.priority,
        status: 'Pending',
        deadline: daysFromNow(dayOffset),
        notes: '',
        dependencies: [],
        tags: [section.tag],
      });
    });
  }
  return tasks;
}

async function seed() {
  const tasks = buildTasks();
  console.log(`Seeding ${tasks.length} Website tasks…`);

  const BATCH = 50;
  let inserted = 0;
  for (let i = 0; i < tasks.length; i += BATCH) {
    const batch = tasks.slice(i, i + BATCH);
    const { error } = await supabase.from('tasks').insert(batch);
    if (error) {
      console.error('Insert error:', error.message);
      process.exit(1);
    }
    inserted += batch.length;
    console.log(`  inserted ${inserted}/${tasks.length}`);
  }

  console.log('Done!');
}

seed();
