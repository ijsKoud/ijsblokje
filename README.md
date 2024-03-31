<div align="center">
    <img src="https://avatars.githubusercontent.com/in/214508" width="100px" />
    <h1>ijsblokje</h1>
  
  <p>Co-pilot for GitHub operations ✈️</p>
  
  <p align="center">
    <img alt="Version" src="https://img.shields.io/badge/version-3.0.6-blue.svg" />
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

IJsblokje is my co-pilot for GitHub operations! It is able to:

- 🏷️ Label PRs automatically according to the conventional commit types
- 🔃 Sync labels across mutliple repositories with the ability to add repository specific ones too
- 🔔 Automatically adds a [GitCord](https://github.com/ijskoud/gitcord) webhook url to the webhooks everytime a repository is created and toggles it depending on the visibility state
- 🗞️ Syncs the readme's of multiple repositories using a config (`readme.ijsblokje.toml`) and a base readme (which is located at your own account repository -> ijsKoud/ijsKoud)
- 🎉 Releases a new version with automatic changelog generation (This can be done via the Discord bot integration)

## Install

Docker is required to host this app yourself. To install and run the GitHub app first pull the image using `docker pull ghcr.io/ijskoud/ijsblokje:github-bot` and after that run it using `docker run --name=ijsblokje-github-bot -v ~/.env:/ijsblokje/.env -d ghcr.io/ijskoud/ijsblokje:github-bot`, you can do the same with the Discord bot.

Alternatively if you would like to use both the GitHub app and Discord bot you can use the provided `docker-compose.yml` file to install it. Simply copy the file to a directory on your pc/server, add the required `.env` files (examples are in the designated app directories) and run `docker-compose up`

## Credits
The logo was created using the <a href='https://www.freepik.com/vectors/melting-ice'>Melting ice vector created by freepik</a>

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
