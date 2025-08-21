export interface CommonEventProperties {
    cr_user_id: string;
    ftm_language: string;
    profile_number: number;
    version_number: string;
    json_version_number: string;
}

export interface SessionStart extends CommonEventProperties {
    days_since_last: Number;
}

export interface SessionEnd extends CommonEventProperties {
    duration: number;
}

export interface DowloadPercentCompleted extends CommonEventProperties {
    ms_since_session_start: Number;
}

export interface TappedStart extends CommonEventProperties {

}

export interface SelectedLevel extends CommonEventProperties {
    level_selected: number;
}

export interface PuzzleCompletedEvent extends CommonEventProperties {
    success_or_failure: string;
    level_number: number;
    puzzle_number: number;
    item_selected: string;
    target: string;
    foils: string[] | string; // Allow both array and string formats
    response_time: number;
}

export interface LevelCompletedEvent extends CommonEventProperties {
    success_or_failure: string;
    level_number: number;
    number_of_successful_puzzles: number;
    duration: number;
}

export interface levelEndButtonsCLick extends CommonEventProperties {
    buttonType: string;
}  