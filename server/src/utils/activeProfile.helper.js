/**
 * Active family-profile helpers. Account holder uses id "self".
 * Articles and service requests are scoped with profileId.
 */

const SELF_PROFILE_ID = 'self';
const ACTIVE_PROFILE_HEADER = 'x-active-profile-id';

function normalizeActiveProfileId(value) {
  const id = String(value || '').trim();
  return !id || id === SELF_PROFILE_ID ? SELF_PROFILE_ID : id;
}

function isSelfProfileId(id) {
  return normalizeActiveProfileId(id) === SELF_PROFILE_ID;
}

function memberDocId(member) {
  if (!member) return '';
  if (member._id != null) return String(member._id);
  if (member.id != null) return String(member.id);
  return '';
}

function findFamilyMember(profile, profileId) {
  const wanted = String(profileId || '').trim();
  if (!wanted || isSelfProfileId(wanted)) return null;
  const members = profile?.familyMembers || [];
  return members.find((m) => memberDocId(m) === wanted) || null;
}

function resolveActiveProfileId(profile) {
  if (!profile) return SELF_PROFILE_ID;
  const active = normalizeActiveProfileId(profile.activeProfileId);
  if (isSelfProfileId(active)) return SELF_PROFILE_ID;
  return findFamilyMember(profile, active) ? active : SELF_PROFILE_ID;
}

function requestedProfileIdFromRequest(req) {
  if (!req) return '';
  const header =
    (typeof req.get === 'function' && req.get('X-Active-Profile-Id')) ||
    req.headers?.[ACTIVE_PROFILE_HEADER] ||
    req.headers?.['X-Active-Profile-Id'] ||
    '';
  return String(header || '').trim();
}

function resolveActiveProfileIdForRequest(req, profile) {
  const requested = requestedProfileIdFromRequest(req);
  if (!requested) return resolveActiveProfileId(profile);
  if (isSelfProfileId(requested)) return SELF_PROFILE_ID;
  if (findFamilyMember(profile, requested)) return requested;
  return resolveActiveProfileId(profile);
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

function toPublicProfile(profile) {
  if (!profile) return profile;
  const json =
    typeof profile.toJSON === 'function' ? profile.toJSON() : { ...profile };
  json._id = json._id != null ? String(json._id) : '';
  if (json.userId && typeof json.userId === 'object') {
    json.userId = String(json.userId._id || json.userId);
  } else if (json.userId != null) {
    json.userId = String(json.userId);
  }
  json.familyMembers = (json.familyMembers || []).map((m) => {
    const id = memberDocId(m);
    return {
      ...m,
      _id: id,
      id,
    };
  });
  json.activeProfileId = resolveActiveProfileId(json);
  return json;
}

module.exports = {
  SELF_PROFILE_ID,
  normalizeActiveProfileId,
  isSelfProfileId,
  memberDocId,
  findFamilyMember,
  resolveActiveProfileId,
  requestedProfileIdFromRequest,
  resolveActiveProfileIdForRequest,
  contentQueryForProfile,
  stampProfileId,
  articleMatchesActiveProfile,
  relationToHouseholdType,
  toPublicProfile,
};
