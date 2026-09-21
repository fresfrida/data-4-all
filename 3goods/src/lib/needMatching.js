/**
 * Category-based need matching for the organisation views (item cards and item detail when logged in as an organisation).
 * Same rule the item detail page already used for "may match one of your needs" (D-059): a need matches an item when its
 * category equals the item's category or its optional second category. Matching is only ever a suggestion (D-006); it
 * never creates a request, reservation or conversation.
 *
 * The public badge on Discover Items for guests and donors is a separate, primary-category-only rule and is not in here.
 */

/** @param {import('../data/types.js').Need} need @param {import('../data/types.js').Item} item */
export function needMatchesItem(need, item) {
  if (!need.category) return false;
  return need.category === item.category || need.category === item.secondaryCategory;
}

/**
 * Does this organisation have a stated need matching the item?
 * @returns {{urgent: boolean}|null} `urgent` when any matching need of theirs is a priority need.
 */
export function ownNeedMatch(needs, organisationId, item) {
  const matching = needs.filter((need) => need.organisationId === organisationId && needMatchesItem(need, item));
  return matching.length > 0 ? { urgent: matching.some((need) => need.priority) } : null;
}

/**
 * Other verified organisations with a stated need matching the item, one entry per organisation (urgent if any of its
 * matching needs is), organisations with an urgent match first.
 * @returns {{id: string, name: {en: string, vi: string}, urgent: boolean}[]}
 */
export function otherVerifiedMatches(needs, organisations, item, excludeOrganisationId) {
  const verified = new Map(organisations.filter((org) => org.verified && org.id !== excludeOrganisationId).map((org) => [org.id, org]));
  const found = new Map();
  for (const need of needs) {
    const org = verified.get(need.organisationId);
    if (!org || !needMatchesItem(need, item)) continue;
    const entry = found.get(org.id) ?? { id: org.id, name: org.name, urgent: false };
    entry.urgent = entry.urgent || need.priority;
    found.set(org.id, entry);
  }
  return [...found.values()].sort((a, b) => Number(b.urgent) - Number(a.urgent));
}
