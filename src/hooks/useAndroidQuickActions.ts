import {useEffect} from 'react';
import {Platform} from 'react-native';
import QuickActions, {ShortcutItem} from 'react-native-quick-actions';
import {useNavigation} from '@react-navigation/native';
import {useAuthStore} from '@src/store/authStore';
import Routes from '@src/constants/routes';

interface QuickActionData {
  type: string;
  userInfo?: {
    url: string;
  };
}

interface UseQuickActionsProps {
  onQuickAction?: (data: QuickActionData) => void;
}

// Quick action types
export const QUICK_ACTION_TYPES = {
  OPEN_HOME: 'com.zenoa.ai.open.home',
  OPEN_GALLERY: 'com.zenoa.ai.open.gallery',
  OPEN_COMMUNITY: 'com.zenoa.ai.open.community',
  OPEN_PROFILE: 'com.zenoa.ai.open.profile',
} as const;

export const useAndroidQuickActions = ({
  onQuickAction,
}: UseQuickActionsProps = {}) => {
  const navigation = useNavigation();
  const {user} = useAuthStore();

  // Set up quick actions
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    // Only show quick actions when user is signed in
    if (!user) {
      QuickActions.clearShortcutItems();
      return;
    }    const setupQuickActions = () => {
      try {        const actions: ShortcutItem[] = [
          // Navigation actions (Bottom nav bar items)
          {
            type: QUICK_ACTION_TYPES.OPEN_HOME,
            title: 'Home',
            subtitle: 'Create AI art',
            icon: 'ic_home',
            userInfo: {
              url: '',
            },
          },
          {
            type: QUICK_ACTION_TYPES.OPEN_GALLERY,
            title: 'Gallery',
            subtitle: 'View your images',
            icon: 'ic_gallery',
            userInfo: {
              url: '',
            },
          },
          {
            type: QUICK_ACTION_TYPES.OPEN_COMMUNITY,
            title: 'Community',
            subtitle: 'Explore community art',
            icon: 'ic_community',
            userInfo: {
              url: '',
            },
          },
          {
            type: QUICK_ACTION_TYPES.OPEN_PROFILE,
            title: 'Profile',
            subtitle: 'Manage your account',
            icon: 'ic_profile',
            userInfo: {
              url: '',
            },
          },
        ];

        console.log('Setting up Android Quick Actions:', actions.length);
        QuickActions.setShortcutItems(actions);
        console.log('Android Quick Actions setup complete');
      } catch (error) {
        console.error('Error setting up Android Quick Actions:', error);
      }
    };

    setupQuickActions();
  }, [user]);  // Handle quick action selection
  useEffect(() => {
    const handleQuickAction = (data: QuickActionData) => {
      console.log('Quick action received:', data);

      // Call custom handler if provided
      if (onQuickAction) {
        onQuickAction(data);
        return;
      }

      // Default handling - simple navigation
      switch (data.type) {
        case QUICK_ACTION_TYPES.OPEN_HOME:
          if (!user) {
            navigation.navigate(Routes.SIGN_IN as never);
            return;
          }
          navigation.navigate(Routes.HOME as never);
          break;

        case QUICK_ACTION_TYPES.OPEN_GALLERY:
          if (!user) {
            navigation.navigate(Routes.SIGN_IN as never);
            return;
          }
          navigation.navigate(Routes.GALLERY as never);
          break;

        case QUICK_ACTION_TYPES.OPEN_COMMUNITY:
          if (!user) {
            navigation.navigate(Routes.SIGN_IN as never);
            return;
          }
          navigation.navigate(Routes.COMMUNITY as never);
          break;

        case QUICK_ACTION_TYPES.OPEN_PROFILE:
          if (!user) {
            navigation.navigate(Routes.SIGN_IN as never);
            return;
          }
          navigation.navigate(Routes.SETTINGS as never);
          break;

        default:
          console.log('Unknown quick action type:', data.type);
      }
    };

    // Set up the listener for when app is opened via quick action
    QuickActions.popInitialAction()
      .then(action => {
        if (action) {
          handleQuickAction(action);
        }
      })
      .catch(console.error);
  }, [navigation, user, onQuickAction]);

  return {
    QUICK_ACTION_TYPES,
  };
};
