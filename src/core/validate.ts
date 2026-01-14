/**
 * @license
 * Copyright 2026
 * SPDX-License-Identifier: MIT
 */

import { ValidationError } from './errors';
import type { SchemaProperty } from './types';

/**
 * Simple JSON schema validation (optional feature)
 * Can be extended with a full JSON schema validator library if needed
 */

export function validateParams(
    params: Record<string, unknown>,
    schema: {
        type: 'object';
        properties?: Record<string, SchemaProperty>;
        required?: string[];
    },
): void {
    // Check required fields
    if (schema.required) {
        for (const field of schema.required) {
            if (!(field in params)) {
                throw new ValidationError(
                    `Missing required field: ${field}`,
                    field,
                );
            }
        }
    }

    // Validate field types
    if (schema.properties) {
        for (const [field, value] of Object.entries(params)) {
            const fieldSchema = schema.properties[field];
            if (!fieldSchema) {
                // Unknown field - could warn or ignore
                continue;
            }

            validateValue(value, fieldSchema, field);
        }
    }
}

function validateValue(
    value: unknown,
    schema: SchemaProperty,
    fieldName: string,
): void {
    const actualType = getActualType(value);

    if (schema.type === 'array') {
        if (!Array.isArray(value)) {
            throw new ValidationError(
                `Expected array for field ${fieldName}, got ${actualType}`,
                fieldName,
            );
        }

        if (schema.items) {
            for (let i = 0; i < value.length; i++) {
                validateValue(value[i], schema.items, `${fieldName}[${i}]`);
            }
        }
        return;
    }

    if (schema.type === 'object' && schema.properties) {
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
            throw new ValidationError(
                `Expected object for field ${fieldName}, got ${actualType}`,
                fieldName,
            );
        }

        const objValue = value as Record<string, unknown>;

        // Check required fields in nested object
        if (schema.required) {
            for (const requiredField of schema.required) {
                if (!(requiredField in objValue)) {
                    throw new ValidationError(
                        `Missing required field: ${fieldName}.${requiredField}`,
                        `${fieldName}.${requiredField}`,
                    );
                }
            }
        }

        // Validate nested properties
        for (const [key, val] of Object.entries(objValue)) {
            const propSchema = schema.properties[key];
            if (propSchema) {
                validateValue(val, propSchema, `${fieldName}.${key}`);
            }
        }
        return;
    }

    // Simple type checking
    if (actualType !== schema.type) {
        throw new ValidationError(
            `Expected ${schema.type} for field ${fieldName}, got ${actualType}`,
            fieldName,
        );
    }

    // Enum validation
    if (schema.enum && !schema.enum.includes(value as string)) {
        throw new ValidationError(
            `Invalid value for field ${fieldName}. Must be one of: ${schema.enum.join(', ')}`,
            fieldName,
        );
    }
}

function getActualType(value: unknown): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
}
