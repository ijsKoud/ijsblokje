<div align="center">
    <img src="https://avatars.githubusercontent.com/in/214508" width="100px" />
    <h1>ijsblokje</h1>
  
  <p>A personal GitHub bot which syncs data and runs automated systems</p>
  
  <p align="center">
    <img alt="Version" src="https://img.shields.io/badge/version-1.0.0-blue.svg" />
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

This is a personal GitHub bot designed to do some tasks for me. It currently does the following:

-   Label Syncer
-   Labeling certain PRs (renovate PRs)

## Install

You can self-host this bot, though I do wonder why cuz this is a personalised bot. If you however have the same setup (using Renovate as Dependency bumper) feel free to continue. To host this either glone the repo (git clone ...) or use Docker (recommended & fastest)

#### Configuring the `.env` file:

First make sure you followed this guide before continuing: [ProBot configuration](https://probot.github.io/docs/development/#manually-configuring-a-github-app)
After that, change the following variables:

```env
LABEL_DEPENDENCIES="Dependencies" # The name of the label you want to give every dependency bump from Renovate
REPO_NAME="ijsKoud/ijsKoud" # The repository where the labels.json file is located
USERNAME="ijsKoud" # Your own GitHub username
```

#### Setup with Docker:

Note: the `3000:3000` are for binding the ports, make sure to update them accordingly when changing the `.env` file PORT variable!

```bash
$ docker pull ghcr.io/ijskoud/ijsblokje:v1
$ docker run --name=ijsblokje --restart always -d --env-file .env -p 3000:3000 ghcr.io/ijskoud/ijsblokje:v1
```

#### Setup without Docker

Make sure to add the `.env` file to the folder before running the bot!

```bash
$ git clone https://github.com/ijsKoud/ijsblokje
$ cd ijsblokje
$ yarn install
$ yarn build
$ yarn start
```

## Credits

-   Logo: <a href='https://www.freepik.com/vectors/melting-ice'>Melting ice vector created by freepik</a>

## Author

👤 **DaanGamesDG**

-   Website: https://ijskoud.dev/
-   Email: <github@ijskoud.dev>
-   Twitter: [@ijsKoud](https://twitter.com/ijs_Koud)
-   Github: [@ijsKoud](https://github.com/ijsKoud)

## Donate

This will always be open source project, even if I don't receive donations. But there are still people out there that want to donate, so if you do here is the link [PayPal](https://paypal.me/daangamesdg) or to [Ko-Fi](https://ijskoud.dev/kofi). Thanks in advance! I really appriciate it <3

## Lisence

Project is licensed under the © [**MIT License**](/LICENSE)

---
