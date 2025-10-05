// This file is run before each test file.
// You can use it to set up a global state for your tests,
// such as mocking browser APIs or setting up a test database.

import { vi } from 'vitest';

// Example: Mocking the chrome API for tests
// Since our services use `chrome.runtime.sendMessage`, we need a basic mock.
const mockChrome = {
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
    },
    lastError: null,
  },
  downloads: {
    download: vi.fn(),
  },
  storage: {
    session: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
    }
  }
};

vi.stubGlobal('chrome', mockChrome);