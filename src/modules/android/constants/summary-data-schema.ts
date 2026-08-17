/**
 * The FTM summary_data schema, and the single source of truth for it.
 *
 * FtmSummaryData is passed to AndroidInterface as its TSummary argument, which constrains the data
 * and the options of every summary write. FTM_SUMMARY_DATA_DEFAULTS is what seeding sends, so the
 * fields read 0 instead of being absent until the first event of that type fires.
 *
 * To add a field: add it to the interface, then add its 0 to the defaults — the `Required<>` on the
 * defaults means the build fails until you do, so the two cannot drift. Core keys its seed marker on
 * the field set, so the new field is seeded onto existing documents automatically.
 *
 * Fields are optional because each event writes only the ones it knows about; seeding covers them
 * all. They must be numeric: seeding relies on the container mapping "add" to FieldValue.increment,
 * which is only a safe no-op for numbers.
 */
export interface FtmSummaryData {
  highest_level_completed?: number;
  levels_completed?: number;
  puzzles_completed?: number;
  puzzle_success?: number;
  puzzle_failure?: number;
  time_spent_total_second?: number;
}

/** Seeded values. All 0 — a non-zero default would increment real counts rather than create them. */
export const FTM_SUMMARY_DATA_DEFAULTS: Required<FtmSummaryData> = {
  highest_level_completed: 0,
  levels_completed: 0,
  puzzles_completed: 0,
  puzzle_success: 0,
  puzzle_failure: 0,
  time_spent_total_second: 0,
};
