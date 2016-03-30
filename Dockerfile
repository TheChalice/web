FROM alpine

# Install nginx & node
RUN apk add --update nginx nodejs git && \
    rm -rf /var/cache/apk/*

# Install Bower
# Set bower root allow
RUN npm install -g bower && \
    echo '{ "allow_root": true }' > /root/.bowerrc && \
    git config --global url."https://".insteadOf git://

# Copy code
COPY ./* /data/datafoundry/

# Install node & bower depends
WORKDIR /data/datafoundry
RUN cp nginx.conf /etc/nginx/nginx.conf && \
    npm install && \
    bower install && \
    ./release.sh

EXPOSE  80 8080
CMD ["nginx", "-g", "daemon off;"]