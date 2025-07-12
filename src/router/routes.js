const routes = [
  {
    path: "/wallet",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      { path: "", component: () => import("src/pages/WalletPage.vue") },
    ],
  },
  {
    path: "/",
    redirect: "/wallet",
  },
  {
    path: "/settings",
    component: () => import("layouts/FullscreenLayout.vue"),
    children: [{ path: "", component: () => import("src/pages/Settings.vue") }],
  },
  {
    path: "/find-creators",
    component: () => import("layouts/FullscreenLayout.vue"),
    children: [
      { path: "", component: () => import("src/pages/FindCreators.vue") },
    ],
  },
  {
    path: "/creator-hub",
    component: () => import("layouts/FullscreenLayout.vue"),
    children: [
      { path: "", component: () => import("src/pages/CreatorHubPage.vue") },
    ],
  },
  {
    path: "/my-profile",
    component: () => import("layouts/FullscreenLayout.vue"),
    children: [
      {
        path: "",
        component: () => import("src/pages/MyProfilePage.vue"),
      },
    ],
  },
  {
    path: "/creator/:npub",
    name: "PublicCreatorProfile",
    component: () => import("pages/PublicCreatorProfilePage.vue"),
  },
  {
    path: "/buckets",
    component: () => import("layouts/FullscreenLayout.vue"),
    children: [{ path: "", component: () => import("pages/Buckets.vue") }],
  },
  {
    path: "/move-tokens",
    component: () => import("layouts/FullscreenLayout.vue"),
    children: [
      { path: "", component: () => import("pages/MoveTokens.vue") },
    ],
  },
  {
    path: "/subscriptions",
    component: () => import("layouts/FullscreenLayout.vue"),
    children: [
      {
        path: "",
        component: () => import("pages/SubscriptionsOverview.vue"),
      },
    ],
  },
  {
    path: "/nostr-messenger",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      { path: "", component: () => import("pages/NostrMessenger.vue") },
    ],
  },
  {
    path: "/buckets/:id",
    component: () => import("layouts/FullscreenLayout.vue"),
    children: [
      { path: "", component: () => import("pages/BucketDetail.vue") },
    ],
  },
  {
    path: "/restore",
    component: () => import("layouts/FullscreenLayout.vue"),
    children: [{ path: "", component: () => import("pages/Restore.vue") }],
  },
  {
    path: "/already-running",
    component: () => import("layouts/BlankLayout.vue"),
    children: [
      { path: "", component: () => import("pages/AlreadyRunning.vue") },
    ],
  },
  {
    path: "/welcome",
    component: () => import("layouts/BlankLayout.vue"),
    children: [
      { path: "", component: () => import("pages/WelcomePage.vue") },
    ],
  },
  {
    path: "/terms",
    component: () => import("layouts/FullscreenLayout.vue"),
    children: [
      { path: "", component: () => import("pages/TermsPage.vue") },
    ],
  },
  {
    path: "/about",
    component: () => import("layouts/FullscreenLayout.vue"),
    children: [
      { path: "", component: () => import("pages/AboutPage.vue") },
    ],
  },
  {
    path: "/nostr-login",
    component: () => import("layouts/FullscreenLayout.vue"),
    children: [
      { path: "", component: () => import("pages/NostrLogin.vue") },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: "/:pathMatch(.*)*",
    component: () => import("layouts/FullscreenLayout.vue"),
    children: [
      { path: "", component: () => import("pages/ErrorNotFound.vue") },
    ],
  },
];

export default routes;
