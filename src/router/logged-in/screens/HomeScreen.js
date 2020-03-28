import React, { useEffect, useContext, useState } from 'react';
import { AppState, AppStateStatus, ScrollView } from 'react-native';
import * as Permissions from 'expo-permissions';
import { UserContext } from '../../../context/user';
import PropTypes from 'prop-types';
import Colors from '../../../constants/Colors';
import { CtaButton, UrlButton } from '../../../components/Button/Button';
import { useTranslation, withTranslation } from 'react-i18next';
import { AuthConsumer } from '../../../context/authentication';
import { initBackgroundTracking, stopBackgroundTracking } from '../../../tracking';
import { registerPushNotifications } from '../../../push-notifications';
import AppShell, { Content } from '../../../components/AppShell';
import Text, { Heading } from '../../../components/ui/Text';
import { ButtonGroup } from '../../../components/Button';
import bullHorn from '../../../assets/images/bullhorn.png';
import { scale } from '../../../utils';
import { resetStack } from '../../../utils/navigation';
import { Vertical } from '../../../components/ui/Spacer';
import messaging from '@react-native-firebase/messaging';
import Footer from '../../../components/Footer';
import LoadingScreen from '../../../components/LoadingScreen';
import { AuthenticationError } from '../../../api/ApiClient';

const links = {
  en: {
    primary: ['avoidInfection', 'possibleInfection', 'isolation', 'quarantine'],
    secondary: [
      'groupsAtRisk',
      'seniorCitizens',
      'childrenAndTeens',
      'worriesAndAnxiety',
      'workplaces',
      'travel',
      'foodPetsAndAnimals',
      'tourists',
      'riskAreas',
    ],
  },
  is: {
    primary: ['avoidInfection', 'possibleInfection', 'isolation', 'quarantine'],
    secondary: [
      'groupsAtRisk',
      'seniorCitizens',
      'childrenAndTeens',
      'worriesAndAnxiety',
      'workplaces',
      'travel',
      'foodPetsAndAnimals',
      'riskAreas',
    ],
  },
  pl: {
    primary: ['avoidInfection', 'possibleInfection', 'isolation', 'quarantine'],
    secondary: [
      'groupsAtRisk',
      'seniorCitizens',
      'childrenAndTeens',
      'worriesAndAnxiety',
      'workplaces',
      'travel',
      'foodPetsAndAnimals',
      'riskAreas',
    ],
  },
};

const smallBtnStyle = {
  width: '48.5%',
};

const HomeScreen = ({ navigation, logout }) => {
  const {
    t,
    i18n: { language },
  } = useTranslation();
  const [loadingUserData, setLoadingUserData] = useState(true);
  const { fetchUser, clearUserData } = useContext(UserContext);

  // Check if we still have location access
  useEffect(() => {
    const checkLocationPermission = async () => {
      const { status } = await Permissions.getAsync(Permissions.LOCATION);
      if (status !== 'granted') {
        resetStack(navigation, 'Permission');
        return;
      }
      await checkUser();
    };

    checkLocationPermission();
  }, []);

  const logoutUser = () => {
    navigation.navigate({ routeName: 'LoggedOut' });
    stopBackgroundTracking();
    logout();
    clearUserData();
  };

  // Check if user has been requested to share data
  const checkUser = async () => {
    setLoadingUserData(true);

    try {
      const user = await fetchUser();
      setLoadingUserData(false);

      if (user && user.dataRequested) {
        resetStack(navigation, 'RequestData');
      }
    } catch (error) {
      setLoadingUserData(false);

      if (error instanceof AuthenticationError) {
        logoutUser();
      }
    }
  };

  /**
   * @param {AppStateStatus} state
   */
  function onAppStateChange(state) {
    if (state === 'active') {
      checkUser();
    }
  }

  // Check user status when app is focused
  useEffect(() => {
    const unsubscribePushMessage = messaging().onMessage(checkUser);
    AppState.addEventListener('change', onAppStateChange);

    return () => {
      unsubscribePushMessage();
      AppState.removeEventListener('change', onAppStateChange);
    };
  }, []);

  useEffect(() => {
    initBackgroundTracking(t('trackingTitle'), t('trackingNotification'));
    registerPushNotifications();
  }, []);

  if (loadingUserData) {
    return <LoadingScreen />;
  }

  return (
    <AppShell title={t('trackingTitle')} subtitle={t('trackingSubtitle')}>
      <ScrollView>
        <Content>
          <Heading level={3}>{t('aboutCovidTitle')}</Heading>
          <Text>{t('aboutCovidDescription')}</Text>
          <ButtonGroup>
            <UrlButton
              align="left"
              justify="start"
              href={t('announcementsLink')}
              image={bullHorn}
              imageDimensions={{ height: scale(26), width: scale(26) }}
            >
              {t('announcements')}
            </UrlButton>
            {links[language].primary.map(link => (
              <UrlButton
                key={link}
                justify="start"
                href={t(`${link}Link`)}
                align="left"
                bgColor={Colors.text}
              >
                {t(`${link}Label`)}
              </UrlButton>
            ))}
          </ButtonGroup>

          <Vertical unit={0.5} />

          <ButtonGroup row>
            {links[language].secondary.map(link => (
              <UrlButton
                key={link}
                href={t(`${link}Link`)}
                bgColor={Colors.orange}
                style={smallBtnStyle}
                small
              >
                {t(`${link}Label`)}
              </UrlButton>
            ))}
          </ButtonGroup>

          <Vertical unit={1} />

          <UrlButton transparent href={t('covidLink')}>
            <Text center>
              Meira á{' '}
              <Text bold color={Colors.blue}>
                covid.is
              </Text>
            </Text>
          </UrlButton>

          <Vertical unit={1} />

          <Footer />

          <Vertical unit={1} />

          {__DEV__ && (
            <CtaButton bgColor={Colors.gray} onPress={logoutUser}>
              Dev only log out
            </CtaButton>
          )}
        </Content>
      </ScrollView>
    </AppShell>
  );
};

HomeScreen.propTypes = {
  navigation: PropTypes.shape({
    dispatch: PropTypes.func.isRequired,
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

const Screen = withTranslation()(({ ...props }) => (
  <AuthConsumer>
    {({ logout }) => <HomeScreen {...props} logout={logout} />}
  </AuthConsumer>
));

Screen.navigationOptions = {
  header: null,
};

export default Screen;
