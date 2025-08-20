# Violet Kanban Zustand Migration: Component Checklist

## Components using legacy contexts (to migrate)

-   [x] BoardList.tsx
-   [x] OrganizationSelect.tsx (migrated)
-   [x] OrganizationGate.tsx (migrated to Zustand, now used in AppProviders)
-   [x] OrganizationFormWrapper.tsx (migrated: direct API call, no queue)
-   [x] OrganizationSelector.tsx (migrated: Zustand + direct API)
-   [x] Breadcrumbs.tsx (migrated: Zustand boardStore)
-   [x] UserMenu.tsx (migrated: Zustand authStore)
-   [x] ActionQueue.tsx (migrated)
-   [x] CardFormWrapper.tsx (migrated)
-   [x] ListFormWrapper.tsx (migrated)
-   [x] BoardFormWrapper.tsx (migrated)
-   [x] BoardCardItem.tsx (migrated)
-   [x] FloatingSyncButton.tsx (migrated)
-   [x] LooseCardsMenu.tsx (migrated)
-   [x] menus/LooseCardsMenu.tsx (migrated)

## Migration Steps

-   Replace context imports with Zustand store/hook imports
-   Update usages to Zustand selectors/actions
-   Remove context providers from app root
-   Test and validate each migrated component

---

Update this checklist as you migrate each component.
