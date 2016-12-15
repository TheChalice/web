FROM openresty/openresty

MAINTAINER Zonesan <chaizs@asiainfo.com>

ADD usr /usr
ADD . /datafoundry-citic

WORKDIR /datafoundry-citic

# Install nginx & node
# Install Bower
# Install node & bower depends
# Set bower root allow

#RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && \
RUN apk add --update nodejs git && \
    npm install -g bower && \
    echo '{ "allow_root": true }' > /root/.bowerrc && \
    git config --global url."https://".insteadOf git:// && \
    npm install && \
    bower install && \
    ./release.sh && \
    npm uninstall -g bower && \
    apk del nodejs git --purge && \
    rm -rf bower_components node_modules app /var/cache/apk/* /tmp/*

EXPOSE 80 


ENTRYPOINT ["/usr/local/bin/start.sh"]
