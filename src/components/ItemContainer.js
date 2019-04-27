import React, { PureComponent } from 'react';
import { StyleSheet, Platform } from 'react-native';
import { Item } from 'native-base';
import { colors } from '../utils/colors';

class ItemContainer extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const { children } = this.props;
    return (
      <Item regular style={styles.formItem} {...this.props}>
        {children}
      </Item>
    );
  }
}

const styles = StyleSheet.create({
  formItem: {
    marginVertical: Platform.OS !== 'ios' ? 5 : 10,
    borderRadius: 5,
    borderColor: colors.BLUE,
    backgroundColor: colors.GRAY,
  },
});
export default ItemContainer;
