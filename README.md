# Drone and Mission Manager Bot (versione 1.0)
## Progetto di Transactional Systems and Data Warehouse

<img src="https://nodejs.org/static/images/logos/nodejs-new-pantone-black.png" width="200px" /><img src="https://www.worksonarm.com/wp-content/uploads/2017/03/mongodb-logo-1.png" width="150px" /><img src="https://www.telegraph.co.uk/content/dam/technology/2016/08/03/telegram_3504581b_trans_NvBQzQNjv4BqpJliwavx4coWFCaEkEsb3kvxIt-lGGWCWqwLa_RXJU8.jpg" width="200px" />


Il progetto implementa un BOT Telegram che gestise le informazioni di __Personale__, __Missioni__ e __Droni__ di uno o più __Operatori Aerei__.
Per spiegazioni ulteriori fare riferimento al [manuale](./docs/manuale_v1.0.pdf).

### Installazione
1. Installare [NodeJS](https://nodejs.org)
2. Installare [MongoDB Community Edition](https://docs.mongodb.com/manual/administration/install-community/)
3. Installare [Git](https://git-scm.com/)
4. Scaricare il [repository](https://github.com/BolleA7X/TSDW-Project)
```
git clone https://github.com/BolleA7X/TSDW-Project.git
```
5. Aggiornare le dipendenze
```
npm update
```

### StartUp
1. Eseguire il servizio di MongoDB
2. Eseguire il file ____app.js____
```
node app
```

### Settings

#### timeouts.json
Il file contiene i valori in minuti dei timeout, che possono essere personalizzati.

Per ulteriori informazioni fare riferimento al [manuale](./docs/manuale_v1.0.pdf).

#### risk-matrix.txt
Il file contiene la matrice di rischio ed è personalizzabile.

Per ulteriori informazioni fare riferimento al [manuale](./docs/manuale_v1.0.pdf).


