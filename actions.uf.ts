import { CDPSession, Page, Protocol } from "puppeteer";

export class ScrollAction {
  private session?: CDPSession;
  constructor(private page: Page) {}

  async swipeToPageBottom(): Promise<void> {
    await this.page.waitForSelector("body");
    await this._synthesizeTouchScroll('down');
  }

  async swipeToPageTop(): Promise<void> {
    await this.page.waitForSelector("body");
    await this._synthesizeTouchScroll('up');
  }

  private async _synthesizeTouchScroll(direction: 'down' | 'up'): Promise<void> {
    const scrollParams = await this._getScrollParams(direction);
    if (!this.session) {
      this.session = await this.page.target().createCDPSession();
    }
    // https://chromedevtools.github.io/devtools-protocol/tot/Input/#method-synthesizeScrollGesture
    await this.session.send('Input.synthesizeScrollGesture', scrollParams);
  }

  private async _getScrollParams(direction: 'down' | 'up'): Promise<Protocol.Input.SynthesizeScrollGestureRequest> {
    const innerHeight = await this._getInnerContentHeight();
    const x = 200;
    const y = direction === 'up' ? 200 : 600;
    const scrollDistance = 1500;
    const speed = 800;
    const repeatDelayMs = 250;
    const yDistance = direction === 'up' ? scrollDistance : scrollDistance * (-1);
    const repeatCount = Math.ceil(innerHeight/scrollDistance) -1;
    const gestureSourceType = 'touch';
    return {x, y, yDistance, speed, repeatCount, repeatDelayMs, gestureSourceType};
  }

  private async _getInnerContentHeight(): Promise<number> {
    const innerContentHandle = await this.page.$("body");
    const innerContentBox = await innerContentHandle!.boundingBox(); 
    return innerContentBox!.height;
  }
}