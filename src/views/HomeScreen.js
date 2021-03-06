import React, { Component } from 'react';
import { Alert, AsyncStorage, Platform, StyleSheet } from 'react-native';
import {
  Body,
  Button,
  CheckBox,
  Container,
  Content,
  Form,
  Icon,
  Input,
  ListItem,
  Picker,
  Text,
  View,
  Thumbnail,
} from 'native-base';

import dJSON from 'dirty-json';
import moment from 'moment';

import { colors } from '../utils/colors';
import { noImage } from '../utils/images.json';

import {
  GetCaptcha,
  GetClockDeviceInfo,
  MarkEletronicPoint,
} from '../services/stefaniniAPI';
import ItemContainer from '../components/ItemContainer';

const USER_PREFERENCES_KEY = '@ELETRONIC_POINT_STEFANINI:USER_PREFERENCES';
const REGISTERED_POINT_KEY = '@ELETRONIC_POINT_STEFANINI:REGISTERED_POINT';

const MESSAGE_TYPES = {
  tmNormal: 0,
  tmOk: 1,
  tmErro: 2,
  tmAtencao: 3,
};

/**
 * Tela do relógio de registro de ponto.
 *
 * @author Leonardo Pereira da Silva
 */
class HomeScreen extends Component {
  constructor(props) {
    super(props);

    this.functions = [
      { label: '1 - Ponto Eletrônico', value: '1' },
      { label: '2 - Pausa NR Call Center', value: '2' },
    ];

    this.virtualClocks = [
      {
        deviceID: 8002,
        deviceTitle: 'Horário de Brasilia',
      },
      {
        deviceID: 8003,
        deviceTitle: 'UTC-4 (Horario Amazonia)',
      },
      {
        deviceID: 8009,
        deviceTitle: 'UTC-2 (Horario Ilhas)',
      },
      {
        deviceID: 8010,
        deviceTitle: 'UTC-5 (Horario Acre)',
      },
    ];

    this.state = {
      selectedFunction: '1',
      deviceID: '8002',
      dateTime: moment(),
      passwordHidden: true,
      username: '',
      password: '',
      saveUserAndPass: false,
      captcha: '',
      captchaSource: noImage,
      crachaCt: '',
      userNameCt: '',
      passwordCt: '',
      leaveCt: '',
      costCenterCt: '',
      funcCt: '',
    };
  }

  componentDidMount = () => {
    this.initScreen();
    setInterval(this.refreshDateTime, 1000);
  };

  /**
   * Métodos de iniciação da tela
   * @memberof HomeScreen
   */
  initScreen = () => {
    this.loadClock();
    this.loadUserPreferences();
  };

  /**
   * Atualiza o relogio exibido na tela.
   * @memberof HomeScreen
   */
  refreshDateTime = () => {
    const { dateTime } = this.state;
    this.setState({
      dateTime: dateTime.add(1, 's'),
    });
  };

  /**
   * Atualiza a função selecionada.
   * @param {string} - Função selecionada.
   * @memberof Home
   */
  onFunctionSelected = selectedFunction => {
    this.setState({
      selectedFunction,
    });
  };

  /**
   * Atualiza o campo de usuário.
   * @param {string} - Usuário digitado.
   * @memberof Home
   */
  onUsernameChange = username => {
    this.setState({
      username,
    });
  };

  /**
   * Atualiza o campo de senha.
   * @param {string} - Senha digitada.
   * @memberof Home
   */
  onPasswordChange = password => {
    this.setState({
      password,
    });
  };

  /**
   * Atualiza o campo de captcha.
   * @param {string} - Captcha digitado.
   * @memberof Home
   */
  onCaptchaChange = captcha => {
    this.setState({
      captcha,
    });
  };

  /**
   * Cria os itens selecionáveis do Picker de seleção de função.
   * @returns {Picker.Item} - Retorna um array de itens selecionáveis.
   * @memberof Home
   */
  renderPickerItems = () =>
    this.functions.map((func, index) => (
      <Picker.Item key={index} label={func.label} value={func.value} />
    ));

  /**
   * Metodo de criação de componet de picker.
   * @returns {Picker} - Componente de Picker.
   * @memberof Home
   */
  renderPicker = () => (
    <Picker
      mode="dialog"
      iosIcon={
        <View style={{ paddingRight: 10 }}>
          <Icon name="ios-arrow-down" style={styles.iconPicker} />
        </View>
      }
      placeholder="Selecione a Função"
      placeholderIconColor={colors.WHITE}
      placeholderStyle={{ color: colors.WHITE }}
      style={styles.itemPicker}
      textStyle={{ color: colors.WHITE }}
      selectedValue={this.state.selectedFunction}
      onValueChange={this.onFunctionSelected.bind(this)}
    >
      {this.renderPickerItems()}
    </Picker>
  );

