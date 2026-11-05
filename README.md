# httpfs4cd
nodejs http file server for constrained client devices (accepts offset/len)

server side:
```
node server.js
```

client side:

```
wget "http://localhost/file-server-prefix/averybigfile.bin?offset=300&len=100"
```

typical apache2 snippet:

```
        ProxyPass /file-server-prefix/ http://localhost:3000/
        ProxyPassReverse /file-server-prefix/ http://localhost:3000/
```
