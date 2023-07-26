interface CommonEventProperties {
    cr_user_id: string;
    ftm_language: string;
    profile_number: number;
    version_number: string;
}

export interface PuzzleCompletedEvent extends CommonEventProperties {
    success_or_failure: string;
    level_number: number;
    puzzle_number: number;
    item_selected: string;
    target: string;
    foils: string[];
    response_time: number;
}
export interface LevelCompletedEvent extends CommonEventProperties {
    success_or_failure: string;
    level_number: number;
    number_of_successful_puzzles: number;
    duration: number;
}  