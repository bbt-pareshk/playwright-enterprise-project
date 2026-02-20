
import { mergeTests } from '@playwright/test';
import { test as baseTest, expect as baseExpect } from './base.fixture';
import { test as authTest } from './auth.fixture';

// Merge all fixtures into one
export const test = mergeTests(baseTest, authTest);
export const expect = baseExpect;
