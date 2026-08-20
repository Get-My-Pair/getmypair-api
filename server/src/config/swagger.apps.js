/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : swagger.apps.js
 * Description: Per-app OpenAPI specs (User / Cobbler / Delivery / Darkworkstore /
 *              Retailer / Master Admin) filtered from the shared path definitions.
 * ----------------------------------------------------------------------------
 */

const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');
const config = require('./env');
const fullSpec = require('./swagger');
const swaggerAdminSpec = require('./swagger.admin');

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'];

const servers = [
  {
    url: `http://localhost:${config.PORT}`,
    description: 'Development (Local)',
  },
  {
    url: 'https://getmypair-api.onrender.com',
    description: 'Production',
  },
];

const uiCss = '.swagger-ui .topbar { display: none }';

/** Exact path + method allowlists (OpenAPI path templates). */
const APP_ALLOWLISTS = {
  user: [
    // Authentication
    ['post', '/api/auth/send-otp'],
    ['post', '/api/auth/verify-otp'],
    ['post', '/api/auth/complete-profile'],
    ['post', '/api/auth/refresh-token'],
    ['post', '/api/auth/logout'],
    ['get', '/api/auth/me'],
    ['get', '/api/auth/sessions'],
    ['delete', '/api/auth/sessions/{sessionId}'],
    ['get', '/api/auth/languages'],
    ['put', '/api/auth/language'],
    // User Profile
    ['get', '/api/user/profile/me'],
    ['get', '/api/user/profile/addresses'],
    ['put', '/api/user/profile'],
    ['put', '/api/user/profile/update'],
    ['post', '/api/user/profile/upload-image'],
    ['post', '/api/user/profile/address/add'],
    ['put', '/api/user/profile/address/update'],
    ['delete', '/api/user/profile/address/delete/{addressId}'],
    ['post', '/api/user/profile/family-members/add'],
    ['put', '/api/user/profile/family-members/update'],
    ['delete', '/api/user/profile/family-members/delete/{memberId}'],
    // Notifications
    ['get', '/api/user/notifications'],
    ['patch', '/api/user/notifications/{id}/read'],
    // Articles
    ['post', '/api/articles/create'],
    ['post', '/api/articles/upload-image'],
    ['get', '/api/articles/my'],
    ['get', '/api/articles/{articleId}'],
    ['put', '/api/articles/update/{articleId}'],
    ['delete', '/api/articles/delete/{articleId}'],
    // Service Requests (USER)
    ['post', '/api/service/create'],
    ['post', '/api/service/upload-proof/image'],
    ['post', '/api/service/upload-proof/video'],
    ['post', '/api/service/respond-actual-cost'],
    ['get', '/api/service/my'],
    ['get', '/api/service/estimation-defaults'],
    ['get', '/api/service/{requestId}'],
    ['put', '/api/service/cancel/{requestId}'],
    // Payment (USER + public checkout helpers)
    ['post', '/api/payment/webhook/zoho'],
    ['post', '/api/payment/order'],
    ['post', '/api/payment/link'],
    ['post', '/api/payment/verify'],
    ['post', '/api/payment/cost/approve'],
    ['post', '/api/payment/cost/reject'],
    ['get', '/api/payment/mock-checkout'],
    ['get', '/api/payment/callback'],
    ['get', '/api/payment/history'],
    ['get', '/api/payment/status/{orderId}'],
    ['get', '/api/payment/by-service-request/{serviceRequestId}'],
    ['get', '/api/payment/{paymentId}'],
    // Cobbler discovery
    ['get', '/api/cobbler/profile/nearby'],
    // Geocoding + Health
    ['get', '/api/geocode/reverse'],
    ['get', '/health'],
    ['get', '/api/version'],
  ],
  cobbler: [
    // Authentication
    ['post', '/api/auth/send-otp'],
    ['post', '/api/auth/verify-otp'],
    ['post', '/api/auth/complete-profile'],
    ['post', '/api/auth/refresh-token'],
    ['post', '/api/auth/logout'],
    ['get', '/api/auth/me'],
    ['get', '/api/auth/sessions'],
    ['delete', '/api/auth/sessions/{sessionId}'],
    ['get', '/api/auth/languages'],
    ['put', '/api/auth/language'],
    // Cobbler Profile (exclude nearby)
    ['get', '/api/cobbler/profile/me'],
    ['get', '/api/cobbler/profile/verification'],
    ['put', '/api/cobbler/profile'],
    ['put', '/api/cobbler/profile/update'],
    ['put', '/api/cobbler/profile/shop'],
    ['put', '/api/cobbler/profile/services'],
    ['put', '/api/cobbler/profile/tools-owned'],
    ['put', '/api/cobbler/profile/tools-needed'],
    ['put', '/api/cobbler/profile/bank'],
    ['put', '/api/cobbler/profile/update-status'],
    ['post', '/api/cobbler/profile/upload-image'],
    ['post', '/api/cobbler/profile/upload-doc'],
    // Cobbler Home
    ['get', '/api/cobbler/home/dashboard'],
    // Service Requests (COBBER)
    ['get', '/api/service/cobbler/new-requests'],
    ['get', '/api/service/cobbler/active'],
    ['get', '/api/service/{requestId}'],
    ['post', '/api/service/cobbler/accept'],
    ['post', '/api/service/cobbler/reject'],
    ['post', '/api/service/cobbler/set-actual-cost'],
    ['post', '/api/service/update-status'],
    ['post', '/api/service/upload-media'],
    ['post', '/api/service/assign-delivery'],
    ['post', '/api/service/assign-darkstore'],
    ['put', '/api/service/cancel/{requestId}'],
    // Payment (COBBER)
    ['get', '/api/payment/cobbler/earnings'],
    ['get', '/api/payment/admin/commission-preview'],
    ['get', '/api/payment/darkstore/{darkStoreId}/revenue'],
    // Health
    ['get', '/health'],
  ],
  delivery: [
    // Auth + Delivery Profile + Health (live APIs; expand as Delivery module grows)
    ['post', '/api/auth/send-otp'],
    ['post', '/api/auth/verify-otp'],
    ['post', '/api/auth/complete-profile'],
    ['post', '/api/auth/refresh-token'],
    ['post', '/api/auth/logout'],
    ['get', '/api/auth/me'],
    ['get', '/api/auth/sessions'],
    ['delete', '/api/auth/sessions/{sessionId}'],
    ['get', '/api/auth/languages'],
    ['put', '/api/auth/language'],
    ['get', '/api/delivery/profile/me'],
    ['get', '/api/delivery/profile/verification'],
    ['put', '/api/delivery/profile'],
    ['put', '/api/delivery/profile/update'],
    ['put', '/api/delivery/profile/vehicle'],
    ['post', '/api/delivery/profile/upload-image'],
    ['post', '/api/delivery/profile/upload-doc'],
    ['post', '/api/service/upload-media'],
    ['post', '/api/delivery/auth/login'],
    ['post', '/api/delivery/auth/verify-otp'],
    ['post', '/api/delivery/auth/resend-otp'],
    ['get', '/api/delivery/auth/me'],
    ['get', '/api/delivery/jobs'],
    ['get', '/api/delivery/jobs/{id}'],
    ['post', '/api/delivery/jobs/{id}/status'],
    ['get', '/health'],
  ],
  darkworkstore: [
    ['post', '/api/darkworkstore/auth/register'],
    ['post', '/api/darkworkstore/auth/login'],
    ['post', '/api/darkworkstore/auth/verify-otp'],
    ['post', '/api/darkworkstore/auth/resend-otp'],
    ['get', '/api/darkworkstore/auth/me'],
    ['get', '/api/darkworkstore/dashboard/stats'],
    ['get', '/api/darkworkstore/payments/cost-approval'],
    ['patch', '/api/darkworkstore/payments/cost/{serviceRequestId}'],
    ['get', '/api/darkworkstore/payments/status'],
    ['get', '/api/darkworkstore/payments/status/{orderId}'],
    ['get', '/api/darkworkstore/payments/jobs/paid'],
    ['get', '/api/darkworkstore/payments/jobs/unpaid'],
    ['get', '/api/darkworkstore/payments/revenue'],
    ['get', '/api/darkworkstore/payments/transactions'],
    ['get', '/api/darkworkstore/payments/transactions/{paymentId}'],
    ['get', '/api/darkworkstore/payments/history/{serviceRequestId}'],
    ['get', '/api/darkworkstore/payments/settlements'],
    ['post', '/api/darkworkstore/payments/settlements/{settlementId}/process'],
    ['get', '/api/darkworkstore/payments/reports/monthly'],
    ['get', '/api/darkworkstore/payments/notifications'],
    ['get', '/api/darkworkstore/jobs'],
    ['post', '/api/darkworkstore/jobs/{id}/accept'],
    ['post', '/api/darkworkstore/jobs/{id}/reject'],
    ['post', '/api/darkworkstore/jobs/{id}/assign-cobbler'],
    ['get', '/api/darkworkstore/jobs/pickup'],
    ['get', '/api/darkworkstore/jobs/return'],
    ['get', '/api/darkworkstore/jobs/workflow'],
    ['post', '/api/darkworkstore/jobs/{id}/assign-delivery'],
    ['post', '/api/darkworkstore/jobs/{id}/receive'],
    ['post', '/api/darkworkstore/jobs/{id}/progress'],
    ['get', '/api/darkworkstore/delivery-members'],
    ['get', '/api/darkworkstore/cobblers'],
    ['post', '/api/darkworkstore/cobblers'],
    ['delete', '/api/darkworkstore/cobblers/{id}'],
  ],
  retailer: [
    // Canonical retailer mount + legacy /api/admin/profile
    ['get', '/api/retailer/profile/users'],
    ['get', '/api/retailer/profile/cobblers'],
    ['get', '/api/retailer/profile/delivery'],
    ['get', '/api/retailer/profile/{id}'],
    ['put', '/api/retailer/profile/verify'],
    ['put', '/api/retailer/profile/status'],
    ['get', '/api/admin/profile/users'],
    ['get', '/api/admin/profile/cobblers'],
    ['get', '/api/admin/profile/delivery'],
    ['get', '/api/admin/profile/{id}'],
    ['put', '/api/admin/profile/verify'],
    ['put', '/api/admin/profile/status'],
  ],
  masteradmin: [
    ['post', '/api/masteradmin/auth/login'],
    ['post', '/api/masteradmin/auth/verify-otp'],
    ['post', '/api/masteradmin/auth/resend-otp'],
    ['get', '/api/masteradmin/auth/me'],
    ['get', '/api/masteradmin/dashboard/stats'],
    ['get', '/api/masteradmin/users'],
    ['delete', '/api/masteradmin/users/{id}'],
    ['get', '/api/masteradmin/articles'],
    ['get', '/api/masteradmin/articles/by-owner'],
    ['get', '/api/masteradmin/service-requests'],
    ['get', '/api/masteradmin/service-requests/{id}'],
    ['patch', '/api/masteradmin/service-requests/{id}'],
    ['delete', '/api/masteradmin/service-requests/{id}'],
    ['get', '/api/masteradmin/cobblers'],
    ['patch', '/api/masteradmin/cobblers/{id}/verify'],
    ['get', '/api/masteradmin/delivery-partners'],
    ['get', '/api/masteradmin/email-templates'],
    ['get', '/api/masteradmin/delivery-members'],
    ['post', '/api/masteradmin/delivery-members'],
    ['get', '/api/masteradmin/delivery-members/{id}'],
    ['patch', '/api/masteradmin/delivery-members/{id}'],
    ['delete', '/api/masteradmin/delivery-members/{id}'],
    ['patch', '/api/masteradmin/delivery-members/{id}/send-email'],
    ['get', '/api/masteradmin/delivery-jobs/pickup'],
    ['get', '/api/masteradmin/delivery-jobs/return'],
    ['post', '/api/masteradmin/delivery-jobs/{id}/assign'],
    ['get', '/api/masteradmin/darkworkstore-users'],
    ['post', '/api/masteradmin/darkworkstore-users'],
    ['get', '/api/masteradmin/darkworkstore-users/{id}'],
    ['patch', '/api/masteradmin/darkworkstore-users/{id}'],
    ['delete', '/api/masteradmin/darkworkstore-users/{id}'],
    ['patch', '/api/masteradmin/darkworkstore-users/{id}/verify'],
    ['get', '/api/masteradmin/payments/cost-approval'],
    ['patch', '/api/masteradmin/payments/cost/{serviceRequestId}'],
    ['get', '/api/masteradmin/payments/status'],
    ['get', '/api/masteradmin/payments/status/{orderId}'],
    ['get', '/api/masteradmin/payments/jobs/paid'],
    ['get', '/api/masteradmin/payments/jobs/unpaid'],
    ['get', '/api/masteradmin/payments/revenue'],
    ['get', '/api/masteradmin/payments/transactions'],
    ['get', '/api/masteradmin/payments/transactions/{paymentId}'],
    ['get', '/api/masteradmin/payments/history/{serviceRequestId}'],
    ['get', '/api/masteradmin/payments/settlements'],
    ['post', '/api/masteradmin/payments/settlements/{settlementId}/process'],
    ['get', '/api/masteradmin/payments/reports/monthly'],
    ['get', '/api/masteradmin/payments/notifications'],
    ['get', '/api/masteradmin/db/overview'],
    ['post', '/api/masteradmin/db/clear/collection'],
    ['post', '/api/masteradmin/db/clear/group'],
    ['post', '/api/masteradmin/db/clear/all'],
  ],
};

