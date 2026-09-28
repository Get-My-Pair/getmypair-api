/**
 * Active family-profile helpers. Account holder uses id "self".
 * Articles and service requests are scoped with profileId.
 */

const SELF_PROFILE_ID = 'self';

function normalizeActiveProfileId(value) {
  const id = String(value || '').trim();
  return !id || id === SELF_PROFILE_ID ? SELF_PROFILE_ID : id;
}

function isSelfProfileId(id) {
  return normalizeActiveProfileId(id) === SELF_PROFILE_ID;
}

function resolveActiveProfileId(profile) {
  if (!profile) return SELF_PROFILE_ID;
  const active = normalizeActiveProfileId(profile.activeProfileId);
  if (isSelfProfileId(active)) return SELF_PROFILE_ID;
  const exists = (profile.familyMembers || []).some(
    (m) => String(m._id) === String(active)
  );
  return exists ? String(active) : SELF_PROFILE_ID;
}

function contentQueryForProfile(ownerField, ownerId, activeProfileId) {
  const q = { [ownerField]: ownerId };
  if (isSelfProfileId(activeProfileId)) {
    q.$or = [
      { profileId: SELF_PROFILE_ID },
      { profileId: null },
      { profileId: { $exists: false } },
    ];
  } else {
    q.profileId = String(activeProfileId);
  }
  return q;
}

function stampProfileId(activeProfileId) {
  return isSelfProfileId(activeProfileId)
    ? SELF_PROFILE_ID
    : String(activeProfileId);
}

function articleMatchesActiveProfile(article, activeProfileId) {
  if (!article) return false;
  const articlePid = normalizeActiveProfileId(article.profileId);
  const active = normalizeActiveProfileId(activeProfileId);
  if (isSelfProfileId(active)) {
    return isSelfProfileId(articlePid);
  }
  return articlePid === active;
}

function relationToHouseholdType(relation) {
  if (relation === 'partner') return 'with_partner';
  if (relation === 'child') return 'with_children';
  if (relation === 'elder') return 'with_elder';
  return 'just_me';
}

module.exports = {
  SELF_PROFILE_ID,
  normalizeActiveProfileId,
  isSelfProfileId,
  resolveActiveProfileId,
  contentQueryForProfile,
  stampProfileId,
  articleMatchesActiveProfile,
  relationToHouseholdType,
};
