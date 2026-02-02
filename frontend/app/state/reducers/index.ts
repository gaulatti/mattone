import { authReducer } from './auth';
import { preferencesReducer } from './preferences';
import { type ReduxAction } from '../dispatchers/base';
import defaultStore, { type State } from '../store';

/**
 * Root reducer combining all reducers
 */
export const reducers = (state: State = defaultStore, action: ReduxAction) => {
  // Apply both reducers
  let newState = authReducer(state, action);
  newState = preferencesReducer(newState, action);
  return newState;
};
