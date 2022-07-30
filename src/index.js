require("dotenv").config();

const axios = require("axios");
const cron = require("node-cron");
const { faker } = require("@faker-js/faker");

function refreshToken() {
  return axios
    .post(
      "https://securetoken.googleapis.com/v1/token?key=AIzaSyBc8a2MgrJ3krmxixlWflgVGg5ZQ_pHF78",
      {
        grantType: "refresh_token",
        refreshToken: process.env.REFRESH_TOKEN,
      },
      {
        headers: {
          "x-client-version": "iOS/FirebaseSDK/9.2.0/FirebaseCore-iOS",
          "x-ios-bundle-identifier": "com.bonnet.driver",
          "x-firebase-gmpid": "1:1003470998483:ios:356ea3f15bd3b119cdfd26",
          "content-type": "application/json",
          "user-agent":
            "FirebaseAuth.iOS/9.2.0 com.bonnet.driver/2.0.4 iPhone/15.5 hw/iPhone13_2",
        },
      }
    )
    .then((response) => {
      return response.data.access_token;
    })
    .catch((response) => console.log(response.response.data));
}

async function getProfile() {
  const token = await refreshToken();

  return axios
    .get("https://bonnetapps.com/driver/api/1.1/me/gaming-profile", {
      headers: {
        authorization: token,
        accept: "*/*",
        "content-type": "application/json",
        "app-version": "2.0.4",
        "user-agent": "Bonnet/3 CFNetwork/1333.0.4 Darwin/21.5.0",
        "app-platform": "ios",
      },
    })
    .then((response) => response.data);
}

async function requestSuggest() {
  const token = await refreshToken();

  return axios
    .post(
      "https://bonnetapps.com/driver/api/1.1/locations/suggestion",
      {
        city: faker.address.cityName(),
        comment: "",
        street_facility: faker.address.streetAddress(),
      },
      {
        headers: {
          authorization: token,
          accept: "*/*",
          "content-type": "application/json",
          "app-version": "2.0.4",
          "user-agent": "Bonnet/3 CFNetwork/1333.0.4 Darwin/21.5.0",
          "app-platform": "ios",
        },
      }
    )
    .then((response) => {
      return response.data;
    })
    .catch((error) => console.log(error));
}

(async function () {
  const cronjob = cron.schedule(
    `*/5 * * * *`,
    async function () {

      const response = await getProfile();

      console.log('profile', response);

      const actionSuggest = response.actions.find((item) => item.title === 'suggest_charger');

      if (actionSuggest) {
        console.log("Sending Suggestion to Bonnet");
        const response = await requestSuggest();
        console.log(`Suggestion sent at: ${new Date()}`);
      }
    
    },
    {
      scheduled: false,
    }
  );

  console.log('deploy start')

  cronjob.start();
})();
