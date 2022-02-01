import { CognitoUser } from '@aws-amplify/auth';
import Amplify, { Auth } from 'aws-amplify';

export const config = {
  REGION: 'eu-west-1',
  USER_POOL_ID: 'eu-west-1_P5W4IVGDt',
  APP_CLIENT_ID: '5osr3b0ned71d45669iht8fgqo',
  TEST_USERNAME: 'ammar',
  TEST_PASSWORD: '9ReduslsDkhb_=5y'
}

Amplify.configure({
  Auth: {
    mandatorySignIn: false,
    region: config.REGION,
    userPoolId: config.USER_POOL_ID,
    userPoolWebClientId: config.APP_CLIENT_ID,
    authenticationFlowType: 'USER_PASSWORD_AUTH',
  }
});

export class AuthService {
  public async login(username: string, password: string) {
    const user = await Auth.signIn(username, password) as CognitoUser;
    console.log(user)
    return user;
  }
}

const authService = new AuthService();
authService.login(config.TEST_USERNAME, config.TEST_PASSWORD);
