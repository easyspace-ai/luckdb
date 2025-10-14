/**
 * Grid System - Unified Export
 * 
 * This is the refactored grid system that combines the original grid
 * and grid-enhancements into a single, cohesive structure.
 */

// Core Grid Components
export * from './core';

// UI Components (includes editors, context menus, etc.)
export * from './components';

// Hooks (primitive + business)
export * from './hooks';

// Renderers
export * from './renderers';

// Managers
export * from './managers';

// Store
export * from './store';

// Utilities
export * from './utils';

// Configs
export * from './configs';

// Types
export * from './types';

// Legacy re-exports for backward compatibility
export { Grid } from './core/Grid';
export type { IGridRef } from './core/Grid';
export type { IGridColumn, ICellItem } from './types/grid';
