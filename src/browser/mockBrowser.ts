export class MockBrowser {
  async goto(url: string) {
    console.log("Navigate:", url);
    // In a real extension, this would use chrome.tabs.update
  }

  async getSnapshot() {
    // Try to communicate with the extension parent if running in an iframe
    if (window.parent !== window) {
      return new Promise((resolve) => {
        const id = Math.random().toString(36).substring(7);
        const handler = (event: MessageEvent) => {
          if (event.data.id === id) {
            window.removeEventListener('message', handler);
            resolve(event.data.response);
          }
        };
        window.addEventListener('message', handler);
        window.parent.postMessage({ action: 'GET_SNAPSHOT', id }, '*');
        
        // Fallback for demo if extension doesn't respond
        setTimeout(() => {
          window.removeEventListener('message', handler);
          resolve(this.getMockSnapshot());
        }, 1000);
      });
    }
    return this.getMockSnapshot();
  }

  private getMockSnapshot() {
    return {
      url: window.location.href,
      title: document.title || "Example",
      domTree: document.documentElement.outerHTML || "<html><body><h1>Example Page</h1><p>This is a mock page for the builder demo.</p></body></html>",
      forms: [],
      interactiveElements: [],
      visibleText: document.body.innerText || "Example page content"
    };
  }

  async execute(actions: any[]) {
    console.log("Executing:", actions);
    if (window.parent !== window) {
      return new Promise((resolve) => {
        const id = Math.random().toString(36).substring(7);
        const handler = (event: MessageEvent) => {
          if (event.data.id === id) {
            window.removeEventListener('message', handler);
            resolve(event.data.response);
          }
        };
        window.addEventListener('message', handler);
        window.parent.postMessage({ action: 'EXECUTE_ACTIONS', data: actions, id }, '*');
      });
    }
  }

  async wait(ms: number) {
    return new Promise(r => setTimeout(r, ms));
  }

  async waitForLoad() {
    await this.wait(1000);
  }

  async back() {}
  async forward() {}
  async reload() {}
}