  /**
   * Altera o estado do olho, exibindo a senha ou não.
   * @memberof Home
   */
  togglePasswordVisibility = () => {
    this.setState({ passwordHidden: !this.state.passwordHidden });
  };

  /**
   * Altera o estado da flag saveUserAndPass.
   * @memberof Home
   */
  toggleCheckSaveUserAndPass = () => {
    this.setState(
      { saveUserAndPass: !this.state.saveUserAndPass },
      this.saveUserPreferences
    );
  };

  /**
   * Carrega da memória do dispositivo os dados de usuário salvo, se houver.
   * @memberof Home
   */
  loadUserPreferences = async () => {
    try {
      let USER_PREFERENCES = await AsyncStorage.getItem(USER_PREFERENCES_KEY);
      if (USER_PREFERENCES) {
        const { username, password, saveUserAndPass } = JSON.parse(
          USER_PREFERENCES
        );
        this.setState({
          username,
          password,
          saveUserAndPass,
        });
      }
    } catch (error) {}
  };

  /**
   * Salva na memória do dispositivo os dados de usuário.
   * @async
   * @memberof Home
   */
  saveUserPreferences = async () => {
    try {
      const { username, password, saveUserAndPass } = this.state;

      if (saveUserAndPass) {
        const USER_PREFERENCES = {
          username,
          password,
          saveUserAndPass,
        };
        await AsyncStorage.setItem(
          USER_PREFERENCES_KEY,
          JSON.stringify(USER_PREFERENCES)
        );
      } else {
        this.resetUserPreferences();
      }
    } catch (error) {}
  };

  /**
   * Reseta da memória do dispositivo os dados de usuário salvo.
   * @async
   * @memberof Home
   */
  resetUserPreferences = async () => {
    try {
      await AsyncStorage.removeItem(USER_PREFERENCES_KEY);
    } catch (error) {}
  };

  /**
   * Carrega as informações do relógio selecionado.
   * @async
   * @memberof Home
   */
  loadClock = () => {
    GetClockDeviceInfo(this.state.deviceID)
      .then(response => response.data)
      .then(response => {
        const result = JSON.parse(
          JSON.stringify(
            dJSON.parse(response.replace(/(new Date\([0-9,]+\))/, '"$1"'))
          )
        );
        const {
          useCracha,
          useUserPwd,
          oplLiberarFolhaRVirtual,
          oplLiberarCCustoRVirtual,
          oplLiberarFuncoesRVirtual,
          dtTimeEvent,
        } = result.deviceInfo;
        const [y, M, d, h, m, s] = dtTimeEvent
          .replace(/[^0-9,]+/, '')
          .split(',');
        const clockTime = moment({ y, M, d, h, m, s });
        this.setState({
          crachaCt: useCracha,
          userNameCt: useUserPwd,
          passwordCt: useUserPwd,
          leaveCt: oplLiberarFolhaRVirtual,
          costCenterCt: oplLiberarCCustoRVirtual,
          funcCt: oplLiberarFuncoesRVirtual,
          dateTime: clockTime,
        });
      })
      .then(this.loadCaptcha());
  };

  /**
   * Carrega a imagem captcha retornada da api.
   * @async
   * @memberof Home
   */
  loadCaptcha = () => {
    GetCaptcha(this.state.deviceID)
      .then(response => response.data)
      .then(async response => {
        const { urlcaptcha } = response;
        this.setState({
          captchaSource: urlcaptcha,
          captcha: '',
        });
      });
  };

  /**
   * Recarrega a imagem captcha retornada da api.
   * @async
   * @memberof Home
   */
  reloadCaptcha = () => {
    this.loadCaptcha();
  };

  /**
   * Realiza a ação de registrar o ponto do colaborador.
   * @async
   * @memberof Home
   */
  onPressRegister = () => {
    const {
      deviceID,
      selectedFunction,
      username,
      password,
      saveUserAndPass,
      captcha,
    } = this.state;

    if (saveUserAndPass) {
      this.saveUserPreferences();
    }

    MarkEletronicPoint(deviceID, selectedFunction, username, password, captcha)
      .then(response => response.data)
      .then(response => {
        const result = JSON.parse(JSON.stringify(dJSON.parse(response)));
        if (result.success) {
          this.showAlert(result.msg.msg, result.msg.type);
        } else {
          this.showAlert(
            result.error.replace('Texto', 'O Captcha'),
            MESSAGE_TYPES.tmErro
          );
        }
        this.loadCaptcha();
      })
      .catch(() => {
        this.loadCaptcha();
      });
  };

