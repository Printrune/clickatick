export const LEGACY_PUBLISHING_CLOSED = 'LEGACY_PUBLISHING_CLOSED';

export function creatorNeonCutoverEnabled(env = process.env) {
  return env.CREATOR_NEON_CUTOVER_ENABLED === 'true';
}

export function legacyPublishingClosedResponse() {
  return Response.json({
    error: 'Save this draft to a brand to publish it after review.',
    code: LEGACY_PUBLISHING_CLOSED,
    saveDraftUrl: '/dashboard?source=creator',
  }, {status: 410, headers: {'Cache-Control': 'no-store'}});
}
