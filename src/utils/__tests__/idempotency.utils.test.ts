import {
  generateIdempotencyKey,
  storeIdempotencyKey,
  getStoredIdempotencyKey,
  clearIdempotencyKey,
  clearAllIdempotencyKeys,
} from '@/utils/idempotency.utils';

/**
 * Test suite for Idempotency Key Management
 * Run with: npm test or jest src/utils/__tests__/idempotency.utils.test.ts
 */

describe('Idempotency Key Management', () => {
  beforeEach(() => {
    // Clear sessionStorage before each test
    sessionStorage.clear();
  });

  afterEach(() => {
    // Clean up after each test
    sessionStorage.clear();
  });

  describe('generateIdempotencyKey', () => {
    test('should generate a non-empty string', () => {
      const key = generateIdempotencyKey();
      expect(typeof key).toBe('string');
      expect(key.length).toBeGreaterThan(0);
    });

    test('should generate unique keys', () => {
      const key1 = generateIdempotencyKey();
      const key2 = generateIdempotencyKey();
      expect(key1).not.toBe(key2);
    });

    test('should contain timestamp and UUID', () => {
      const key = generateIdempotencyKey();
      // Format: timestamp-uuid
      const parts = key.split('-');
      expect(parts.length).toBeGreaterThan(2); // At least timestamp and uuid parts
    });
  });

  describe('storeIdempotencyKey', () => {
    test('should store idempotency key in sessionStorage', () => {
      const key = 'test-key-123';
      const operationId = 'test-operation';
      
      storeIdempotencyKey(key, operationId);
      
      const stored = JSON.parse(sessionStorage.getItem('idempotency_keys') || '{}');
      expect(stored[operationId]).toBeDefined();
      expect(stored[operationId].key).toBe(key);
    });

    test('should store timestamp with key', () => {
      const key = 'test-key-456';
      const operationId = 'test-operation-2';
      
      const beforeTime = Date.now();
      storeIdempotencyKey(key, operationId);
      const afterTime = Date.now();
      
      const stored = JSON.parse(sessionStorage.getItem('idempotency_keys') || '{}');
      expect(stored[operationId].timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(stored[operationId].timestamp).toBeLessThanOrEqual(afterTime);
    });

    test('should handle multiple keys', () => {
      const key1 = 'key-1';
      const key2 = 'key-2';
      const op1 = 'op-1';
      const op2 = 'op-2';
      
      storeIdempotencyKey(key1, op1);
      storeIdempotencyKey(key2, op2);
      
      const stored = JSON.parse(sessionStorage.getItem('idempotency_keys') || '{}');
      expect(Object.keys(stored).length).toBe(2);
      expect(stored[op1].key).toBe(key1);
      expect(stored[op2].key).toBe(key2);
    });
  });

  describe('getStoredIdempotencyKey', () => {
    test('should retrieve stored key', () => {
      const key = 'test-key-789';
      const operationId = 'test-retrieve';
      
      storeIdempotencyKey(key, operationId);
      const retrieved = getStoredIdempotencyKey(operationId);
      
      expect(retrieved).toBe(key);
    });

    test('should return null for non-existent key', () => {
      const retrieved = getStoredIdempotencyKey('non-existent-operation');
      expect(retrieved).toBeNull();
    });

    test('should handle empty sessionStorage gracefully', () => {
      sessionStorage.removeItem('idempotency_keys');
      const retrieved = getStoredIdempotencyKey('any-operation');
      expect(retrieved).toBeNull();
    });

    test('should handle corrupted sessionStorage gracefully', () => {
      sessionStorage.setItem('idempotency_keys', 'invalid json');
      const retrieved = getStoredIdempotencyKey('any-operation');
      expect(retrieved).toBeNull();
    });
  });

  describe('clearIdempotencyKey', () => {
    test('should remove specific key', () => {
      const key = 'test-key-clear';
      const operationId = 'test-clear';
      
      storeIdempotencyKey(key, operationId);
      expect(getStoredIdempotencyKey(operationId)).toBe(key);
      
      clearIdempotencyKey(operationId);
      expect(getStoredIdempotencyKey(operationId)).toBeNull();
    });

    test('should not affect other keys', () => {
      const key1 = 'key-1';
      const key2 = 'key-2';
      const op1 = 'op-1';
      const op2 = 'op-2';
      
      storeIdempotencyKey(key1, op1);
      storeIdempotencyKey(key2, op2);
      
      clearIdempotencyKey(op1);
      
      expect(getStoredIdempotencyKey(op1)).toBeNull();
      expect(getStoredIdempotencyKey(op2)).toBe(key2);
    });

    test('should handle clearing non-existent key gracefully', () => {
      // Should not throw error
      expect(() => clearIdempotencyKey('non-existent')).not.toThrow();
    });
  });

  describe('clearAllIdempotencyKeys', () => {
    test('should remove all keys', () => {
      storeIdempotencyKey('key-1', 'op-1');
      storeIdempotencyKey('key-2', 'op-2');
      storeIdempotencyKey('key-3', 'op-3');
      
      clearAllIdempotencyKeys();
      
      expect(sessionStorage.getItem('idempotency_keys')).toBeNull();
    });

    test('should handle empty storage gracefully', () => {
      // Should not throw error
      expect(() => clearAllIdempotencyKeys()).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete key lifecycle', () => {
      // Generate
      const key = generateIdempotencyKey();
      const operationId = '/api/v1/payments/initialize-123';
      
      // Store
      storeIdempotencyKey(key, operationId);
      
      // Retrieve
      expect(getStoredIdempotencyKey(operationId)).toBe(key);
      
      // Clear
      clearIdempotencyKey(operationId);
      expect(getStoredIdempotencyKey(operationId)).toBeNull();
    });

    test('should retry with same key', () => {
      const operationId = '/api/v1/transactions/bills/payment-456';
      
      // First attempt
      let key = generateIdempotencyKey();
      storeIdempotencyKey(key, operationId);
      
      // Simulate retry - should get same key
      const storedKey = getStoredIdempotencyKey(operationId);
      expect(storedKey).toBe(key);
    });

    test('should manage multiple concurrent operations', () => {
      const operations = [
        { id: 'payment-1', key: generateIdempotencyKey() },
        { id: 'payment-2', key: generateIdempotencyKey() },
        { id: 'bills-1', key: generateIdempotencyKey() },
        { id: 'wallet-1', key: generateIdempotencyKey() },
      ];
      
      // Store all
      operations.forEach(({ id, key }) => {
        storeIdempotencyKey(key, id);
      });
      
      // Verify all
      operations.forEach(({ id, key }) => {
        expect(getStoredIdempotencyKey(id)).toBe(key);
      });
      
      // Clear one
      clearIdempotencyKey('payment-1');
      expect(getStoredIdempotencyKey('payment-1')).toBeNull();
      expect(getStoredIdempotencyKey('payment-2')).toBe(operations[1].key);
    });
  });
});
