/**
 * @license
 * Copyright 2026
 * SPDX-License-Identifier: MIT
 */

/**
 * Chrome Extension Tools - Main Export
 * 
 * This module exports all available tool packs for Chrome extensions.
 * Tool packs contain both definitions (for tools/list) and handlers (for tools/call).
 */

export * from './types';
export * from './navigation';
export * from './dom';
export * from './debugging';

import { navigationTools } from './navigation';
import { domTools } from './dom';
import { debuggingTools } from './debugging';
import type { ToolPack } from './types';

/**
 * All available tool packs
 * Extensions can import specific packs or use all of them
 */
export const toolPacks = {
    navigation: navigationTools,
    dom: domTools,
    debugging: debuggingTools,
};

/**
 * Get all tools combined
 * Convenience export for using all available tools
 */
export const allTools: ToolPack = {
    definitions: [
        ...navigationTools.definitions,
        ...domTools.definitions,
        ...debuggingTools.definitions,
    ],
    handlers: {
        ...navigationTools.handlers,
        ...domTools.handlers,
        ...debuggingTools.handlers,
    },
};
