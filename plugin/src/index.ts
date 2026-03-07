import type { PluginAPI } from './types.js';

export const id = 'athena';
export const name = 'Athena - Strategic Career Engineer';

export function register(api: PluginAPI) {
  console.log('[Athena] Plugin loaded successfully');
}
