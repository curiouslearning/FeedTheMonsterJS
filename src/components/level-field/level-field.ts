import {
  LevelFieldOptions,
  BaseLevelFieldComponent
} from './base-level-field/base-level-field-component';

export default class LevelField extends BaseLevelFieldComponent {

  constructor(id, options?: LevelFieldOptions ) {
    super(options || {
      selectors: {
        root: '.game-scene',
        bars: '.bar-level'
      } }, id);
  }

}