/**
 * Common base properties included in all analytics events.
 *
 * @property {string} cr_user_id - Unique pseudo identifier for the current user.
 * @property {string} ftm_language - The language code of the app/session (e.g., `"en"`, `"hi"`).
 * @property {number} profile_number - The profile number for multi-profile environments (default: `0`).
 * @property {string} version_number - The current app version string, extracted from the DOM.
 * @property {string} json_version_number - The version number of the JSON configuration file.
 *
 * @since 1.0.0
 */
export interface CommonEventProperties {
    cr_user_id: string;
    ftm_language: string;
    profile_number: number;
    version_number: string;
    json_version_number: string;
  }
  
  /**
   * Event payload for the start of a session.
   *
   * @extends CommonEventProperties
   * @property {number} days_since_last - Number of days since the last session.
   *
   * @example
   * ```ts
   * const event: SessionStart = {
   *   cr_user_id: "abc123",
   *   ftm_language: "en",
   *   profile_number: 0,
   *   version_number: "1.2.3",
   *   json_version_number: "5",
   *   days_since_last: 2
   * };
   * ```
   */
  export interface SessionStart extends CommonEventProperties {
    days_since_last: number;
  }
  
  /**
   * Event payload for the end of a session.
   *
   * @extends CommonEventProperties
   * @property {number} duration - Total session duration in milliseconds.
   */
  export interface SessionEnd extends CommonEventProperties {
    duration: number;
  }
  
  /**
   * Event payload for download progress milestones (25%, 50%, 75%, 100%).
   *
   * @extends CommonEventProperties
   * @property {number} ms_since_session_start - Time elapsed since the session start in milliseconds.
   */
  export interface DowloadPercentCompleted extends CommonEventProperties {
    ms_since_session_start: number;
  }
  
  /**
   * Event payload for the `tapped_start` event.
   *
   * @extends CommonEventProperties
   * @remarks
   * This event has no additional properties beyond {@link CommonEventProperties}.
   */
  export interface TappedStart extends CommonEventProperties {}
  
  /**
   * Event payload for when a level is selected.
   *
   * @extends CommonEventProperties
   * @property {number} level_selected - The numeric identifier of the selected level.
   */
  export interface SelectedLevel extends CommonEventProperties {
    level_selected: number;
  }
  
  /**
   * Event payload for puzzle completion (success or failure).
   *
   * @extends CommonEventProperties
   * @property {string} success_or_failure - Indicates outcome (`"success"` or `"failure"`).
   * @property {number} level_number - The level number where the puzzle occurred.
   * @property {number} puzzle_number - The puzzle number within the level.
   * @property {string} item_selected - The item the user selected.
   * @property {string} target - The correct/expected item.
   * @property {string[] | string} foils - Alternative options shown to the user (can be array or string).
   * @property {number} response_time - Time taken to respond, in seconds.
   */
  export interface PuzzleCompletedEvent extends CommonEventProperties {
    success_or_failure: string;
    level_number: number;
    puzzle_number: number;
    item_selected: string;
    target: string;
    foils: string[] | string;
    response_time: number;
  }
  
  /**
   * Event payload for when a level is completed.
   *
   * @extends CommonEventProperties
   * @property {string} success_or_failure - Indicates overall outcome (`"success"` or `"failure"`).
   * @property {number} level_number - The level number that was completed.
   * @property {number} number_of_successful_puzzles - Number of puzzles solved successfully in the level.
   * @property {number} duration - Time taken to complete the level, in seconds.
   */
  export interface LevelCompletedEvent extends CommonEventProperties {
    success_or_failure: string;
    level_number: number;
    number_of_successful_puzzles: number;
    duration: number;
  }
  
  /**
   * Event payload for when a level-end button is clicked.
   *
   * @extends CommonEventProperties
   * @property {string} buttonType - The type of button clicked (e.g., `"retry"`, `"next"`, `"exit"`).
   */
  export interface levelEndButtonsCLick extends CommonEventProperties {
    buttonType: string;
  }
  