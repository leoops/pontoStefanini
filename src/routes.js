import { createStackNavigator, createAppContainer } from 'react-navigation';
import HomeScreen from './views/HomeScreen';

const AppNavigator = createStackNavigator(
  {
    HomeScreen: {
      screen: HomeScreen,
    },
  },
  {
    navigationOptions: {
      header: null,
    },
  }
);

export default createAppContainer(AppNavigator);