const APP_META = {
  user: {
    id: 'user',
    slug: 'user',
    appType: 'User App',
    title: 'GetMyPair – User App APIs',
    description:
      'Customer mobile app (X-App-Source: USER_APP). OTP auth, profile, notifications, articles, service requests, payments, cobbler discovery, geocoding.',
    status: 'Active',
    route: '/api-docs/user',
    tags: [
      { name: 'Authentication', description: 'OTP-based authentication endpoints' },
      { name: 'User Profile', description: 'User profile management - Profile created by auth; Role: USER' },
      { name: 'User Notifications', description: 'In-app notifications for customer users - Role: USER' },
      { name: 'Articles', description: 'Article / Digital Shoe Passport (Module 3) - Role: USER' },
      { name: 'Service Requests', description: 'Service request lifecycle APIs (Module 4)' },
      { name: 'Payment', description: 'Zoho payments, cost approval, settlements, refunds (Module 5)' },
      { name: 'Cobbler Profile', description: 'Cobbler profile management - Profile created by auth; Role: COBBER' },
      { name: 'Geocoding', description: 'Reverse geocoding (lat/lng to address)' },
      { name: 'Health', description: 'Health check endpoints' },
    ],
    securitySchemes: {
      bearerAuth: fullSpec.components.securitySchemes.bearerAuth,
    },
  },
  cobbler: {
    id: 'cobbler',
    slug: 'cobbler',
    appType: 'Cobbler App',
    title: 'GetMyPair – Cobbler App APIs',
    description:
      'Cobbler mobile app (X-App-Source: COBBER_APP). Auth, cobbler profile, home dashboard, service workflow, earnings.',
    status: 'Active',
    route: '/api-docs/cobbler',
    tags: [
      { name: 'Authentication', description: 'OTP-based authentication endpoints' },
      { name: 'Cobbler Profile', description: 'Cobbler profile management - Profile created by auth; Role: COBBER' },
      { name: 'Cobbler Home', description: 'Cobbler home dashboard summary - Role: COBBER' },
      { name: 'Service Requests', description: 'Service request lifecycle APIs (Module 4)' },
      { name: 'Payment', description: 'Zoho payments, cost approval, settlements, refunds (Module 5)' },
      { name: 'Health', description: 'Health check endpoints' },
    ],
    securitySchemes: {
      bearerAuth: fullSpec.components.securitySchemes.bearerAuth,
    },
  },
  delivery: {
    id: 'delivery',
    slug: 'delivery',
    appType: 'Delivery App',
    title: 'GetMyPair – Delivery App APIs',
    description:
      'Delivery partner mobile app (X-App-Source: DELIVERY_APP). Auth, delivery profile, and service media upload.',
    status: 'Active',
    route: '/api-docs/delivery',
    tags: [
      { name: 'Authentication', description: 'OTP-based authentication endpoints' },
      { name: 'Delivery Profile', description: 'Delivery partner profile management - Role: DELIVERY' },
      { name: 'Service Requests', description: 'Service request lifecycle APIs (Module 4)' },
      { name: 'Health', description: 'Health check endpoints' },
    ],
    securitySchemes: {
      bearerAuth: fullSpec.components.securitySchemes.bearerAuth,
    },
  },
  darkworkstore: {
    id: 'darkworkstore',
    slug: 'darkworkstore',
    appType: 'Darkworkstore Dashboard',
    title: 'GetMyPair – Darkworkstore Dashboard APIs',
    description:
      'Darkworkstore dashboard APIs under /api/darkworkstore (auth, jobs, cobblers, payments). Uses master-admin JWT.',
    status: 'Active',
    route: '/api-docs/darkworkstore',
    tags: [
      { name: 'Darkworkstore Auth', description: 'Darkworkstore login (master-admin JWT)' },
      { name: 'Darkworkstore Dashboard', description: 'Store overview stats for the dashboard home' },
      {
        name: 'Darkworkstore Jobs',
        description: 'Inbox of user-app jobs — accept, reject, and assign a store cobbler',
      },
      {
        name: 'Darkworkstore Cobblers',
        description: 'Internal cobbler employees for this store',
      },
      {
        name: 'Darkworkstore Payments',
        description: 'Payment workflow — cost approval through settlements and reports',
      },
    ],
    hubModules: [
      {
        title: 'Authentication',
        description: 'Darkworkstore login',
        match: (method, p) => p.startsWith('/api/darkworkstore/auth'),
      },
      {
        title: 'Dashboard',
        description: 'Store overview stats',
        match: (method, p) => p.startsWith('/api/darkworkstore/dashboard'),
      },
      {
        title: 'Jobs',
        description: 'User-app jobs — accept, reject, assign cobbler',
        match: (method, p) => p.startsWith('/api/darkworkstore/jobs'),
      },
      {
        title: 'Cobblers',
        description: 'Internal cobbler employees',
        match: (method, p) => p.startsWith('/api/darkworkstore/cobblers'),
      },
      {
        title: 'Payments',
        description: 'Payment workflow — cost approval through settlements and reports',
        match: (method, p) => p.startsWith('/api/darkworkstore/payments'),
      },
    ],
    securitySchemes: {
      adminBearerAuth: swaggerAdminSpec.components?.securitySchemes?.adminBearerAuth || {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Master admin JWT access token',
      },
    },
  },
  retailer: {
    id: 'retailer',
    slug: 'retailer',
    appType: 'Retailer App',
    title: 'GetMyPair – Retailer App APIs',
    description:
      'Retailer app APIs under /api/retailer (canonical) and legacy /api/admin/profile (X-App-Source: ADMIN_APP). Future retailer modules reserved.',
    status: 'Active',
    route: '/api-docs/retailer',
    tags: [
      {
        name: 'Retailer Profile',
        description: 'Retailer profile management — Role: ADMIN',
      },
      {
        name: 'Admin Profile',
        description: 'Legacy mobile ADMIN profile APIs under /api/admin/profile',
      },
    ],
    securitySchemes: {
      bearerAuth: fullSpec.components.securitySchemes.bearerAuth,
    },
  },
  masteradmin: {
    id: 'masteradmin',
    slug: 'masteradmin',
    appType: 'Masteradmin Dashboard',
    title: 'GetMyPair – Masteradmin Dashboard APIs',
    description:
      'Masteradmin React dashboard APIs under /api/masteradmin — auth, ops overview, users, articles, services, cobblers, delivery, payments, DB maintenance. Legacy alias: /api/sys-admin.',
    status: 'Active',
    route: '/api-docs/masteradmin',
    tags: [
      { name: 'Master Admin Dashboard', description: 'Operations overview and platform statistics' },
      { name: 'Master Admin Payments', description: 'Payment workflow — cost approval through settlements and reports' },
      { name: 'Master Admin Database', description: 'MongoDB overview and clear collection/group/all' },
    ],
    hubModules: [
      {
        title: 'Authentication',
        description: 'Masteradmin login',
        match: (method, p) => p.startsWith('/api/masteradmin/auth'),
      },
      {
        title: 'Dashboard',
        description: 'Operations overview and platform statistics',
        match: (method, p) => p.startsWith('/api/masteradmin/dashboard'),
      },
      {
        title: 'Users',
        description: 'List and delete platform users',
        match: (method, p) => p.startsWith('/api/masteradmin/users'),
      },
      {
        title: 'Articles',
        description: 'List articles and owners with article counts',
        match: (method, p) => p.startsWith('/api/masteradmin/articles'),
      },
      {
        title: 'Service requests',
        description: 'List, view, update workflow, and delete service requests',
        match: (method, p) => p.startsWith('/api/masteradmin/service-requests'),
      },
      {
        title: 'Cobblers',
        description: 'List cobblers and verify profiles',
        match: (method, p) => p.startsWith('/api/masteradmin/cobblers'),
      },
      {
        title: 'Delivery',
        description: 'List delivery partners',
        match: (method, p) => p.startsWith('/api/masteradmin/delivery-partners'),
      },
      {
        title: 'Darkworkstore users',
        description: 'Create, view, update, delete, and verify Darkworkstore portal accounts',
        match: (method, p) => p.startsWith('/api/masteradmin/darkworkstore-users'),
      },
      {
        title: 'Payments',
        description: 'Payment workflow — cost approval through settlements and reports',
        match: (method, p) => p.startsWith('/api/masteradmin/payments'),
      },
      {
        title: 'DB maintenance',
        description: 'MongoDB overview and clear collection/group/all',
        match: (method, p) => p.startsWith('/api/masteradmin/db'),
      },
    ],
    securitySchemes: {
      adminBearerAuth: swaggerAdminSpec.components?.securitySchemes?.adminBearerAuth || {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Masteradmin JWT access token',
      },
    },
  },
};

