# !/bin/bash

git pull
cp -rf * /usr/apps/msart/
pm2 restart msart
pm2 save