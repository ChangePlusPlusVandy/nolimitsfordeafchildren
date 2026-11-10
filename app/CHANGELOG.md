# Changelog

## [0.1.0](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/compare/app-v0.0.1...app-v0.1.0) (2026-11-10)


### Features

* add administrator schedule detail page ([#143](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/issues/143)) ([09a4614](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/commit/09a4614f36bf0f1de6db2e9360298b3e40d520b2))
* add initial enrollment flow on student creation ([#114](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/issues/114)) ([#147](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/issues/147)) ([d0a98f3](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/commit/d0a98f3f3505e81c9e072b2c3880a5f2d795e716))
* add password reset and change password flows ([#119](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/issues/119)) ([#148](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/issues/148)) ([ea01214](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/commit/ea012141f5a84eff272b40a771445e9d3893992e))
* allow parents to manage siblings and hearing info ([#126](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/issues/126)) ([#144](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/issues/144)) ([2cb4211](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/commit/2cb4211b364b451b13ccb25d86c3ccd599b079aa))
* **api:** port 129 endpoints from routing-controllers to Server Actions + route handlers ([e7a48d5](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/commit/e7a48d59498461f6f278174ffdd55dfa22124f0d))
* migrate app hosting from OpenNext to Vinext ([#112](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/issues/112)) ([53cb11b](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/commit/53cb11b1cce41e298a482f2cbaed39ad3ee71cac))
* **parents:** audiogram compliance chips, document upload, and date/mask fixes ([aec65a6](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/commit/aec65a6d20a27cc28c3aebca8bf7357920c65c38))
* **photos:** add admin photo gallery delete action ([#135](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/issues/135)) ([#141](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/issues/141)) ([07ee152](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/commit/07ee15219c8066d0e513d67efb5a159f214c1c41))
* scaffold flattened Next.js 16 + OpenNext on Cloudflare Workers app ([468f8df](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/commit/468f8dfc90f950c50b07413c434749695759e3b9))
* seed Michelle and Jeannette and lowercase the sidebar brand ([#111](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/issues/111)) ([d371f33](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/commit/d371f3316b706f8aa76a2cdd2918770cf3e31a03))
* show assessment summary and fix Add Post dialog ([#127](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/issues/127)) ([#145](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/issues/145)) ([476e3dd](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/commit/476e3dd4ebfb072f4c88ed3a27abaee911eeed84))
* **web:** port 34 routes to Next.js App Router with MUI 9 + React Query ([c105ae4](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/commit/c105ae4f64608c0764d30e8122ce2ef6a67a1fa2))


### Bug Fixes

* **admin:** link teacher users to their profile and stop Chip-in-p hydration ([b757020](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/commit/b7570204ae4ca9f4cdc4061af663dfae650467f3))
* **auth:** add issuer column to auth_accounts for better-auth 1.7 compatibility ([3d9635f](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/commit/3d9635f672b98147179e07b9543dd3880032e5b3))
* authorize make-up attendance by teacher assignment ([#142](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/issues/142)) ([bcd4e4f](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/commit/bcd4e4fa086381594b2c58f3669b9922d3bc6bb0))
* **authz:** gate unassigned users out of the dashboard and close the locations leak ([adb4950](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/commit/adb4950a88e29add6991900e40530156dda6883b))
* **authz:** scope student records to linked/assigned callers ([c72359d](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/commit/c72359deff25b001cb3c97444a7c8f47bc1542f3))
* **build:** make OpenNext production build pass for Cloudflare Workers ([a511eb7](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/commit/a511eb77ae6a76a13089c698bec6bb23a36977e4))
* **build:** skip static prerender so OpenNext can resolve D1 bindings ([557ff98](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/commit/557ff9862681076a131500c8ca4fef29f09236af))
* **files:** tighten file download authorization for photos, bulletins, and documents ([#146](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/issues/146)) ([c1a210d](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/commit/c1a210d421467ed0cc87300b6aee71bab8e97229))
* handle denied record access safely ([3da2990](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/commit/3da29908e751d8ad80c320c7293edb4d61446797))
* **infra:** reconcile staging bindings, secure file routes, fix upload/email/cron bugs ([076a5e1](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/commit/076a5e19bad9da289886115aa5d5f6981e13de03))
* keep student names off summary lists ([cae569a](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/commit/cae569a0febe5757174bf82964be2f84054ecebd))
* label the make-up session date filter ([a3fd626](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/commit/a3fd62692782403f619a79a1f1bf93d32af8a247))
* let parents edit custom hearing devices ([#152](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/issues/152)) ([ef18963](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/commit/ef18963b9c167bb44f5fc0355e7c4d21bad06489))
* OpenNext startup issues ([552a18e](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/commit/552a18e73b72408f8d3d0e734fe686360454e292))
* preserve parent sibling notes ([#151](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/issues/151)) ([a37cf55](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/commit/a37cf55cd6a0c698d584c6ef1a3b4e517d99ce9d))
* preserve pending table search input ([852984e](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/commit/852984e2216fb77a3b9714ca2887ec2e4b5b065e))
* restore unmarked attendance on undo ([557d3de](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/commit/557d3de8e944c3723a301ab4b57a956e8989431b))
* trim names before generating initials ([a8a6f37](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/commit/a8a6f3766e608de9bb80583b4da2c7942842f223))
* **ui:** add app icon so favicon requests stop 404ing ([ebd989f](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/commit/ebd989f7b34bebc0bba6c77db3439d5651515840))
* wrap page header title on small screens ([0f201f8](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/commit/0f201f87d1f5a617a402b452d7d09e6848178106))