function keyOf(method, apiPath) {
  return `${method.toLowerCase()} ${apiPath}`;
}

function filterSpec(sourceSpec, allowlist, meta) {
  const allowed = new Set(allowlist.map(([m, p]) => keyOf(m, p)));
  const paths = {};
  const usedTags = new Set();

  for (const [apiPath, pathItem] of Object.entries(sourceSpec.paths || {})) {
    const filtered = {};
    for (const method of HTTP_METHODS) {
      if (!pathItem[method]) continue;
      if (!allowed.has(keyOf(method, apiPath))) continue;
      filtered[method] = pathItem[method];
      for (const tag of pathItem[method].tags || []) usedTags.add(tag);
    }
    if (Object.keys(filtered).length) {
      // Preserve path-level params if present
      if (pathItem.parameters) filtered.parameters = pathItem.parameters;
      paths[apiPath] = filtered;
    }
  }

  const tags =
    meta.tags?.filter((t) => usedTags.has(t.name)) ||
    [...usedTags].map((name) => ({ name }));

  return {
    openapi: '3.0.0',
    info: {
      title: meta.title,
      version: '1.0.0',
      description: meta.description,
      contact: { name: 'API Support' },
    },
    servers,
    tags,
    paths,
    components: {
      securitySchemes: meta.securitySchemes || {},
      schemas: sourceSpec.components?.schemas || {},
    },
  };
}

