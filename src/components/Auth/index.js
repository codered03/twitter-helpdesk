import React, { Component } from "react";
import StyledFirebaseAuth from "react-firebaseui/StyledFirebaseAuth";
import firebase from "firebase";
import styled from "styled-components";

// Configure Firebase.
const config = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DB_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: "",
  messagingSenderId: process.env.REACT_APP_FIREBASE_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};
firebase.initializeApp(config);

// Configure FirebaseUI.
const uiConfig = {
  signInFlow: "popup",
  signInSuccessUrl: "/signedIn",
  signInOptions: [
    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    firebase.auth.EmailAuthProvider.PROVIDER_ID
  ]
};

const AuthContainer = styled.div`
  text-align: center;
`;
const AuthOptionsWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

class Auth extends Component {
  // Listen to the Firebase Auth state and set the local state.
  componentDidMount() {
    this.unregisterAuthObserver = firebase.auth().onAuthStateChanged(
        (user) => {
          if (user) {
            localStorage.setItem('twitterHelpdesk.expectSignIn', '1')
          } else {
            localStorage.removeItem('twitterHelpdesk.expectSignIn')
          }
        }
    );
  }

  // Un-register Firebase observers when the component unmounts.
  componentWillUnmount() {
    this.unregisterAuthObserver();
  }

  render() {
    return(<AuthContainer>
      <h1>Twitter HelpDesk</h1>
      <p>Please sign-in to continue:</p>
      <AuthOptionsWrapper>
        <StyledFirebaseAuth
          uiConfig={uiConfig}
          firebaseAuth={firebase.auth()}
        />
      </AuthOptionsWrapper>
    </AuthContainer>);
  }
}

export default Auth;
