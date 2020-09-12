---
sidebar: auto
---

# Installation

Cryb requires a Redis and a MongoDB server, NodeJS, Yarn and Docker.

This guide is for Ubuntu Server 20.04.1 LTS but should also work on derivates.

## Yarn Repo
First we add the yarn repo
```bash
curl -sL https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt update
```

## Install dependencies
Then we install the dependencies. We also install `screen` to run it in the background later on.
```bash
sudo apt remove cmdtest
sudo apt install mongodb redis-server docker.io yarn git screen
```

## Info
::: tip
In the following replace `YOURDOMAIN`. You may use something like `cryb.example.org`
:::

## Create Discord Application
Since login works via Discord you need you create a Discord application.  
Visit the [Discord Developer Portal](https://discord.com/developers/applications) to do so.
 
- Click on `New application` and give it a name.  
- Then copy and save the `Client ID` and `Client Secret` (You will need them later)   
- Now go to `OAuth2` and a `Redirect`
  - If you plan on using a [reverse proxy](./#setup-reverse-proxy) just add `https://YOURDOMAIN/auth/discord` 
  - Otherwise, add `http://YOURDOMAIN:3000/auth/discord`

## Clone repositories
Create a directory and clone all required repositories
```bash
mkdir cryb
cd cryb
git clone https://github.com/crybapp/api.git
git clone https://github.com/crybapp/web.git
git clone https://github.com/crybapp/portals.git
git clone https://github.com/crybapp/portal.git
git clone https://github.com/crybapp/janus-docker.git
```

## Setup API
Move into the `api` directory
```bash
cd api
```
Install dependencies
```bash
yarn
```
Rename environment file and edit
```bash
mv .env.example .env
nano .env
```
Set
```ini
NODE_ENV=production
JWT_KEY=bigcrybfan
MONGO_URI=mongodb://localhost:27017/cryb
PORTALS_API_KEY=thinkingwithportals
REDIS_URI=redis://localhost:6379
```
For Discord, we set
```ini
DISCORD_CLIENT_ID=<Your client ID here>
DISCORD_CLIENT_SECRET=<Your client secret here>
```
- If you plan on using a [reverse proxy](./#setup-reverse-proxy) set 
  - `DISCORD_OAUTH_ORIGINS=https://YOURDOMAIN`
  - `DISCORD_CALLBACK_URL=https://YOURDOMAIN/auth/discord`
- Otherwise, set
  - `DISCORD_OAUTH_ORIGINS=http://YOURDOMAIN:3000`
  - `DISCORD_CALLBACK_URL=http://YOURDOMAIN:3000/auth/discord`

## Setup Web
Move into the `web` directory
```bash
cd web
```
Install dependencies
```bash
yarn
```
Rename environment file and edit
```bash
mv .env.example .env
nano .env
```
Set
```ini
NODE_ENV=production
COOKIE_DOMAIN=.YOURDOMAIN
```
::: warning
Important: you need that `.` in front of `YOURDOMAIN`
:::
- If you plan on using a [reverse proxy](./#setup-reverse-proxy) set 
  - `API_WS_URL=https://YOURDOMAIN/apiws`
  - `API_BASE_URL=https://YOURDOMAIN/api`
  - `WEB_BASE_URL=https://YOURDOMAIN`
  - `JANUS_URL=https://YOURDOMAIN/janus`
- Otherwise, set
  - `API_WS_URL=http://YOURDOMAIN:4000`
  - `API_BASE_URL=http://YOURDOMAIN:4000`
  - `WEB_BASE_URL=http://YOURDOMAIN:3000`
  - `JANUS_URL=http://YOURDOMAIN:8088`

## Create Docker network
We will create a docker network for the portals communication
```bash
docker network create -d bridge --subnet 192.168.0.0/24 --gateway 192.168.0.1 portalnet
```

## Setup Portals
Move into the `portals` directory
```bash
cd portals
```
Install dependencies
```bash
yarn
```
Rename environment file and edit
```bash
mv .env.example .env
nano .env
```
Set
```ini
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/cryb
REDIS_URI=redis://localhost:6379
API_KEY=thinkingwithportals
PORTAL_KEY=ilikeportals
DRIVER=docker
DOCKER_SOCK=/var/run/docker.sock
DOCKER_IMAGE=cryb/portal
DOCKER_SHM_SIZE=1024
DOCKER_NETWORK=portalnet
ENABLE_JANUS=true
JANUS_HOSTNAME=localhost
JANUS_STREAMING_ADMIN_KEY=supersecret
JANUS_PORT=8088
```

## Setup Janus
Move into the `janus-docker` directory
```bash
cd janus-docker
```
Rename config files
```bash
cd configs
mv janus.jcfg.example janus.jcfg
mv janus.plugin.streaming.jcfg.example janus.plugin.streaming.jcfg
mv janus.transport.http.jcfg.example janus.transport.http.jcfg
```
Edit streaming config
```bash
nano janus.plugin.streaming.jcfg.example
```
Uncomment `#admin_key = "supersecret"` under `general`

Go back and build docker image
```bash
cd ..
docker build . -t cryb/janus
```

## Setup Portal
Move into the `portal` directory
```bash
cd portal
```
Install dependencies
```bash
yarn
```
Rename environment file and edit
```bash
mv .env.example .env
nano .env
```
Set
```ini
NODE_ENV=production
PORTALS_WS_URL=ws://192.168.0.1:5000
STREAMING_URL=192.168.0.1
PORTAL_KEY=ilikeportals
JANUS_PORT=8088
```
Build docker image
```bash
yarn docker:build
```

## Start everything

### Start API
```bash
cd cryb/api
screen -S cryb-api
yarn start
```
### Start Web
```bash
cd cryb/web
screen -S cryb-web
yarn build && yarn start
```
### Start Portals
```bash
cd cryb/portals
screen -S cryb-portals
yarn start
```
### Start Janus
```bash
cd cryb/janus-docker
screen -S cryb-janus
docker run --rm --name cryb-janus -it --net=host cryb/janus
```

### Start a portal manually
If you've set `DRIVER=docker` in the `portals/.env` portals should automatically start. If you want you can set it to `manual` and start them manually.
Look into the `cryb-portals` output for the ID (just the numbers) and start a portal:
```bash
cd cryb/portal
yarn docker:dev --portalId <Portal-ID>
```

## Setup reverse proxy
Now we'll setup a reverse proxy which enables everything to run with SSL and on the root of your domain.

### DNS
Add an `A` entry with the IP of your VPS, and a subdomain which you chose earlier.
![DNS Setup](./dns.png)

### Install stuff
For this we will install nginx and certbot
```bash
sudo apt install nginx certbot python3-certbot-nginx
```
### Run certbot
```bash
sudo certbot --nginx -d YOURDOMAIN
```
### Edit nginx config
```bash
sudo nano /etc/nginx/sites-available/default
```
Replace the `location /` section with
```nginx
location / {
        proxy_pass http://127.0.0.1:3000/;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 0;
}

location /api {
        proxy_pass http://127.0.0.1:4000;
        rewrite    /api/(.*) /$1 break;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 0;
}

location /apiws {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
}

location /janus {
        proxy_pass http://127.0.0.1:8088;
        rewrite    /janus/(.*) /$1 break;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 0;
}
```
Restart nginx
```bash
sudo service nginx restart
```