/** Merge main + admin path maps so app filters can pull from either. */
function mergePaths(...specs) {
  const paths = {};
  for (const spec of specs) {
    for (const [p, item] of Object.entries(spec.paths || {})) {
      paths[p] = { ...(paths[p] || {}), ...item };
    }
  }
  return {
    openapi: '3.0.0',
    paths,
    components: {
      schemas: {
        ...(fullSpec.components?.schemas || {}),
        ...(swaggerAdminSpec.components?.schemas || {}),
      },
      securitySchemes: {
        ...(fullSpec.components?.securitySchemes || {}),
        ...(swaggerAdminSpec.components?.securitySchemes || {}),
      },
    },
  };
}

const combinedSource = mergePaths(fullSpec, swaggerAdminSpec);

const appSpecs = {};
for (const [id, meta] of Object.entries(APP_META)) {
  appSpecs[id] = filterSpec(combinedSource, APP_ALLOWLISTS[id], meta);
}

function emptyCounts() {
  return { post: 0, get: 0, put: 0, patch: 0, delete: 0, total: 0 };
} 

function countMethods(spec) {
  const counts = emptyCounts();
  for (const pathItem of Object.values(spec.paths || {}))
     {
    for (const method of HTTP_METHODS) {
      if (pathItem[method]) {
        counts[method] += 1;
        counts.total += 1;
      }
    }
  }
  return counts;
}

