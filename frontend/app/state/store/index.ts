import { type AuthStore } from '../reducers/auth';
import { type PreferencesStore } from '../reducers/preferences';

/**
 * Represents the state of the application.
 */
export interface State {
  auth: AuthStore;
  preferences: PreferencesStore;
}

/**
 * The application state store.
 */
const store: State = {
  auth: {
    loaded: false
  },
  preferences: {
    selectedLanguage: 'en'
  }
};

export default store;
