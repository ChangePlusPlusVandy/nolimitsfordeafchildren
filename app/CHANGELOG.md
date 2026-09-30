# Changelog

## [0.1.0](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/compare/app-v0.0.1...app-v0.1.0) (2026-09-30)


### Features

* **api:** port 129 endpoints from routing-controllers to Server Actions + route handlers ([e7a48d5](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/commit/e7a48d59498461f6f278174ffdd55dfa22124f0d))
* **parents:** audiogram compliance chips, document upload, and date/mask fixes ([aec65a6](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/commit/aec65a6d20a27cc28c3aebca8bf7357920c65c38))
* scaffold flattened Next.js 16 + OpenNext on Cloudflare Workers app ([468f8df](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/commit/468f8dfc90f950c50b07413c434749695759e3b9))
* seed Michelle and Jeannette and lowercase the sidebar brand ([#111](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/issues/111)) ([d371f33](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/commit/d371f3316b706f8aa76a2cdd2918770cf3e31a03))
* **web:** port 34 routes to Next.js App Router with MUI 9 + React Query ([c105ae4](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/commit/c105ae4f64608c0764d30e8122ce2ef6a67a1fa2))


### Bug Fixes

* **admin:** link teacher users to their profile and stop Chip-in-p hydration ([b757020](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/commit/b7570204ae4ca9f4cdc4061af663dfae650467f3))
* **auth:** add issuer column to auth_accounts for better-auth 1.7 compatibility ([3d9635f](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/commit/3d9635f672b98147179e07b9543dd3880032e5b3))
* **authz:** gate unassigned users out of the dashboard and close the locations leak ([adb4950](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/commit/adb4950a88e29add6991900e40530156dda6883b))
* **authz:** scope student records to linked/assigned callers ([c72359d](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/commit/c72359deff25b001cb3c97444a7c8f47bc1542f3))
* **build:** make OpenNext production build pass for Cloudflare Workers ([a511eb7](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/commit/a511eb77ae6a76a13089c698bec6bb23a36977e4))
* **build:** skip static prerender so OpenNext can resolve D1 bindings ([557ff98](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/commit/557ff9862681076a131500c8ca4fef29f09236af))
* **infra:** reconcile staging bindings, secure file routes, fix upload/email/cron bugs ([076a5e1](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/commit/076a5e19bad9da289886115aa5d5f6981e13de03))
* OpenNext startup issues ([552a18e](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/commit/552a18e73b72408f8d3d0e734fe686360454e292))
* **ui:** add app icon so favicon requests stop 404ing ([ebd989f](https://github.com/ChangePlusPlusVandy/nolimitsfordeafchildren/commit/ebd989f7b34bebc0bba6c77db3439d5651515840))