function moduleBreakdown(spec, preferredTagOrder = []) {
  const byTag = {};
  for (const pathItem of Object.values(spec.paths || {})) {
    for (const method of HTTP_METHODS) {
      const op = pathItem[method];
      if (!op) continue;
      const tag = (op.tags && op.tags[0]) || 'Untagged';
      if (!byTag[tag]) byTag[tag] = emptyCounts();
      byTag[tag][method] += 1;
      byTag[tag].total += 1;
    }
  }

  if (!preferredTagOrder.length) return byTag;

  const ordered = {};
  for (const name of preferredTagOrder) {
    if (byTag[name]) ordered[name] = byTag[name];
  }
  for (const [name, counts] of Object.entries(byTag)) {
    if (!ordered[name]) ordered[name] = counts;
  }
  return ordered;
}

function hubModuleBreakdown(spec, hubModules, preferredTagOrder = []) {
  if (!hubModules?.length) return moduleBreakdown(spec, preferredTagOrder);

  const modules = {};
  for (const mod of hubModules) {
    modules[mod.title] = { ...emptyCounts(), description: mod.description };
  }

  for (const [apiPath, pathItem] of Object.entries(spec.paths || {})) {
    for (const method of HTTP_METHODS) {
      if (!pathItem[method]) continue;
      const mod = hubModules.find((m) => m.match(method, apiPath));
      const title = mod?.title || 'Other';
      if (!modules[title]) {
        modules[title] = { ...emptyCounts(), description: title };
      }
      modules[title][method] += 1;
      modules[title].total += 1;
    }
  }
  return modules;
}

