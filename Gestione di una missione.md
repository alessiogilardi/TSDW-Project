# Gestione di una missione

## Creazione
1. Viene generata una missione da un BaseSupervisor
    La missione deve avere:
    a. Una base
    b. Un supervisore
    c. Una data
    d. Un tipo
    e. Un rango
    f. Un piano di volo
    g. Una durata prevista
    h. Una lista di droni
2. La *missione* ha, a questo puntoto, sato __Instantiated__ ed è aggiunta alle Pending Missions del Supervisore di base

## Notifica equipaggio
3. I *piloti* idonei, i *membri dell'equipaggio* e, nel caso, i *manutentori* vengono __notificati__
4. Il *personale* che riceve notifica è inserito nell'apposito campo della *missione* e lo stato della *missione* passa a __Pending__
5. Il *personale* notificato può accettare o meno la *missione* entro un tempo limite deciso a priori
6. Il *personale* che accetta viene spostato da __notified__ a __accepted__

## Scelta team
7. Una volta raggiunto un numero sufficiente di membri il supervisore viene __notificato__ con l'elenco di persone e può decidere se iniziare la missione o aspettare
8. Quando il __supervisore__ sceglie i membri, quelli che vengono scelti passano da __accepted__ a __chosen__
9. Il __supervisore__ a questo punto può decidere si *startare* la missione
10. Il team viene notificato con le informazioni necessarie
11. La *missione* è aggiunta alle *pending/waiting for QTB* missions del dei __Droni__ che partecipano alla missione
11. La *missione* è aggiunta alle *pending/waiting for logbook* missions del team in __Personnel__
13. La *missione* passa da __Pending__ a __Running__

## Altro team
14. In caso accettino la missione persone più idonee di quelle precedenti viene scelto un nuovo team
15. La missione è aggiunta alle *pending/waiting for logbook* missions del nuovo team in __Personnel__

## Completamento
16. I campi __notified__, __accepted__ e __chosen__ vengono svuotati
17. Viene inserita la durata effettiva della missione
18. Aggiunte eventuali note del supervisore
19. La *missione* passa da __Running__ a __Completed__

## Inserimento documenti
20. I QTB vengono scaricati dai __droni__, inseriti nel __DB__ e viene inserito un loro riferimento nella *missione*
21. I piloti compilano i __Logbook__ e inseriscono un riferimento nel __DB___ allegato poi alla *missione*
22. Quando tutti hanno inserito la *documentazione* la missione passa da __Completed__ a __Completed and documented__ 

