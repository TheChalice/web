FROM registry.dataos.io/guestbook/datafoundry-citic-base

# Copy code
COPY . /datafoundry-citic

WORKDIR /datafoundry-citic

# Install nginx & node
# Install Bower
# Install node & bower depends
# Set bower root allow

RUN ./release.sh

EXPOSE 80 

ENTRYPOINT ["/usr/local/bin/start.sh"]

