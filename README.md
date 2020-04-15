## Fiware Orion Subscriber: Software requirements

This GE is based on a JavaScript environment and SQL databases. In order to run
the identity manager the following requirements must be installed:

-   node.js
-   npm
-   elasticsearch-server (7.6.1)

### Install

1.  Clone repository:

```console
git clone https://github.com/napat1412/fiware-orion-subscriber.git
```

2.  Install the dependencies:

```console
cd fiware-orion-subscriber/
npm install
```

3.  Duplicate config.template in config.js:

```console
cp config.js.template config.js
```

4.  Configure variable:

```javascript
config.es_user = (process.env.ES_USER || 'admin');
config.es_pass = (process.env.ES_PASS || 'admin');
config.es_nodes = to_array(process.env.ES_NODES, ['https://localhost:9200']);

```

5.  Start server with admin rights (server listens in 3000 port by default or in
    443 if HTTPS is enabled).

```console
sudo npm start
```

