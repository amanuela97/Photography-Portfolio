# Profile Collection

{
id: string,
name: string,
title: string,
location: string,
bio: string,
contact: {
email: string,
phone: string,
socials: {
type: "Facebook" | "Instagram" | "Twitter",
href: string
}[]
}
createdAt: Date,
updatedAt: Date
}

# About Collection

{
hero: {
intro: string,
portraitImage: string,
},

story: {
whoIAm: string,
inspiration: string,
howIStarted: string,
philosophy: string
},

process: {
intro: string,
whatToExpect: string,
steps: {
number: number,
title: string,
description: string
}[]
},

gear: {
camera: { name: string, type: string }[],
lenses: { name: string, type: string }[],
software: { name: string, type: string }[]
}
}

# Galleries Collection

{
id: string,
slug: string (unqiue)
title: string,
description: string,
coverImageUrl: string | null,
images: string[]
video: string
isFeatured: boolean //deafult false (max 4 galleries can be featured on home page)
createdAt: Date,
updatedAt: Date
}

# Photos Collection

{
id: string,
title: string,
url: string, // reference to Firebase Storage image file
eventType: "Wedding" | "Birthday" | "Baby Showers" | "Elopement" | "Birthdays" | "Ceremonies" | "Anniversaries" | "Other",
isFavorite: boolean //deafult false (max 6 photos can be favorited)
createdAt: Date,
updatedAt: Date
}

# Testimonials Collection

{
id: string,
quote: string,
author: string,
isApproved: boolean, // feault: false
isFeatured: boolean, // default: false (max 4 can be featured on home page)
createdAt: Date,
updatedAt: Date
}

# Films Collection

{
id: string,
title: string,
url: string, // reference to Firebase Storage video file
createdAt: Date,
updatedAt: Date
}
