FROM node:8

#
# When we build the image, we copy the executable jar in the image file system. 
#
COPY src /opt/app/

WORKDIR /opt/app/

RUN npm install

ENTRYPOINT ["node", "/opt/app/musician.js"]
