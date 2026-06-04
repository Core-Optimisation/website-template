import { getPayload } from 'payload';
import config from '@payload-config';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = join(__dirname, 'assets');

/** Build a minimal Lexical richText value from plain paragraphs. */
function richText(...paragraphs: string[]) {
  return {
    root: {
      type: 'root',
      format: '' as const,
      indent: 0,
      version: 1,
      direction: 'ltr' as const,
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        format: '' as const,
        indent: 0,
        version: 1,
        direction: 'ltr' as const,
        children: [
          {
            type: 'text',
            text,
            format: 0,
            detail: 0,
            mode: 'normal',
            style: '',
            version: 1,
          },
        ],
      })),
    },
  };
}

const seed = async () => {
  const payload = await getPayload({ config });

  payload.logger.info('— SiteForge seed: Waterford Festival of Food demo —');

  // 1. Admin user ----------------------------------------------------------
  const adminEmail = 'admin@siteforge.dev';
  const existingUsers = await payload.find({
    collection: 'users',
    where: { email: { equals: adminEmail } },
    limit: 1,
  });
  if (existingUsers.totalDocs === 0) {
    await payload.create({
      collection: 'users',
      data: { name: 'Festival Admin', email: adminEmail, password: 'changeme123' },
    });
    payload.logger.info(`Created admin user ${adminEmail} (password: changeme123)`);
  } else {
    payload.logger.info('Admin user already exists — skipping.');
  }

  // 2. Media — upload from ./assets, or generate solid-colour placeholders -
  const palette = ['#7a8b3a', '#b06a3b', '#3a6b8b', '#8b3a6b', '#5a7a4a', '#a8843b'];

  const upsertMedia = async (filename: string, alt: string, colorIndex = 0): Promise<number> => {
    const found = await payload.find({
      collection: 'media',
      where: { alt: { equals: alt } },
      limit: 1,
    });
    if (found.totalDocs > 0) return found.docs[0].id as number;

    const assetPath = join(ASSETS_DIR, filename);
    let data: Buffer;
    let name = filename;
    let mimetype = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';

    if (existsSync(assetPath)) {
      data = readFileSync(assetPath);
    } else {
      // Generate a simple solid-colour placeholder so the seed never fails.
      const color = palette[colorIndex % palette.length];
      data = await sharp({
        create: { width: 1200, height: 800, channels: 3, background: color },
      })
        .png()
        .toBuffer();
      name = filename.replace(/\.(jpe?g)$/i, '.png');
      mimetype = 'image/png';
    }

    const doc = await payload.create({
      collection: 'media',
      data: { alt },
      file: { data, name, mimetype, size: data.length },
    });
    return doc.id as number;
  };

  const heroImg = await upsertMedia('hero.jpg', 'Festival crowd in Dungarvan', 0);
  const diningImg = await upsertMedia('dining.jpg', 'Long-table dining experience', 1);
  const producersImg = await upsertMedia('producers.jpg', 'Local food producers', 2);
  const logoImg = await upsertMedia('logo.png', 'Waterford Festival of Food logo', 4);
  const sponsors: number[] = [];
  for (let i = 1; i <= 4; i++) {
    sponsors.push(await upsertMedia(`sponsor-${i}.png`, `Festival sponsor ${i}`, i));
  }

  // 3. Categories ----------------------------------------------------------
  const upsertCategory = async (title: string, slug: string, description: string) => {
    const found = await payload.find({
      collection: 'categories',
      where: { slug: { equals: slug } },
      limit: 1,
    });
    if (found.totalDocs > 0) return found.docs[0];
    return payload.create({ collection: 'categories', data: { title, slug, description } });
  };

  const producerStories = await upsertCategory(
    'Producer Stories',
    'producer-stories',
    'Profiles of the growers, fishers and makers of West Waterford.',
  );
  const festivalNews = await upsertCategory(
    'Festival News',
    'festival-news',
    'Announcements and news from the festival.',
  );
  const recipes = await upsertCategory('Recipes', 'recipes', 'Dishes and ideas from the region.');

  // 4. Posts ---------------------------------------------------------------
  const upsertPost = async (data: {
    title: string;
    slug: string;
    excerpt: string;
    category: number;
    coverImage: number;
    tags: string[];
    body: string[];
    publishedAt: string;
  }) => {
    const found = await payload.find({
      collection: 'posts',
      where: { slug: { equals: data.slug } },
      limit: 1,
    });
    if (found.totalDocs > 0) return found.docs[0];
    return payload.create({
      collection: 'posts',
      data: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        category: data.category,
        coverImage: data.coverImage,
        tags: data.tags.map((tag) => ({ tag })),
        body: richText(...data.body),
        publishedAt: data.publishedAt,
        _status: 'published',
      },
    });
  };

  await upsertPost({
    title: 'Meet the Producers Behind the Festival',
    slug: 'meet-the-producers',
    excerpt:
      'The local growers, fishers and artisan makers of West Waterford who give the festival its flavour.',
    category: producerStories.id as number,
    coverImage: producersImg,
    tags: ['producers', 'west-waterford'],
    publishedAt: new Date('2026-02-10T09:00:00Z').toISOString(),
    body: [
      'West Waterford is a patchwork of small farms, coastal fishing boats and artisan kitchens, and the festival exists to celebrate the people behind them.',
      'From cheesemakers in the hills to fishers working out of Helvick Head, each producer brings a story shaped by the landscape they work in.',
      'Throughout the festival weekend you can meet many of them in person — at markets, tastings and on the farm visits that close the programme.',
    ],
  });

  await upsertPost({
    title: 'Your Weekend Guide to Dungarvan',
    slug: 'weekend-guide-dungarvan',
    excerpt: 'Food trails, harbour-town atmosphere and the live Culture Underground event guide.',
    category: festivalNews.id as number,
    coverImage: heroImg,
    tags: ['dungarvan', 'guide'],
    publishedAt: new Date('2026-03-05T09:00:00Z').toISOString(),
    body: [
      'Dungarvan is a harbour town built for wandering — compact, colourful, and packed with places to eat and drink.',
      'Follow the self-guided food trails between eateries and producers, then check the live Culture Underground guide for what is on right now.',
      'Whether you have a weekend or just a day, the town rewards the curious and the hungry alike.',
    ],
  });

  await upsertPost({
    title: 'A Long-Table Dinner in the Comeraghs',
    slug: 'long-table-dinner-comeraghs',
    excerpt:
      'Communal dining experiences set against the dramatic backdrop of the Comeragh Mountains.',
    category: recipes.id as number,
    coverImage: diningImg,
    tags: ['dining', 'comeraghs'],
    publishedAt: new Date('2026-03-20T09:00:00Z').toISOString(),
    body: [
      'There is something about eating together at a single long table that turns a meal into an occasion.',
      'Set against the Comeragh Mountains, the festival long-table dinners pair local produce with the chefs who know it best.',
      'Expect shared plates, generous pours and conversation with whoever happens to be seated beside you.',
    ],
  });

  // 5. Pages ---------------------------------------------------------------
  const upsertPage = async (title: string, slug: string, layout: unknown[]) => {
    const found = await payload.find({
      collection: 'pages',
      where: { slug: { equals: slug } },
      limit: 1,
    });
    if (found.totalDocs > 0) {
      await payload.update({
        collection: 'pages',
        id: found.docs[0].id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { layout: layout as any, _status: 'published' },
      });
      payload.logger.info(`Updated page /${slug}.`);
    } else {
      await payload.create({
        collection: 'pages',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { title, slug, layout: layout as any, _status: 'published' },
      });
      payload.logger.info(`Created page /${slug}.`);
    }
  };

  // --- Home ---------------------------------------------------------------
  await upsertPage('Home', 'home', [
    {
      blockType: 'hero',
      variant: 'centered',
      tagline: '24–26 April 2026',
      title: 'Waterford Festival of Food',
      subtitle:
        'Ireland’s longest-running food festival returns to Dungarvan and West Waterford this April.',
      actions: [
        { variant: 'primary', text: 'View 2026 Programme', href: '/programme' },
        { variant: 'secondary', text: 'Plan Your Visit', href: '/plan-your-visit' },
      ],
      image: heroImg,
      anchorId: 'top',
    },
    {
      blockType: 'note',
      content:
        'Ticket sales commence Friday 20th March 2026, with a second release on Tuesday 24th March.',
    },
    {
      blockType: 'content',
      title: 'A weekend of food, place and people',
      content: richText(
        'Chefs, producers, growers and food lovers gather across the region for dining experiences, markets, tastings, talks and family activities.',
        'It is a weekend that celebrates not just food, but the place and people that make it.',
      ),
      image: diningImg,
      isReversed: false,
    },
    {
      blockType: 'features',
      variant: 'grid',
      columns: '3',
      tagline: 'What’s on',
      title: 'Explore the festival',
      items: [
        { title: 'Food Trails', description: 'Self-guided trails through Dungarvan’s eateries and producers.', icon: 'tabler:map-2' },
        { title: 'Markets & Tastings', description: 'Artisan markets, cooking demos and producer tastings.', icon: 'tabler:basket' },
        { title: 'Long-Table Dining', description: 'Communal dining experiences set against the Comeraghs.', icon: 'tabler:tools-kitchen-2' },
        { title: 'Talks & Demos', description: 'Hear from chefs and growers behind the region’s food.', icon: 'tabler:microphone' },
        { title: 'Farm Visits', description: 'Get close to where the food is grown and made.', icon: 'tabler:plant-2' },
        { title: 'Family Events', description: 'Activities for all ages across the festival weekend.', icon: 'tabler:mood-kid' },
      ],
    },
    {
      blockType: 'content',
      title: 'Taste Waterford',
      content: richText(
        'Behind every dish is a person and a place. Discover the producers, recipes and stories that make West Waterford’s food worth travelling for.',
      ),
      callToAction: { variant: 'primary', text: 'Discover food stories', href: '/blog' },
      isAfterContent: true,
    },
    {
      blockType: 'content',
      anchorId: 'culture-underground',
      title: 'Live event guide — Culture Underground',
      content: richText(
        'Explore a live, mobile-friendly event guide. Find events, venue directions and what’s on now over the weekend at cultureunderground.ie.',
      ),
      callToAction: {
        variant: 'secondary',
        text: 'Open the live guide',
        href: 'https://cultureunderground.ie',
        target: '_blank',
      },
    },
    {
      blockType: 'blogLatestPosts',
      title: 'Festival stories',
      information: 'News, producer profiles and recipes from the festival.',
      count: 3,
      linkText: 'All stories',
      linkUrl: '/blog',
    },
    {
      blockType: 'brands',
      anchorId: 'sponsors',
      title: 'Festival Sponsors',
      subtitle: 'Made possible with the support of our sponsors.',
      images: sponsors.map((image) => ({ image })),
    },
    {
      blockType: 'callToAction',
      anchorId: 'newsletter',
      title: 'Festival Newsletter',
      subtitle: 'Stay up to date with festival announcements.',
      actions: [{ variant: 'primary', text: 'Sign Up', href: '/#newsletter' }],
    },
  ]);

  // --- About --------------------------------------------------------------
  await upsertPage('About', 'about', [
    {
      blockType: 'hero',
      variant: 'split',
      tagline: 'About',
      title: 'Celebrating West Waterford’s food culture',
      subtitle: 'Set against the backdrop of Dungarvan and the Comeragh Mountains.',
      image: heroImg,
    },
    {
      blockType: 'content',
      content: richText(
        'The Waterford Festival of Food is Ireland’s longest-running food festival, bringing chefs, producers, growers and food lovers together each April.',
        'Across the weekend the festival hosts dining experiences, markets, talks, tastings, food trails and family events throughout Dungarvan and West Waterford.',
      ),
    },
    {
      blockType: 'stats',
      stats: [
        { amount: '15+', title: 'Years running' },
        { amount: '3', title: 'Festival days' },
        { amount: '50+', title: 'Producers & venues' },
      ],
    },
    {
      blockType: 'callToAction',
      title: 'Want to get involved?',
      subtitle: 'Volunteers help make the festival happen.',
      actions: [{ variant: 'primary', text: 'Volunteer with us', href: '/volunteer' }],
    },
  ]);

  // --- Programme ----------------------------------------------------------
  await upsertPage('Programme', 'programme', [
    {
      blockType: 'hero',
      variant: 'centered',
      tagline: '24–26 April 2026',
      title: '2026 Programme',
      subtitle:
        'Three days of dining, markets, talks and trails across Dungarvan and West Waterford.',
    },
    {
      blockType: 'steps',
      variant: 'timeline',
      title: 'Festival weekend',
      items: [
        { title: 'Friday 24 April — Opening & Long-Table Dinner', description: 'The festival opens with a communal dining experience.', icon: 'tabler:glass-full' },
        { title: 'Saturday 25 April — Markets, Demos & Trails', description: 'Artisan markets, cooking demonstrations and self-guided food trails.', icon: 'tabler:basket' },
        { title: 'Sunday 26 April — Farm Visits & Family Day', description: 'Producer visits and family-friendly activities to close the weekend.', icon: 'tabler:plant-2' },
      ],
    },
    {
      blockType: 'faqs',
      columns: '2',
      title: 'Programme FAQs',
      items: [
        { title: 'When do tickets go on sale?', description: 'Ticket sales commence Friday 20th March 2026, with a second release on Tuesday 24th March.' },
        { title: 'Where do events take place?', description: 'Across Dungarvan town and the surrounding West Waterford countryside.' },
        { title: 'Is there a live event guide?', description: 'Yes — a mobile-friendly guide is available via Culture Underground at cultureunderground.ie.' },
        { title: 'Are events family friendly?', description: 'Many events are suitable for all ages, including farm visits and a family day.' },
      ],
    },
  ]);

  // --- Plan Your Visit ----------------------------------------------------
  await upsertPage('Plan Your Visit', 'plan-your-visit', [
    {
      blockType: 'hero',
      variant: 'centered',
      tagline: 'Plan Your Visit',
      title: 'Getting to Dungarvan',
      subtitle: 'A harbour town on Ireland’s south-east coast, in the heart of West Waterford.',
    },
    {
      blockType: 'content',
      title: 'Where to find us',
      content: richText(
        'Dungarvan sits on the N25 between Cork and Waterford city, with regional bus links into the town centre.',
        'Parking is available around the town, and most festival venues are within easy walking distance of one another.',
        'Book accommodation early — the town’s hotels, guesthouses and B&Bs fill quickly over the festival weekend.',
      ),
      image: diningImg,
    },
    {
      blockType: 'features',
      variant: 'twocol',
      columns: '2',
      title: 'Good to know',
      items: [
        { title: 'Getting here', description: 'By car via the N25; regional bus links to Dungarvan.', icon: 'tabler:car' },
        { title: 'Where to stay', description: 'Hotels, guesthouses and B&Bs in and around the town.', icon: 'tabler:bed' },
        { title: 'Accessibility', description: 'Many venues are accessible; check the live guide for details.', icon: 'tabler:accessible' },
        { title: 'Live guide', description: 'Use Culture Underground for venue directions and what’s-on-now.', icon: 'tabler:map-pin' },
      ],
    },
  ]);

  // --- Volunteer ----------------------------------------------------------
  await upsertPage('Volunteer', 'volunteer', [
    {
      blockType: 'hero',
      variant: 'centered',
      tagline: 'Volunteer',
      title: 'Be part of the festival',
      subtitle: 'Volunteers are at the heart of the Waterford Festival of Food.',
    },
    {
      blockType: 'content',
      content: richText(
        'Volunteering is the best way to experience the festival from the inside — helping at events, welcoming visitors and keeping the weekend running smoothly.',
        'Roles are flexible and suited to all kinds of people; many volunteers come back year after year for the atmosphere and the community.',
      ),
    },
    {
      blockType: 'callToAction',
      title: 'Register your interest',
      subtitle: 'We’ll be in touch with roles and times.',
      actions: [{ variant: 'primary', text: 'Sign up to volunteer', href: '/#newsletter' }],
    },
  ]);

  // 6. Contact form + page -------------------------------------------------
  const upsertForm = async (title: string, data: Record<string, unknown>): Promise<number> => {
    const found = await payload.find({
      collection: 'forms',
      where: { title: { equals: title } },
      limit: 1,
    });
    if (found.totalDocs > 0) {
      await payload.update({
        collection: 'forms',
        id: found.docs[0].id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: data as any,
      });
      payload.logger.info(`Updated form “${title}”.`);
      return found.docs[0].id as number;
    }
    const created = await payload.create({
      collection: 'forms',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { title, ...data } as any,
    });
    payload.logger.info(`Created form “${title}”.`);
    return created.id as number;
  };

  const contactFormId = await upsertForm('Contact', {
    submitButtonLabel: 'Send message',
    confirmationType: 'message',
    confirmationMessage: richText(
      'Thanks for getting in touch — a member of the festival team will reply within a few days.',
    ),
    fields: [
      { blockType: 'text', name: 'full-name', label: 'Full name', required: true, width: 100 },
      { blockType: 'email', name: 'email', label: 'Email address', required: true, width: 100 },
      {
        blockType: 'select',
        name: 'topic',
        label: 'What is your enquiry about?',
        required: true,
        width: 100,
        options: [
          { label: 'General enquiry', value: 'general' },
          { label: 'Tickets & programme', value: 'tickets' },
          { label: 'Becoming a stallholder', value: 'stallholder' },
          { label: 'Sponsorship', value: 'sponsorship' },
          { label: 'Press & media', value: 'press' },
        ],
      },
      { blockType: 'textarea', name: 'message', label: 'Message', required: true, width: 100 },
    ],
  });

  await upsertPage('Contact', 'contact', [
    {
      blockType: 'hero',
      variant: 'centered',
      tagline: 'Contact',
      title: 'Get in touch',
      subtitle: 'Questions about the festival, tickets or taking part? Send us a message.',
    },
    {
      blockType: 'formBlock',
      title: 'Send us a message',
      subtitle: 'We read every message and aim to reply within a few days.',
      form: contactFormId,
    },
  ]);

  // 7. Redirects (demo) ----------------------------------------------------
  const upsertRedirect = async (from: string, to: Record<string, unknown>) => {
    const found = await payload.find({
      collection: 'redirects',
      where: { from: { equals: from } },
      limit: 1,
    });
    if (found.totalDocs > 0) {
      await payload.update({
        collection: 'redirects',
        id: found.docs[0].id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { from, to } as any,
      });
      payload.logger.info(`Updated redirect ${from}.`);
    } else {
      await payload.create({
        collection: 'redirects',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { from, to } as any,
      });
      payload.logger.info(`Created redirect ${from}.`);
    }
  };

  // Resolve the Programme page so a reference redirect can point at it.
  const programmePage = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'programme' } },
    limit: 1,
  });
  if (programmePage.totalDocs > 0) {
    await upsertRedirect('/whats-on', {
      type: 'reference',
      reference: { relationTo: 'pages', value: programmePage.docs[0].id },
    });
  }
  await upsertRedirect('/get-in-touch', { type: 'custom', url: '/contact' });

  // 8. Navigation global ---------------------------------------------------
  await payload.updateGlobal({
    slug: 'navigation',
    data: {
      header: {
        links: [
          { text: 'About', href: '/about' },
          { text: 'Programme', href: '/programme' },
          { text: 'Plan Your Visit', href: '/plan-your-visit' },
          { text: 'Volunteer', href: '/volunteer' },
          { text: 'Contact', href: '/contact' },
          { text: 'Search', href: '/search' },
        ],
        actions: [{ variant: 'primary', text: 'View 2026 Programme', href: '/programme' }],
      },
      footer: {
        columns: [
          {
            title: 'Explore',
            links: [
              { text: 'Programme', href: '/programme' },
              { text: 'Plan Your Visit', href: '/plan-your-visit' },
              { text: 'About', href: '/about' },
              { text: 'Volunteer', href: '/volunteer' },
              { text: 'Contact', href: '/contact' },
              { text: 'Search', href: '/search' },
            ],
          },
          {
            title: 'Festival',
            links: [
              { text: 'Sponsors', href: '/#sponsors' },
              { text: 'Newsletter', href: '/#newsletter' },
              { text: 'Culture Underground guide', href: 'https://cultureunderground.ie' },
            ],
          },
        ],
        socialLinks: [
          { label: 'Instagram', icon: 'tabler:brand-instagram', href: '#' },
          { label: 'Facebook', icon: 'tabler:brand-facebook', href: '#' },
        ],
        note: 'An annual celebration of the food, producers and landscapes of Waterford, based in Dungarvan.',
        legalLinks: [
          { text: 'Terms', href: '/terms' },
          { text: 'Cookies', href: '/cookies' },
        ],
      },
    },
  });

  // 9. SiteSettings global -------------------------------------------------
  await payload.updateGlobal({
    slug: 'siteSettings',
    data: {
      siteName: 'Waterford Festival of Food',
      tagline: 'Ireland’s longest-running food festival — Dungarvan & West Waterford',
      logo: logoImg,
      defaultSeo: {
        metaTitle: 'Waterford Festival of Food',
        titleTemplate: '%s — Waterford Festival of Food',
        metaDescription:
          'A weekend celebrating the food, producers and landscapes of West Waterford. 24–26 April 2026.',
      },
      theme: { mode: 'system', accentColor: '#7a8b3a' },
    },
  });

  const homeUrl = `${process.env.WEB_PUBLIC_URL ?? 'http://localhost:4321'}/`;
  const adminUrl = `${process.env.PAYLOAD_PUBLIC_SERVER_URL ?? 'http://localhost:3000'}/admin`;
  payload.logger.info(
    `Seed complete. Home: ${homeUrl}  Admin: ${adminUrl} (admin@siteforge.dev / changeme123)`,
  );
};

// Top-level await so `payload run` waits for seeding to finish before exiting.
await seed();