  /**
   * Exibe um alerta com as mensagens extraídas do endpoint.
   * @memberof Home
   * @instance
   * @param {string} message - Mensagem recebida
   * @param {number} type - Tipo de mensagem a ser exibida
   */
  showAlert = (message, type) => {
    let alertTitle;
    switch (type) {
      case MESSAGE_TYPES.tmOK:
        alertTitle = 'Sucesso';
        break;
      case MESSAGE_TYPES.tmErro:
        alertTitle = 'Erro';
        break;
      case MESSAGE_TYPES.tmAtencao:
        alertTitle = 'Atenção';
        break;
      default:
        alertTitle = 'Atenção';
        break;
    }
    if (message.includes('Usuário / Senha')) {
      message = 'Usuário e/ou Senha Inválidos!';
    }
    Alert.alert(
      alertTitle,
      message,
      [
        {
          text: 'OK',
          onPress: () => {},
        },
      ],
      { cancelable: false }
    );
  };

  /**
   * Renderiza item de relógio.
   * @memberof Home
   */
  renderItemClock = () => {
    const { dateTime } = this.state;
    const date = dateTime.format('DD/MM/YYYY');
    const time = dateTime.format('HH:mm:ss');
    return (
      <View style={styles.dateTimeInfoContainer}>
        <Text style={styles.dateTimeInfoTextStyle}>Horário de Brasília</Text>
        <Text style={styles.dateTimeInfoTextStyle}>
          {date} - {time}
        </Text>
      </View>
    );
  };

  render = () => {
    return (
      <Container style={styles.container}>
        <Content showsVerticalScrollIndicator={false}>
          {this.renderItemClock()}
          <Form>
            <ItemContainer picker>{this.renderPicker()}</ItemContainer>
            <ItemContainer>
              <Input
                style={styles.input}
                placeholder="Usuário"
                placeholderTextColor={colors.WHITE}
                autoCapitalize="none"
                autoCorrect={false}
                value={this.state.username}
                onChangeText={this.onUsernameChange.bind(this)}
              />
            </ItemContainer>
            <ItemContainer>
              <Input
                style={styles.input}
                placeholder="Senha"
                placeholderTextColor={colors.WHITE}
                secureTextEntry={this.state.passwordHidden}
                autoCapitalize="none"
                autoCorrect={false}
                value={this.state.password}
                onChangeText={this.onPasswordChange.bind(this)}
              />
              <Icon
                type="FontAwesome"
                name={this.state.passwordHidden ? 'eye-slash' : 'eye'}
                style={styles.iconItem}
                onPress={this.togglePasswordVisibility}
              />
            </ItemContainer>
            <ListItem noBorder onPress={this.toggleCheckSaveUserAndPass}>
              <CheckBox
                checked={this.state.saveUserAndPass}
                color={colors.BLUE}
                onPress={this.toggleCheckSaveUserAndPass}
              />
              <Body>
                <Text>Salvar usuário e senha</Text>
              </Body>
            </ListItem>
            <View style={styles.captchaContainer}>
              <Thumbnail
                style={styles.captchaImage}
                square
                resizeMode="contain"
                large
                source={{ uri: this.state.captchaSource }}
              />
              <Icon
                style={styles.captchaIcon}
                type="FontAwesome"
                name="repeat"
                onPress={this.reloadCaptcha}
              />
            </View>
            <ItemContainer>
              <Input
                style={styles.input}
                placeholder="Captcha"
                placeholderTextColor={colors.WHITE}
                autoCapitalize="none"
                autoCorrect={false}
                value={this.state.captcha}
                onChangeText={this.onCaptchaChange.bind(this)}
                maxLength={4}
              />
            </ItemContainer>
            <Button
              full
              icon
              style={styles.button}
              onPress={this.onPressRegister}
            >
              <Text style={styles.textButton}>REGISTRAR</Text>
            </Button>
          </Form>
        </Content>
      </Container>
    );
  };
}

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
    backgroundColor: colors.WHITE,
  },
  input: {
    color: colors.WHITE,
  },
  dateTimeInfoContainer: {
    flex: 1,
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 10,
  },
  dateTimeInfoTextStyle: {
    fontSize: 20,
    color: colors.BLUE,
    fontWeight: 'bold',
  },
  captchaContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 5,
  },
  captchaImage: {
    width: 200,
  },
  captchaIcon: {
    marginLeft: 10,
    alignSelf: 'center',
    color: colors.BLUE,
  },
  button: {
    flex: 1,
    backgroundColor: colors.BLUE,
    marginTop: 5,
    marginBottom: Platform.OS !== 'ios' ? 10 : 0,
    borderRadius: 5,
  },
  textButton: {
    fontSize: 14,
    color: colors.WHITE,
  },
  iconButton: { color: colors.WHITE },
  iconItem: { color: colors.WHITE },
  iconPicker: { color: colors.WHITE },
  itemPicker: Platform.OS !== 'ios' ? { color: colors.WHITE } : { flex: 1 },
});
