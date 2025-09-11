import { TreasureChestAnimation } from './treasureChestAnimation';

export class TreasureChestMiniGame {
  private earnedStarCount: number;
  /**
   * Lifecycle flag for the Treasure Chest mini-game.
   *
   * - The game has 5 segments, and this mini-game can appear randomly in any segment.
   * - When completed, the flag 'this.miniGameStatus' is set to `true` to prevent retriggering within the same level.
   * - The flag resets to `false` during `dispose()`, after the game concludes.
   */
  private collectedStones: number;
  private callback: any;
  public miniGameStatus: boolean = false;
  private treasureAnimation: TreasureChestAnimation;
  private clickedCount = 0;
  constructor(miniGameCompleteCallback) {
    this.earnedStarCount = 0;
    this.collectedStones = 0;
    this.callback = miniGameCompleteCallback;
    this.treasureAnimation = new TreasureChestAnimation(
      window.innerWidth,
      window.innerHeight,
      this.tapStoneCallback.bind(this)
    );
  }

  public tapStoneCallback() {
    this.clickedCount++;
    console.log("Stone achieved in Treasure Chest MiniGame:" + this.clickedCount);
    
    // this.updateCollectedStone(); // commented out to test without collecting stones
    // this.processStoneCollection() // commented out to test without collecting stones
  }

  private updateCollectedStone() {
    this.collectedStones++;
  }

  private processStoneCollection() {
    if (this.collectedStones >= 3) {
      this.earnedStarCount = 1;

      //Add more logic here relating to animation or anything tied after collecting 1 star.

      //Set miniGameStatus to TRUE for minigame handler. Draw will be disabled.
      this.miniGameStatus = true;

      //Trigger callback from parent miniGameHandler when the treasure chest mini game is complete.
      this.callback(this.earnedStarCount);
    }
  }

  //Draw logic for treasure chest minigame. Called by mini game handler.
  public draw() {
    if (!this.miniGameStatus) {
      // Start the animation
      this.treasureAnimation.show(() => {
        // Animation complete callback
        console.log("Treasure Chest Animation Completed");

        
      // If player didn't collect enough stones, still call parent
      if (!this.miniGameStatus) {
        this.callback(this.earnedStarCount);
      }
      });
    }

  }

  //Called before moving to level-end scene. This is handled and used by mini game handler.
  public dispose() {
    this.earnedStarCount = 0;
    this.collectedStones = 0;
    this.miniGameStatus = false;
    this.treasureAnimation.hide();
  }
}