import React from 'react';
import { createStackNavigator } from 'react-navigation';

import Home from './views/Home';

export default (Routes = () => {
  NavigationContainer = createStackNavigator(
    {
      Home: {
        screen: Home,
      },
    },
    {
      navigationOptions: {
        header: null,
      },
    }
  );
  return <NavigationContainer />;
});
