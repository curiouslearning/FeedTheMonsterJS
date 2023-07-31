# FeedTheMonsterJS

<div id="top"></div>

<div id="screenshots">
<p>
<img src="https://github.com/curiouslearning/Media/blob/master/FTM%20JS/ftm_js_1.png" height="400" width="200">
<img src="https://github.com/curiouslearning/Media/blob/master/FTM%20JS/ftm_js_2.png" height="400" width="200">
</p>
</div>

[![Contributors][contributors-shield]][contributors-url]
[![Issues][issues-shield]][issues-url]

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#play-the-game">Play the Game</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
        <li><a href="#additional-dependencies">Additional Dependencies</a></li>
        <li><a href="#pre-requisites">Pre-requisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a>
    <ul>
    <li><a href="#creating-a-new-language-version">Creating a new language version</a></li>
    <li><a href="#compile-and-build-the-new-version">Compile and build the new version</a></li>
    <li><a href="#export-and-upload-to-a-wordpress-server">Export and upload to a Wordpress server</a></li>
    <li><a href="#creating-a-new-gameplay-feature">Creating a new gameplay feature</a></li>
    </ul></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->

## About The Project

Feed The Monster teaches your child the fundamentals of reading. Collect monster eggs and feed them letters so they can grow into new friends!

**WHAT IS FEED THE MONSTER?**

Feed The Monster uses proven ‘play to learn’ techniques to engage kids and help them learn to read. Children enjoy collecting and growing pet monsters while learning reading fundamentals.

**GAME FEATURES TO PROMOTE READING SKILLS:**

• Fun and engaging phonics puzzles

• Challenging “sound only” levels

• Collectable, evolvable, and fun monsters

• Designed to promote socio-emotional skills.

**DEVELOPED BY EXPERTS FOR YOUR CHILD.**

The game is based on years of research and experience into the science of literacy. It incorporates key skills for literacy, including Phonological Awareness, Letter Recognition, Phonics, Vocabulary, and Sight Word Reading so kids can develop a strong foundation for reading. Built around the concept of caring for a collection of monsters, it is designed to encourage empathy, perseverance and socio-emotional development for children.

**WHO ARE WE?**

Feed the Monster was funded by the Norwegian Ministry of Foreign Affairs as part of the EduApp4Syria-competition. The original Arabic app was developed as a joint venture between Apps Factory, The Center for Educational Technology (CET) and The International Rescue Committee (IRC).

Feed the Monster was adapted to English by Curious Learning, a non-profit dedicated to promoting access to effective literacy content for everyone who needs it. We're a team of researchers, developers, and educators dedicated to giving children everywhere literacy education in their native language based on evidence and data – and are working to bring Feed The Monster to 100+ high-impact languages around the world.

### Play the Game

This version of Feed The Monster was created specifically for web-enabled smartphone and tablet devices. To play the game, please follow the appropriate language links on a phone or tablet:

#### [English Version](https://devcuriousreader.wpcomstaging.com/Testingftm_2.9/)



