export const siteData = {
  name: "Studio of G10",
  tagline: "Portraits & Life Stories Captured with Heart",
  location: "Finland",
  description:
    "Creating expressive portraits and intimate event photography that celebrate culture, emotion, and real connections.",

  photographer: {
    name: "Jitendra",
    title: "Photographer & Founder",
    shortBio:
      "I'm the photographer behind Studio of G10, bringing stories to life through portrait and event photography. I'm based in Nepal, inspired by people, light, and the beauty of everyday moments.",
  },

  about: {
    hero: {
      headline: "Studio of G10 – Portraits & Life Stories Captured with Heart",
      intro:
        "Originally from Nepal but now based in Finland, I create expressive portraits and intimate event photography that celebrate culture, emotion, and real connections.",
    },

    story: {
      whoIAm:
        "I'm the photographer behind Studio of G10, bringing stories to life through portrait and event photography. I'm based in Nepal, inspired by people, light, and the beauty of everyday moments.",

      inspiration:
        "I'm deeply inspired by portrait photography I discover online—expressions, moods, and storytelling visuals that spark curiosity and creativity. Each face has a story, and capturing that truth is what drives my work.",

      howIStarted:
        "Photography began as a passion—something I was simply drawn to. Over time, that passion grew into a profession, allowing me to capture meaningful moments and create lasting memories for others.",

      philosophy:
        "My style is natural, expressive, and emotion-focused. I aim to create an experience where clients feel comfortable, confident, and truly themselves.",
    },
  },

  services: [
    { name: "Rice-feeding Ceremonies", icon: "🍚" },
    { name: "Birthdays", icon: "🎂" },
    { name: "Anniversaries", icon: "💑" },
    { name: "Pregnancy & Maternity Shoots", icon: "🤰" },
    { name: "Baby Showers", icon: "👶" },
    { name: "Weddings", icon: "💒" },
  ],

  process: {
    intro:
      "My process is simple, smooth, and centered around making clients feel at ease. Whether it's a portrait shoot or an event, I work patiently with clear guidance and attention to detail.",

    whatToExpect:
      "A friendly experience, thoughtful direction, and beautifully edited images delivered within one week.",

    steps: [
      {
        number: 1,
        title: "Consultation",
        description:
          "We talk about your ideas, location, style, and expectations.",
      },
      {
        number: 2,
        title: "Shoot",
        description:
          "A relaxed session where I guide poses, expressions, and lighting to bring out your best.",
      },
      {
        number: 3,
        title: "Editing",
        description:
          "I refine each image with clean, modern color grading and careful adjustments.",
      },
      {
        number: 4,
        title: "Delivery",
        description:
          "Final images delivered within 7 days, ready to view, download, and share.",
      },
    ],
  },

  gear: {
    camera: [{ name: "Sony A7 IV", type: "Camera Body" }],
    lenses: [
      { name: "Tamron 35–150mm", type: "Zoom Lens" },
      { name: "Sony 85mm", type: "Portrait Lens" },
    ],
    software: [
      { name: "Adobe Lightroom", type: "Photo Editing" },
      { name: "Adobe Premiere Pro", type: "Video Editing" },
    ],
  },

  contact: {
    email: "studioog10@example.com",
    phone: "+977 XXX-XXXX-XXXX",
    instagram: "@studioog10",
  },
} as const;

export const featuredGalleries = [
  {
    title: "Emma & Mikko",
    eventType: "Wedding",
    image: "/elegant-bride-and-groom-portrait-at-finnish-lakesi.jpg",
    href: "/galleries/emma-mikko",
  },
  {
    title: "Celebration of Life",
    eventType: "Birthday",
    image: "/joyful-birthday-celebration-with-family-and-candle.jpg",
    href: "/galleries/birthday",
  },
  {
    title: "New Beginnings",
    eventType: "Graduation",
    image: "/graduate-throwing-cap-in-air-with-diploma.jpg",
    href: "/galleries/graduation",
  },
  {
    title: "Sofia & Lauri",
    eventType: "Wedding",
    image: "/wedding-first-dance-in-elegant-ballroom.jpg",
    href: "/galleries/sofia-lauri",
  },
];

export const testimonials = [
  {
    quote:
      "Jitendra captured our wedding day with such authenticity and grace. Every photo tells a story and brings back the emotions we felt.",
    author: "Emma & Mikko",
  },
  {
    quote:
      "His eye for detail and ability to capture genuine moments is truly remarkable. We couldn't be happier with our photos.",
    author: "Sofia & Lauri",
  },
  {
    quote:
      "Professional, creative, and so easy to work with. Jitendra made us feel comfortable and the results are absolutely stunning.",
    author: "Anna & Petri",
  },
  {
    quote:
      "The photos exceeded all our expectations. Jitendra has a gift for capturing love and emotion in the most beautiful way.",
    author: "Laura & Henrik",
  },
];

// Type exports for better TypeScript support
export type SiteData = typeof siteData;
export type Service = (typeof siteData.services)[number];
export type ProcessStep = (typeof siteData.process.steps)[number];
export type FeaturedGallery = (typeof featuredGalleries)[number];
export type Testimonial = (typeof testimonials)[number];
