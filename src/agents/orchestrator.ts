import { runBlueAgent } from "./blueAgent";
import { runRedAgent } from "./redAgent";

export class AgentOrchestrator {
  browser: any;
  memory: any;

  constructor(browser: any, memory: any) {
    this.browser = browser;
    this.memory = memory;
  }

  async execute(task: string, config: any, startUrl?: string) {
    if (startUrl) {
      await this.browser.goto(startUrl);
    }

    let iteration = 0;
    let done = false;

    const result: any = {
      success: false,
      output: null,
      startTime: Date.now(),
      logs: []
    };

    const log = (msg: string, data?: any) => {
      console.log(msg, data);
      result.logs.push({ timestamp: Date.now(), message: msg, data });
    };

    while (!done && iteration < 15) {
      iteration++;
      log(`Iteration ${iteration}`);

      const snapshot = await this.browser.getSnapshot();
      const memory = await this.memory.get();

      // 🔵 BLUE
      log("Running Blue Agent...");
      const blue = await runBlueAgent({
        task,
        pageSnapshot: snapshot,
        memory,
        config
      });

      log("BLUE output:", blue);

      if (blue.status === "task_complete") {
        log("Task complete!");
        result.success = true;
        result.output = snapshot.visibleText;
        break;
      }

      if (blue.status === "navigation_needed") {
        log("Navigation needed:", blue.navigationAction);
        await this.handleNavigation(blue.navigationAction);
        await this.browser.waitForLoad();
        continue;
      }

      // 🔴 RED
      log("Running Red Agent...");
      const red = await runRedAgent({
        task,
        pageSnapshot: snapshot,
        memory,
        blueContext: blue,
        config
      });

      log("RED output:", red);

      if (red.actions?.length) {
        log("Executing actions:", red.actions);
        await this.executeWithRetry(red.actions);
      }

      if (red.needsHumanInput) {
        log("Human input required:", red.humanInputQuestion);
        throw new Error("Human input required: " + red.humanInputQuestion);
      }

      if (red.result) {
        result.output = red.result;
      }

      // 🧠 Save memory
      await this.memory.set({
        lastUrl: snapshot.url,
        lastActions: red.actions
      });

      // ⏱ cooldown
      await new Promise(r => setTimeout(r, 800));

      // ⏰ timeout
      if (Date.now() - result.startTime > 60000) {
        log("Timeout reached");
        throw new Error("Timeout");
      }
    }

    return result;
  }

  async executeWithRetry(actions: any[]) {
    let attempts = 0;

    while (attempts < 3) {
      try {
        return await this.browser.execute(actions);
      } catch (err) {
        attempts++;
        if (attempts === 3) throw err;
      }
    }
  }

  async handleNavigation(action: any) {
    if (!action) return;

    switch (action.type) {
      case "goto":
        await this.browser.goto(action.url);
        break;
      case "back":
        await this.browser.back();
        break;
      case "forward":
        await this.browser.forward();
        break;
      case "reload":
        await this.browser.reload();
        break;
      case "wait":
        await this.browser.wait(2000);
        break;
    }
  }
}
