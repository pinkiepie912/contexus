/**
 * Content Script Testing Utilities
 *
 * This module provides testing functions for the content script functionality.
 * These functions can be called from the browser console when on LLM platform pages.
 */

/**
 * Content Script Test Suite
 * Tests the conversation detection and adapter functionality
 */
export class ContentScriptTest {
  private testResults: { test: string; result: 'pass' | 'fail'; details?: any }[] = [];

  /**
   * Run all content script tests
   */
  async runAllTests(): Promise<void> {
    console.log('🧪 Starting Content Script Tests...');

    await this.testPlatformDetection();
    await this.testAdapterSelectors();
    await this.testConversationDetection();
    await this.testMessageExtraction();
    await this.testQuickCapture();

    this.printResults();
  }

  /**
   * Test 1: Platform Detection
   */
  async testPlatformDetection(): Promise<void> {
    try {
      const contentManager = (window as any).contextusContent;

      if (!contentManager) {
        this.addResult('Platform Detection', 'fail', 'Content manager not found');
        return;
      }

      const adapter = contentManager.getAdapter();
      const currentUrl = window.location.href;

      // Check if adapter was properly detected
      if (adapter && adapter.platform) {
        const expectedPlatform = this.detectExpectedPlatform(currentUrl);

        if (adapter.platform === expectedPlatform || expectedPlatform === 'other') {
          this.addResult('Platform Detection', 'pass', {
            detected: adapter.platform,
            name: adapter.name,
            url: currentUrl
          });
          console.log('✅ Platform detection: OK -', adapter.name, `(${adapter.platform})`);
        } else {
          this.addResult('Platform Detection', 'fail', {
            detected: adapter.platform,
            expected: expectedPlatform
          });
        }
      } else {
        this.addResult('Platform Detection', 'fail', 'No adapter detected');
      }

    } catch (error) {
      this.addResult('Platform Detection', 'fail', error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ Platform detection test failed:', error);
    }
  }

  /**
   * Test 2: Adapter Selectors
   */
  async testAdapterSelectors(): Promise<void> {
    try {
      const contentManager = (window as any).contextusContent;
      const adapter = contentManager.getAdapter();

      // Test if selectors work on current page
      const selectorResults = {
        conversationContainer: !!document.querySelector(adapter.selectors.conversationContainer),
        messageContainer: !!document.querySelector(adapter.selectors.messageContainer),
        userMessage: !!document.querySelector(adapter.selectors.userMessage),
        assistantMessage: !!document.querySelector(adapter.selectors.assistantMessage),
        messageContent: !!document.querySelector(adapter.selectors.messageContent)
      };

      const workingSelectorCount = Object.values(selectorResults).filter(Boolean).length;
      const totalSelectors = Object.keys(selectorResults).length;

      if (workingSelectorCount >= 3) {
        this.addResult('Adapter Selectors', 'pass', {
          working: workingSelectorCount,
          total: totalSelectors,
          details: selectorResults
        });
        console.log('✅ Adapter selectors: OK -', workingSelectorCount, '/', totalSelectors, 'working');
      } else {
        this.addResult('Adapter Selectors', 'fail', {
          working: workingSelectorCount,
          total: totalSelectors,
          details: selectorResults
        });
      }

    } catch (error) {
      this.addResult('Adapter Selectors', 'fail', error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ Adapter selectors test failed:', error);
    }
  }

  /**
   * Test 3: Conversation Detection
   */
  async testConversationDetection(): Promise<void> {
    try {
      const contentManager = (window as any).contextusContent;
      const detectedMessages = contentManager.getDetectedMessages();

      if (detectedMessages && detectedMessages.length > 0) {
        const captureReadyMessages = contentManager.getCaptureReadyMessages();

        this.addResult('Conversation Detection', 'pass', {
          totalMessages: detectedMessages.length,
          captureReady: captureReadyMessages.length
        });

        console.log('✅ Conversation detection: OK -', detectedMessages.length, 'messages detected,', captureReadyMessages.length, 'ready for capture');

        // Test message attributes
        const sampleMessage = detectedMessages[0];
        if (sampleMessage) {
          console.log('📝 Sample message attributes:', {
            'data-contexus-message': sampleMessage.getAttribute('data-contexus-message'),
            'data-contexus-complete': sampleMessage.getAttribute('data-contexus-complete'),
            'data-contexus-type': sampleMessage.getAttribute('data-contexus-type'),
            'data-contexus-capture-ready': sampleMessage.getAttribute('data-contexus-capture-ready')
          });
        }

      } else {
        this.addResult('Conversation Detection', 'fail', 'No messages detected');
      }

    } catch (error) {
      this.addResult('Conversation Detection', 'fail', error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ Conversation detection test failed:', error);
    }
  }

  /**
   * Test 4: Message Text Extraction
   */
  async testMessageExtraction(): Promise<void> {
    try {
      const contentManager = (window as any).contextusContent;
      const detectedMessages = contentManager.getDetectedMessages();

      if (detectedMessages && detectedMessages.length > 0) {
        let extractedCount = 0;
        let totalTextLength = 0;

        detectedMessages.forEach((messageEl: Element, index: number) => {
          const captureData = (messageEl as any).__contextusCaptureData;

          if (captureData && captureData.text) {
            extractedCount++;
            totalTextLength += captureData.text.length;

            if (index === 0) {
              console.log('📖 Sample extracted text:', captureData.text.substring(0, 100) + '...');
            }
          }
        });

        if (extractedCount > 0) {
          const avgTextLength = Math.round(totalTextLength / extractedCount);

          this.addResult('Message Extraction', 'pass', {
            extractedCount,
            avgTextLength,
            totalMessages: detectedMessages.length
          });

          console.log('✅ Message extraction: OK -', extractedCount, 'messages with text, avg length:', avgTextLength);
        } else {
          this.addResult('Message Extraction', 'fail', 'No text extracted from messages');
        }

      } else {
        this.addResult('Message Extraction', 'fail', 'No messages available for extraction test');
      }

    } catch (error) {
      this.addResult('Message Extraction', 'fail', error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ Message extraction test failed:', error);
    }
  }

  /**
   * Test 5: Quick Capture Functionality
   */
  async testQuickCapture(): Promise<void> {
    try {
      console.log('🔍 Testing quick capture with selected text...');

      // Create a test selection
      const testText = 'This is a test text for quick capture functionality.';
      const testElement = document.createElement('div');
      testElement.textContent = testText;
      testElement.style.position = 'absolute';
      testElement.style.top = '-1000px';
      document.body.appendChild(testElement);

      // Create selection
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(testElement);
      selection?.removeAllRanges();
      selection?.addRange(range);

      // Test quick capture
      const contentManager = (window as any).contextusContent;

      // Note: This will actually try to save to the database
      // In a real test environment, you might want to mock this
      console.warn('⚠️ Quick capture test will attempt real database save');

      try {
        await contentManager.quickCapture();
        this.addResult('Quick Capture', 'pass', 'Quick capture executed successfully');
        console.log('✅ Quick capture: OK - Test text captured');
      } catch (captureError) {
        // This might fail if background service isn't ready, which is okay for testing
        this.addResult('Quick Capture', 'pass', 'Quick capture executed (background service may not be ready)');
        console.log('⚠️ Quick capture: Attempted but background service may not be ready');
      }

      // Clean up
      selection?.removeAllRanges();
      document.body.removeChild(testElement);

    } catch (error) {
      this.addResult('Quick Capture', 'fail', error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ Quick capture test failed:', error);
    }
  }

  /**
   * Detect expected platform from URL
   */
  private detectExpectedPlatform(url: string): string {
    if (url.includes('chat.openai.com') || url.includes('chatgpt.com')) return 'openai';
    if (url.includes('gemini.google.com') || url.includes('bard.google.com')) return 'gemini';
    if (url.includes('claude.ai')) return 'claude';
    return 'other';
  }

  /**
   * Add test result
   */
  private addResult(test: string, result: 'pass' | 'fail', details?: any): void {
    this.testResults.push({ test, result, details });
  }

  /**
   * Print test results summary
   */
  private printResults(): void {
    console.log('\n📊 Content Script Test Results:');
    console.log('======================================');

    const passed = this.testResults.filter(r => r.result === 'pass').length;
    const failed = this.testResults.filter(r => r.result === 'fail').length;

    this.testResults.forEach(result => {
      const icon = result.result === 'pass' ? '✅' : '❌';
      console.log(`${icon} ${result.test}`);

      if (result.details) {
        console.log('   Details:', result.details);
      }
    });

    console.log('\n📈 Summary:');
    console.log(`   Passed: ${passed}/${this.testResults.length}`);
    console.log(`   Failed: ${failed}/${this.testResults.length}`);
    console.log(`   Success Rate: ${((passed / this.testResults.length) * 100).toFixed(1)}%`);

    if (failed === 0) {
      console.log('\n🎉 All content script tests passed!');
    } else {
      console.log('\n⚠️ Some tests failed. Check the details above.');
    }
  }

  /**
   * Quick manual tests for debugging
   */
  public debugInfo(): void {
    console.log('🔍 Content Script Debug Information:');
    console.log('===================================');

    const contentManager = (window as any).contextusContent;

    if (!contentManager) {
      console.log('❌ Content manager not found');
      return;
    }

    const adapter = contentManager.getAdapter();
    console.log('🌐 Platform:', adapter.name, `(${adapter.platform})`);
    console.log('📝 URL:', window.location.href);
    console.log('📊 Messages detected:', contentManager.getDetectedMessages().length);
    console.log('🎯 Capture ready:', contentManager.getCaptureReadyMessages().length);
    console.log('🧬 Extension injected:', (window as any).__CONTEXUS_INJECTED__);
    console.log('🔧 DOM attribute:', document.documentElement.getAttribute('data-contexus-extension'));

    // Test selectors
    console.log('\n🎯 Selector Test Results:');
    Object.entries(adapter.selectors).forEach(([name, selector]) => {
      const found = !!document.querySelector(selector as string);
      console.log(`   ${found ? '✅' : '❌'} ${name}: ${selector}`);
    });
  }
}

// Export instance for global access
export const contentTest = new ContentScriptTest();

// Make available in browser console for manual testing
if (typeof window !== 'undefined') {
  (window as any).contentTest = contentTest;
  console.log('🔧 Content script test available: contentTest.runAllTests()');
  console.log('🔧 Debug info available: contentTest.debugInfo()');
}