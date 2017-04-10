FROM registry.dataos.io/guestbook/datafoundry-citic-base

# Copy code
COPY . /datafoundry-citic

WORKDIR /datafoundry-citic

# Install nginx & node
# Install Bower
# Install node & bower depends
# Set bower root allow

RUN cp usr / -rf && rm usr -rf &&  \
    ./release.sh

EXPOSE 80 

ENTRYPOINT ["/usr/local/bin/start.sh"]