const APP_CATALOG = Object.values(APP_META).map((meta) => {
  const counts = countMethods(appSpecs[meta.id]);
  const preferred = (meta.tags || []).map((t) => t.name);
  const modules = hubModuleBreakdown(appSpecs[meta.id], meta.hubModules, preferred);
  return {
    ...meta,
    counts,
    modules,
  };
});

function buildHubHtml(baseUrl = '') {
  const rows = APP_CATALOG.map((app, idx) => {
    const moduleEntries = Object.entries(app.modules);
    const moduleRows = moduleEntries
      .map(([title, c], i) => {
        const desc =
          c.description ||
          app.tags.find((t) => t.name === title)?.description ||
          title;
        return `<tr>
          <td>${i + (app.id === 'masteradmin' ? 0 : 1)}</td>
          <td>${app.appType}</td>
          <td>${title}</td>
          <td>${desc}</td>
          <td>${c.post}</td>
          <td>${c.get}</td>
          <td>${c.put}</td>
          <td>${c.patch}</td>
          <td>${c.delete}</td>
          <td>${c.total}</td>
          <td>${app.status}</td>
          <td><a href="${baseUrl}${app.route}">${title}</a></td>
        </tr>`;
      })
      .join('');

    const grand = `<tr class="grand">
      <td></td>
      <td>${app.appType}</td>
      <td colspan="2"><strong>GRAND TOTAL</strong></td>
      <td><strong>${app.counts.post}</strong></td>
      <td><strong>${app.counts.get}</strong></td>
      <td><strong>${app.counts.put}</strong></td>
      <td><strong>${app.counts.patch}</strong></td>
      <td><strong>${app.counts.delete}</strong></td>
      <td><strong>${app.counts.total}</strong></td>
      <td>${app.status}</td>
      <td><a href="${baseUrl}${app.route}">Open Swagger</a></td>
    </tr>`;

    return `
      <tr class="app-header">
        <td colspan="12">
          <a href="${baseUrl}${app.route}">${idx + 1}. ${app.appType}</a>
          — ${app.counts.total} APIs
        </td>
      </tr>
      ${moduleRows || `<tr><td colspan="12" class="empty">No modules yet (Pending)</td></tr>`}
      ${grand}
      <tr class="spacer"><td colspan="12"></td></tr>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>GetMyPair API Docs – By App</title>
  <style>
    :root {
      --bg: #f6f3ee;
      --ink: #1c1917;
      --muted: #57534e;
      --line: #d6d3d1;
      --accent: #0f766e;
      --card: #ffffff;
      --grand: #ecfdf5;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", system-ui, sans-serif;
      background: linear-gradient(160deg, #f6f3ee 0%, #e7e5e4 50%, #f0fdfa 100%);
      color: var(--ink);
      min-height: 100vh;
    }
    .wrap { max-width: 1200px; margin: 0 auto; padding: 32px 20px 64px; }
    h1 { margin: 0 0 8px; font-size: 1.75rem; }
    .sub { color: var(--muted); margin-bottom: 24px; }
    .links { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 28px; }
    .links a {
      display: inline-block;
      padding: 8px 14px;
      background: var(--accent);
      color: #fff;
      text-decoration: none;
      border-radius: 6px;
      font-size: 0.9rem;
    }
    .links a.all { background: #1c1917; }
    table {
      width: 100%;
      border-collapse: collapse;
      background: var(--card);
      box-shadow: 0 1px 3px rgba(0,0,0,.06);
      font-size: 0.85rem;
    }
    th, td {
      border: 1px solid var(--line);
      padding: 8px 10px;
      text-align: left;
      vertical-align: top;
    }
    th { background: #1c1917; color: #fff; font-weight: 600; white-space: nowrap; }
    tr.app-header td {
      background: #0f766e;
      color: #fff;
      font-weight: 600;
      font-size: 0.95rem;
    }
    tr.app-header a { color: #fff; }
    tr.grand td { background: var(--grand); }
    tr.spacer td { border: none; height: 16px; background: transparent; }
    td.empty { color: var(--muted); font-style: italic; }
    a { color: var(--accent); }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>GetMyPair API Documentation</h1>
    <p class="sub">Separate Swagger per application. Base: <code>${baseUrl || '/'}</code> · Full catalog also at <a href="${baseUrl}/api-docs/all">/api-docs/all</a></p>
    <div class="links">
      ${APP_CATALOG.map((a) => `<a href="${baseUrl}${a.route}">${a.appType}</a>`).join('')}
      <a class="all" href="${baseUrl}/api-docs/all">All APIs</a>
    </div>
    <table>
      <thead>
        <tr>
          <th>SNO</th>
          <th>App Type</th>
          <th>Module Title</th>
          <th>Module Description</th>
          <th>Post</th>
          <th>Get</th>
          <th>Put</th>
          <th>Patch</th>
          <th>Delete</th>
          <th>Total</th>
          <th>Status</th>
          <th>Work File Link</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  </div>
</body>
</html>`;
}

module.exports = {
  appSpecs,
  APP_META,
  APP_ALLOWLISTS,
  APP_CATALOG,
  uiCss,
  buildHubHtml,
  countMethods,
};