To create new language versions, please refer to our [Adding New Languages](https://github.com/curiouslearning/FeedTheMonsterJS/edit/main/README.md#adding-new-languages) section below which will detail the process of making the app using pre-populated JSON files for 50+ languages and links to the Creative Commons audio files for those languages.

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- GETTING STARTED -->

## Getting Started


**Note:** The Following documentation was created taking `home` as your main repository directory where the project is cloned in our case it is `FEEDTHEMONSTERJS`.

### Built With

- Vanilla Javascript
- HTML canvas
- Typescript
### Additional Dependencies

```
    "@capacitor/android": "^4.4.0",
    "@capacitor/core": "^4.4.0",
    "@types/workbox-window": "^4.3.4",
    "copy-webpack-plugin": "^11.0.0",
    "webpack": "^5.74.0",
    "workbox-window": "^4.3.1"
    "@capacitor/cli": "^4.4.0",
    "typescript": "^4.9.3",
    "webpack-cli": "^4.10.0"
```

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- GETTING STARTED -->

### Pre-requisites

In order to utilize the contents of this repository, we will need to install the Node Package Manager locally on a development machine using the command prompt:

```sh
 npm install npm@latest -g
```

<p align="right">(<a href="#top">back to top</a>)</p>

### Installation

The following steps will walk through a local development setup for building and deploying Feed The Monster Progressive Web App.

1. In a command prompt, navigate to `home` folder.

2. Clone the repo by running the following:
   `  https://github.com/curiouslearning/FeedTheMonsterJS`

3. Now build the project using `tsconfig.json`,
Also using shortcut Shift+b .

4. Next install NPM packages:
   `   npm install`

5. Then run the command:
   `   npm run dev`
6. Next step is to run the command:
   `workbox injectManifest`.

   Which can also be utilised for compiling newer versions as well.
7. Go to `build` folder,there open the `index.html` file with live Server.

8. Now you can install the Feed The Monster On your device and Run it.

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- USAGE EXAMPLES -->

## Usage

### Creating a new language version

For creating a new language version of Feed The Monster, we will need to replace the current repo's JSON file with an [appropriate language JSON file](https://github.com/curiouslearning/ftm-asset-api/tree/main/fulljsons) or create a new language JSON file using any of the language JSON files linked as a template.

1. Once a language JSON file has been selected and created,add it in the `home\lang` folder where you have to create a language specific folder.

2. Make sure that the naming convention for the new json shall be like:

   `ftm_languagechosen.json`.


3.  Images and the audios of specific language should be added for the praising words(fantastic,good job) inside the 'lang'directory language specific folder where you need to create folders for audios and images.
 
5. Next Step is going to `home/global-variables.ts` and change the lang variable value with the appropriate value of the language desired.

<!-- 6.  Contents for the information that has to be displayed in the start scene(about company) and end scene(googleplay link to continue further)has to be added with keys 'aboutCompany' and 'descriptionText' with a value in their respective language in 'ftm_language.json' file. -->
Please note that above the language JSON in this JS file are meta variables that will help distinguish different language builds (e.g. LanguageName) and even versioning information (e.g. LanguageVersion) for the JSON itself that are helpful in maintaining the app or troubleshooting issues. Also note that all server URLs such as server.com/... and curiousreader.org/... will need to be replaced with the URLs where language-specific images or audio are uploaded ultimately. All existing [language-specific images and audio](https://github.com/curiouslearning/ftm-languagepacks) can be downloaded and used as Creative Commons.

<p align="right">(<a href="#top">back to top</a>)</p>

### Compile and build the new version

For Creating new versions the steps are simple you just have to run

 `workbox injectManifest` command.

<p align="right">(<a href="#top">back to top</a>)</p>

### Export and upload to a Wordpress server

The following section is NOT necessary in understanding the Feed The Monster build process but is supplementary information if we have decided to use a Wordpress server with the Freelearning Wordpress theme for publishing the app.

1.  Open the Wordpress server and go navigation sidebar.

2.  Open file Manager, there select the `htdocs` there create a new folder for example `feedTheMonster_1.0.0`.

3.  Now in that folder add all files separately from the build folder of our project.


<p align="right">(<a href="#top">back to top</a>)</p>

### Creating a new gameplay feature

To help understand how to extend functionality of this version of Feed The Monster, we will be creating a theoretical feature of adding a scoreboard to the main gameplay screen when a user answers a question in Feed The Monster.

We will be using canvas context which is an object with properties and methods that you can use to render graphics inside the canvas element.

For creating this new gameplay feature, navigate to `home\src\components` folder.

1.  Now here you will create an file `score-card.ts` in which you will be doing the changes as per the requirement.

2.  In that file create an export class.

3.  Now go to the desired scene where you want to add this feature, In our case it's `level-start-scene.ts`.
4.  There we will be importing the class along with the parameters we will be utilising and using it like:
    ` this.scoreCard = new ScoreCard(game, score);`

5.  Now go back to the `score-card.ts`,Here as shown in the below code snippet you will doing all the necessary such as:

      1 Creating new Layer:

            this.id = this.canvasStack.createLayer(
            this.height,
            this.width,
            ScoreCardLayer
            );

    where you have to exportScoreCardLayer from `home\scr\common.ts` file.

      2 Creating functions for updating the score:

      ```
          setCurrentScore(data) {
          this.score = data;
          }
      ```

    These are functions which can be called from `level-start-scene.ts` and can be utilised as per requirement as in this case for updating score.

    ```
         self.scorecard.setCurrentScore(score);
            self.scorecard.draw();
    ```

    3 Removing the scoreCard from the scene can be achived as:

    `deleteCanvas() { this.canvasStack.deleteLayer(this.id);
}`

**Here's the code snippet for `score-card.ts`:**

```

import { PromptTextLayer, ScoreCardLayer } from "../common/common.js";
import { CanvasStack } from "../utility/canvas-stack.js";
var self: any;
var score_cardimg = new Image();
score_cardimg.src = "./assets/images/score_v01.png";
export class ScoreCard {
public game: any;
public width: any;
public height: any;
public canvasStack: any;
public score: any;
public fntstOrGrtImgArr: any;
public id: any;
public canavsElement: any;
public context: any;

constructor(game, score) {
this.game = game;
this.width = game.width;
this.height = game.height;
this.canvasStack = new CanvasStack("canvas");
this.score = score;
self = this;
this.fntstOrGrtImgArr = [];
this.createCanvas();
this.draw();
}

createCanvas() {
this.id = this.canvasStack.createLayer(
this.height,
this.width,
ScoreCardLayer
);
this.canavsElement = document.getElementById(this.id);
this.context = this.canavsElement.getContext("2d");
this.canavsElement.style.zIndex = 6;
}

setCurrentScore(data) {
this.score = data;
}

deleteCanvas() {
this.canvasStack.deleteLayer(this.id);
}
draw() {
this.context.clearRect(0, 0, this.width, this.height);
this.context.drawImage(
score*cardimg,
this.game.width / 2.5,
this.height * 0.001,
this.game.width \_ 0.25,
this.height \* 0.1
);
if (this.score != 0) {
this.context.fillStyle = "white";
this.context.font = 38 + "px Arial";
this.context.textAlign = 30;
this.context.fillText(this.score, this.width / 2.25, this.height / 15);
}
}
}

```



<p align="right">(<a href="#top">back to top</a>)</p>


<!-- CONTRIBUTING -->

## Contributing

The Feed The Monster codebase is open source and we freely encourage others to extend, remix, or localize the content herein, including the audio and graphical content which is licensed under CC-BY.

In our exploration of previous React version of Feed The Monster, we found React to have a few major shortcomings-- namely the ability to play fluid, pre-loaded animations which we feel is paramount to child engagement. We have re-write the code instead using [vanilla Javascript and HTML canvas](https://github.com/curiouslearning/FeedTheMonsterJS).

#### Contribution guidelines coming soon

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- CONTACT -->

## Contact

#### If you'd like to contact us, please feel free to e-mail us at info@curiouslearning.org.

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- ACKNOWLEDGMENTS -->

## Acknowledgments

#### The Sutara Development Team

- Rajesh Kumar Choudhary
- P Vinay Kumar Reddy
- Rakshith Acharya
- ASHISH KUMAR
- Ashish M
- Amit Kumar Singh

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[contributors-shield]: https://img.shields.io/badge/Contributors-lightgrey?style=for-the-badge
[contributors-url]: https://github.com/curiouslearning/FeedTheMonsterJS/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/curiouslearning/FeedTheMonsterJS?style=for-the-badge
[forks-url]: https://github.com/curiouslearning/FeedTheMonsterJS/network/members
[stars-shield]: https://img.shields.io/github/stars/curiouslearning/FeedTheMonsterJS?style=for-the-badge
[stars-url]: https://github.com/curiouslearning/FeedTheMonsterJS/stargazers
[issues-shield]: https://img.shields.io/github/issues/curiouslearning/FeedTheMonsterJS?style=for-the-badge
[issues-url]: https://github.com/curiouslearning/FeedTheMonsterJS/issues
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[product-screenshot]: images/screenshot.png

```

```
