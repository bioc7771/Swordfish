# Swordfish IV

![Swordfish logo](https://www.maxprograms.com/images/swordfish_white.png)

An advanced CAT (Computer Aided Translation) tool based on XLIFF Standard that supports MS Office, DITA, HTML and other document formats.

Swordfish uses TM (Translation Memory) and MT (Machine Translation). Supports segment filtering, terminology, customization and more.

#### Swordfish IV Running on macOS

<a href="https://www.maxprograms.com/tutorials/TranslateFile.mp4"><img src="https://www.maxprograms.com/images/translateFile.png"></a>

## Licenses

Swordfish is available in two modes:

- Personal Use of Source Code
- Yearly Subscriptions

### Personal Use of Source Code

Source code of Swordfish is free for personal use. Anyone can download the source code, compile, modify and use it at no cost in compliance with the accompanying license terms.

You can subscribe to [Maxprograms Support](https://groups.io/g/maxprograms/) at Groups.io and request peer assistance for the source code version there.

### Subscriptions

Ready to use installers and technical support for Swordfish are available as yearly subscriptions at [Maxprograms Online Store](https://www.maxprograms.com/store/buy.html).

The version of Swordfish included in the official installers from [Maxprograms Download Page](https://www.maxprograms.com/downloads/index.html) can be used at no cost for 30 days requesting a free Evaluation Key.

Subscription version includes unlimited email support at tech@maxprograms.com

### Differences sumary
Differences | Source Code | Subscription Based
-|----------- | -------------
Ready To Use Installers| No | Yes
Notarized macOS launcher| No | Yes
Signed launcher and installer for Windows | No | Yes
Restricted Features | None | None
Technical Support |  Peer support at  [Groups.io](https://groups.io/g/maxprograms/)| - Direct email at tech@maxprograms.com  <br> - Peer support at [Groups.io](https://groups.io/g/maxprograms/)


## Related Projects

- [OpenXLIFF Filters](https://github.com/rmraya/OpenXLIFF)

## Requirements

- JDK 11 or newer is required for compiling and building. Get it from [AdoptOpenJDK](https://adoptopenjdk.net/).
- Apache Ant 1.10.7 or newer. Get it from [https://ant.apache.org/](https://ant.apache.org/)
- Node.js 12.16.0 LTS or newer. Get it from [https://nodejs.org/](https://nodejs.org/)

## Building

- Checkout this repository.
- Point your `JAVA_HOME` environment variable to JDK 11
- Run `ant` to compile the Java code
- Run `npm install` to download and install NodeJS dependencies
- Run `npm start` to launch Swordfish

### Steps for building

``` bash
  git clone https://github.com/rmraya/Swordfish.git
  cd Swordfish
  ant
  npm install
  npm start
```

Compile once and then simply run `npm start` to start Swordfish
