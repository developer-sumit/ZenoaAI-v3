import {useNavigation, NavigationProp} from '@react-navigation/native';

type NavigationParams = {
  route: string;
  params?: Record<string, any>;
};

const useAppNavigation = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const navigate = ({route, params}: NavigationParams): void => {
    if (!route) {
      console.error("Navigation error: 'route' is required.");
      return;
    }
    navigation.navigate(route, params);
  };

  return {navigate};
};

export default useAppNavigation;
