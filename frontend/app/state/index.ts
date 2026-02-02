import { type Store, configureStore } from '@reduxjs/toolkit';
import { reducers } from './reducers';

let store: Store;

/**
 * Retrieves the Redux store.
 * @returns An object containing the Redux store.
 */
const getStore = () => {
  if (!store) {
    store = configureStore({
      reducer: reducers,
      middleware: (getDefaultMiddleware) => {
        // Omitting saga middleware for now as it adds complexity without the s files
        const middleware = getDefaultMiddleware({ serializableCheck: false });
        // if (import.meta.env.DEV && typeof window !== 'undefined') {
        //   return middleware.concat(logger);
        // }
        return middleware;
      }
    });
  }

  return { store };
};

export { getStore };
