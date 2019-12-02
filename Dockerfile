FROM ubuntu:18.04
LABEL Author='Freight Trust Corporation'

# Updating OS
RUN apt update \
    && apt upgrade -y \
    && apt install build-essential xvfb libgtk-3-0 libx11-xcb1 libxss1 libgconf-2-4 libnss3 libasound2 curl -y
    
RUN echo ttf-mscorefonts-installer msttcorefonts/accepted-mscorefonts-eula select true | debconf-set-selections  
RUN apt install ttf-mscorefonts-installer -y 

# Installing NodeJS
RUN curl -sL https://deb.nodesource.com/setup_9.x -o ./nodesourceSetup.sh \
    && bash ./nodesourceSetup.sh \
    && apt install nodejs -y

# Creating workspace
WORKDIR /app   
COPY . .

# Installing Application
RUN npm install \ 
    && mkdir ./pdfs \
    && apt remove build-essential -y

ENV DISPLAY=':99.0'

VOLUME [ "/app/pdfs" ]

ENTRYPOINT [ "bash", "run.sh" ]