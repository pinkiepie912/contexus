/**
 * Background Service Worker Test Utilities
 *
 * This module provides testing functions for the background service worker.
 * These functions can be called from the browser console when the extension is loaded.
 */

import * as messaging from './messaging.js';
import type { SaveSnippetPayload } from '../types.js';

/**
 * Test suite for background service worker functionality
 */
export class BackgroundServiceTest {
  private testResults: { test: string; result: 'pass' | 'fail'; error?: string }[] = [];

  /**
   * Run all background service tests
   */
  async runAllTests(): Promise<void> {
    console.log('🧪 Starting Background Service Worker Tests...');

    await this.testPingConnection();
    await this.testDatabaseSeeding();
    await this.testSnippetOperations();
    await this.testRoleOperations();
    await this.testSearchFunctionality();

    this.printResults();
  }

  /**
   * Test 1: Connection to background service worker
   */
  async testPingConnection(): Promise<void> {
    try {
      const response = await messaging.pingBackground();

      if (response.pong && typeof response.at === 'number') {
        this.addResult('Ping Connection', 'pass');
        console.log('✅ Background service worker connection: OK');
      } else {
        this.addResult('Ping Connection', 'fail', 'Invalid ping response');
      }
    } catch (error) {
      this.addResult('Ping Connection', 'fail', error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ Background service worker connection failed:', error);
    }
  }

  /**
   * Test 2: Database seeding with default roles
   */
  async testDatabaseSeeding(): Promise<void> {
    try {
      const roles = await messaging.getAllRoles();

      if (roles.length >= 4) {
        const systemRoles = roles.filter(role => role.isSystem);

        if (systemRoles.length >= 4) {
          this.addResult('Database Seeding', 'pass');
          console.log('✅ Database seeding: OK -', systemRoles.length, 'system roles found');
        } else {
          this.addResult('Database Seeding', 'fail', 'Insufficient system roles');
        }
      } else {
        this.addResult('Database Seeding', 'fail', 'No roles found');
      }
    } catch (error) {
      this.addResult('Database Seeding', 'fail', error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ Database seeding test failed:', error);
    }
  }

  /**
   * Test 3: Snippet CRUD operations
   */
  async testSnippetOperations(): Promise<void> {
    try {
      // Create test snippet
      const testSnippet: SaveSnippetPayload = {
        content: 'This is a test snippet for validation',
        sourceUrl: 'https://example.com/test',
        title: 'Test Snippet',
        tags: ['test', 'validation'],
        platform: 'other'
      };

      const saveResult = await messaging.saveSnippet(testSnippet);

      if (!saveResult.success || !saveResult.snippetId) {
        this.addResult('Snippet Operations', 'fail', 'Failed to save snippet');
        return;
      }

      // Read snippet
      const snippet = await messaging.getSnippetById(saveResult.snippetId);

      if (!snippet) {
        this.addResult('Snippet Operations', 'fail', 'Failed to retrieve snippet');
        return;
      }

      // Update snippet
      const updateResult = await messaging.updateSnippet(saveResult.snippetId, {
        title: 'Updated Test Snippet'
      });

      if (!updateResult.success) {
        this.addResult('Snippet Operations', 'fail', 'Failed to update snippet');
        return;
      }

      // Delete snippet
      const deleteResult = await messaging.deleteSnippet(saveResult.snippetId);

      if (!deleteResult.success) {
        this.addResult('Snippet Operations', 'fail', 'Failed to delete snippet');
        return;
      }

      this.addResult('Snippet Operations', 'pass');
      console.log('✅ Snippet CRUD operations: OK');

    } catch (error) {
      this.addResult('Snippet Operations', 'fail', error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ Snippet operations test failed:', error);
    }
  }

  /**
   * Test 4: Role operations
   */
  async testRoleOperations(): Promise<void> {
    try {
      // Create test role
      const createResult = await messaging.createRole({
        name: 'Test Role',
        description: 'A test role for validation',
        promptTemplate: 'You are a test role. Please respond helpfully.',
        category: 'test'
      });

      if (!createResult.success || !createResult.roleId) {
        this.addResult('Role Operations', 'fail', 'Failed to create role');
        return;
      }

      // Update role
      const updateResult = await messaging.updateRole(createResult.roleId, {
        description: 'Updated test role description'
      });

      if (!updateResult.success) {
        this.addResult('Role Operations', 'fail', 'Failed to update role');
        return;
      }

      // Delete role
      const deleteResult = await messaging.deleteRole(createResult.roleId);

      if (!deleteResult.success) {
        this.addResult('Role Operations', 'fail', 'Failed to delete role');
        return;
      }

      this.addResult('Role Operations', 'pass');
      console.log('✅ Role CRUD operations: OK');

    } catch (error) {
      this.addResult('Role Operations', 'fail', error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ Role operations test failed:', error);
    }
  }

  /**
   * Test 5: Search functionality
   */
  async testSearchFunctionality(): Promise<void> {
    try {
      // Search for existing content
      const searchResult = await messaging.searchSnippets('test', {
        limit: 10,
        offset: 0
      });

      if (typeof searchResult.total === 'number' && Array.isArray(searchResult.results)) {
        this.addResult('Search Functionality', 'pass');
        console.log('✅ Search functionality: OK -', searchResult.total, 'total snippets');
      } else {
        this.addResult('Search Functionality', 'fail', 'Invalid search response format');
      }

    } catch (error) {
      this.addResult('Search Functionality', 'fail', error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ Search functionality test failed:', error);
    }
  }

  /**
   * Add test result
   */
  private addResult(test: string, result: 'pass' | 'fail', error?: string): void {
    this.testResults.push({ test, result, error });
  }

  /**
   * Print test results summary
   */
  private printResults(): void {
    console.log('\n📊 Background Service Worker Test Results:');
    console.log('==========================================');

    const passed = this.testResults.filter(r => r.result === 'pass').length;
    const failed = this.testResults.filter(r => r.result === 'fail').length;

    this.testResults.forEach(result => {
      const icon = result.result === 'pass' ? '✅' : '❌';
      console.log(`${icon} ${result.test}`);

      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    console.log('\n📈 Summary:');
    console.log(`   Passed: ${passed}/${this.testResults.length}`);
    console.log(`   Failed: ${failed}/${this.testResults.length}`);
    console.log(`   Success Rate: ${((passed / this.testResults.length) * 100).toFixed(1)}%`);

    if (failed === 0) {
      console.log('\n🎉 All background service worker tests passed!');
    } else {
      console.log('\n⚠️ Some tests failed. Check the logs above for details.');
    }
  }

  /**
   * Test specific message type
   */
  async testMessageType(type: string, payload?: any): Promise<void> {
    try {
      const response = await chrome.runtime.sendMessage({ type, payload });
      console.log(`Message ${type} response:`, response);
    } catch (error) {
      console.error(`Message ${type} error:`, error);
    }
  }
}

// Export instance for global access
export const backgroundTest = new BackgroundServiceTest();

// Make available in browser console for manual testing
if (typeof window !== 'undefined') {
  (window as any).backgroundTest = backgroundTest;
  console.log('🔧 Background service test available: backgroundTest.runAllTests()');
}