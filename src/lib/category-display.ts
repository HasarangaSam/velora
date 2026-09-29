type CategoryLabel = {
  name: string;
  slug: string;
};

// Some category slugs need a friendlier storefront label, even though the database name remains
// the canonical value used elsewhere in the app.
export function getCategoryDisplayName(category: CategoryLabel) {
  return category.slug === "women-dresses" ? "Frocks" : category.name;
}
