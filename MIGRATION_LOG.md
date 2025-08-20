# Violet Kanban Zustand Migration Log

## Migration Plan

### 1. Identify Context Usage

-   [x] Locate all components using legacy contexts:
    -   DataProvider
    -   OrganizationsProvider
    -   AuthProvider
    -   SyncProvider

### 2. Replace Context Imports with Store/Hook Imports

-   [x] Use `useOrganizationStore` for organization data
-   [x] Use `useAuthStore` for auth state
-   [x] Use `useQueueStore` and hooks from `useVioletKanbanHooks.ts` for board/list/card/queue actions

### 3. Update Component Usages

-   [x] Migrate `LooseCardsMenu` to Zustand stores
-   [x] Migrate `OrganizationSelect` to Zustand stores
-   [x] Migrate `OrganizationSelector` to Zustand stores
-   [ ] Replace context calls with store selectors/hooks in each component
-   [ ] Update queue actions to use new store logic
-   [ ] Update organization/auth references to Zustand

### 4. Remove Context Providers

-   [ ] Remove legacy providers from the app root/component tree

### 5. Test and Validate

-   [ ] Test each migrated component for correct state, actions, and sync
-   [ ] Validate queue squashing and sync logic

### 6. Clean Up

-   [ ] Remove unused context files and legacy code
-   [ ] Update documentation to reflect Zustand migration

**2025-08-20**

-   Migrated FloatingSyncButton.tsx to Zustand queueStore
-   Migrated ActionQueue.tsx to Zustand queueStore and helpers for conflict detection
-   Migrated CardFormWrapper.tsx, ListFormWrapper.tsx, and BoardFormWrapper.tsx to Zustand queue logic
-   Migrated BoardCardItem.tsx to Zustand queue logic for card delete actions

-   Migrated queue, organization, and auth state to Zustand stores
-   Integrated queue squashing into store logic
-   Updated syncManager to use fresh idToken and organizationId for each sync
-   Ready to migrate components to use Zustand stores
-   Migrated `LooseCardsMenu` to Zustand stores
-   Migrated `OrganizationSelect` to Zustand stores
-   Replaced `useLocalOrganizations` context with `useOrganizationStore` Zustand hook
-   Updated all usages to Zustand selectors/actions
-   Preserved mock data logic for local dev
-   Ready for validation and testing
-   Refactored OrganizationGate to use Zustand organizationStore
-   Removed LocalOrganizationsProvider from AppProviders
-   Wrapped main app content with OrganizationGate for org gating
-   Ready for validation and testing
-   Migrated OrganizationFormWrapper to Zustand
-   OrganizationFormWrapper now calls organization creation API directly (no queue)
-   OrganizationGate shows offline message if no organization exists and user is offline
-   Ready for validation and testing
-   Migrated `OrganizationSelector` to Zustand stores
-   Organization creation in `OrganizationSelector` now uses direct API call
-   Ready for validation and testing
-   Migrated `Breadcrumbs` to Zustand stores
-   Uses Zustand boardStore for board data
-   Removed legacy DataProvider context
-   Ready for validation and testing
-   Migrated `UserMenu` to Zustand stores
-   Uses Zustand authStore for user/auth state/actions
-   Removed legacy AuthProvider context
-   Ready for validation and testing

---

**Next Steps:**

-   Continue migrating components using contexts to Zustand
-   Remove legacy providers and context files
-   Test and validate full app functionality
