<div align="center">
    <img src="https://avatars.githubusercontent.com/in/214508" width="100px" />
    <h1>ijsblokje</h1>
  
  <p>A personal GitHub bot which syncs data and runs automated systems</p>
  
  <p align="center">
    <img alt="Version" src="https://img.shields.io/badge/version-2.1.2-blue.svg" />
    <a href="/LICENSE" target="_blank">
      <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" />
    </a>
  </p>

  <a href="https://ijskoud.dev/discord" target="_blank">
    <img src="https://ijskoud.dev/discord/banner" />
  </a>
</div>

---

## Information

IJsblokje is a custom GitHub app build to automate a bunch of stuff, it can for example:

- 🏷️ Label PRs automatically according to the conventional commit types
- 🔃 Sync labels across mutliple repositories and allows for specific repo labels too
- 🔔 Automatically adds the Discord feed webhook URL and enables/disables it depending on the visibility state
- 🗞️ Syncs the readme's of multiple repositories using a config and a base readme (which is located at ijsKoud/ijsKoud)
- 🎉 Releases a new version with automatic changelog generation everytime a command is ran by the owner: [@ijsblokjeee[bot]](https://github.com/apps/ijsblokjeee) release v**x.y.z**

## Install

Although you cannot self-host this with docker due to the personal preferences and names you can edit the code to your likings and run it from there.

To do this, simply clone the repository (`git clone <url>`) and edit the code from there (Only edit the src/lib/constants.ts if you aren't looking to change the code). After that Rename the directory `ijsKoud` to your own GitHub username.

Once finished, build the app (`yarn run build`) and start it by running: `yarn run start`. Do NOT forget to edit the `.env` variables first and move them to the `/data` folder (create one if it is not there yet)!


## Credits
- Logo: <a href='https://www.freepik.com/vectors/melting-ice'>Melting ice vector created by freepik</a>

## Author

👤 **ijsKoud**

-   Website: https://ijskoud.dev/
-   Email: <hi@ijskoud.dev>
-   Twitter: [@ijsKoud](https://ijskoud.dev/twitter)
-   Github: [@ijsKoud](https://github.com/ijsKoud)

## Donate

This will always be open source project, even if I don't receive donations. But there are still people out there that want to donate, so if you do here is the link [PayPal](https://ijskoud.dev/paypal) or to [Ko-Fi](https://ijskoud.dev/kofi). Thanks in advance! I really appriciate it <3

## License

Project is licensed under the © [**MIT License**](/LICENSE)

---
