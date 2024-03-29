#!/bin/sh

sed -i 's/<ROUTER_DOMAIN_SUFFIX>/'$ROUTER_DOMAIN_SUFFIX'/g'  /datafoundry-citic/dist/app.js


sed -i 's/<redis_host>/'$REDIS_HOST'/g' /usr/local/openresty/nginx/conf/nginx.conf
sed -i 's/<redis_port>/'$REDIS_PORT'/g' /usr/local/openresty/nginx/conf/nginx.conf
sed -i 's/<redis_password>/'$REDIS_PASSWORD'/g' /usr/local/openresty/nginx/conf/nginx.conf
sed -i 's/<api_server_addr>/'$API_SERVER_ADDR'/g' /usr/local/openresty/nginx/conf/nginx.conf
sed -i 's/<api_proxy_addr>/'$API_PROXY_ADDR'/g' /usr/local/openresty/nginx/conf/nginx.conf
sed -i 's/<api_oauth_addr>/'$API_OAUTH_ADDR'/g' /usr/local/openresty/nginx/conf/nginx.conf
sed -i 's/<api_metrics_addr>/'$API_METRICS_ADDR'/g' /usr/local/openresty/nginx/conf/nginx.conf



/usr/local/openresty/bin/openresty -g "daemon off;"
