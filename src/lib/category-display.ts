type CategoryLabel = {
  name: string;
  slug: string;
};

export function getCategoryDisplayName(category: CategoryLabel) {
  return category.slug === "women-dresses" ? "Frocks" : category.name;
}
