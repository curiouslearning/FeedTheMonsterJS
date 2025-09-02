import miniGameStateService from '@miniGameStateService';
import { TreasureChestMiniGame } from './treasureChest/treasureChestMiniGame';

/**
 * MiniGame handler class.
 *
 * Purpose:
 *  - Acts as a central manager for mini-game lifecycle 
 *    (creation, drawing, disposal).
 *  - Provides a single integration point so the application 
 *    can interact with mini-games without needing to know 
 *    their internal details.
 *
 * Current state:
 *  - Supports only one mini-game instance (placeholder).
 *  - Core logic is not yet implemented; layout only.
 *
 * Future:
 *  - Will serve as a factory/loader for multiple mini-games.
 *  - Responsible for selecting which mini-game to create 
 *    based on game state, type, or level.
 *  - Ensures consistent lifecycle management (instantiate, 
 *    render, clean up) across all mini-game types.
 */
export class MiniGameHandler {
  public activeMiniGame: TreasureChestMiniGame | null; //Any for now as default.

  constructor() {
    this.activeMiniGame = null;
    this.createMiniGameInstance();
  }

  /**
   * Creates a new mini-game instance.
   *
   * Currently:
   *  - There is only one mini-game available, so this method will 
   *    only instantiate that single mini-game.
   *
   * Future:
   *  - This method is designed to support multiple mini-game types.
   *  - Additional conditions/branches will be added here once new 
   *    mini-games are introduced.
   */
  private createMiniGameInstance() {
    //Since we only have one mini game instance we will just assigned treasure chest mini game.
    //Update and add logic here to handle loading of different mini game.

    this.activeMiniGame = new TreasureChestMiniGame((earnedStarCount: number) => {
      this.handleMiniGameComplete(earnedStarCount);
    });
  }

  /**
 * Draws the mini-game on the canvas.
 *
 * Currently:
 *  - Placeholder method with no rendering logic.
 *
 * Future:
 *  - Will handle rendering of all mini-game visuals (background, 
 *    sprites, UI elements, etc.).
 *  - May include conditional drawing logic depending on 
 *    mini-game type or state.
 */
  public draw() {
    //Draw mini game.
    this.activeMiniGame?.draw();
  }

  private handleMiniGameComplete(earnedStarCount: number) {

    // ADD logic here relating to star count.
    // For example relating to game score to reflext the correct star count for monster evolution with GameScore @data class.

    //Communicate to GamePlay-Scene that the mini game is done to trigger the load puzzle method.
    miniGameStateService.publish(miniGameStateService.EVENTS.IS_MINI_GAME_DONE, true);
  }

  /**
 * Disposes of the current mini-game instance.
 *
 * Responsibilities:
 *  - Clear the mini-game canvas.
 *  - Reset related values and state.
 *  - Free up any resources used by the mini-game.
 *
 * This ensures a clean teardown before switching 
 * to another mini-game or exiting.
 */
  public dispose() {
    //Clear canvas mini game and reset values;

    this.activeMiniGame?.dispose();
    this.activeMiniGame = null;
  }
}