// Centralized repository of high-demand intercity travel routes for SEO landing pages and Google Rich Snippets

export const POPULAR_ROUTES = [
  {
    slug: 'pune-to-mumbai-cabs',
    aliases: ['pune-to-mumbai', 'pune-mumbai-taxi'],
    fromShort: 'Pune',
    toShort: 'Mumbai',
    fromAddress: 'Pune, Maharashtra, India',
    toAddress: 'Mumbai, Maharashtra, India',
    fromLat: 18.52043,
    fromLng: 73.856743,
    toLat: 19.07609,
    toLng: 72.877707,
    distanceKm: 150,
    durationHours: '3.0 Hours',
    startingFare: 1599,
    highway: 'Mumbai-Pune Expressway',
    tagline: 'Fastest doorstep one-way & round-trip cab on the Mumbai-Pune Expressway',
    overview: 'Traveling between Maharashtra’s cultural capital and financial powerhouse has never been easier. Rentox provides reliable, sanitized AC cabs from any point in Pune (Hinjawadi, Kothrud, Viman Nagar, Pune Airport) straight to any destination in Mumbai (South Mumbai, Dadar, Bandra, Andheri, Mumbai Airport T2). Enjoy comfortable highway driving with verified drivers, zero surge surprises, and guaranteed on-time pickups.',
    carFares: [
      { type: 'Hatchback', models: 'WagonR, Tiago or equivalent', fare: 1599, seats: 4, bags: 2 },
      { type: 'Sedan', models: 'Dzire, Etios or equivalent', fare: 1799, seats: 4, bags: 3 },
      { type: 'SUV (6+1)', models: 'Ertiga, Carens or equivalent', fare: 2499, seats: 6, bags: 4 },
      { type: 'Premium SUV', models: 'Innova Crysta', fare: 3699, seats: 7, bags: 5 }
    ],
    faqs: [
      {
        q: 'What is the cab fare from Pune to Mumbai with Rentox?',
        a: 'Pune to Mumbai cab fares start at ₹1,599 for a Hatchback, ₹1,799 for an AC Sedan (Dzire/Etios), and ₹2,499 for a 6-seater Ertiga SUV. Zero hidden booking fees.'
      },
      {
        q: 'Can I book a one-way cab without paying return fare?',
        a: 'Yes! Rentox specializes in one-way intercity drops. You only pay for the distance you travel from Pune to Mumbai, with zero return fare penalty.'
      },
      {
        q: 'Are night pickups available on the Mumbai-Pune Expressway?',
        a: 'Yes, Rentox operates 24x7. We have experienced highway drivers trained for smooth, safe night journeys along the expressway.'
      },
      {
        q: 'Can the driver pick me up directly from Pune Airport?',
        a: 'Yes. Simply select Pune Airport as your pickup location and your verified driver will meet you right outside the arrivals terminal.'
      }
    ]
  },
  {
    slug: 'mumbai-to-pune-cabs',
    aliases: ['mumbai-to-pune', 'mumbai-pune-taxi'],
    fromShort: 'Mumbai',
    toShort: 'Pune',
    fromAddress: 'Mumbai, Maharashtra, India',
    toAddress: 'Pune, Maharashtra, India',
    fromLat: 19.07609,
    fromLng: 72.877707,
    toLat: 18.52043,
    toLng: 73.856743,
    distanceKm: 150,
    durationHours: '3.0 Hours',
    startingFare: 1599,
    highway: 'Mumbai-Pune Expressway',
    tagline: 'Reliable AC cabs from Mumbai & Airport to Pune IT hubs & city',
    overview: 'Heading from Mumbai to Pune for work, meetings in Hinjawadi, or returning home? Rentox delivers punctual doorstep service across South Mumbai, Thane, Navi Mumbai, and Mumbai Airport T1/T2. Relax in clean, air-conditioned vehicles driven by professional chauffeurs.',
    carFares: [
      { type: 'Hatchback', models: 'WagonR, Tiago or equivalent', fare: 1599, seats: 4, bags: 2 },
      { type: 'Sedan', models: 'Dzire, Etios or equivalent', fare: 1799, seats: 4, bags: 3 },
      { type: 'SUV (6+1)', models: 'Ertiga, Carens or equivalent', fare: 2499, seats: 6, bags: 4 },
      { type: 'Premium SUV', models: 'Innova Crysta', fare: 3699, seats: 7, bags: 5 }
    ],
    faqs: [
      {
        q: 'How much does a Mumbai to Pune taxi cost?',
        a: 'Rentox rates start at ₹1,599 for Hatchbacks and ₹1,799 for Sedans. What you see is what you pay.'
      },
      {
        q: 'Can I get picked up directly from Mumbai International Airport (BOM T2)?',
        a: 'Yes, we provide 24/7 dedicated flight-arrival pickups from both Terminal 1 and Terminal 2 directly to Pune.'
      },
      {
        q: 'How long does the journey take?',
        a: 'The 150 km drive via the Mumbai-Pune Expressway takes approximately 3 to 3.5 hours depending on city exit traffic.'
      }
    ]
  },
  {
    slug: 'pune-to-shirdi-cabs',
    aliases: ['pune-to-shirdi', 'pune-shirdi-taxi'],
    fromShort: 'Pune',
    toShort: 'Shirdi',
    fromAddress: 'Pune, Maharashtra, India',
    toAddress: 'Shirdi, Maharashtra, India',
    fromLat: 18.52043,
    fromLng: 73.856743,
    toLat: 19.7667,
    toLng: 74.4764,
    distanceKm: 205,
    durationHours: '4.5 Hours',
    startingFare: 2799,
    highway: 'Pune-Nashik Highway / Sangamner',
    tagline: 'Peaceful Sai Baba Darshan Pilgrimage with comfortable AC cabs',
    overview: 'Make your pilgrimage to the holy shrine of Sai Baba in Shirdi peaceful and spiritually fulfilling. Rentox offers hassle-free one-way and same-day or multi-day round-trip packages from Pune. Clean family-friendly cabs with space for luggage and senior citizens.',
    carFares: [
      { type: 'Hatchback', models: 'WagonR, Tiago or equivalent', fare: 2799, seats: 4, bags: 2 },
      { type: 'Sedan', models: 'Dzire, Etios or equivalent', fare: 3199, seats: 4, bags: 3 },
      { type: 'SUV (6+1)', models: 'Ertiga, Carens or equivalent', fare: 4299, seats: 6, bags: 4 },
      { type: 'Premium SUV', models: 'Innova Crysta', fare: 5999, seats: 7, bags: 5 }
    ],
    faqs: [
      {
        q: 'Can the driver wait while I attend Sai Baba Darshan in Shirdi?',
        a: 'Yes! If you choose a Round-Trip booking, your dedicated driver will wait at Shirdi and drive you back to Pune comfortably.'
      },
      {
        q: 'What is the one-way fare from Pune to Shirdi?',
        a: 'One-way fares start at ₹2,799 for Hatchback and ₹3,199 for Sedan.'
      }
    ]
  },
  {
    slug: 'mumbai-to-shirdi-cabs',
    aliases: ['mumbai-to-shirdi', 'mumbai-shirdi-taxi'],
    fromShort: 'Mumbai',
    toShort: 'Shirdi',
    fromAddress: 'Mumbai, Maharashtra, India',
    toAddress: 'Shirdi, Maharashtra, India',
    fromLat: 19.07609,
    fromLng: 72.877707,
    toLat: 19.7667,
    toLng: 74.4764,
    distanceKm: 240,
    durationHours: '4.5 - 5.0 Hours',
    startingFare: 3199,
    highway: 'Samruddhi Mahamarg / NH 160',
    tagline: 'Fast and serene journey to Shirdi via Samruddhi Mahamarg',
    overview: 'Experience the smoothest drive to Shirdi Sai Baba Temple from Mumbai. Enjoy fast connectivity via Samruddhi Expressway. Ideal for families and elderly passengers looking for a safe, bump-free ride.',
    carFares: [
      { type: 'Hatchback', models: 'WagonR, Tiago or equivalent', fare: 3199, seats: 4, bags: 2 },
      { type: 'Sedan', models: 'Dzire, Etios or equivalent', fare: 3699, seats: 4, bags: 3 },
      { type: 'SUV (6+1)', models: 'Ertiga, Carens or equivalent', fare: 4999, seats: 6, bags: 4 },
      { type: 'Premium SUV', models: 'Innova Crysta', fare: 6999, seats: 7, bags: 5 }
    ],
    faqs: [
      {
        q: 'How fast can I reach Shirdi from Mumbai?',
        a: 'With new expressway connectivity, travel time is reduced to around 4.5 hours from Thane / Eastern Express Highway.'
      }
    ]
  },
  {
    slug: 'pune-to-nashik-cabs',
    aliases: ['pune-to-nashik', 'pune-nashik-taxi'],
    fromShort: 'Pune',
    toShort: 'Nashik',
    fromAddress: 'Pune, Maharashtra, India',
    toAddress: 'Nashik, Maharashtra, India',
    fromLat: 18.52043,
    fromLng: 73.856743,
    toLat: 19.9975,
    toLng: 73.7898,
    distanceKm: 210,
    durationHours: '4.5 Hours',
    startingFare: 2899,
    highway: 'NH 60 (Pune-Nashik Highway)',
    tagline: 'Scenic rides to the Wine Capital & Trimbakeshwar pilgrimage',
    overview: 'Whether visiting Sula Vineyards, attending business meetings, or taking a holy dip at Trimbakeshwar, Rentox connects Pune to Nashik seamlessly with clean, air-conditioned cabs and verified highway drivers.',
    carFares: [
      { type: 'Hatchback', models: 'WagonR, Tiago or equivalent', fare: 2899, seats: 4, bags: 2 },
      { type: 'Sedan', models: 'Dzire, Etios or equivalent', fare: 3299, seats: 4, bags: 3 },
      { type: 'SUV (6+1)', models: 'Ertiga, Carens or equivalent', fare: 4499, seats: 6, bags: 4 },
      { type: 'Premium SUV', models: 'Innova Crysta', fare: 6299, seats: 7, bags: 5 }
    ],
    faqs: [
      {
        q: 'What is the Pune to Nashik cab fare?',
        a: 'One-way fares start from ₹2,899 for Hatchback and ₹3,299 for Sedan.'
      }
    ]
  },
  {
    slug: 'mumbai-to-nashik-cabs',
    aliases: ['mumbai-to-nashik', 'mumbai-nashik-taxi'],
    fromShort: 'Mumbai',
    toShort: 'Nashik',
    fromAddress: 'Mumbai, Maharashtra, India',
    toAddress: 'Nashik, Maharashtra, India',
    fromLat: 19.07609,
    fromLng: 72.877707,
    toLat: 19.9975,
    toLng: 73.7898,
    distanceKm: 165,
    durationHours: '3.5 Hours',
    startingFare: 2299,
    highway: 'NH 160 via Kasara Ghat',
    tagline: 'Breathtaking drive through Kasara Ghats to Nashik Vineyards',
    overview: 'Drive through the scenic Western Ghats and Kasara Ghat to Nashik. Rentox provides comfortable vehicles with well-rested drivers familiar with mountain road safety.',
    carFares: [
      { type: 'Hatchback', models: 'WagonR, Tiago or equivalent', fare: 2299, seats: 4, bags: 2 },
      { type: 'Sedan', models: 'Dzire, Etios or equivalent', fare: 2699, seats: 4, bags: 3 },
      { type: 'SUV (6+1)', models: 'Ertiga, Carens or equivalent', fare: 3799, seats: 6, bags: 4 },
      { type: 'Premium SUV', models: 'Innova Crysta', fare: 5299, seats: 7, bags: 5 }
    ],
    faqs: [
      {
        q: 'Is it safe to travel through Kasara Ghat at night?',
        a: 'Yes, our experienced drivers regularly navigate the ghats and ensure top safety standards with 24/7 customer support.'
      }
    ]
  },
  {
    slug: 'pune-to-lonavala-cabs',
    aliases: ['pune-to-lonavala', 'pune-lonavala-taxi'],
    fromShort: 'Pune',
    toShort: 'Lonavala',
    fromAddress: 'Pune, Maharashtra, India',
    toAddress: 'Lonavala, Maharashtra, India',
    fromLat: 18.52043,
    fromLng: 73.856743,
    toLat: 18.7557,
    toLng: 73.4091,
    distanceKm: 65,
    durationHours: '1.5 Hours',
    startingFare: 1299,
    highway: 'Mumbai-Pune Expressway',
    tagline: 'Quick weekend escape to waterfalls, chikki & Tiger Point',
    overview: 'Escape the city rush with an instant cab to Lonavala or Khandala. Ideal for day picnics, resort weekend getaways, and monsoon waterfall tours.',
    carFares: [
      { type: 'Hatchback', models: 'WagonR, Tiago or equivalent', fare: 1299, seats: 4, bags: 2 },
      { type: 'Sedan', models: 'Dzire, Etios or equivalent', fare: 1499, seats: 4, bags: 3 },
      { type: 'SUV (6+1)', models: 'Ertiga, Carens or equivalent', fare: 2199, seats: 6, bags: 4 },
      { type: 'Premium SUV', models: 'Innova Crysta', fare: 3199, seats: 7, bags: 5 }
    ],
    faqs: [
      {
        q: 'Can I book a same-day return trip to Lonavala?',
        a: 'Yes! Book a Round-Trip and your driver will stay with you throughout the day for sightseeing across Tiger Point, Bhushi Dam, and Karla Caves.'
      }
    ]
  },
  {
    slug: 'mumbai-to-lonavala-cabs',
    aliases: ['mumbai-to-lonavala', 'mumbai-lonavala-taxi'],
    fromShort: 'Mumbai',
    toShort: 'Lonavala',
    fromAddress: 'Mumbai, Maharashtra, India',
    toAddress: 'Lonavala, Maharashtra, India',
    fromLat: 19.07609,
    fromLng: 72.877707,
    toLat: 18.7557,
    toLng: 73.4091,
    distanceKm: 85,
    durationHours: '2.0 Hours',
    startingFare: 1499,
    highway: 'Mumbai-Pune Expressway',
    tagline: 'Your favorite hill-station getaway just 2 hours from Mumbai',
    overview: 'Enjoy the misty hill views of Khandala Ghat and Lonavala with a private Rentox cab right from your Mumbai doorstep.',
    carFares: [
      { type: 'Hatchback', models: 'WagonR, Tiago or equivalent', fare: 1499, seats: 4, bags: 2 },
      { type: 'Sedan', models: 'Dzire, Etios or equivalent', fare: 1799, seats: 4, bags: 3 },
      { type: 'SUV (6+1)', models: 'Ertiga, Carens or equivalent', fare: 2599, seats: 6, bags: 4 },
      { type: 'Premium SUV', models: 'Innova Crysta', fare: 3699, seats: 7, bags: 5 }
    ],
    faqs: [
      {
        q: 'How much is a cab from Mumbai to Lonavala?',
        a: 'One-way cabs start at ₹1,499 for Hatchbacks and ₹1,799 for Sedans.'
      }
    ]
  },
  {
    slug: 'pune-to-mahabaleshwar-cabs',
    aliases: ['pune-to-mahabaleshwar', 'pune-mahabaleshwar-taxi'],
    fromShort: 'Pune',
    toShort: 'Mahabaleshwar',
    fromAddress: 'Pune, Maharashtra, India',
    toAddress: 'Mahabaleshwar, Maharashtra, India',
    fromLat: 18.52043,
    fromLng: 73.856743,
    toLat: 17.9237,
    toLng: 73.6586,
    distanceKm: 120,
    durationHours: '3.0 Hours',
    startingFare: 1999,
    highway: 'NH 48 via Wai Ghat',
    tagline: 'Strawberry capital & Panchgani viewpoint retreat',
    overview: 'Breathe the cool mountain air of Mahabaleshwar and Panchgani. Rentox provides comfortable AC cabs ready for winding mountain roads and scenic family holidays.',
    carFares: [
      { type: 'Hatchback', models: 'WagonR, Tiago or equivalent', fare: 1999, seats: 4, bags: 2 },
      { type: 'Sedan', models: 'Dzire, Etios or equivalent', fare: 2299, seats: 4, bags: 3 },
      { type: 'SUV (6+1)', models: 'Ertiga, Carens or equivalent', fare: 3299, seats: 6, bags: 4 },
      { type: 'Premium SUV', models: 'Innova Crysta', fare: 4799, seats: 7, bags: 5 }
    ],
    faqs: [
      {
        q: 'Can the cab also cover Panchgani?',
        a: 'Yes, Panchgani is on the way to Mahabaleshwar and can easily be included in your itinerary.'
      }
    ]
  },
  {
    slug: 'mumbai-to-alibaug-cabs',
    aliases: ['mumbai-to-alibaug', 'mumbai-alibaug-taxi'],
    fromShort: 'Mumbai',
    toShort: 'Alibaug',
    fromAddress: 'Mumbai, Maharashtra, India',
    toAddress: 'Alibaug, Maharashtra, India',
    fromLat: 19.07609,
    fromLng: 72.877707,
    toLat: 18.6414,
    toLng: 72.8722,
    distanceKm: 95,
    durationHours: '2.5 Hours',
    startingFare: 1799,
    highway: 'MTHL (Atal Setu) / NH 66',
    tagline: 'Direct road trip to Alibaug beaches via Atal Setu (MTHL)',
    overview: 'Skip the crowded ferry! Travel in AC comfort straight to your Alibaug beach villa or resort via the new Atal Setu sea bridge.',
    carFares: [
      { type: 'Hatchback', models: 'WagonR, Tiago or equivalent', fare: 1799, seats: 4, bags: 2 },
      { type: 'Sedan', models: 'Dzire, Etios or equivalent', fare: 2099, seats: 4, bags: 3 },
      { type: 'SUV (6+1)', models: 'Ertiga, Carens or equivalent', fare: 2999, seats: 6, bags: 4 },
      { type: 'Premium SUV', models: 'Innova Crysta', fare: 4299, seats: 7, bags: 5 }
    ],
    faqs: [
      {
        q: 'Is traveling by car via Atal Setu faster than the ferry?',
        a: 'Yes, with Atal Setu you can reach Alibaug from South/Central Mumbai in about 2 hours with all your luggage intact.'
      }
    ]
  },
  {
    slug: 'kannur-to-calicut-cabs',
    aliases: ['kannur-to-calicut', 'kannur-calicut-taxi'],
    fromShort: 'Kannur',
    toShort: 'Calicut',
    fromAddress: 'Kannur, Kerala, India',
    toAddress: 'Kozhikode, Kerala, India',
    fromLat: 11.8745,
    fromLng: 75.3704,
    toLat: 11.2588,
    toLng: 75.7804,
    distanceKm: 90,
    durationHours: '2.5 Hours',
    startingFare: 1699,
    highway: 'NH 66 (North Kerala Coastal Corridor)',
    tagline: 'Reliable coastal intercity cabs between Kannur and Kozhikode',
    overview: 'Connecting Malabar’s two key cities with reliable, transparent cab service. Perfect for business travelers, hospital visits, and airport transfers.',
    carFares: [
      { type: 'Hatchback', models: 'WagonR, Tiago or equivalent', fare: 1699, seats: 4, bags: 2 },
      { type: 'Sedan', models: 'Dzire, Etios or equivalent', fare: 1999, seats: 4, bags: 3 },
      { type: 'SUV (6+1)', models: 'Ertiga, Carens or equivalent', fare: 2799, seats: 6, bags: 4 },
      { type: 'Premium SUV', models: 'Innova Crysta', fare: 3999, seats: 7, bags: 5 }
    ],
    faqs: [
      {
        q: 'Can I book a one-way cab from Kannur to Calicut Airport (CCJ)?',
        a: 'Yes, we provide direct one-way drops to Calicut Airport in Karipur with zero return fare charges.'
      }
    ]
  },
  {
    slug: 'kannur-to-bangalore-cabs',
    aliases: ['kannur-to-bangalore', 'kannur-bangalore-taxi'],
    fromShort: 'Kannur',
    toShort: 'Bangalore',
    fromAddress: 'Kannur, Kerala, India',
    toAddress: 'Bangalore, Karnataka, India',
    fromLat: 11.8745,
    fromLng: 75.3704,
    toLat: 12.9716,
    toLng: 77.5946,
    distanceKm: 310,
    durationHours: '6.5 Hours',
    startingFare: 4499,
    highway: 'via Virajpet - Mysore - Bengaluru Expressway',
    tagline: 'Smooth interstate drive across Coorg ghats & Mysore Expressway',
    overview: 'Travel seamlessly from Kannur to Bangalore via Coorg and the Mysore-Bangalore Expressway. Experience relaxed intercity travel without train waiting lists or bus luggage hassles.',
    carFares: [
      { type: 'Hatchback', models: 'WagonR, Tiago or equivalent', fare: 4499, seats: 4, bags: 2 },
      { type: 'Sedan', models: 'Dzire, Etios or equivalent', fare: 5199, seats: 4, bags: 3 },
      { type: 'SUV (6+1)', models: 'Ertiga, Carens or equivalent', fare: 7299, seats: 6, bags: 4 },
      { type: 'Premium SUV', models: 'Innova Crysta', fare: 9999, seats: 7, bags: 5 }
    ],
    faqs: [
      {
        q: 'Does the fare include interstate permit charges?',
        a: 'Karnataka border permit is calculated transparently so there are no surprises during the trip.'
      }
    ]
  }
];

