# Instrument 19

<pre>
  Author: Chris Fowers <chris@freighttrust.com>
  Status: LTS, Production
  License: BSD-3-Clause
  Link: [freight-trust.com](https://freighttrust.com)
</pre>


# Overview
---

This application relies heavily on several modules for creating PDF's from HTML templates or XML files:

* Electron / Electron-PDF - For creating PDF's from HTML pages
* Express - Makes managing REST routes easy and facilitates adding route middleware easily
* Handlebars / Express-hbs - Templating system for building dynamic pages
* Request - Expanded http client used to request webpages passed to the pdf generator. 

Other libraries are at play however are less critical to core functionality. Fore more information on modules being used please refer to the `package.json` file in the root of the project. 

## Working with existing forms
---
Forms components (html, stylsheets, and routing) are named to match. For example, a bol has a bol.hbs, bol.js (router), bol.css, bol-mockdata.js, bol-queue-service.js. These are all generated this way to ensure that you can find the correct corresponding files when you need to change styles or modify a service, etc. 

## Creating a new form
---
# How to deploy
Currently there is only one deployment environment. <br>
We will need to break out a staging and production environment in the very near future. 
Currently to deploy the service simply just commit code changes and push to the development branch. 
As part of the build process (more information below on this) a docker image is published to the docker hub. On the running server, a watchtower container monitors for new deployments of this alpha build and automatically handles updating of the currently running container once a new image appears in the hub. 

Looking at the pipleline definition you'll find 3 environments already defined: `development`, `staging`, and `master` for production. All steps do mostly the same thing. Note that they all build the application and create a docker image that is then pushed to the docker hub. One thing to take into account though is the tag associated with the build varries depending on the branch. Development is built with an `alpha` tag. Staging is built with a `beta` tag and master is built with the default `latest` tag. 

An example branch from the pipeline definition: 

```
development:
    - step:  
        services:
        - docker
        script:
        - export IMAGE_NAME=freight-trust/formgen #$BITBUCKET_COMMIT
        - docker build -t $IMAGE_NAME:alpha .
        - docker login --username $DOCKER_HUB_USERNAME --password $DOCKER_HUB_PASSWORD
        - docker push $IMAGE_NAME:alpha
```