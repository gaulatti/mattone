import { signOut } from 'aws-amplify/auth';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { logout as logoutDispatcher } from '../state/dispatchers/auth';
import { isAuthenticated as isAuthenticatedSelector, isLoaded as isLoadedSelector } from '../state/selectors/auth';

/**
 * Custom hook for handling user logout.
 * This hook checks if the user is authenticated and loaded,
 * and performs a logout on the cognito side, and then removes
 * any references to the user in the local store.
 *
 * @returns An object containing the `logout` function.
 */
const useLogout = () => {
  const { isAuthenticated, isLoaded } = useAuthStatus();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  /**
   * Do a logout on the cognito side, and
   * then remove any references to the user
   * in the local store.
   */
  const logout = (): void => {
    if (isAuthenticated && isLoaded) {
      signOut()
        .then(() => {
          dispatch(logoutDispatcher());
          navigate('/login');
        })
        .catch((err) => {
          console.error('Error signing out: ', err);
          // Force logout even if cognito fails
          dispatch(logoutDispatcher());
          navigate('/login');
        });
    }
  };

  return {
    logout
  };
};

const useAuthStatus = () => {
  /**
   * If there's an active cognito user.
   */
  const isAuthenticated = useSelector(isAuthenticatedSelector);

  /**
   * If the process to verify if there's an active user
   * has finished or not.
   */
  const isLoaded = useSelector(isLoadedSelector);

  return {
    isAuthenticated,
    isLoaded
  };
};

export { useAuthStatus, useLogout };
