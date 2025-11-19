- Lets start with (site)/page.tsx, which should be converted into an on demand ISR component
  Inside (site)/page.tsx you need to fetch maybe using promise.all and pass the data to another client component.
- the following data needs to be fetched for (site)/page.tsx;
  - site/profile document (this data will also be needed inside the footer so maybe it is best to fetch it inside SiteLayout and then use some global state manager or context to share it to the home page)
  - photos documents where the field isFavorite is set to true (you must fetch at maximum 3 docmunets)
  - galleries where the field isFeatured is set to true (you must fetch at maximum 4 docmunets)
  - testimonials where the field isFeatured is set to true (you must fetch at maximum 4 docmunets)