// Helper to look up curated route or dynamically generate programmatic route for ANY city pair
export function getRouteBySlug(rawSlug) {
  if (!rawSlug) return null;
  const slug = rawSlug.toLowerCase().trim();

  // 1. Direct match or alias match
  const found = POPULAR_ROUTES.find(r => r.slug === slug || (r.aliases && r.aliases.includes(slug)));
  if (found) return found;

  // 2. Programmatic Dynamic Parsing for ANY route: e.g. "pune-to-goa-cabs" or "bangalore-to-mysore"
  const cleanSlug = slug.replace(/-cabs$/, '').replace(/-taxi$/, '');
  const parts = cleanSlug.split('-to-');
  if (parts.length === 2 && parts[0] && parts[1]) {
    const capitalize = (str) => str.replace(/\b\w/g, c => c.toUpperCase());
    const fromName = capitalize(parts[0].replace(/-/g, ' '));
    const toName = capitalize(parts[1].replace(/-/g, ' '));

    return {
      slug: `${parts[0]}-to-${parts[1]}-cabs`,
      fromShort: fromName,
      toShort: toName,
      fromAddress: `${fromName}, India`,
      toAddress: `${toName}, India`,
      fromLat: null,
      fromLng: null,
      toLat: null,
      toLng: null,
      distanceKm: 150,
      durationHours: '3 - 4 Hours',
      startingFare: 1599,
      highway: 'National & State Highways',
      tagline: `Book verified AC one-way & round-trip cabs from ${fromName} to ${toName}`,
      overview: `Looking for a comfortable, reliable ride from ${fromName} to ${toName}? Rentox provides instant one-way drops and flexible round-trip packages with clean AC vehicles, professional chauffeurs, and transparent per-km billing.`,
      carFares: [
        { type: 'Hatchback', models: 'WagonR, Tiago or equivalent', fare: 1599, seats: 4, bags: 2 },
        { type: 'Sedan', models: 'Dzire, Etios or equivalent', fare: 1799, seats: 4, bags: 3 },
        { type: 'SUV (6+1)', models: 'Ertiga, Carens or equivalent', fare: 2499, seats: 6, bags: 4 },
        { type: 'Premium SUV', models: 'Innova Crysta', fare: 3699, seats: 7, bags: 5 }
      ],
      faqs: [
        {
          q: `How much is the cab fare from ${fromName} to ${toName}?`,
          a: `Cab fares from ${fromName} to ${toName} on Rentox start from ₹1,599 for Hatchbacks and ₹1,799 for Sedans with guaranteed transparent pricing.`
        },
        {
          q: `Can I book a one-way drop from ${fromName} to ${toName}?`,
          a: `Yes, Rentox specializes in one-way intercity drops. You only pay for your travel from ${fromName} to ${toName} without return charges.`
        }
      ]
    };
  }

  return null;
}
